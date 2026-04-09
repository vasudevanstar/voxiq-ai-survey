
import React from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, MessageSquare, TrendingUp, AlertCircle, Sparkles, ClipboardList, Users2, Calendar, ShoppingBag, GraduationCap, Package, Users, Shield, Target, Zap, Activity } from 'lucide-react';
import { Survey, QuestionType, Response, Question, RiskAlert } from './types';

export interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  questions: Omit<Question, 'id'>[];
}

export const MOCK_SURVEYS: Survey[] = [
  {
    id: '4',
    title: 'E-commerce Customer Feedback',
    description: 'Sentiment analysis across global trade categories. Detecting consumer friction points and logistic issues.',
    creatorId: 'admin1',
    createdAt: '2024-01-01T09:00:00Z',
    status: 'active',
    questions: [
      { id: 'pq1', type: QuestionType.MCQ, title: 'Product Category', options: ['Logistics', 'Hardware', 'Cloud', 'Retail'], required: true },
      { id: 'pq2', type: QuestionType.RATING, title: 'Rating', description: 'Overall satisfaction score (1-5)', required: true },
      { id: 'pq3', type: QuestionType.MCQ, title: 'Sentiment', options: ['Positive', 'Neutral', 'Negative'], required: true },
      { id: 'pq4', type: QuestionType.TEXT, title: 'Review Title', required: true },
      { id: 'pq5', type: QuestionType.TEXT, title: 'Detailed Review', required: true },
      { id: 'pq6', type: QuestionType.MCQ, title: 'Verified Purchase', options: ['Yes', 'No'], required: true }
    ]
  },
  {
    id: '3',
    title: 'Employee Satisfaction Survey',
    description: 'Feedback on workforce throughput and organizational satisfaction.',
    creatorId: 'admin1',
    createdAt: '2025-01-01T08:00:00Z',
    status: 'active',
    questions: [
      { id: 'aq1', type: QuestionType.RATING, title: 'Process Clarity', required: true },
      { id: 'aq2', type: QuestionType.MCQ, title: 'Work Pace', options: ['Optimal', 'Lagging', 'Surge'], required: true },
      { id: 'aq3', type: QuestionType.RATING, title: 'Infrastructure Quality', required: true },
      { id: 'aq4', type: QuestionType.RATING, title: 'Satisfaction Index', required: true },
      { id: 'aq5', type: QuestionType.TEXT, title: 'Feedback', required: false },
      { id: 'aq6', type: QuestionType.MCQ, title: 'Department', options: ['Engineering', 'DevOps', 'Sales', 'Product'], required: true }
    ]
  }
];

export const MOCK_ALERTS: RiskAlert[] = [
  {
    id: 'al-01',
    category: 'Hardware',
    type: 'Sentiment Spike',
    severity: 'High',
    timestamp: new Date().toISOString(),
    rootCause: 'Sudden drop in battery performance reviews.',
    action: 'Check recent batch QA logs.',
    status: 'open'
  },
  {
    id: 'al-02',
    category: 'Cloud',
    type: 'Rating Drop',
    severity: 'Medium',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    rootCause: 'Latency causing rating decay in Asia-Pacific region.',
    action: 'Investigate server load.',
    status: 'open'
  }
];

const generateAcademicResponses = (): Response[] => {
  const courses = ['Engineering', 'DevOps', 'Sales', 'Product'];
  const paces = ['Optimal', 'Surge', 'Lagging'];
  const scores = [1, 2, 3, 4, 5];
  const feedbacks = [
    "Workflow optimized effectively",
    "Bottleneck detected in pipeline",
    "High throughput achieved",
    "Latency issues identified",
    "Needs logic refinement",
    "Strong performance metrics",
    "Data points validated",
    "Inconsistent telemetry",
    "Great collaborative focus",
    "Operational clarity noted"
  ];

  const res: Response[] = [];
  for (let i = 1; i <= 100; i++) {
    const courseIndex = (i - 1) % 4;
    const paceIndex = (i - 1) % 3;
    const scoreVal = scores[i % 5];
    const feedbackText = feedbacks[(i - 1) % 10];
    const day = (i % 28) + 1;
    res.push({
      surveyId: '3',
      timestamp: `2025-01-${String(day).padStart(2, '0')}`,
      answers: {
        'aq1': scoreVal,
        'aq2': paces[paceIndex],
        'aq3': scoreVal,
        'aq4': scoreVal,
        'aq5': feedbackText,
        'aq6': courses[courseIndex]
      }
    });
  }
  return res;
};

const generateProductResponses = (): Response[] => {
  const categories = ['Logistics', 'Hardware', 'Cloud', 'Retail'];
  const res: Response[] = [];
  for (let i = 1; i <= 1000; i++) {
    const catIdx = (i - 1) % 4;
    const isPositive = i % 3 === 0 || i % 7 === 0;
    const isNegative = i % 5 === 0 && !isPositive;
    let rating = isPositive ? 4 + (i % 2) : isNegative ? 1 + (i % 2) : 3;
    let sentiment = isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral';
    res.push({
      surveyId: '4',
      timestamp: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      answers: {
        'pq1': categories[catIdx],
        'pq2': rating,
        'pq3': sentiment,
        'pq4': `Review #${i}`,
        'pq5': sentiment === 'Positive' ? 'Great product' : 'Needs improvement',
        'pq6': i % 2 === 0 ? 'Yes' : 'No'
      }
    });
  }
  return res;
};

export const MOCK_RESPONSES: Record<string, Response[]> = {
  '4': generateProductResponses(),
  '3': generateAcademicResponses(),
  '1': []
};

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Customer Satisfaction (CSAT)',
    description: 'Standard NPS framework for measuring customer loyalty.',
    category: 'Retail',
    icon: <Target size={20} />,
    questions: [
      { type: QuestionType.RATING, title: 'Overall Experience', required: true },
      { type: QuestionType.TEXT, title: 'Reason for Rating', required: false },
      { type: QuestionType.MCQ, title: 'Likelihood to Recommend', options: ['Unlikely', 'Neutral', 'Likely', 'Very Likely'], required: true }
    ]
  },
  {
    id: 'tpl-2',
    title: 'Employee Pulse',
    description: 'Measuring organizational health and team morale.',
    category: 'Enterprise',
    icon: <Activity size={20} />,
    questions: [
      { type: QuestionType.RATING, title: 'Role Clarity', required: true },
      { type: QuestionType.MCQ, title: 'Workload', options: ['Low', 'Normal', 'High'], required: true },
      { type: QuestionType.TEXT, title: 'Suggestions', required: false }
    ]
  }
];

export const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'builder', label: 'Survey Builder', icon: <PlusCircle size={20} /> },
  { id: 'dashboard', label: 'My Surveys', icon: <BarChart3 size={20} /> },
];

export const AI_INDICATORS = [
  { label: 'Sentiment', icon: <Zap size={16} className="text-brand-primary" /> },
  { label: 'Predictive', icon: <TrendingUp size={16} className="text-brand-primary" /> },
  { label: 'Risks', icon: <AlertCircle size={16} className="text-rose-400" /> },
  { label: 'AI Insights', icon: <Sparkles size={16} className="text-brand-accent" /> },
];
