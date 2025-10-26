/**
 * Centralized Reports Service
 * Handles all report API calls across all ERP modules
 * Provides unified interface for fetching, exporting, and managing reports
 */

import { handleError } from '@/services/utils/errorHandler.js';
import axios from '@/utils/axiosConfig';

const V1_BASE = '';
const ENDPOINTS = {
    // HRM Reports
    HRM_PAYROLL_REPORTS: '/hrm/payroll/reports',
    HRM_ANALYTICS: '/hrm/analytics',
    
    // Finance Reports
    FINANCE_REPORTS: '/finance/reports',
    FINANCE_ANALYTICS: '/finance/analytics',
    
    // Ecommerce Reports
    ECOMMERCE_REPORTS: '/ecommerce/reports',
    ECOMMERCE_ANALYTICS: '/ecommerce/analytics',
    
    // Manufacturing Reports
    MANUFACTURING_REPORTS: '/manufacturing/reports',
    MANUFACTURING_ANALYTICS: '/manufacturing/analytics',
    
    // Procurement Reports
    PROCUREMENT_REPORTS: '/procurement/reports',
    PROCUREMENT_ANALYTICS: '/procurement/analytics',
    
    // CRM Reports
    CRM_REPORTS: '/crm/reports',
    CRM_ANALYTICS: '/crm/analytics'
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
 * Finance Reports Service
 */
export const financeReportsService = {
    /**
     * Get Profit & Loss Statement
     */
    async getProfitLossStatement(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.FINANCE_REPORTS}/profit-loss/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Balance Sheet
     */
    async getBalanceSheet(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.FINANCE_REPORTS}/balance-sheet/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Cash Flow Statement
     */
    async getCashFlowStatement(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.FINANCE_REPORTS}/cash-flow/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Financial Statements Suite
     */
    async getFinancialStatementsSuite(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.FINANCE_REPORTS}/statements-suite/`, { params });
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
                `${V1_BASE}${ENDPOINTS.FINANCE_REPORTS}/export/${reportType}/`,
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
 * Ecommerce Reports Service
 */
export const ecommerceReportsService = {
    /**
     * Get Sales Dashboard Report
     */
    async getSalesDashboard(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/sales-dashboard/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Product Performance Report
     */
    async getProductPerformance(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/product-performance/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Customer Analysis Report
     */
    async getCustomerAnalysis(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/customer-analysis/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Inventory Management Report
     */
    async getInventoryManagement(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/inventory-management/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Get Ecommerce Reports Suite
     */
    async getReportsSuite(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/suite/`, { params });
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
                `${V1_BASE}${ENDPOINTS.ECOMMERCE_REPORTS}/export/${reportType}/`,
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
 * Manufacturing Reports Service
 */
export const manufacturingReportsService = {
    /**
     * Get Production Analytics
     */
    async getProductionAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.MANUFACTURING_ANALYTICS}/`, { params });
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
                `${V1_BASE}${ENDPOINTS.MANUFACTURING_REPORTS}/export/${reportType}/`,
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
 * Procurement Reports Service
 */
export const procurementReportsService = {
    /**
     * Get Procurement Analytics
     */
    async getProcurementAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.PROCUREMENT_ANALYTICS}/`, { params });
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
                `${V1_BASE}${ENDPOINTS.PROCUREMENT_REPORTS}/export/${reportType}/`,
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
 * CRM Reports Service
 */
export const crmReportsService = {
    /**
     * Get CRM Analytics
     */
    async getCrmAnalytics(params = {}) {
        try {
            const response = await axios.get(`${V1_BASE}${ENDPOINTS.CRM_ANALYTICS}/`, { params });
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
                `${V1_BASE}${ENDPOINTS.CRM_REPORTS}/export/${reportType}/`,
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
    hrm: hrmReportsService,
    finance: financeReportsService,
    ecommerce: ecommerceReportsService,
    manufacturing: manufacturingReportsService,
    procurement: procurementReportsService,
    crm: crmReportsService
};
