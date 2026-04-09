
export enum QuestionType {
  MCQ = 'MCQ',
  RATING = 'RATING',
  LIKERT = 'LIKERT',
  TEXT = 'TEXT',
  SLIDER = 'SLIDER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'creator' | 'viewer';
  avatar: string;
  permissions?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string; 
  options?: string[]; 
  required: boolean;
  conditionalLogic?: {
    dependsOn: string; 
    value: string;
  };
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
  questions: Question[];
}

export interface Response {
  surveyId: string;
  answers: Record<string, any>;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  voiceTranscription?: string;
  // Import tracking fields
  _importSource?: 'excel' | 'csv' | 'json' | 'mock';
  _importFileName?: string;
  _rowNumber?: number;
}

export interface AIAnalysis {
  summary: string;
  sentimentScore: number;
  recommendations: string[];
  trends: string[];
  weakAreas: string[];
  keywords?: string[];
  emotions?: Record<string, number>;
  anomalies?: string[];
}

export interface RiskAlert {
  id: string;
  category: string;
  type: 'Rating Drop' | 'Sentiment Spike' | 'Keyword Cluster' | 'Volume Anomaly' | 'Logic Mismatch';
  severity: 'Low' | 'Medium' | 'High';
  timestamp: string;
  rootCause: string;
  action: string;
  status: 'open' | 'resolved';
}

export interface AnalystThresholds {
  sentimentSensitivity: number;
  riskAlertThreshold: number;
  mismatchTolerance: number;
}

export type View = 'home' | 'builder' | 'dashboard' | 'taker' | 'analytics';
