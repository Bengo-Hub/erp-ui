/**
 * ExpenseService.js
 * Service for managing expenses with axios integration
 */
import axios from '@/utils/axiosConfig';

const FINANCE_BASE_URL = '/finance';

export const expenseService = {
    // Expenses CRUD
    getAll: (params) => axios.get(`${FINANCE_BASE_URL}/expenses/`, { params }),
    getById: (id) => axios.get(`${FINANCE_BASE_URL}/expenses/${id}/`),
    create: (data, config = {}) => axios.post(`${FINANCE_BASE_URL}/expenses/`, data, config),
    update: (id, data, config = {}) => axios.put(`${FINANCE_BASE_URL}/expenses/${id}/`, data, config),
    patch: (id, data) => axios.patch(`${FINANCE_BASE_URL}/expenses/${id}/`, data),
    delete: (id) => axios.delete(`${FINANCE_BASE_URL}/expenses/${id}/`),
    // Expense actions
    getExpenseSummary: (params = {}) => axios.get(`${FINANCE_BASE_URL}/expenses/summary/`, { params }),
    recordPayment: (id, data) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/record-payment/`, data),
    approve: (id, data = {}) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/approve/`, data),
    reject: (id, data = {}) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/reject/`, data),
    submit: (id, data = {}) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/submit/`, data),
    clone: (id) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/clone/`),
    bulkApprove: (ids) => axios.post(`${FINANCE_BASE_URL}/expenses/bulk-approve/`, { ids }),
    bulkReject: (ids, reason = '') => axios.post(`${FINANCE_BASE_URL}/expenses/bulk-reject/`, { ids, reason }),
    exportExpenses: (params = {}, format = 'csv') => axios.get(`${FINANCE_BASE_URL}/expenses/export/`, {
        params: { format, ...params },
        responseType: 'blob'
    }),
    sendReport: (id, recipients) => axios.post(`${FINANCE_BASE_URL}/expenses/${id}/send-report/`, { recipients })
};

export const expenseCategoryService = {
    getAll: (params) => axios.get(`${FINANCE_BASE_URL}/expensecategories/`, { params }),
    getById: (id) => axios.get(`${FINANCE_BASE_URL}/expensecategories/${id}/`),
    create: (data) => axios.post(`${FINANCE_BASE_URL}/expensecategories/`, data),
    update: (id, data) => axios.patch(`${FINANCE_BASE_URL}/expensecategories/${id}/`, data),
    delete: (id) => axios.delete(`${FINANCE_BASE_URL}/expensecategories/${id}/`)
};

// Default export for backward compatibility
export default expenseService;
