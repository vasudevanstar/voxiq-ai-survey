// Advanced analytics and data processing service

export interface AnalyticsData {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  timestamp: Date;
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  status?: string[];
  severity?: string[];
  tags?: string[];
  searchQuery?: string;
}

export class AdvancedDataService {
  // Real-time data processing
  static processRealtimeMetrics(data: any[]): AnalyticsData[] {
    return data.map((item, idx) => ({
      metric: item.name || `Metric ${idx}`,
      value: item.value || 0,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.random() * 20 - 10,
      timestamp: new Date(),
    }));
  }

  // Advanced filtering with multiple criteria
  static applyAdvancedFilters<T extends Record<string, any>>(
    items: T[],
    filters: FilterOptions
  ): T[] {
    return items.filter(item => {
      if (filters.dateRange && item.timestamp) {
        const date = new Date(item.timestamp);
        if (date < filters.dateRange.start || date > filters.dateRange.end) {
          return false;
        }
      }

      if (filters.status && !filters.status.includes(item.status)) {
        return false;
      }

      if (filters.severity && !filters.severity.includes(item.severity)) {
        return false;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableFields = ['name', 'description', 'type', 'category'];
        const matches = searchableFields.some(field =>
          String(item[field] || '').toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      return true;
    });
  }

  // Data aggregation for insights
  static aggregateData(items: any[], groupBy: string): Record<string, any[]> {
    return items.reduce((acc, item) => {
      const key = item[groupBy] || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }

  // Calculate statistics
  static calculateStats(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const std = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    return { mean, median, max, min, std };
  }

  // Export data in multiple formats
  static exportToJSON(data: any[], filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, `${filename}.json`);
  }

  static exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
