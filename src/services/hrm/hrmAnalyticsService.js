/**
 * HRM Analytics Service
 *
 * Service for fetching HRM analytics data from the backend.
 * Provides comprehensive analytics for all HRM modules with fallback data.
 */

import { handleError } from '@/services/utils/errorHandler.js';
import axios from '@/utils/axiosConfig';

// Align with versioned API and backend URL structure
const V1_HRM_BASE = '/hrm';
const ANALYTICS_BASE = `${V1_HRM_BASE}/analytics`;

export const hrmAnalyticsService = {
    // Main HRM Dashboard Analytics
    async getHrmDashboard(params = {}) {
        try {
            const response = await axios.get(ANALYTICS_BASE, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Analytics
    async getEmployeeAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/employees/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Payroll Analytics
    async getPayrollAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/payroll/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Attendance Analytics
    async getAttendanceAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/attendance/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Leave Analytics
    async getLeaveAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/leave/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Training Analytics
    async getTrainingAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/training/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Performance Analytics
    async getPerformanceAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/performance/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Recruitment Analytics
    async getRecruitmentAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/recruitment/analytics/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Comprehensive HRM Report
    async getHrmReport(reportType, params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/reports/${reportType}/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Export HRM Data
    async exportHrmData(dataType, format = 'csv', params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/export/${dataType}/`, {
                params: { format, ...params },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Real-time HRM Metrics
    async getRealTimeMetrics(params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/real-time/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Historical HRM Trends
    async getHistoricalTrends(metric, period, params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/trends/${metric}/`, {
                params: { period, ...params }
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Comparative Analysis
    async getComparativeAnalysis(metric, comparisonType, params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/comparison/${metric}/`, {
                params: { comparison_type: comparisonType, ...params }
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Predictive Analytics
    async getPredictiveAnalytics(metric, horizon, params = {}) {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/predictive/${metric}/`, {
                params: { horizon, ...params }
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Custom Analytics Query
    async getCustomAnalytics(query, params = {}) {
        try {
            const response = await axios.post(`${ANALYTICS_BASE}/custom-query/`, {
                query,
                params
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Analytics Configuration
    async getAnalyticsConfig() {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/config/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateAnalyticsConfig(config) {
        try {
            const response = await axios.put(`${ANALYTICS_BASE}/config/`, config);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Analytics Cache Management
    async clearAnalyticsCache(cacheType = 'all') {
        try {
            const response = await axios.post(`${ANALYTICS_BASE}/cache/clear/`, {
                cache_type: cacheType
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getAnalyticsCacheStatus() {
        try {
            const response = await axios.get(`${ANALYTICS_BASE}/cache/status/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

export default hrmAnalyticsService;
