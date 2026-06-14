import store from '@/store/index';

/**
 * Centralized employee filter builder.
 * - Adds employee id only if available and appropriate
 * - Merges common HRM filter params (department, region, project)
 * - Merges any extra params provided by caller
 */
export function useEmployeeFilters() {
    /**
     * Build query params for endpoints that can filter by employee and HRM dimensions.
     *
     * @param {Object} options
     * @param {boolean} [options.includeEmployeeFromStore=true] include current user's employee_id if present
     * @param {number|number[]} [options.employee] explicit employee id(s) to use (overrides store)
     * @param {number|number[]} [options.department] department id(s)
     * @param {number|number[]} [options.region] region id(s)
     * @param {number|number[]} [options.project] project id(s)
     * @param {Object} [options.extra] extra params to merge (e.g., fromdate, todate)
     * @returns {Object} params
     */
    const buildEmployeeFilterParams = (options = {}) => {
        const {
            includeEmployeeFromStore = true,
            employee,
            department,
            region,
            project,
            extra = {},
        } = options;

        const params = { ...extra };

        // Department/Region/Project accept single id or array
        if (department && Array.isArray(department) ? department.length : department) {
            params.department = department;
        }
        if (region && (Array.isArray(region) ? region.length : region)) {
            params.region = region;
        }
        if (project && (Array.isArray(project) ? project.length : project)) {
            params.project = project;
        }

        // Employee id handling:
        // - use explicit employee param if provided
        // - else, optionally use current user's employee_id if present
        // - never pass user id as employee id if no mapping
        const explicitEmployee =
            typeof employee !== 'undefined' && employee !== null
                ? employee
                : undefined;
        if (typeof explicitEmployee !== 'undefined') {
            params.employee = explicitEmployee;
        } else if (includeEmployeeFromStore) {
            const current = store.state?.auth?.user;
            if (current && current.employee_id) {
                params.employee = current.employee_id;
            }
        }

        return params;
    };

    return {
        buildEmployeeFilterParams,
    };
}


