/**
 * Data Consistency Service
 * Ensures imported data is properly tracked and reflected in all reports
 * Handles dynamic report generation based on actual imported data
 */

import { Response, Survey } from '../types';

export interface DataStore {
  surveyId: string;
  importedResponses: Response[];
  lastUpdated: string;
  importMetadata: {
    fileName: string;
    rowCount: number;
    importDate: string;
    source: 'excel' | 'csv' | 'json';
  };
}

export interface AnalyticsSnapshot {
  surveyId: string;
  totalResponses: number;
  importedCount: number;
  mockCount: number;
  categories: CategoryAnalysis[];
  timeline: TimelineEntry[];
  sentiment: SentimentAnalysis;
  timestamp: string;
}

export interface CategoryAnalysis {
  name: string;
  count: number;
  percentage: number;
  avgRating: number;
  negativeCount: number;
}

export interface TimelineEntry {
  date: string;
  responseCount: number;
  cumulativeCount: number;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

class DataConsistencyServiceClass {
  private dataStores: Map<string, DataStore> = new Map();
  private analyticsCache: Map<string, AnalyticsSnapshot> = new Map();

  /**
   * Register imported data for a survey
   */
  registerImportedData(
    surveyId: string,
    responses: Response[],
    fileName: string,
    source: 'excel' | 'csv' | 'json'
  ): void {
    const existing = this.dataStores.get(surveyId) || {
      surveyId,
      importedResponses: [],
      lastUpdated: new Date().toISOString(),
      importMetadata: {
        fileName,
        rowCount: 0,
        importDate: new Date().toISOString(),
        source,
      },
    };

    // Append new responses
    const newResponses = [
      ...existing.importedResponses,
      ...responses.map(r => ({
        ...r,
        _importSource: source,
        _importFileName: fileName,
      })),
    ];

    existing.importedResponses = newResponses;
    existing.lastUpdated = new Date().toISOString();
    existing.importMetadata = {
      fileName,
      rowCount: newResponses.length,
      importDate: new Date().toISOString(),
      source,
    };

    this.dataStores.set(surveyId, existing);
    
    // Invalidate cache for this survey
    this.analyticsCache.delete(surveyId);
  }

  /**
   * Get all imported responses for a survey
   */
  getImportedResponses(surveyId: string): Response[] {
    return this.dataStores.get(surveyId)?.importedResponses || [];
  }

  /**
   * Get data store metadata
   */
  getDataStoreMetadata(surveyId: string): DataStore | null {
    return this.dataStores.get(surveyId) || null;
  }

  /**
   * Generate comprehensive analytics from all imported data
   */
  generateAnalytics(
    surveyId: string,
    allResponses: Response[],
    survey: Survey
  ): AnalyticsSnapshot {
    // Check cache
    const cacheKey = `${surveyId}-${allResponses.length}`;
    if (this.analyticsCache.has(cacheKey)) {
      return this.analyticsCache.get(cacheKey)!;
    }

    const importedResponses = this.getImportedResponses(surveyId);
    const importedCount = importedResponses.length;
    const mockCount = allResponses.length - importedCount;

    // Determine field names based on survey type
    const isProduct = surveyId === '4';
    const categoryField = isProduct ? 'pq1' : 'aq6';
    const scoreField = isProduct ? 'pq2' : 'aq4';
    const sentimentField = isProduct ? 'pq3' : '';

    // Calculate category statistics
    const categoryMap: Record<string, {
      count: number;
      sum: number;
      negCount: number;
    }> = {};

    const timelineMap: Record<string, number> = {};
    let sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    allResponses.forEach(response => {
      const category = response.answers[categoryField] || 'Other';
      
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, sum: 0, negCount: 0 };
      }

      const rating = Number(response.answers[scoreField]) || 0;
      categoryMap[category].count++;
      categoryMap[category].sum += rating;

      if (sentimentField && response.answers[sentimentField]) {
        const sentiment = response.answers[sentimentField];
        if (sentiment === 'Positive') sentimentCounts.positive++;
        else if (sentiment === 'Neutral') sentimentCounts.neutral++;
        else if (sentiment === 'Negative') sentimentCounts.negative++;
      }

      if (response.timestamp) {
        const dateKey = new Date(response.timestamp).toISOString().split('T')[0];
        timelineMap[dateKey] = (timelineMap[dateKey] || 0) + 1;
      }
    });

    // Build categories array
    const categories: CategoryAnalysis[] = Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      count: stats.count,
      percentage: Math.round((stats.count / allResponses.length) * 100),
      avgRating: Number((stats.sum / (stats.count || 1)).toFixed(2)),
      negativeCount: stats.negCount,
    }));

    // Build timeline array
    const sortedDates = Object.keys(timelineMap).sort();
    let cumulativeCount = 0;
    const timeline: TimelineEntry[] = sortedDates.map(date => {
      cumulativeCount += timelineMap[date];
      return {
        date,
        responseCount: timelineMap[date],
        cumulativeCount,
      };
    });

    // Calculate sentiment percentages
    const totalResponses = allResponses.length;
    const sentiment: SentimentAnalysis = {
      positive: sentimentCounts.positive,
      neutral: sentimentCounts.neutral,
      negative: sentimentCounts.negative,
      positivePercent: Math.round((sentimentCounts.positive / totalResponses) * 100),
      neutralPercent: Math.round((sentimentCounts.neutral / totalResponses) * 100),
      negativePercent: Math.round((sentimentCounts.negative / totalResponses) * 100),
    };

    const snapshot: AnalyticsSnapshot = {
      surveyId,
      totalResponses: allResponses.length,
      importedCount,
      mockCount,
      categories,
      timeline,
      sentiment,
      timestamp: new Date().toISOString(),
    };

    this.analyticsCache.set(cacheKey, snapshot);
    return snapshot;
  }

  /**
   * Generate export data ensuring all imported rows are included
   */
  generateExportData(
    surveyId: string,
    allResponses: Response[],
    includeColumns?: string[]
  ): {
    headers: string[];
    rows: Record<string, any>[];
    metadata: {
      totalRows: number;
      importedRows: number;
      exportDate: string;
    };
  } {
    const importedResponses = this.getImportedResponses(surveyId);

    // Determine columns from all responses
    const allColumns = new Set<string>();
    allResponses.forEach(r => {
      if (r.answers) {
        Object.keys(r.answers).forEach(key => allColumns.add(key));
      }
    });
    allColumns.add('timestamp');
    allColumns.add('_importSource');

    const headers = includeColumns && includeColumns.length > 0
      ? includeColumns
      : Array.from(allColumns).sort();

    const rows = allResponses.map(response => {
      const row: Record<string, any> = {};
      headers.forEach(header => {
        if (header === 'timestamp') {
          row[header] = response.timestamp || '';
        } else if (header === '_importSource') {
          row[header] = response._importSource || 'mock';
        } else {
          row[header] = response.answers?.[header] || '';
        }
      });
      return row;
    });

    return {
      headers,
      rows,
      metadata: {
        totalRows: allResponses.length,
        importedRows: importedResponses.length,
        exportDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Validate that imported data matches survey structure
   */
  validateDataIntegrity(
    surveyId: string,
    survey: Survey
  ): { isValid: boolean; issues: string[] } {
    const importedResponses = this.getImportedResponses(surveyId);
    const issues: string[] = [];

    if (importedResponses.length === 0) {
      return { isValid: true, issues: ['No imported data to validate'] };
    }

    // Check for required fields
    survey.questions.filter(q => q.required).forEach(question => {
      const missingCount = importedResponses.filter(
        r => !r.answers[question.id] || r.answers[question.id] === ''
      ).length;

      if (missingCount > 0) {
        issues.push(`Question "${question.title}" is missing in ${missingCount} responses`);
      }
    });

    // Check for data type consistency
    importedResponses.forEach((response, idx) => {
      Object.entries(response.answers).forEach(([key, value]) => {
        const question = survey.questions.find(q => q.id === key);
        if (!question) {
          // This is OK - might be metadata
          return;
        }

        if (question.type === 'RATING' && isNaN(Number(value))) {
          issues.push(`Row ${idx + 1}, Question "${question.title}": expected number, got "${value}"`);
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Clear all data for a survey
   */
  clearSurveyData(surveyId: string): void {
    this.dataStores.delete(surveyId);
    this.analyticsCache.delete(surveyId);
  }

  /**
   * Get import statistics
   */
  getImportStatistics(): {
    totalSurveys: number;
    totalImportedResponses: number;
    surveys: Array<{
      surveyId: string;
      importedCount: number;
      source: string;
      lastImportDate: string;
    }>;
  } {
    const surveys = Array.from(this.dataStores.values()).map(store => ({
      surveyId: store.surveyId,
      importedCount: store.importedResponses.length,
      source: store.importMetadata.source,
      lastImportDate: store.importMetadata.importDate,
    }));

    const totalImportedResponses = surveys.reduce((sum, s) => sum + s.importedCount, 0);

    return {
      totalSurveys: surveys.length,
      totalImportedResponses,
      surveys,
    };
  }
}

// Export singleton instance
export const DataConsistencyService = new DataConsistencyServiceClass();
