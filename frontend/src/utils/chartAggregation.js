/**
 * Chart data aggregation utilities
 * Handles weekly and monthly aggregation for long-term data visualization
 */

/**
 * Aggregate daily data into weekly averages
 * @param {Object} dailyData - Object with date strings as keys and values
 * @param {Array} dateLabels - Array of date strings in YYYY-MM-DD format
 * @param {Array} dataValues - Array of data values corresponding to dateLabels
 * @returns {Object} - { labels: [], values: [] } with weekly aggregated data
 */
export function aggregateByWeek(dateLabels, dataValues) {
  if (!dateLabels || !dataValues || dateLabels.length === 0) {
    return { labels: [], values: [] };
  }

  const weeklyData = [];
  const weeklyLabels = [];
  
  // Group data by week (7-day periods)
  let currentWeek = [];
  let weekStartDate = null;
  
  for (let i = 0; i < dateLabels.length; i++) {
    try {
      const date = new Date(dateLabels[i]);
      if (isNaN(date.getTime())) {
        // Invalid date, skip
        continue;
      }
      const value = dataValues[i];
      
      // Initialize week start date
      if (!weekStartDate) {
        weekStartDate = new Date(date);
        weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay()); // Start of week (Sunday)
      }
      
      // Check if this date is still in the current week
      const daysDiff = Math.floor((date - weekStartDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 7) {
        // Still in current week
        if (value !== null && value !== undefined) {
          currentWeek.push(value);
        }
      } else {
        // New week - calculate average for previous week
        if (currentWeek.length > 0) {
          const avg = currentWeek.reduce((sum, val) => sum + val, 0) / currentWeek.length;
          weeklyData.push(Math.round(avg));
          weeklyLabels.push(formatWeekLabel(weekStartDate));
        } else {
          weeklyData.push(null);
          weeklyLabels.push(formatWeekLabel(weekStartDate));
        }
        
        // Start new week
        currentWeek = [];
        if (value !== null && value !== undefined) {
          currentWeek.push(value);
        }
        weekStartDate = new Date(date);
        weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
      }
    } catch (err) {
      // Skip invalid dates
      continue;
    }
  }
  
  // Handle last week
  if (weekStartDate) {
    if (currentWeek.length > 0) {
      const avg = currentWeek.reduce((sum, val) => sum + val, 0) / currentWeek.length;
      weeklyData.push(Math.round(avg));
      weeklyLabels.push(formatWeekLabel(weekStartDate));
    } else if (weeklyData.length > 0 || dateLabels.length > 0) {
      // Add null for last week even if no data, to maintain chart structure
      weeklyData.push(null);
      weeklyLabels.push(formatWeekLabel(weekStartDate));
    }
  }
  
  return { labels: weeklyLabels, values: weeklyData };
}

/**
 * Aggregate daily data into monthly averages
 * @param {Array} dateLabels - Array of date strings in YYYY-MM-DD format
 * @param {Array} dataValues - Array of data values corresponding to dateLabels
 * @returns {Object} - { labels: [], values: [] } with monthly aggregated data
 */
export function aggregateByMonth(dateLabels, dataValues) {
  if (!dateLabels || !dataValues || dateLabels.length === 0) {
    return { labels: [], values: [] };
  }

  const monthlyData = [];
  const monthlyLabels = [];
  
  // Group data by month
  let currentMonth = null;
  let currentMonthData = [];
  
  for (let i = 0; i < dateLabels.length; i++) {
    try {
      const date = new Date(dateLabels[i]);
      if (isNaN(date.getTime())) {
        // Invalid date, skip
        continue;
      }
      const value = dataValues[i];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (currentMonth === null) {
        currentMonth = monthKey;
      }
      
      if (monthKey === currentMonth) {
        // Still in current month
        if (value !== null && value !== undefined) {
          currentMonthData.push(value);
        }
      } else {
        // New month - calculate average for previous month
        if (currentMonthData.length > 0) {
          const avg = currentMonthData.reduce((sum, val) => sum + val, 0) / currentMonthData.length;
          monthlyData.push(Math.round(avg));
          monthlyLabels.push(formatMonthLabel(currentMonth));
        } else {
          monthlyData.push(null);
          monthlyLabels.push(formatMonthLabel(currentMonth));
        }
        
        // Start new month
        currentMonthData = [];
        if (value !== null && value !== undefined) {
          currentMonthData.push(value);
        }
        currentMonth = monthKey;
      }
    } catch (err) {
      // Skip invalid dates
      continue;
    }
  }
  
  // Handle last month
  if (currentMonth) {
    if (currentMonthData.length > 0) {
      const avg = currentMonthData.reduce((sum, val) => sum + val, 0) / currentMonthData.length;
      monthlyData.push(Math.round(avg));
      monthlyLabels.push(formatMonthLabel(currentMonth));
    } else if (monthlyData.length > 0 || dateLabels.length > 0) {
      // Add null for last month even if no data, to maintain chart structure
      monthlyData.push(null);
      monthlyLabels.push(formatMonthLabel(currentMonth));
    }
  }
  
  return { labels: monthlyLabels, values: monthlyData };
}

/**
 * Format week label (e.g., "Nov 1-7" or "Week 1")
 */
function formatWeekLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

/**
 * Format month label (e.g., "Jan 2024" or "Jan")
 */
function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Get number of days for a time range
 */
export function getDaysForRange(range) {
  switch(range) {
    case '7D': return 7;
    case '30D': return 30;
    case '3M': return 90;
    case '1Y': return 365;
    default: return 7;
  }
}

/**
 * Check if aggregation is needed for a time range
 */
export function needsAggregation(range) {
  return range === '3M' || range === '1Y';
}

/**
 * Get aggregation type for a time range
 */
export function getAggregationType(range) {
  if (range === '3M') return 'week';
  if (range === '1Y') return 'month';
  return 'day';
}

