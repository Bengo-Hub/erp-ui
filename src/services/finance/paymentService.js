import axios from '@/utils/axiosConfig';
import { extractPaginatedData } from '../utils/responseHandler';

const PAYMENT_BASE_URL = '/finance/payment/';

export const paymentService = {
    // Payment Methods
    getPaymentMethods() {
        return axios.get(`${PAYMENT_BASE_URL}methods/`);
    },

    // Process Payment
    processPayment(data) {
        return axios.post(`${PAYMENT_BASE_URL}process/`, data);
    },

    // Split Payment
    processSplitPayment(data) {
        return axios.post(`${PAYMENT_BASE_URL}split/`, data);
    },

    // M-Pesa Integration (use ecommerce POS endpoints from POSService in POS flows)

    // Card Payment
    processCardPayment(data) {
        return axios.post(`${PAYMENT_BASE_URL}card/process/`, data);
    },

    // Payment Validation
    validatePayment(data) {
        return axios.post(`${PAYMENT_BASE_URL}validate/`, data);
    },

    // Get Payment Details
    getPaymentDetails(paymentId) {
        return axios.get(`${PAYMENT_BASE_URL}details/${paymentId}/`);
    },

    // Get Payment History
    getPaymentHistory(params) {
        return axios.get(`${PAYMENT_BASE_URL}history/`, { params }).then(response => extractPaginatedData(response));
    },

    // Refund Payment
    processRefund(data) {
        return axios.post(`${PAYMENT_BASE_URL}refund/`, data);
    }
};

export default PaymentService;
