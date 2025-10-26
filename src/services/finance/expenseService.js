// ExpenseService.js
import axios from '@/utils/axiosConfig';
import { extractPaginatedData } from '../utils/responseHandler';

export const expenseService = {
    // Expense Categories
    getExpenseCategories(params = {}) {
        return axios.get(`finance/expensecategories/`, { params }).then(response => extractPaginatedData(response));
    },

    createExpenseCategory(data) {
        return axios.post(`finance/expensecategories/`, data);
    },

    updateExpenseCategory(id, data) {
        return axios.patch(`finance/expensecategories/${id}/`, data);
    },

    deleteExpenseCategory(id) {
        return axios.delete(`finance/expensecategories/${id}/`);
    },

    // Expenses
    getExpenses(params = {}) {
        return axios.get(`finance/expenses/`, { params }).then(response => extractPaginatedData(response));
    },

    getExpense(id) {
        return axios.get(`finance/expenses/${id}/`);
    },

    createExpense(data) {
        return axios.post(`finance/expenses/`, data);
    },

    updateExpense(id, data) {
        return axios.put(`finance/expenses/${id}/`, data);
    },

    deleteExpense(id) {
        return axios.delete(`finance/expenses/${id}/`);
    },

    // Tax Rates - Updated to use correct endpoint
    getTaxRates(params = {}) {
        return axios.get(`finance/taxes/rates/`, { params });
    },

    getTaxCategories(params = {}) {
        return axios.get(`finance/taxes/categories/`, { params });
    },

    getTaxGroups(params = {}) {
        return axios.get(`finance/taxes/groups/`, { params });
    }
};

export default ExpenseService;
