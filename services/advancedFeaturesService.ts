/**
 * Advanced Features Service
 * Handles conditional logic, filtering, bulk actions, and more
 */

import { ConditionalRule, ResponseFilter, ResponseFilterSet, BulkAction } from '../types/survey';

export class ConditionalLogicService {
  /**
   * Evaluates if a question should be shown based on conditional rules
   */
  static evaluateQuestionVisibility(
    questionId: string,
    rules: ConditionalRule[],
    responses: Record<string, any>
  ): boolean {
    const applicableRules = rules.filter(r => r.questionId === questionId);
    
    if (applicableRules.length === 0) return true;

    return applicableRules.every(rule => this.evaluateRule(rule, responses));
  }

  private static evaluateRule(rule: ConditionalRule, responses: Record<string, any>): boolean {
    const triggerValue = responses[rule.triggerQuestionId];
    
    switch (rule.operator) {
      case 'equals':
        return (rule.action === 'show' ? triggerValue === rule.triggerValue : triggerValue !== rule.triggerValue);
      
      case 'contains':
        return (rule.action === 'show' ? 
          String(triggerValue).includes(String(rule.triggerValue)) : 
          !String(triggerValue).includes(String(rule.triggerValue))
        );
      
      case 'greaterThan':
        return (rule.action === 'show' ? Number(triggerValue) > Number(rule.triggerValue) : Number(triggerValue) <= Number(rule.triggerValue));
      
      case 'lessThan':
        return (rule.action === 'show' ? Number(triggerValue) < Number(rule.triggerValue) : Number(triggerValue) >= Number(rule.triggerValue));
      
      default:
        return true;
    }
  }

  /**
   * Gets conditional rules for a specific question
   */
  static getQuestionsToShow(
    allRules: ConditionalRule[],
    responses: Record<string, any>
  ): Set<string> {
    const visibleQuestions = new Set<string>();
    
    allRules.forEach(rule => {
      const isVisible = this.evaluateQuestionVisibility(rule.questionId, [rule], responses);
      if (isVisible) {
        visibleQuestions.add(rule.questionId);
      }
    });
    
    return visibleQuestions;
  }
}

export class ResponseFilterService {
  /**
   * Applies filters to responses
   */
  static applyFilters(
    responses: any[],
    filterSet: ResponseFilterSet
  ): any[] {
    let filtered = [...responses];

    // Apply field filters
    filterSet.filters.forEach(filter => {
      filtered = this.applyFilter(filtered, filter);
    });

    // Apply date range filter
    if (filterSet.dateRange) {
      const { startDate, endDate } = filterSet.dateRange;
      filtered = filtered.filter(r => {
        const responseDate = new Date(r.submittedAt || r.createdAt);
        return responseDate >= startDate && responseDate <= endDate;
      });
    }

    // Apply respondent status filter
    if (filterSet.respondentStatus) {
      filtered = filtered.filter(r => r.status === filterSet.respondentStatus);
    }

    return filtered;
  }

  private static applyFilter(responses: any[], filter: ResponseFilter): any[] {
    return responses.filter(response => {
      const value = response[filter.questionId];
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        
        case 'contains':
          return String(value).includes(String(filter.value));
        
        case 'greaterThan':
          return Number(value) > Number(filter.value);
        
        case 'lessThan':
          return Number(value) < Number(filter.value);
        
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            return Number(value) >= Number(filter.value[0]) && Number(value) <= Number(filter.value[1]);
          }
          return true;
        
        case 'in':
          return Array.isArray(filter.value) ? (filter.value as any[]).includes(value) : false;
        
        default:
          return true;
      }
    });
  }

  /**
   * Gets summary statistics for filtered responses
   */
  static getFilteredStats(responses: any[], filterSet: ResponseFilterSet) {
    const filtered = this.applyFilters(responses, filterSet);
    
    return {
      totalResponses: responses.length,
      filteredCount: filtered.length,
      completionRate: (filtered.filter((r: any) => r.status === 'completed').length / filtered.length) * 100,
      averageTime: filtered.reduce((sum: number, r: any) => sum + (r.timeSpent || 0), 0) / filtered.length,
    };
  }
}

export class BulkActionService {
  /**
   * Executes bulk actions on responses
   */
  static executeBulkAction(action: BulkAction, responses: any[]): any[] {
    switch (action.type) {
      case 'delete':
        return responses.filter(r => !action.responseIds.includes(r.id));
      
      case 'tag':
        return responses.map(r =>
          action.responseIds.includes(r.id)
            ? { ...r, tags: [...(r.tags || []), action.metadata?.tag] }
            : r
        );
      
      case 'flag':
        return responses.map(r =>
          action.responseIds.includes(r.id)
            ? { ...r, flagged: action.metadata?.flagged ?? true, flagReason: action.metadata?.reason }
            : r
        );
      
      case 'moveToFolder':
        return responses.map(r =>
          action.responseIds.includes(r.id)
            ? { ...r, folder: action.metadata?.folderId }
            : r
        );
      
      default:
        return responses;
    }
  }

  /**
   * Gets count of actions performed
   */
  static getActionStats(responses: any[], action: BulkAction) {
    const affected = responses.filter(r => action.responseIds.includes(r.id));
    return {
      totalAffected: affected.length,
      actionType: action.type,
      timestamp: new Date(),
    };
  }
}

export class NotificationService {
  /**
   * Formats email content for survey responses
   */
  static generateResponseEmail(
    surveyTitle: string,
    respondentName: string,
    responseData: Record<string, any>,
    companyName: string
  ): { subject: string; body: string } {
    const subject = `New Response: ${surveyTitle}`;
    
    const body = `
Dear Team,

A new response has been submitted to your survey: "${surveyTitle}"

**Respondent Information:**
- Name: ${respondentName}
- Submitted: ${new Date().toLocaleString()}

**Responses:**
${Object.entries(responseData)
  .map(([question, answer]) => `• ${question}: ${answer}`)
  .join('\n')}

---
Survey Sense | AI-Powered Decision Intelligence
${companyName}
    `;

    return { subject, body };
  }

  /**
   * Generates digest email for multiple responses
   */
  static generateDigestEmail(
    surveyTitle: string,
    responseCount: number,
    completionRate: number,
    companyName: string
  ): { subject: string; body: string } {
    const subject = `Daily Digest: ${responseCount} new responses to "${surveyTitle}"`;
    
    const body = `
Dear Team,

Here's your daily digest for survey: "${surveyTitle}"

**Summary:**
- New Responses: ${responseCount}
- Completion Rate: ${completionRate.toFixed(1)}%
- Date: ${new Date().toLocaleDateString()}

Visit your dashboard to view detailed analytics.

---
Survey Sense | AI-Powered Decision Intelligence
${companyName}
    `;

    return { subject, body };
  }

  /**
   * Mock email sending (replace with actual service)
   */
  static async sendEmail(
    to: string[],
    subject: string,
    body: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('Email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Body:', body);
      
      // Simulate email sending
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }
}
