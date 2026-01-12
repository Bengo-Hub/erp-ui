/**
 * Billing Documents Service - Complementary billing documents API
 * Handles Credit Notes, Debit Notes, Delivery Notes, and Proforma Invoices
 * Integrates with backend finance/invoicing endpoints
 */
import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';
import { extractPaginatedData } from '../utils/responseHandler';

const INVOICING_BASE = '/finance/invoicing';

// =============================================================================
// CREDIT NOTES
// =============================================================================
export const creditNoteService = {
    async getCreditNotes(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/credit-notes/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getCreditNote(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/credit-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createCreditNote(data) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/credit-notes/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createFromInvoice(invoiceId, data = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/credit-notes/create-from-invoice/`, {
                invoice_id: invoiceId,
                ...data
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateCreditNote(id, data) {
        try {
            const response = await axios.put(`${INVOICING_BASE}/credit-notes/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteCreditNote(id) {
        try {
            const response = await axios.delete(`${INVOICING_BASE}/credit-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getCreditNotePDF(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/credit-notes/${id}/pdf/`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async applyToInvoice(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/credit-notes/${id}/apply/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

// =============================================================================
// DEBIT NOTES
// =============================================================================
export const debitNoteService = {
    async getDebitNotes(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/debit-notes/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getDebitNote(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/debit-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createDebitNote(data) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/debit-notes/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createFromInvoice(invoiceId, data = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/debit-notes/create-from-invoice/`, {
                invoice_id: invoiceId,
                ...data
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateDebitNote(id, data) {
        try {
            const response = await axios.put(`${INVOICING_BASE}/debit-notes/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteDebitNote(id) {
        try {
            const response = await axios.delete(`${INVOICING_BASE}/debit-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getDebitNotePDF(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/debit-notes/${id}/pdf/`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async applyToInvoice(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/debit-notes/${id}/apply/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

// =============================================================================
// DELIVERY NOTES
// =============================================================================
export const deliveryNoteService = {
    async getDeliveryNotes(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/delivery-notes/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getDeliveryNote(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/delivery-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createDeliveryNote(data) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/delivery-notes/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createFromInvoice(invoiceId, data = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/delivery-notes/create-from-invoice/`, {
                invoice_id: invoiceId,
                ...data
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createFromPurchaseOrder(purchaseOrderId, data = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/delivery-notes/create-from-purchase-order/`, {
                purchase_order_id: purchaseOrderId,
                ...data
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateDeliveryNote(id, data) {
        try {
            const response = await axios.put(`${INVOICING_BASE}/delivery-notes/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteDeliveryNote(id) {
        try {
            const response = await axios.delete(`${INVOICING_BASE}/delivery-notes/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async markDelivered(id, deliveryData = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/delivery-notes/${id}/mark-delivered/`, deliveryData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getDeliveryNotePDF(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/delivery-notes/${id}/pdf/`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

// =============================================================================
// PROFORMA INVOICES
// =============================================================================
export const proformaInvoiceService = {
    async getProformaInvoices(params = {}) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/proforma-invoices/`, { params });
            return extractPaginatedData(response);
        } catch (error) {
            return handleError(error);
        }
    },

    async getProformaInvoice(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/proforma-invoices/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createProformaInvoice(data) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/proforma-invoices/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createFromQuotation(quotationId, data = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/proforma-invoices/create-from-quotation/`, {
                quotation_id: quotationId,
                ...data
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateProformaInvoice(id, data) {
        try {
            const response = await axios.put(`${INVOICING_BASE}/proforma-invoices/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteProformaInvoice(id) {
        try {
            const response = await axios.delete(`${INVOICING_BASE}/proforma-invoices/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async convertToInvoice(id) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/proforma-invoices/${id}/convert-to-invoice/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getProformaInvoicePDF(id) {
        try {
            const response = await axios.get(`${INVOICING_BASE}/proforma-invoices/${id}/pdf/`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async sendProformaInvoice(id, emailData = {}) {
        try {
            const response = await axios.post(`${INVOICING_BASE}/proforma-invoices/${id}/send/`, emailData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};

// =============================================================================
// UNIFIED EXPORT
// =============================================================================
export default {
    creditNote: creditNoteService,
    debitNote: debitNoteService,
    deliveryNote: deliveryNoteService,
    proformaInvoice: proformaInvoiceService
};
