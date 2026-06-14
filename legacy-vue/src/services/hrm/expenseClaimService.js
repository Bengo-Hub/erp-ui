import axios from '@/utils/axiosConfig';

const V1_HRM_BASE = '/hrm';
const PAYROLL_BASE = `${V1_HRM_BASE}/payroll`;

export const expenseClaimService = {
    // Expense Claim Settings
    getExpenseClaimSettings() {
        return axios.get(`${PAYROLL_BASE}/expense-claim-settings/`);
    },
    
    updateExpenseClaimSettings(id, data) {
        return axios.put(`${PAYROLL_BASE}/expense-claim-settings/${id}/`, data);
    },

    // Expense Codes
    listExpenseCodes(params = {}) {
        return axios.get(`${PAYROLL_BASE}/expense-codes/`, { params });
    },
    
    getExpenseCode(id) {
        return axios.get(`${PAYROLL_BASE}/expense-codes/${id}/`);
    },
    
    createExpenseCode(data) {
        return axios.post(`${PAYROLL_BASE}/expense-codes/`, data);
    },
    
    updateExpenseCode(id, data) {
        return axios.put(`${PAYROLL_BASE}/expense-codes/${id}/`, data);
    },
    
    deleteExpenseCode(id) {
        return axios.delete(`${PAYROLL_BASE}/expense-codes/${id}/`);
    },

    // Expense Claims
    listExpenseClaims(params = {}) {
        return axios.get(`${PAYROLL_BASE}/claims/`, { params });
    },
    
    getExpenseClaim(id) {
        return axios.get(`${PAYROLL_BASE}/claims/${id}/`);
    },
    
    createExpenseClaim(data) {
        return axios.post(`${PAYROLL_BASE}/claims/`, data);
    },
    
    updateExpenseClaim(id, data) {
        return axios.put(`${PAYROLL_BASE}/claims/${id}/`, data);
    },
    
    deleteExpenseClaim(id) {
        return axios.delete(`${PAYROLL_BASE}/claims/${id}/`);
    },
    
    approveExpenseClaim(id) {
        return axios.post(`${PAYROLL_BASE}/claims/${id}/approve/`);
    },
    
    rejectExpenseClaim(id, reason) {
        return axios.post(`${PAYROLL_BASE}/claims/${id}/reject/`, { reason });
    }
};

