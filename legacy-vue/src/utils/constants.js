/**
 * Application-wide Constants
 * Centralized location for shared constants used across the application
 */

// Period/Date Range Options
export const PERIOD_OPTIONS = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
];

// Chart Color Palettes
export const CHART_COLORS = {
    primary: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
    success: ['#10b981', '#059669', '#047857', '#065f46'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
    danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    info: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
    gradient: {
        blue: { from: '#3b82f6', to: '#1e40af' },
        green: { from: '#10b981', to: '#059669' },
        orange: { from: '#f59e0b', to: '#d97706' },
        red: { from: '#ef4444', to: '#dc2626' },
        purple: { from: '#8b5cf6', to: '#7c3aed' },
        pink: { from: '#ec4899', to: '#be185d' },
        cyan: { from: '#06b6d4', to: '#0891b2' }
    }
};

// Dashboard Action Icons
export const DASHBOARD_ICONS = {
    add: 'pi pi-plus',
    edit: 'pi pi-pencil',
    delete: 'pi pi-trash',
    view: 'pi pi-eye',
    refresh: 'pi pi-refresh',
    export: 'pi pi-download',
    filter: 'pi pi-filter',
    search: 'pi pi-search',
    calendar: 'pi pi-calendar',
    chart: 'pi pi-chart-bar',
    users: 'pi pi-users',
    settings: 'pi pi-cog'
};

// Status Options
export const STATUS_OPTIONS = {
    active: { label: 'Active', value: 'active', severity: 'success' },
    inactive: { label: 'Inactive', value: 'inactive', severity: 'danger' },
    pending: { label: 'Pending', value: 'pending', severity: 'warning' },
    suspended: { label: 'Suspended', value: 'suspended', severity: 'warning' },
    completed: { label: 'Completed', value: 'completed', severity: 'success' },
    cancelled: { label: 'Cancelled', value: 'cancelled', severity: 'danger' }
};

// Employment Types
export const EMPLOYMENT_TYPES = [
    { value: 'regular-open', label: 'Regular (Open-ended)' },
    { value: 'regular-fixed', label: 'Regular (Fixed-term)' },
    { value: 'intern', label: 'Intern' },
    { value: 'probationary', label: 'Probationary' },
    { value: 'casual', label: 'Casual' },
    { value: 'consultant', label: 'Consultant' }
];

// Contract Statuses
export const CONTRACT_STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'expired', label: 'Expired' }
];

// Pagination Defaults
export const PAGINATION = {
    defaultRows: 100,
    rowsPerPageOptions: [10, 25, 50, 100, 250, 500],
    maxRows: 500
};

// API Response Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

// Toast Lifetimes (milliseconds)
export const TOAST_LIFE = {
    short: 3000,
    medium: 5000,
    long: 7000
};

// File Size Limits (bytes)
export const FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024 // 50MB
};

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

export default {
    PERIOD_OPTIONS,
    CHART_COLORS,
    DASHBOARD_ICONS,
    STATUS_OPTIONS,
    EMPLOYMENT_TYPES,
    CONTRACT_STATUSES,
    PAGINATION,
    HTTP_STATUS,
    TOAST_LIFE,
    FILE_SIZE_LIMITS,
    ALLOWED_FILE_TYPES
};

