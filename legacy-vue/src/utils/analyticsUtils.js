/**
 * Analytics Utilities
 * Helpers for calculating metrics, trends, and aggregations
 */

/**
 * Calculate percentage change between two values
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

/**
 * Calculate trend for a data series
 * @param {Array} data - Array of numbers
 * @returns {Object} Trend info {direction, percentage, label}
 */
export const calculateTrend = (data) => {
    if (!data || data.length < 2) return { direction: 'neutral', percentage: 0, label: 'No data' };

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = calculatePercentageChange(avgSecond, avgFirst);

    return {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        percentage: Math.abs(change),
        label: change > 0 ? 'Increasing' : change < 0 ? 'Decreasing' : 'Stable'
    };
};

/**
 * Calculate growth rate between two values
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} Growth percentage
 */
export const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : -100;
    return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Calculate standard deviation
 * @param {Array} values - Array of numbers
 * @returns {Number} Standard deviation
 */
export const calculateStandardDeviation = (values) => {
    if (!values || values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(avgSquareDiff);
};

/**
 * Calculate average value
 * @param {Array} values - Array of numbers
 * @returns {Number} Average
 */
export const calculateAverage = (values) => {
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Calculate median value
 * @param {Array} values - Array of numbers
 * @returns {Number} Median
 */
export const calculateMedian = (values) => {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Calculate sum of values
 * @param {Array} values - Array of numbers
 * @returns {Number} Sum
 */
export const calculateSum = (values) => {
    if (!values || !Array.isArray(values)) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0);
};

/**
 * Find min and max values
 * @param {Array} values - Array of numbers
 * @returns {Object} {min, max}
 */
export const findMinMax = (values) => {
    if (!values || values.length === 0) return { min: 0, max: 0 };
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
};

/**
 * Format metric value with appropriate units
 * @param {Number} value - Value to format
 * @param {String} type - Type: 'currency' | 'percentage' | 'decimal' | 'integer'
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted value
 */
export const formatMetricValue = (value, type = 'decimal', decimals = 2) => {
    if (value === null || value === undefined) {
        const zero = (0).toFixed(decimals);
        return type === 'currency' ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(zero)) : zero;
    }

    const num = Number(value);
    const fixed = Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);

    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(Number(fixed));
        case 'percentage':
            return `${fixed}%`;
        case 'integer':
            return Math.round(value).toString();
        case 'decimal':
        default:
            return Number(fixed).toLocaleString('en-KE', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
    }
};

/**
 * Calculate percentage of total
 * @param {Number} value - Value
 * @param {Number} total - Total
 * @param {Number} decimals - Decimal places
 * @returns {Number} Percentage
 */
export const calculatePercentageOfTotal = (value, total, decimals = 2) => {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Group array by field and sum values
 * @param {Array} data - Array of objects
 * @param {String} groupField - Field to group by
 * @param {String} sumField - Field to sum
 * @returns {Array} Grouped data
 */
export const groupAndSum = (data, groupField, sumField) => {
    if (!data || !Array.isArray(data)) return [];

    const grouped = {};

    data.forEach(item => {
        const key = item[groupField];
        grouped[key] = (grouped[key] || 0) + (item[sumField] || 0);
    });

    return Object.entries(grouped).map(([key, sum]) => ({
        [groupField]: key,
        [sumField]: sum
    }));
};

/**
 * Calculate moving average
 * @param {Array} values - Array of numbers
 * @param {Number} windowSize - Size of moving window
 * @returns {Array} Moving averages
 */
export const calculateMovingAverage = (values, windowSize = 3) => {
    if (!values || values.length < windowSize) return values;

    const result = [];
    for (let i = 0; i <= values.length - windowSize; i++) {
        const window = values.slice(i, i + windowSize);
        const avg = calculateAverage(window);
        result.push(avg);
    }
    return result;
};

/**
 * Calculate variance
 * @param {Array} values - Array of numbers
 * @returns {Number} Variance
 */
export const calculateVariance = (values) => {
    if (!values || values.length === 0) return 0;
    const mean = calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Generate KPI status based on value and thresholds
 * @param {Number} value - Current value
 * @param {Object} thresholds - {poor, fair, good, excellent}
 * @returns {Object} {status, color, icon}
 */
export const getKPIStatus = (value, thresholds = { poor: 30, fair: 60, good: 80, excellent: 100 }) => {
    if (value >= thresholds.excellent) {
        return { status: 'excellent', color: '#10b981', icon: 'pi-check-circle' };
    } else if (value >= thresholds.good) {
        return { status: 'good', color: '#3b82f6', icon: 'pi-circle-fill' };
    } else if (value >= thresholds.fair) {
        return { status: 'fair', color: '#f59e0b', icon: 'pi-exclamation-circle' };
    }
    return { status: 'poor', color: '#ef4444', icon: 'pi-times-circle' };
};

export default {
    calculatePercentageChange,
    calculateTrend,
    calculateGrowth,
    calculateStandardDeviation,
    calculateAverage,
    calculateMedian,
    calculateSum,
    findMinMax,
    formatMetricValue,
    calculatePercentageOfTotal,
    groupAndSum,
    calculateMovingAverage,
    calculateVariance,
    getKPIStatus
};
