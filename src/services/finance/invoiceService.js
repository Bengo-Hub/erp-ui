/**
 * Invoice Service - Comprehensive invoice management API
 * Integrates with backend finance/invoicing endpoints
 */
import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';
import { extractPaginatedData } from '../utils/responseHandler';

const INVOICING_BASE = '/finance/invoicing';

export const invoiceService = {
    // Invoice CRUD Operations
    async getInvoices(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoices/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getInvoice(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoices/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createInvoice(data) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateInvoice(id, data) {
        try {
            const response = await axios.put(`${INVOICING_BASE}/invoices/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteInvoice(id) {
        try {
            const response = await axios.delete(`${INVOICING_BASE}/invoices/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Invoice Actions (Zoho-like functionality)
    async sendInvoice(id, emailData = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/send/`, emailData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async scheduleInvoice(id, scheduleData) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/schedule/`, scheduleData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async markAsSent(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/mark-as-sent/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async recordPayment(id, paymentData) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/record-payment/`, paymentData);
            return response.data.data || response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async voidInvoice(id, reason = '') {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/void/`, { reason });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async cloneInvoice(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/clone/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async sendReminder(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/send-reminder/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async approveInvoice(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/approve/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Invoice Analytics
    async getInvoiceSummary(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoices/summary/`, { params });
            return response.data.data || response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Invoice Payments
    async getInvoicePayments(invoiceId) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoice-payments/`, {
                params: { invoice: invoiceId }
            });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Invoice Email Logs
    async getInvoiceEmailLogs(invoiceId) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoice-email-logs/`, {
                params: { invoice: invoiceId }
            });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Helper: Filter invoices by status
    async getInvoicesByStatus(status, params = {}) {
        return this.getInvoices({ status_filter: status, ...params });
    },

    // Helper: Get overdue invoices
    async getOverdueInvoices(params = {}) {
        return this.getInvoicesByStatus('overdue', params);
    },

    // Helper: Get draft invoices
    async getDraftInvoices(params = {}) {
        return this.getInvoicesByStatus('draft', params);
    },

    // Helper: Get paid invoices
    async getPaidInvoices(params = {}) {
        return this.getInvoicesByStatus('paid', params);
    },

    // PDF Methods
    async getInvoicePDF(id, params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/invoices/${id}/pdf/`, {
                params: params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async downloadInvoicePDF(id, params = {}) {
        return this.getInvoicePDF(id, { ...params, download: true });
    },

    // Public/Shared Invoice Methods
    async getPublicInvoice(id, token) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/public/invoice/${id}/${token}/`);
            return response.data.data || response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async generateShareLink(id, options = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/generate-share-link/`, options);
            return response.data.data || response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async sendWithShareLink(id, emailData = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/send/`, {
                ...emailData,
                include_share_link: true
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async sendWhatsApp(id, whatsappData) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/invoices/${id}/send-whatsapp/`, whatsappData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getPaymentAccounts() {
        try {
            const response = await axios.get('/finance/accounts/paymentaccounts/');
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

export default invoiceService;

