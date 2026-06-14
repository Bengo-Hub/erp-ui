/**
 * Report Utilities
 * Helper functions for report generation, export, and file handling
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob data
 * @param {string} filename - The filename
 */
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Download response as file
 * @param {Object} response - Axios response with blob data
 * @param {string} defaultFilename - Default filename if not in headers
 */
export const downloadResponseAsFile = (response, defaultFilename = 'report.pdf') => {
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;

    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
        }
    }

    downloadBlob(response.data, filename);
};

/**
 * Export DataTable to CSV
 * @param {Object} dt - DataTable ref
 * @param {string} filename - Filename without extension
 */
export const exportDataTableToCSV = (dt, filename) => {
    if (dt && dt.exportCSV) {
        dt.exportCSV();
    }
};

/**
 * Print current page
 */
export const printPage = () => {
    window.print();
};

/**
 * Format month name from number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
export const formatMonthName = (month) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
};

/**
 * Get current financial year
 * @returns {number} Current financial year
 */
export const getCurrentFinancialYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // If before July, financial year is current year
    // If July or after, financial year is next year
    return currentMonth < 7 ? currentYear : currentYear + 1;
};

/**
 * Get financial year range
 * @param {number} year - Financial year
 * @returns {Object} Start and end dates
 */
export const getFinancialYearRange = (year) => {
    return {
        start: new Date(year - 1, 6, 1), // July 1st of previous year
        end: new Date(year, 5, 30) // June 30th of current year
    };
};

/**
 * Format report filters for display
 * @param {Object} filters - Filter object
 * @returns {string} Formatted filter string
 */
export const formatReportFilters = (filters) => {
    const parts = [];

    if (filters.year) parts.push(`Year: ${filters.year}`);
    if (filters.month) parts.push(`Month: ${formatMonthName(filters.month)}`);
    if (filters.department) parts.push(`Department: ${filters.department}`);
    if (filters.region) parts.push(`Region: ${filters.region}`);
    if (filters.employee) parts.push(`Employee: ${filters.employee}`);

    return parts.join(' | ');
};

/**
 * Validate report filters
 * @param {Object} filters - Filter object
 * @param {Array} required - Required filter fields
 * @returns {Object} Validation result
 */
export const validateReportFilters = (filters, required = ['year']) => {
    const missing = [];

    required.forEach(field => {
        if (!filters[field]) {
            missing.push(field);
        }
    });

    return {
        isValid: missing.length === 0,
        missing,
        message: missing.length > 0 ? `Please select: ${missing.join(', ')}` : ''
    };
};

/**
 * Get default report filters
 * @returns {Object} Default filters
 */
export const getDefaultReportFilters = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        department: null,
        region: null,
        project: null,
        employee: null
    };
};

/**
 * Build query params from filters
 * @param {Object} filters - Filter object
 * @returns {Object} Query params
 */
export const buildReportQueryParams = (filters) => {
    const params = {};

    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    if (filters.department) params.department_id = filters.department;
    if (filters.region) params.region_id = filters.region;
    if (filters.project) params.project_id = filters.project;
    if (filters.employee) params.employee_id = filters.employee;
    if (filters.dateRange && filters.dateRange.length === 2) {
        params.from_date = filters.dateRange[0]?.toISOString().split('T')[0];
        params.to_date = filters.dateRange[1]?.toISOString().split('T')[0];
    }

    return params;
};

