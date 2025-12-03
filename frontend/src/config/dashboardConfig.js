/**
 * Dashboard Configuration
 * Centralized configuration for all dashboard components
 * No hardcoded values - everything comes from here
 */

// Color Palettes - Teal/Grey Theme
export const CHART_COLORS = {
  primary: {
    teal: 'rgba(54, 94, 99, 1)', // #365E63
    tealLight: 'rgba(54, 94, 99, 0.8)',
    tealBg: 'rgba(54, 94, 99, 0.1)',
  },
  secondary: {
    mint: 'rgba(140, 209, 188, 1)', // #8CD1BC
    mintLight: 'rgba(140, 209, 188, 0.8)',
    mintBg: 'rgba(140, 209, 188, 0.1)',
  },
  medium: {
    teal: 'rgba(107, 142, 145, 1)', // #6B8E91
    tealLight: 'rgba(107, 142, 145, 0.8)',
    tealBg: 'rgba(107, 142, 145, 0.1)',
  },
  light: {
    teal: 'rgba(207, 224, 224, 1)', // #CFE0E0
    tealLight: 'rgba(207, 224, 224, 0.8)',
    tealBg: 'rgba(207, 224, 224, 0.1)',
  },
  neutral: {
    gray: 'rgba(153, 153, 153, 1)', // #999999
    grayLight: 'rgba(153, 153, 153, 0.8)',
    grayBg: 'rgba(153, 153, 153, 0.1)',
  },
  dark: {
    gray: 'rgba(102, 102, 102, 1)', // #666666
    grayLight: 'rgba(102, 102, 102, 0.8)',
  },
};

// Chart Color Arrays - Teal Theme
export const KEYWORD_CHART_COLORS = [
  CHART_COLORS.primary.tealLight,
  CHART_COLORS.secondary.mintLight,
  CHART_COLORS.medium.tealLight,
  CHART_COLORS.light.tealLight,
  'rgba(123, 196, 214, 0.8)', // #7BC4D6 - cyan-blue
];

export const KEYWORD_CHART_BORDER_COLORS = [
  CHART_COLORS.primary.teal,
  CHART_COLORS.secondary.mint,
  CHART_COLORS.medium.teal,
  CHART_COLORS.light.teal,
  '#7BC4D6', // cyan-blue
];

export const SENTIMENT_COLORS = {
  positive: CHART_COLORS.secondary.mintLight,
  negative: 'rgba(239, 68, 68, 0.8)', // Keep red for negative
  neutral: CHART_COLORS.neutral.grayLight,
};

// Theme Card Colors - Teal variations
export const THEME_CARD_COLORS = [
  { bg: '#365E63', hover: '#3C666C', label: 'Dark Teal' },
  { bg: '#8CD1BC', hover: '#7BC4D6', label: 'Mint Green' },
  { bg: '#6B8E91', hover: '#5A7A7D', label: 'Medium Teal' },
  { bg: '#CFE0E0', hover: '#B8D0D0', label: 'Light Teal' },
  { bg: '#7BC4D6', hover: '#6BB3C5', label: 'Cyan Blue' },
];

// Chart Heights
export const CHART_HEIGHTS = {
  line: 250,
  bar: 250,
  doughnut: 300,
  keywords: 300,
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

// Chart Default Options
export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
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
  layout: {
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
  plugins: {
    ...CHART_OPTIONS.plugins,
    tooltip: {
      callbacks: {
        label: function(context) {
          const score = context.parsed.y;
          if (score === null) return 'No data';
          return `Count: ${score}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
};

// Doughnut Chart Specific Options
export const DOUGHNUT_CHART_OPTIONS = {
  ...CHART_OPTIONS,
  layout: {
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
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

// Unified Health Chart Colors
export const UNIFIED_CHART_COLORS = {
  sleep: '#4CAF50', // Green
  exercise: '#F44336', // Red
  food: '#FF9800', // Orange
  water: '#03A9F4', // Light blue
};

// Health Metric Card Configuration
export const HEALTH_CARD_CONFIG = {
  sleep: {
    name: 'Sleep',
    bgColor: '#4CAF50',
    iconColor: 'white',
  },
  exercise: {
    name: 'Exercise',
    bgColor: 'white',
    iconColor: '#F44336',
  },
  food: {
    name: 'Food',
    bgColor: 'white',
    iconColor: '#FF9800',
  },
  water: {
    name: 'Water',
    bgColor: 'white',
    iconColor: '#03A9F4',
  },
};

