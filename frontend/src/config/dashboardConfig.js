/**
 * Dashboard Configuration
 * Centralized configuration for all dashboard components
 * No hardcoded values - everything comes from here
 */

// Color Palettes
export const CHART_COLORS = {
  primary: {
    blue: 'rgba(59, 130, 246, 1)',
    blueLight: 'rgba(59, 130, 246, 0.8)',
    blueBg: 'rgba(59, 130, 246, 0.1)',
  },
  success: {
    green: 'rgba(16, 185, 129, 1)',
    greenLight: 'rgba(16, 185, 129, 0.8)',
    greenBg: 'rgba(16, 185, 129, 0.1)',
  },
  warning: {
    yellow: 'rgba(251, 191, 36, 1)',
    yellowLight: 'rgba(251, 191, 36, 0.8)',
  },
  error: {
    red: 'rgba(239, 68, 68, 1)',
    redLight: 'rgba(239, 68, 68, 0.8)',
  },
  neutral: {
    gray: 'rgba(156, 163, 175, 1)',
    grayLight: 'rgba(156, 163, 175, 0.8)',
    grayBg: 'rgba(156, 163, 175, 0.1)',
  },
  purple: {
    purple: 'rgba(139, 92, 246, 1)',
    purpleLight: 'rgba(139, 92, 246, 0.8)',
  },
};

// Chart Color Arrays
export const KEYWORD_CHART_COLORS = [
  CHART_COLORS.primary.blueLight,
  CHART_COLORS.success.greenLight,
  CHART_COLORS.warning.yellowLight,
  CHART_COLORS.error.redLight,
  CHART_COLORS.purple.purpleLight,
];

export const KEYWORD_CHART_BORDER_COLORS = [
  CHART_COLORS.primary.blue,
  CHART_COLORS.success.green,
  CHART_COLORS.warning.yellow,
  CHART_COLORS.error.red,
  CHART_COLORS.purple.purple,
];

export const SENTIMENT_COLORS = {
  positive: CHART_COLORS.success.greenLight,
  negative: CHART_COLORS.error.redLight,
  neutral: CHART_COLORS.neutral.grayLight,
};

// Theme Card Colors
export const THEME_CARD_COLORS = [
  { bg: '#3B82F6', hover: '#2563EB', label: 'Blue' },
  { bg: '#10B981', hover: '#059669', label: 'Green' },
  { bg: '#F59E0B', hover: '#D97706', label: 'Yellow/Orange' },
  { bg: '#8B5CF6', hover: '#7C3AED', label: 'Purple' },
  { bg: '#EF4444', hover: '#DC2626', label: 'Red' },
];

// Chart Heights
export const CHART_HEIGHTS = {
  line: 250,
  bar: 250,
  doughnut: 300,
  keywords: 300,
  wordCloud: 450,
};

// Spacing Constants
export const SPACING = {
  container: {
    mt: 2, // Reduced from 4 for hero layout
    mb: 3,
  },
  section: {
    mb: 3, // Reduced from 4
  },
  card: {
    mb: 2, // Reduced from 3
  },
  grid: {
    spacing: 2, // Reduced from 3 for tighter layout
  },
  hero: {
    mb: 3, // Spacing after hero section
  },
};

// Word Cloud Configuration
export const WORD_CLOUD_CONFIG = {
  fontSizes: [80, 200], // Much larger font size range: min 80px, max 200px for better visibility
  minSize: 80, // Minimum font size - ensures even low-frequency words (2-3 uses) are large and visible
  padding: 1, // Reduced padding to fill more space
  gridSize: 1, // Reduced grid size for tighter packing
  rotations: 2,
  rotationSteps: 2,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 'bold',
  scale: 'linear', // Use linear scale for more consistent sizing across frequencies
  containerHeight: 600, // Increased container height
};

// Chart Default Options
export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
};

// Line Chart Specific Options
export const LINE_CHART_OPTIONS = {
  ...CHART_OPTIONS,
  plugins: {
    ...CHART_OPTIONS.plugins,
    tooltip: {
      callbacks: {
        label: function(context) {
          const score = context.parsed.y;
          if (score === null || score === undefined) return 'No data';
          const sentiment = score >= 50 ? 'Positive' : 'Negative';
          return `${sentiment}: ${score}%`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value) {
          return value + '%';
        },
      },
      grid: {
        color: function(context) {
          if (context.tick.value === 50) {
            return 'rgba(0, 0, 0, 0.3)';
          }
          return 'rgba(0, 0, 0, 0.1)';
        },
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  elements: {
    point: {
      radius: function(context) {
        return context.raw === null || context.raw === undefined ? 0 : 5;
      },
    },
  },
};

// Bar Chart Specific Options
export const BAR_CHART_OPTIONS = {
  ...CHART_OPTIONS,
  plugins: {
    ...CHART_OPTIONS.plugins,
    tooltip: {
      callbacks: {
        label: function(context) {
          const score = context.parsed.y;
          if (score === null) return 'No data';
          return `Positivity: ${score}%`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value) {
          return value + '%';
        },
      },
    },
  },
};

// Doughnut Chart Specific Options
export const DOUGHNUT_CHART_OPTIONS = {
  ...CHART_OPTIONS,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
};

// Default Values
export const DEFAULT_VALUES = {
  daily_progress: {
    days_this_month: 0,
    current_streak: 0,
    longest_streak: 0,
    total_days: 0,
  },
  positivity_score: {
    overall_score: 0,
    trend: 'neutral',
    positive_count: 0,
    negative_count: 0,
  },
  weekly_summary: {
    days_completed: 0,
    top_themes: [],
    weekly_trend: 'neutral',
    positivity_score: 0,
  },
  top_keywords: {
    top_10: [],
    counts: {},
  },
  daily_sentiment: {},
  total_reflections: 0,
  last_submission: null,
};

// Positivity Score Thresholds
export const POSITIVITY_THRESHOLDS = {
  high: 70,
  medium: 50,
  low: 0,
};

// Date Format Options
export const DATE_FORMATS = {
  display: 'en-US',
  short: { weekday: 'short', month: 'short', day: 'numeric' },
  numeric: 'MM/DD/YYYY',
};

// Empty State Messages
export const EMPTY_STATE_MESSAGES = {
  noSentimentData: 'No sentiment data available for this week. Start reflecting to see your daily sentiment trends!',
  noKeywords: 'No keywords yet. Start reflecting to see your most used words!',
  noThemes: 'Start reflecting to see your themes!',
  noData: 'No data available',
};

// Loading Messages
export const LOADING_MESSAGES = {
  dashboard: 'Loading your dashboard...',
  default: 'Loading...',
};

// Error Messages
export const ERROR_MESSAGES = {
  failedToLoad: 'Failed to load dashboard summary',
  loginRequired: 'Make sure you have logged in and submitted at least one response.',
};

