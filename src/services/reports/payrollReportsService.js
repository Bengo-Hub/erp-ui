/**
 * Payroll Reports Service
 * 
 * Service for fetching payroll statutory reports data from the backend.
 * Provides comprehensive reporting for Kenyan statutory requirements (KRA, NSSF, NHIF, NITA).
 */

import { handleError } from '@/services/utils/errorHandler.js';
import axios from '@/utils/axiosConfig';

const HRM_BASE = '/hrm';
const PAYROLL_BASE = `${HRM_BASE}/payroll`;
const REPORTS_BASE = `${PAYROLL_BASE}/reports`;

export const payrollReportsService = {
    /**
     * Get P9 Tax Deduction Card Report
     * @param {Object} params - Filter parameters (year, employee_id, department, etc.)
     * @returns {Promise} P9 report data
     */
    async getP9Report(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/p9/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export P9 Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportP9Report(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/p9/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get P10A Annual PAYE Return Report
     * @param {Object} params - Filter parameters (year, etc.)
     * @returns {Promise} P10A report data
     */
    async getP10AReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/p10a/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export P10A Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportP10AReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/p10a/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get KRA Withholding Tax Report
     * @param {Object} params - Filter parameters (month, year, etc.)
     * @returns {Promise} Withholding tax report data
     */
    async getWithholdingTaxReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/withholding-tax/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Withholding Tax Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportWithholdingTaxReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/withholding-tax/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get NSSF Contributions Report
     * @param {Object} params - Filter parameters (month, year, etc.)
     * @returns {Promise} NSSF report data
     */
    async getNSSFReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nssf/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export NSSF Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportNSSFReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nssf/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get NHIF (SHA) Contributions Report
     * @param {Object} params - Filter parameters (month, year, etc.)
     * @returns {Promise} NHIF report data
     */
    async getNHIFReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nhif/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export NHIF Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportNHIFReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nhif/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get NITA Industrial Training Levy Report
     * @param {Object} params - Filter parameters (month, year, etc.)
     * @returns {Promise} NITA report data
     */
    async getNITAReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nita/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export NITA Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportNITAReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/nita/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Bank Net Pay Report
     * @param {Object} params - Filter parameters (month, year, bank_id, etc.)
     * @returns {Promise} Bank net pay report data
     */
    async getBankNetPayReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/bank-net-pay/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Bank Net Pay Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel, txt)
     * @returns {Promise} Blob data
     */
    async exportBankNetPayReport(params = {}, format = 'excel') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/bank-net-pay/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Muster Roll Report
     * @param {Object} params - Filter parameters (month, year, department, etc.)
     * @returns {Promise} Muster roll report data
     */
    async getMusterRollReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/muster-roll/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Muster Roll Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportMusterRollReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/muster-roll/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Payroll Variance Report
     * @param {Object} params - Filter parameters (from_month, to_month, year, etc.)
     * @returns {Promise} Variance report data
     */
    async getVarianceReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/variance/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Variance Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportVarianceReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/variance/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Central Bureau of Statistics Report
     * @param {Object} params - Filter parameters (year, quarter, etc.)
     * @returns {Promise} CBS report data
     */
    async getCBSReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/cbs/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export CBS Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportCBSReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/cbs/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Approvers/Approval Workflow Report
     * @param {Object} params - Filter parameters (month, year, status, etc.)
     * @returns {Promise} Approvers report data
     */
    async getApproversReport(params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/approvers/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Approvers Report
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportApproversReport(params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/approvers/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Custom Reports List
     * @returns {Promise} Custom reports data
     */
    async getCustomReports() {
        try {
            const response = await axios.get(`${REPORTS_BASE}/custom/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Custom Report by ID
     * @param {string} reportId - Report ID
     * @param {Object} params - Filter parameters
     * @returns {Promise} Custom report data
     */
    async getCustomReport(reportId, params = {}) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/custom/${reportId}/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Create Custom Report
     * @param {Object} reportData - Report configuration
     * @returns {Promise} Created report data
     */
    async createCustomReport(reportData) {
        try {
            const response = await axios.post(`${REPORTS_BASE}/custom/`, reportData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Update Custom Report
     * @param {string} reportId - Report ID
     * @param {Object} reportData - Report configuration
     * @returns {Promise} Updated report data
     */
    async updateCustomReport(reportId, reportData) {
        try {
            const response = await axios.put(`${REPORTS_BASE}/custom/${reportId}/`, reportData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Delete Custom Report
     * @param {string} reportId - Report ID
     * @returns {Promise} Deletion confirmation
     */
    async deleteCustomReport(reportId) {
        try {
            const response = await axios.delete(`${REPORTS_BASE}/custom/${reportId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Export Custom Report
     * @param {string} reportId - Report ID
     * @param {Object} params - Filter parameters
     * @param {string} format - Export format (pdf, excel)
     * @returns {Promise} Blob data
     */
    async exportCustomReport(reportId, params = {}, format = 'pdf') {
        try {
            const response = await axios.get(`${REPORTS_BASE}/custom/${reportId}/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get All Report Types with Metadata
     * @returns {Promise} Report types data
     */
    async getReportTypes() {
        try {
            const response = await axios.get(`${REPORTS_BASE}/types/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Report Filters Configuration
     * @param {string} reportType - Report type
     * @returns {Promise} Filter configuration data
     */
    async getReportFilters(reportType) {
        try {
            const response = await axios.get(`${REPORTS_BASE}/filters/${reportType}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

export default payrollReportsService;

