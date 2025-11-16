/**
 * HRM Services Index
 *
 * Centralized export for all HRM-related services.
 * This provides a single import point for all HRM functionality.
 */

// Core HRM Services
export { employeeService } from './employeeService';
export { hrmAnalyticsService } from './hrmAnalyticsService';
export { payrollService } from './payrollService';

// Additional HRM Services
export { appraisalService } from './appraisalService';
export { leaveService } from './leaveService';
export { trainingService } from './trainingService';

// Re-export for convenience
export { default as hrmAnalyticsServiceDefault } from './hrmAnalyticsService';

/**
 * HRM Service Constants
 * Centralized constants for HRM API endpoints
 */
export const HRM_ENDPOINTS = {
    // Base paths
    HRM_BASE: '/hrm',
    EMPLOYEES: '/hrm/employees',
    PAYROLL: '/hrm/payroll',
    ATTENDANCE: '/hrm/attendance',
    LEAVE: '/hrm/leave',
    TRAINING: '/hrm/training',
    PERFORMANCE: '/hrm/performance',
    RECRUITMENT: '/hrm/recruitment',
    ANALYTICS: '/hrm/analytics',

    // Specific endpoints
    EMPLOYEE_STATUS: '/hrm/employee-status',
    SALARY_DETAILS: '/hrm/salary-details',
    BENEFITS: '/hrm/benefits',
    EARNINGS: '/hrm/earnings',
    DEDUCTIONS: '/hrm/deductions',
    CONTRACTS: '/hrm/contracts',

    // Payroll endpoints
    PAYROLL_PROCESS: '/hrm/payroll/payroll',
    PAYROLL_AUDITS: '/hrm/payroll/payroll-audits',
    ADVANCES: '/hrm/payroll/advances',
    CLAIMS: '/hrm/payroll/claims',
    LOSS_DAMAGES: '/hrm/payroll/losses-damages',

    // Analytics endpoints
    EMPLOYEE_ANALYTICS: '/hrm/analytics',
    PAYROLL_ANALYTICS: '/hrm/payroll/analytics',
    ATTENDANCE_ANALYTICS: '/hrm/attendance/analytics',
    LEAVE_ANALYTICS: '/hrm/leave/analytics',
    TRAINING_ANALYTICS: '/hrm/training/analytics',
    PERFORMANCE_ANALYTICS: '/hrm/performance/analytics',
    RECRUITMENT_ANALYTICS: '/hrm/recruitment/analytics'
};

/**
 * HRM Filter Types
 * Centralized filter configuration for HRM modules
 */
export const HRM_FILTER_TYPES = {
    // Employee filters
    EMPLOYEE: 'employee',
    DEPARTMENT: 'department',
    REGION: 'region',
    PROJECT: 'project',
    EMPLOYMENT_TYPE: 'employment_type',
    CONTRACT_STATUS: 'contract_status',

    // Payroll filters
    PAY_PERIOD: 'pay_period',
    PAYROLL_STATUS: 'payroll_status',

    // Attendance filters
    DATE_RANGE: 'date_range',
    ATTENDANCE_STATUS: 'attendance_status',

    // Leave filters
    LEAVE_TYPE: 'leave_type',
    LEAVE_STATUS: 'leave_status',

    // Performance filters
    REVIEW_PERIOD: 'review_period',
    PERFORMANCE_RATING: 'performance_rating'
};

/**
 * HRM Employment Types
 * Standard employment type options
 */
export const EMPLOYMENT_TYPES = [
    { value: 'regular-open', label: 'Regular (Open-ended)' },
    { value: 'regular-fixed', label: 'Regular (Fixed-term)' },
    { value: 'intern', label: 'Intern' },
    { value: 'probationary', label: 'Probationary' },
    { value: 'casual', label: 'Casual' },
    { value: 'consultant', label: 'Consultant' }
];

/**
 * HRM Contract Statuses
 * Standard contract status options
 */
export const CONTRACT_STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'expired', label: 'Expired' }
];

/**
 * HRM Service Utilities
 * Helper functions for HRM services
 */
export const HRM_UTILS = {
    /**
     * Build filter parameters for API calls
     * @param {Object} filters - Filter object from useHrmFilters
     * @returns {Object} - Formatted parameters for API
     */
    buildFilterParams(filters) {
        const params = {};

        if (filters.department) params.department = filters.department;
        if (filters.region) params.region = filters.region;
        if (filters.project) params.project = filters.project;
        if (filters.employee) params.employee = filters.employee;
        if (filters.status) params.status = filters.status;
        if (filters.employmentType) params.employment_type = filters.employmentType;
        if (filters.contractStatus) params.contract_status = filters.contractStatus;
        if (filters.dateRange && filters.dateRange.length === 2) {
            params.start_date = filters.dateRange[0];
            params.end_date = filters.dateRange[1];
        }
        if (filters.search) params.search = filters.search;
        if (filters.global?.value) params.global_search = filters.global.value;

        return params;
    },

    /**
     * Validate HRM data before API calls
     * @param {Object} data - Data to validate
     * @param {Array} requiredFields - Required field names
     * @returns {Object} - Validation result
     */
    validateHrmData(data, requiredFields = []) {
        const errors = [];
        const warnings = [];

        // Check required fields
        requiredFields.forEach((field) => {
            if (!data[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate email format if present
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Invalid email format');
        }

        // Validate phone number if present
        if (data.phone && !/^(\+254|0)[17]\d{8}$/.test(data.phone)) {
            warnings.push('Phone number format may be invalid');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};
