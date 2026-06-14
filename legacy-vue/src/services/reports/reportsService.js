/**
 * Centralized Reports Service
 * Handles HRM/payroll report API calls.
 * Reports for other business domains now live in their own microservices.
 */

import { handleError } from '@/services/utils/errorHandler.js';
import axios from '@/utils/axiosConfig';

const V1_BASE = '';
const ENDPOINTS = {
    // HRM Reports
    HRM_PAYROLL_REPORTS: '/hrm/payroll/reports',
    HRM_ANALYTICS: '/hrm/analytics'
};

/**
 * HRM/Payroll Reports Service
 */
export const hrmReportsService = {
    /**
     * Get P9 Tax Report
     */
    async getP9Report(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/p9-tax/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get P10A Employer Return Report
     */
    async getP10AReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/p10a-employer-return/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Statutory Deductions Report (NSSF, NHIF, NITA)
     */
    async getStatutoryDeductionsReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/statutory-deductions/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Bank Net Pay Report
     */
    async getBankNetPayReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/bank-net-pay/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Muster Roll Report
     */
    async getMusterRollReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/muster-roll/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Withholding Tax Report
     */
    async getWithholdingTaxReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/withholding-tax/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Payroll Variance Report
     */
    async getVarianceReport(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/variance/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Payroll Analytics (Net Pay, PAYE, NSSF, NHIF trends)
     */
    async getPayrollAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.HRM_ANALYTICS}/payroll/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Report
     */
    async exportReport(reportType, format = 'pdf', params = {}) {
        try {
            const response = await axios.get(
                `${V1_BASE}${ENDPOINTS.HRM_PAYROLL_REPORTS}/export/${reportType}/`,
                {
                    params: { format, ...params },
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

/**
 * Export all services
 */
export const reportsService = {
    hrm: hrmReportsService
};
