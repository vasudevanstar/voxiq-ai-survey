/**
 * Application Configuration
 * Centralized configuration management for the Survey Sense platform
 */

// Environment detection - using simple defaults
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiBase: '/api',
  enableMockData: true,
};

// Theme configuration
export const THEME_CONFIG = {
  colors: {
    primary: '#00d9ff',
    secondary: '#ff006e',
    accent: '#00f5ff',
    dark: '#0a0e27',
    surface: '#151932',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 1000,
    },
  },
};

// Feature flags
export const FEATURES = {
  enableNotifications: true,
  enableKeyboardShortcuts: true,
  enableThemeToggle: true,
  enableAdvancedSearch: true,
  enableDataExport: true,
  enableRealTimeUpdates: false, // Ready for implementation
  enableOfflineMode: false,
  enableBetaFeatures: true,
};

// API endpoints
export const API_ENDPOINTS = {
  surveys: '/surveys',
  surveyDetail: (id: string) => `/surveys/${id}`,
  surveyResponses: (id: string) => `/surveys/${id}/responses`,
  analytics: (id: string) => `/surveys/${id}/analytics`,
  riskAlerts: '/alerts',
  users: '/users',
  auth: '/auth',
  export: '/export',
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  openSearch: { key: 'k', ctrl: true },
  export: { key: 'e', ctrl: true, shift: true },
  filters: { key: 'f', ctrl: true, shift: true },
  toggleTheme: { key: 't', ctrl: true, shift: true },
  newSurvey: { key: 'n', ctrl: true },
  help: { key: '?', shift: true },
};

// Pagination
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
};

// Cache settings
export const CACHE = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  enabled: true,
};

// Notification settings
export const NOTIFICATIONS = {
  defaultDuration: 5000,
  maxStack: 5,
  position: 'top-right' as const,
};

// Animation timing
export const ANIMATION_TIMINGS = {
  pageLoad: 500,
  transitionIn: 300,
  transitionOut: 200,
  hoverDelay: 150,
};

// Validation rules
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    minLength: 8,
    message: 'Password must be at least 8 characters',
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,20}$/,
    message: 'Username must be 3-20 characters (alphanumeric, - and _)',
  },
};

// Data limits
export const LIMITS = {
  maxUploadSize: 100 * 1024 * 1024, // 100MB
  maxSurveyQuestions: 100,
  maxResponsesPerSurvey: 10000,
  maxExportRows: 50000,
};

// Date/Time formats
export const FORMATS = {
  date: 'MM/dd/yyyy',
  time: 'HH:mm:ss',
  datetime: 'MM/dd/yyyy HH:mm:ss',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// Log levels
export const LOG_LEVEL = ENV.isDevelopment ? 'debug' : 'warn';

// Performance thresholds
export const PERFORMANCE = {
  slowThreshold: 1000, // ms
  warnThreshold: 500, // ms
  enableMonitoring: ENV.isDevelopment,
};

// Error handling
export const ERROR_MESSAGES = {
  networkError: 'Network error. Please check your connection.',
  serverError: 'Server error. Please try again later.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  unknown: 'An unexpected error occurred.',
};

// Default state
export const DEFAULT_STATE = {
  theme: 'dark' as const,
  language: 'en',
  pageSize: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

// Feature configuration based on user role
export const ROLE_FEATURES = {
  admin: ['create', 'read', 'update', 'delete', 'export', 'analytics', 'users'],
  analyst: ['read', 'update', 'export', 'analytics'],
  researcher: ['read'],
};

// Date ranges for filters
export const DATE_RANGES = {
  today: { label: 'Today', days: 0 },
  yesterday: { label: 'Yesterday', days: -1 },
  last7days: { label: 'Last 7 days', days: -7 },
  last30days: { label: 'Last 30 days', days: -30 },
  last90days: { label: 'Last 90 days', days: -90 },
  custom: { label: 'Custom range', days: null },
};

// Chart configuration
export const CHART_CONFIG = {
  colors: [
    '#00d9ff', // Primary Cyan
    '#ff006e', // Secondary Pink
    '#00f5ff', // Accent Cyan
    '#ff1493', // Hot Pink
    '#1e90ff', // Dodger Blue
    '#32cd32', // Lime Green
  ],
  animationDuration: 500,
  responsive: true,
  maintainAspectRatio: true,
};

// Export this configuration object
export const APP_CONFIG = {
  ENV,
  THEME_CONFIG,
  FEATURES,
  API_ENDPOINTS,
  KEYBOARD_SHORTCUTS,
  PAGINATION,
  CACHE,
  NOTIFICATIONS,
  ANIMATION_TIMINGS,
  VALIDATION_RULES,
  LIMITS,
  FORMATS,
  LOG_LEVEL,
  PERFORMANCE,
  ERROR_MESSAGES,
  DEFAULT_STATE,
  ROLE_FEATURES,
  DATE_RANGES,
  CHART_CONFIG,
};

export default APP_CONFIG;
