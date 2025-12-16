// formatters.js
export function formatCurrency(amount, currency = 'KES') {
    // Ensure we always pass a finite number to Intl.NumberFormat
    const num = Number(amount);
    const value = Number.isFinite(num) ? num : 0;

    try {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency
        }).format(value);
    } catch (e) {
        // Fallback formatting
        return `${currency} ${value.toFixed(2)}`;
    }
}

export function safeNumber(value, defaultValue = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

//format date
export function formatDate(date, format = 'long') {
    if (!date) return '';
    
    const dateObj = new Date(date);
    
    // Relative format (e.g., "5 minutes ago", "2 hours ago")
    if (format === 'relative') {
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
        if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
        return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    }
    
    // Short format (e.g., "Jan 1, 2025")
    if (format === 'short') {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }
    
    // Default long format (e.g., "January 1, 2025")
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
}

export function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleString('en-US', options);
}

export function formatTime(time) {
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Format date for API calls (YYYY-MM-DD format)
export function formatDateForAPI(date) {
    if (!date) return null;
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Format month selection for API calls (first day of selected month)
// This function properly handles month selection without timezone issues
export function formatMonthForAPI(monthDate) {
    if (!monthDate) return null;

    // Create a new date object from the selected month
    const dateObj = new Date(monthDate);

    // Extract year and month, then create a new date for the first day of that month
    // This avoids timezone conversion issues
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // getMonth() returns 0-11

    // Create date in local timezone to avoid timezone shifts
    const firstDayOfMonth = new Date(year, month, 1);

    // Format as YYYY-MM-DD
    const yearStr = firstDayOfMonth.getFullYear();
    const monthStr = String(firstDayOfMonth.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() is 0-based
    const dayStr = String(firstDayOfMonth.getDate()).padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
}

// Get the last day of the month for a given date
export function getLastDayOfMonth(monthDate) {
    if (!monthDate) return null;

    // Create a new date object from the selected month
    const dateObj = new Date(monthDate);

    // Extract year and month
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // getMonth() returns 0-11

    // Create date for the first day of the next month, then subtract 1 day
    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    const lastDayOfMonth = new Date(firstDayOfNextMonth.getTime() - 24 * 60 * 60 * 1000);

    // Format as YYYY-MM-DD
    const yearStr = lastDayOfMonth.getFullYear();
    const monthStr = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(lastDayOfMonth.getDate()).padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
}

// Get both first and last day of the month for payroll period
export function getMonthDateRange(monthDate) {
    if (!monthDate) return { fromdate: null, todate: null };

    return {
        fromdate: formatMonthForAPI(monthDate),
        todate: getLastDayOfMonth(monthDate)
    };
}
