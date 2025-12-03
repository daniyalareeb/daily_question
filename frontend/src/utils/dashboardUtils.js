/**
 * Dashboard Utility Functions
 * Centralized utility functions for dashboard data processing
 */

import { DATE_FORMATS } from '../config/dashboardConfig';

/**
 * Format date string (YYYY-MM-DD) to display format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    const d = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
    return d.toLocaleDateString(DATE_FORMATS.display, DATE_FORMATS.short);
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(DATE_FORMATS.display, DATE_FORMATS.short);
};

/**
 * Format date string (YYYY-MM-DD) to MM/DD/YYYY format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string in MM/DD/YYYY
 */
export const formatDateNumeric = (dateStr) => {
  if (!dateStr) return 'Never';
  
  try {
    // Handle YYYY-MM-DD format
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const day = parseInt(dateParts[2], 10);
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        return `${formattedMonth}/${formattedDay}/${year}`;
      }
    }
    
    // Fallback for other date formats
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(d.getDate()).padStart(2, '0');
      return `${formattedMonth}/${formattedDay}/${d.getFullYear()}`;
    }
    
    return dateStr;
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
};

/**
 * Sort dates chronologically (oldest first)
 * @param {Array<string>} dates - Array of date strings
 * @returns {Array<string>} Sorted array of date strings
 */
export const sortDatesChronologically = (dates) => {
  return [...dates].sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
};

/**
 * Calculate progress percentage
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculateProgressPercentage = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, (current / total) * 100);
};

/**
 * Get days in current month
 * @returns {number} Number of days in current month
 */
export const getDaysInCurrentMonth = () => {
  const currentDate = new Date();
  return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
};

/**
 * Validate daily sentiment data
 * @param {Object} dailySentiment - Daily sentiment object
 * @returns {boolean} True if valid
 */
export const isValidDailySentiment = (dailySentiment) => {
  if (!dailySentiment || typeof dailySentiment !== 'object' || Array.isArray(dailySentiment) || Object.keys(dailySentiment).length === 0) {
    return false;
  }
  
  // Support both old format (just score) and new format (object with score, positive, negative)
  // Be lenient - accept any value that's a number or an object (we'll handle missing properties safely)
  try {
    return Object.values(dailySentiment).every(val => {
      if (val === null || val === undefined) {
        return false; // Reject null/undefined values
      }
      if (typeof val === 'number') {
        return val >= 0 && val <= 100; // Old format: just score
      }
      if (typeof val === 'object' && !Array.isArray(val)) {
        return true; // Accept any object - we'll safely check properties later
      }
      return false;
    });
  } catch (error) {
    console.warn('Error validating daily sentiment:', error);
    return false;
  }
};

/**
 * Prepare daily sentiment data for line chart
 * @param {Object} dailySentiment - Daily sentiment object with date keys
 * @returns {Object} Object with sorted labels and data arrays
 */
export const prepareLineChartData = (dailySentiment) => {
  if (!isValidDailySentiment(dailySentiment)) {
    return { labels: [], data: [], positiveData: [], negativeData: [] };
  }
  
  const sortedDates = sortDatesChronologically(Object.keys(dailySentiment));
  
  // Extract data based on format (old: just number, new: object with score/positive/negative)
  const scoreData = [];
  const positiveData = [];
  const negativeData = [];
  
  sortedDates.forEach((date) => {
    const value = dailySentiment[date];
    
    let score = null;
    let positive = null;
    let negative = null;
    
    try {
      if (value === null || value === undefined) {
        score = null;
        positive = null;
        negative = null;
      } else if (typeof value === 'number') {
        score = value;
        positive = null;
        negative = null;
      } else if (typeof value === 'object' && !Array.isArray(value) && value !== null && value !== undefined) {
        if (value && typeof value === 'object' && !Array.isArray(value) && value !== null && value !== undefined) {
          try {
            if (Object.prototype.hasOwnProperty.call(value, 'score')) {
              const scoreVal = value.score;
              score = (typeof scoreVal === 'number') ? scoreVal : null;
            }
          } catch (e) {
            score = null;
          }
          
          try {
            if (Object.prototype.hasOwnProperty.call(value, 'positive')) {
              const posVal = value.positive;
              positive = (typeof posVal === 'number') ? posVal : null;
            }
          } catch (e) {
            positive = null;
          }
          
          try {
            if (Object.prototype.hasOwnProperty.call(value, 'negative')) {
              const negVal = value.negative;
              negative = (typeof negVal === 'number') ? negVal : null;
            }
          } catch (e) {
            negative = null;
          }
        }
      } else {
        score = null;
        positive = null;
        negative = null;
      }
    } catch (error) {
      score = null;
      positive = null;
      negative = null;
    }
    
    scoreData.push(score);
    positiveData.push(positive);
    negativeData.push(negative);
  });
  
  return {
    labels: sortedDates.map(date => formatDateForDisplay(date)),
    data: scoreData,
    positiveData: positiveData,
    negativeData: negativeData,
  };
};

/**
 * Get point colors for sentiment scores
 * @param {Array<number>} scores - Array of sentiment scores
 * @returns {Array<string>} Array of color strings
 */
export const getSentimentPointColors = (scores) => {
  return scores.map(score => {
    if (score === null || score === undefined) {
      return 'rgba(156, 163, 175, 1)';
    }
    return score >= 50 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
  });
};

/**
 * Get bar chart colors for sentiment scores
 * @param {Array<number>} scores - Array of sentiment scores
 * @returns {Object} Object with backgroundColor and borderColor arrays
 */
export const getSentimentBarColors = (scores) => {
  return {
    backgroundColor: scores.map(score => {
      if (score === null) return 'rgba(156, 163, 175, 0.5)';
      if (score >= 50) {
        return `rgba(16, 185, 129, ${0.5 + (score / 200)})`;
      }
      return `rgba(239, 68, 68, ${0.5 + ((100 - score) / 200)})`;
    }),
    borderColor: scores.map(score => {
      if (score === null) return 'rgba(156, 163, 175, 1)';
      return score >= 50 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
    }),
  };
};

/**
 * Prepare keywords chart data
 * @param {Object} topKeywords - Top keywords object
 * @param {number} limit - Number of keywords to include (default: 5)
 * @returns {Object|null} Chart data object or null if invalid
 */
export const prepareKeywordsChartData = (topKeywords, limit = 5) => {
  if (!topKeywords?.top_10 || !Array.isArray(topKeywords.top_10) || topKeywords.top_10.length === 0) {
    return null;
  }
  
  const keywords = topKeywords.top_10.slice(0, limit);
  
  return {
    labels: keywords,
    datasets: [{
      label: 'Usage Count',
      data: keywords.map(k => (topKeywords?.counts && topKeywords.counts[k]) || 0),
    }],
  };
};

/**
 * Prepare mood/sentiment distribution chart data
 * @param {Object} positivityScore - Positivity score object
 * @returns {Object} Chart data object
 */
export const prepareMoodChartData = (positivityScore) => {
  const positive = positivityScore?.positive_count || 0;
  const negative = positivityScore?.negative_count || 0;
  const neutral = Math.max(0, positive + negative);
  
  return {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [positive, negative, neutral],
    }],
  };
};

/**
 * Get positivity score color based on threshold
 * @param {number} score - Positivity score (0-100)
 * @returns {string} Color name ('success', 'primary', or 'warning')
 */
export const getPositivityColor = (score) => {
  if (score >= 70) return 'success';
  if (score >= 50) return 'primary';
  return 'warning';
};

/**
 * Normalize daily sentiment object
 * @param {*} rawDailySentiment - Raw daily sentiment value
 * @returns {Object} Normalized daily sentiment object
 */
export const normalizeDailySentiment = (rawDailySentiment) => {
  if (rawDailySentiment && typeof rawDailySentiment === 'object' && !Array.isArray(rawDailySentiment)) {
    return rawDailySentiment;
  }
  return {};
};

