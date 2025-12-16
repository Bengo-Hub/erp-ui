import axios from '@/utils/axiosConfig';

const FINANCE_BASE = '/finance';

export const financeService = {
    // Account Types
    getAccountTypes(params = {}) {
        return axios.get(`${FINANCE_BASE}/accounts/accounttypes/`, { params });
    },

    // Payment Accounts
    getPaymentAccounts(params = {}) {
        return axios.get(`${FINANCE_BASE}/accounts/paymentaccounts/`, { params });
    },
    getPaymentAccount(id) {
        return axios.get(`${FINANCE_BASE}/accounts/paymentaccounts/${id}/`);
    },
    createPaymentAccount(data) {
        return axios.post(`${FINANCE_BASE}/accounts/paymentaccounts/`, data);
    },
    updatePaymentAccount(id, data) {
        return axios.patch(`${FINANCE_BASE}/accounts/paymentaccounts/${id}/`, data);
    },
    deletePaymentAccount(id) {
        return axios.delete(`${FINANCE_BASE}/accounts/paymentaccounts/${id}/`);
    },

    // Account Transactions
    getAccountTransactions(accountId, params = {}) {
        return axios.get(`${FINANCE_BASE}/accounts/paymentaccounts/${accountId}/transactions/`, { params });
    },
    getAccountBalance(accountId) {
        return axios.get(`${FINANCE_BASE}/accounts/paymentaccounts/${accountId}/balance/`);
    },

    // Voucher Management
    getVouchers(params = {}) {
        return axios.get(`${FINANCE_BASE}/accounts/vouchers/`, { params });
    },
    getVoucher(id) {
        return axios.get(`${FINANCE_BASE}/accounts/vouchers/${id}/`);
    },
    createVoucher(data) {
        return axios.post(`${FINANCE_BASE}/accounts/vouchers/`, data);
    },
    updateVoucher(id, data) {
        return axios.patch(`${FINANCE_BASE}/accounts/vouchers/${id}/`, data);
    },
    deleteVoucher(id) {
        return axios.delete(`${FINANCE_BASE}/accounts/vouchers/${id}/`);
    },
    updateVoucherStatus(id, status, remarks = '') {
        return axios.post(`${FINANCE_BASE}/accounts/vouchers/${id}/update_status/`, { status, remarks });
    },
    addVoucherItem(id, data) {
        return axios.post(`${FINANCE_BASE}/accounts/vouchers/${id}/add_item/`, data);
    },

    // Billing Documents
    getBillingDocuments(params = {}) {
        return axios.get(`${FINANCE_BASE}/payment/billing-documents/`, { params });
    },
    getBillingDocument(id) {
        return axios.get(`${FINANCE_BASE}/payment/billing-documents/${id}/`);
    },
    createBillingDocument(data) {
        return axios.post(`${FINANCE_BASE}/payment/billing-documents/`, data);
    },
    updateBillingDocument(id, data) {
        return axios.patch(`${FINANCE_BASE}/payment/billing-documents/${id}/`, data);
    },
    deleteBillingDocument(id) {
        return axios.delete(`${FINANCE_BASE}/payment/billing-documents/${id}/`);
    },
    getBillingDocumentPdf(id, params = {}) {
        return axios.get(`${FINANCE_BASE}/payment/billing-documents/${id}/pdf/`, { params, responseType: 'blob' });
    },
    submitToKRA(id, invoicePayload = null) {
        return axios.post(`${FINANCE_BASE}/payment/billing-documents/${id}/submit-kra/`, { invoice_payload: invoicePayload });
    },

    // Tax Management
    getTaxRates(params = {}) {
        return axios.get(`${FINANCE_BASE}/taxes/rates/`, { params });
    },
    getTaxRate(id) {
        return axios.get(`${FINANCE_BASE}/taxes/rates/${id}/`);
    },
    createTaxRate(data) {
        return axios.post(`${FINANCE_BASE}/taxes/rates/`, data);
    },
    updateTaxRate(id, data) {
        return axios.patch(`${FINANCE_BASE}/taxes/rates/${id}/`, data);
    },
    deleteTaxRate(id) {
        return axios.delete(`${FINANCE_BASE}/taxes/rates/${id}/`);
    },

    getTaxCategories(params = {}) {
        return axios.get(`${FINANCE_BASE}/taxes/categories/`, { params });
    },
    createTaxCategory(data) {
        return axios.post(`${FINANCE_BASE}/taxes/categories/`, data);
    },
    updateTaxCategory(id, data) {
        return axios.patch(`${FINANCE_BASE}/taxes/categories/${id}/`, data);
    },
    deleteTaxCategory(id) {
        return axios.delete(`${FINANCE_BASE}/taxes/categories/${id}/`);
    },

    getTaxGroups(params = {}) {
        return axios.get(`${FINANCE_BASE}/taxes/groups/`, { params });
    },

    // Payment Management
    getPayments(params = {}) {
        return axios.get(`${FINANCE_BASE}/payment/payments/`, { params });
    },
    getPayment(id) {
        return axios.get(`${FINANCE_BASE}/payment/payments/${id}/`);
    },
    createPayment(data) {
        return axios.post(`${FINANCE_BASE}/payment/payments/`, data);
    },
    updatePayment(id, data) {
        return axios.patch(`${FINANCE_BASE}/payment/payments/${id}/`, data);
    },
    deletePayment(id) {
        return axios.delete(`${FINANCE_BASE}/payment/payments/${id}/`);
    },

    getPaymentMethods(params = {}) {
        return axios.get(`${FINANCE_BASE}/payment/methods/`, { params });
    },
    createPaymentMethod(data) {
        return axios.post(`${FINANCE_BASE}/payment/methods/`, data);
    },
    updatePaymentMethod(id, data) {
        return axios.patch(`${FINANCE_BASE}/payment/methods/${id}/`, data);
    },
    deletePaymentMethod(id) {
        return axios.delete(`${FINANCE_BASE}/payment/methods/${id}/`);
    },

    // Dashboard / Reports
    getDashboard(params = {}) {
        return axios.get(`${FINANCE_BASE}/dashboard/`, { params });
    },
    getDashboardData(period = 'month') {
        return axios.get(`${FINANCE_BASE}/dashboard/`, { params: { period } });
    },
    getTaxSummary(params = {}) {
        return axios.get(`${FINANCE_BASE}/tax-summary/`, { params });
    },
    getReports(params = {}) {
        return axios.get(`${FINANCE_BASE}/reports/`, { params });
    },

    // Analytics
    getAnalytics(params = {}) {
        return axios.get(`${FINANCE_BASE}/analytics/`, { params });
    },
    getAnalyticsData(period = 'month', business_id = null) {
        const params = { period };
        if (business_id) params.business_id = business_id;
        return axios.get(`${FINANCE_BASE}/analytics/`, { params });
    },

    // Cash Flow
    getCashFlowSummary(params = {}) {
        return axios.get(`${FINANCE_BASE}/cashflow/summary/`, { params });
    },

    // Reports shortcuts for legacy views
    getProfitLoss(params = {}) {
        // maps to /reports/?type=profit_loss
        return axios.get(`${FINANCE_BASE}/reports/`, { params: { type: 'profit_loss', ...params } });
    },
    getSalesOverview(params = {}) {
        // maps to /reports/?type=sales_overview
        return axios.get(`${FINANCE_BASE}/reports/`, { params: { type: 'sales_overview', ...params } });
    },
    getBalanceSheet(params = {}) {
        // maps to /reports/?type=balance_sheet
        return axios.get(`${FINANCE_BASE}/reports/`, { params: { type: 'balance_sheet', ...params } });
    },
    getTrialBalance(params = {}) {
        // maps to /reports/?type=trial_balance
        return axios.get(`${FINANCE_BASE}/reports/`, { params: { type: 'trial_balance', ...params } });
    },

    // Branches
    getBranches(businessName, params = {}) {
        return axios.get(`${FINANCE_BASE}/branches/`, {
            params: { business_name: businessName, ...params }
        });
    },

    // Bank Statements / Reconciliation
    getBankStatements(params = {}) {
        return axios.get(`${FINANCE_BASE}/reconciliation/bank-statements/`, { params });
    },
    getBankStatement(id) {
        return axios.get(`${FINANCE_BASE}/reconciliation/bank-statements/${id}/`);
    },
    createBankStatement(data) {
        return axios.post(`${FINANCE_BASE}/reconciliation/bank-statements/`, data);
    },
    updateBankStatement(id, data) {
        return axios.patch(`${FINANCE_BASE}/reconciliation/bank-statements/${id}/`, data);
    },
    deleteBankStatement(id) {
        return axios.delete(`${FINANCE_BASE}/reconciliation/bank-statements/${id}/`);
    },

    // Budget Management
    getBudgets(params = {}) {
        return axios.get(`${FINANCE_BASE}/budgets/`, { params });
    },
    getBudget(id) {
        return axios.get(`${FINANCE_BASE}/budgets/${id}/`);
    },
    createBudget(data) {
        return axios.post(`${FINANCE_BASE}/budgets/`, data);
    },
    updateBudget(id, data) {
        return axios.patch(`${FINANCE_BASE}/budgets/${id}/`, data);
    },
    deleteBudget(id) {
        return axios.delete(`${FINANCE_BASE}/budgets/${id}/`);
    },

    // Tax Periods
    getTaxPeriods(params = {}) {
        return axios.get(`${FINANCE_BASE}/taxes/periods/`, { params });
    },
    createTaxPeriod(data) {
        return axios.post(`${FINANCE_BASE}/taxes/periods/`, data);
    },
    updateTaxPeriod(id, data) {
        return axios.patch(`${FINANCE_BASE}/taxes/periods/${id}/`, data);
    },
    deleteTaxPeriod(id) {
        return axios.delete(`${FINANCE_BASE}/taxes/periods/${id}/`);
    },

    // Budget Lines
    getBudgetLines(params = {}) {
        return axios.get(`${FINANCE_BASE}/budgets/lines/`, { params });
    },
    getBudgetLine(id) {
        return axios.get(`${FINANCE_BASE}/budgets/lines/${id}/`);
    },
    createBudgetLine(data) {
        return axios.post(`${FINANCE_BASE}/budgets/lines/`, data);
    },
    updateBudgetLine(id, data) {
        return axios.patch(`${FINANCE_BASE}/budgets/lines/${id}/`, data);
    },
    deleteBudgetLine(id) {
        return axios.delete(`${FINANCE_BASE}/budgets/lines/${id}/`);
    }
};

export default financeService;
