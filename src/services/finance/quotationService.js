/**
 * Quotation Service - Comprehensive quotation management API
 * Integrates with backend finance/quotations endpoints
 */
import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';
import { extractPaginatedData } from '../utils/responseHandler';

const QUOTATIONS_BASE = '/finance/quotations';

export const quotationService = {
    // Quotation CRUD Operations
    async getQuotations(params = {}) {
        try {
            const response = await axios.get(`${QUOTATIONS_BASE}/quotations/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getQuotation(id) {
        try {
            const response = await axios.get(`${QUOTATIONS_BASE}/quotations/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createQuotation(data) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateQuotation(id, data) {
        try {
            const response = await axios.put(`${QUOTATIONS_BASE}/quotations/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteQuotation(id) {
        try {
            const response = await axios.delete(`${QUOTATIONS_BASE}/quotations/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Quotation Actions
    async sendQuotation(id, emailData = {}) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/send/`, emailData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async markAsSent(id) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/mark-as-sent/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async acceptQuotation(id) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/accept/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async declineQuotation(id, reason = '') {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/decline/`, { reason });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async convertToInvoice(id, conversionData = {}) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/convert-to-invoice/`, conversionData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async cloneQuotation(id) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/clone/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async sendFollowUp(id) {
        try {
            const response = await axios.post(`${QUOTATIONS_BASE}/quotations/${id}/send-follow-up/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Quotation Analytics
    async getQuotationSummary(params = {}) {
        try {
            const response = await axios.get(`${QUOTATIONS_BASE}/quotations/summary/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getPendingQuotations(params = {}) {
        try {
            const response = await axios.get(`${QUOTATIONS_BASE}/quotations/pending/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Quotation Email Logs
    async getQuotationEmailLogs(quotationId) {
        try {
            const response = await axios.get(`${QUOTATIONS_BASE}/quotation-email-logs/`, {
                params: { quotation: quotationId }
            });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Helper: Filter quotations by status
    async getQuotationsByStatus(status, params = {}) {
        return this.getQuotations({ status_filter: status, ...params });
    },

    // Helper: Get draft quotations
    async getDraftQuotations(params = {}) {
        return this.getQuotationsByStatus('draft', params);
    },

    // Helper: Get sent quotations
    async getSentQuotations(params = {}) {
        return this.getQuotationsByStatus('sent', params);
    },

    // Helper: Get accepted quotations
    async getAcceptedQuotations(params = {}) {
        return this.getQuotationsByStatus('accepted', params);
    },

    // Helper: Get converted quotations
    async getConvertedQuotations(params = {}) {
        return this.getQuotations({ converted: 'true', ...params });
    },
};

export default quotationService;

