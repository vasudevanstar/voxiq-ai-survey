// Survey Sense - Enhanced Types for Advanced Features

// Conditional Logic Types
export interface ConditionalRule {
  id: string;
  questionId: string;
  triggerQuestionId: string;
  triggerValue: string | string[];
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  action: 'show' | 'hide' | 'required' | 'optional';
}

export interface QuestionLogic {
  questionId: string;
  rules: ConditionalRule[];
  enabled: boolean;
}

// Email Notification Types
export interface EmailNotificationSettings {
  id: string;
  surveyId: string;
  enabled: boolean;
  emailAddresses: string[];
  notifyOn: 'every_response' | 'daily_digest' | 'weekly_digest';
  emailTemplate: string;
  lastSentAt?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// Branding/White-label Types
export interface BrandingConfig {
  id: string;
  name: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string;
  companyWebsite?: string;
  footerText?: string;
  customCSS?: string;
  isActive: boolean;
}

// Response Filtering Types
export interface ResponseFilter {
  questionId: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: string | number | string[] | number[];
}

export interface ResponseFilterSet {
  id: string;
  name: string;
  filters: ResponseFilter[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  respondentStatus?: 'completed' | 'incomplete' | 'started';
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  includeColumns: string[];
  filters?: ResponseFilterSet;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeMetadata: boolean;
  branding?: BrandingConfig;
}

// Bulk Action Types
export interface BulkAction {
  type: 'delete' | 'export' | 'tag' | 'flag' | 'moveToFolder';
  responseIds: string[];
  metadata?: Record<string, any>;
}
