/**
 * ExpenseService.js
 * Service for managing expenses with full backend integration
 * Follows BaseService pattern for consistency
 */
import BaseService from '@/services/base/BaseService';

class ExpenseService extends BaseService {
    constructor() {
        super('finance/expenses');
    }

    /**
     * Get expense summary statistics
     */
    async getExpenseSummary(params = {}) {
        return this.request('get', 'summary/', null, params);
    }

    /**
     * Record payment for an expense
     * Integrates with Finance Payment module
     */
    async recordPayment(id, data) {
        return this.request('post', `${id}/record-payment/`, data);
    }

    /**
     * Approve an expense
     */
    async approve(id, data = {}) {
        return this.request('post', `${id}/approve/`, data);
    }

    /**
     * Reject an expense
     */
    async reject(id, data = {}) {
        return this.request('post', `${id}/reject/`, data);
    }

    /**
     * Submit expense for approval
     */
    async submit(id, data = {}) {
        return this.request('post', `${id}/submit/`, data);
    }

    /**
     * Clone an expense
     */
    async clone(id) {
        return this.request('post', `${id}/clone/`);
    }

    /**
     * Bulk approve expenses
     */
    async bulkApprove(ids) {
        return this.request('post', 'bulk-approve/', { ids });
    }

    /**
     * Bulk reject expenses
     */
    async bulkReject(ids, reason = '') {
        return this.request('post', 'bulk-reject/', { ids, reason });
    }

    /**
     * Export expenses to CSV/Excel
     */
    async exportExpenses(params = {}, format = 'csv') {
        return this.request('get', `export/?format=${format}`, null, params, {
            responseType: 'blob'
        });
    }

    /**
     * Send expense report via email
     */
    async sendExpense(id, data) {
        return this.request('post', `${id}/send/`, data);
    }

    /**
     * Schedule expense report to be sent
     */
    async scheduleExpense(id, data) {
        return this.request('post', `${id}/schedule/`, data);
    }

    /**
     * Download expense PDF report
     */
    async downloadPDF(id) {
        return this.request('get', `${id}/download-pdf/`, null, null, {
            responseType: 'blob'
        });
    }
}

class ExpenseCategoryService extends BaseService {
    constructor() {
        super('finance/expensecategories');
    }
}

class PaymentAccountService extends BaseService {
    constructor() {
        super('finance/accounts/payment-accounts');
    }
}

// Export service instances
export const expenseService = new ExpenseService();
export const expenseCategoryService = new ExpenseCategoryService();
export const paymentAccountService = new PaymentAccountService();

// Default export for backward compatibility
export default expenseService;
