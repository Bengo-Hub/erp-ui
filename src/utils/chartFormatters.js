/**
 * Chart Data Formatters
 * Utilities to convert backend API responses to chart-compatible formats
 */

/**
 * Convert line chart API response to PrimeVue Chart format
 * @param {Array} data - Array of data points [{date, value}, ...]
 * @param {String} dateField - Field name for dates
 * @param {String} valueField - Field name for values
 * @param {String} label - Chart label
 * @returns {Object} Chart data object
 */
export const convertLineChartData = (data, dateField = 'date', valueField = 'value', label = 'Trend') => {
    if (!data || !Array.isArray(data)) return null;

    return {
        labels: data.map(item => item[dateField]),
        datasets: [
            {
                label,
                data: data.map(item => item[valueField]),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f620',
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }
        ]
    };
};

/**
 * Convert pie/doughnut chart API response to PrimeVue Chart format
 * @param {Array} items - Array of items [{label, value}, ...]
 * @param {String} labelField - Field name for labels
 * @param {String} valueField - Field name for values
 * @returns {Object} Chart data object
 */
export const convertPieChartData = (items, labelField = 'label', valueField = 'value') => {
    if (!items || !Array.isArray(items)) return null;

    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];

    return {
        labels: items.map(item => item[labelField]),
        datasets: [
            {
                data: items.map(item => item[valueField]),
                backgroundColor: colors.slice(0, items.length),
                borderColor: '#fff',
                borderWidth: 2
            }
        ]
    };
};

/**
 * Convert bar/column chart API response to PrimeVue Chart format
 * @param {Array} data - Array of data items
 * @param {String} categoryField - Field name for categories
 * @param {Array} valueFields - Array of value field names
 * @param {Array} labels - Array of labels for datasets
 * @returns {Object} Chart data object
 */
export const convertBarChartData = (data, categoryField = 'category', valueFields = ['value'], labels = ['Data']) => {
    if (!data || !Array.isArray(data)) return null;

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

    return {
        labels: data.map(item => item[categoryField]),
        datasets: valueFields.map((field, idx) => ({
            label: labels[idx] || field,
            data: data.map(item => item[field]),
            backgroundColor: colors[idx % colors.length]
        }))
    };
};

/**
 * Convert multi-series time series data to stacked area chart
 * @param {Array} data - Array of data points [{date, series1: val1, series2: val2}, ...]
 * @param {String} dateField - Field name for dates
 * @param {Array} seriesFields - Array of series field names
 * @param {Array} labels - Array of labels for series
 * @returns {Object} Chart data object
 */
export const convertStackedAreaChartData = (data, dateField = 'date', seriesFields = [], labels = []) => {
    if (!data || !Array.isArray(data)) return null;

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

    return {
        labels: data.map(item => item[dateField]),
        datasets: seriesFields.map((field, idx) => ({
            label: labels[idx] || field,
            data: data.map(item => item[field]),
            borderColor: colors[idx % colors.length],
            backgroundColor: `${colors[idx % colors.length]}40`,
            fill: true,
            tension: 0.4
        }))
    };
};

/**
 * Convert comparison data for grouped bar chart
 * @param {Array} data - Array of items with multiple values
 * @param {String} categoryField - Field for category labels
 * @param {Object} valueMap - Map of {fieldName: 'displayLabel'}
 * @returns {Object} Chart data object
 */
export const convertComparisonChartData = (data, categoryField = 'name', valueMap = {}) => {
    if (!data || !Array.isArray(data)) return null;

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
    const valueFields = Object.keys(valueMap);

    return {
        labels: data.map(item => item[categoryField]),
        datasets: valueFields.map((field, idx) => ({
            label: valueMap[field],
            data: data.map(item => item[field]),
            backgroundColor: colors[idx % colors.length]
        }))
    };
};

/**
 * Convert transaction/order list to timeline data
 * @param {Array} data - Array of transactions [{date, amount, type}, ...]
 * @param {String} dateField - Field for dates
 * @param {String} amountField - Field for amounts
 * @returns {Object} Timeline formatted data
 */
export const convertTimelineData = (data, dateField = 'date', amountField = 'amount') => {
    if (!data || !Array.isArray(data)) return null;

    return data.map(item => ({
        date: item[dateField],
        amount: item[amountField],
        label: item.description || item.type || 'Transaction',
        severity: item.amount > 0 ? 'success' : 'danger'
    }));
};

/**
 * Format chart data with calculated percentages
 * @param {Array} items - Array of items [{label, value}, ...]
 * @returns {Array} Items with percentage field added
 */
export const addPercentagesToChartData = (items) => {
    if (!items || !Array.isArray(items)) return [];

    const total = items.reduce((sum, item) => sum + (item.value || 0), 0);

    return items.map(item => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(2) : 0
    }));
};

/**
 * Group and aggregate data by time period
 * @param {Array} data - Raw transaction data
 * @param {String} dateField - Field containing date
 * @param {String} valueField - Field containing numeric value
 * @param {String} period - 'day' | 'week' | 'month' | 'year'
 * @returns {Array} Aggregated data
 */
export const aggregateDataByPeriod = (data, dateField = 'date', valueField = 'value', period = 'month') => {
    if (!data || !Array.isArray(data)) return [];

    const grouped = {};

    data.forEach(item => {
        const date = new Date(item[dateField]);
        let periodKey;

        switch (period) {
            case 'day':
                periodKey = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'year':
                periodKey = date.getFullYear().toString();
                break;
            default:
                periodKey = date.toISOString().split('T')[0];
        }

        grouped[periodKey] = (grouped[periodKey] || 0) + (item[valueField] || 0);
    });

    return Object.entries(grouped).map(([period, value]) => ({
        date: period,
        value
    }));
};

export default {
    convertLineChartData,
    convertPieChartData,
    convertBarChartData,
    convertStackedAreaChartData,
    convertComparisonChartData,
    convertTimelineData,
    addPercentagesToChartData,
    aggregateDataByPeriod
};
