export const financeRoutes = [
    {
        path: '/finance',
        name: 'finance',
        component: () => import('@/views/pages/dashboards/financeDashboard.vue'),
        meta: { requiresAuth: true, title: 'Finance Dashboard' }
    },
    {
        path: '/finance/accounts',
        name: 'finance-accounts',
        component: () => import('@/views/pages/finance/accounts/Accounts.vue'),
        meta: { requiresAuth: true, title: 'Accounts Management' }
    },
    {
        path: '/finance/vouchers',
        name: 'finance-vouchers',
        component: () => import('@/views/pages/finance/vouchers/Vouchers.vue'),
        meta: { requiresAuth: true, title: 'Voucher Management' }
    },
    {
        path: '/finance/billing',
        name: 'finance-billing',
        component: () => import('@/views/pages/finance/billing/BillingDocuments.vue'),
        meta: { requiresAuth: true, title: 'Billing Documents' }
    },
    {
        path: '/finance/taxes',
        name: 'finance-taxes',
        component: () => import('@/views/pages/finance/taxes/Taxes.vue'),
        meta: { requiresAuth: true, title: 'Tax Management' }
    },
    {
        path: '/finance/payments',
        name: 'finance-payments',
        component: () => import('@/views/pages/finance/payments/Payments.vue'),
        meta: { requiresAuth: true, title: 'Payment Management' }
    },
    {
        path: '/finance/expenses',
        name: 'finance-expenses',
        component: () => import('@/views/pages/finance/expenses/Expenses.vue'),
        meta: { requiresAuth: true, title: 'Expense Management' }
    },
    {
        path: '/finance/expenses/create',
        name: 'finance-expense-create',
        component: () => import('@/views/pages/finance/expenses/ExpenseForm.vue'),
        meta: { requiresAuth: true, title: 'Create Expense' }
    },
    {
        path: '/finance/expenses/:id',
        name: 'finance-expense-view',
        component: () => import('@/views/pages/finance/expenses/ExpenseView.vue'),
        meta: { requiresAuth: true, title: 'View Expense' }
    },
    {
        path: '/finance/expenses/:id/edit',
        name: 'finance-expense-edit',
        component: () => import('@/views/pages/finance/expenses/ExpenseForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Expense' }
    },
    {
        path: '/finance/expense-categories',
        name: 'finance-expense-categories',
        component: () => import('@/views/pages/finance/expenses/ExpenseCategories.vue'),
        meta: { requiresAuth: true, title: 'Expense Categories' }
    },
    {
        path: '/finance/budgets',
        name: 'finance-budgets',
        component: () => import('@/views/pages/finance/budgets/Budgets.vue'),
        meta: { requiresAuth: true, title: 'Budget Management' }
    },
    {
        path: '/finance/budgets/:id',
        name: 'finance-budget-detail',
        component: () => import('@/views/pages/finance/budgets/BudgetDetail.vue'),
        meta: { requiresAuth: true, title: 'Budget Details' }
    },
    {
        path: '/finance/cashflow',
        name: 'finance-cashflow',
        component: () => import('@/views/pages/finance/cashflow/CashFlowSummary.vue'),
        meta: { requiresAuth: true, title: 'Cash Flow Summary' }
    },
    {
        path: '/finance/cashflow/trial-balance',
        name: 'finance-trial-balance',
        component: () => import('@/views/pages/finance/cashflow/trialBalance.vue'),
        meta: { requiresAuth: true, title: 'Trial Balance' }
    },
    {
        path: '/finance/cashflow/balance-sheet',
        name: 'finance-balance-sheet',
        component: () => import('@/views/pages/finance/cashflow/balanceSheet.vue'),
        meta: { requiresAuth: true, title: 'Balance Sheet' }
    },
    {
        path: '/finance/cashflow/list-accounts',
        name: 'finance-list-accounts',
        component: () => import('@/views/pages/finance/cashflow/listAccounts.vue'),
        meta: { requiresAuth: true, title: 'List Accounts' }
    },
    {
        path: '/finance/cashflow/accounts/:id',
        name: 'finance-account-detail',
        component: () => import('@/views/pages/finance/cashflow/AccountDetail.vue'),
        meta: { requiresAuth: true, title: 'Account Details' }
    },
    {
        path: '/finance/cashflow/cash-flow',
        name: 'finance-cash-flow',
        component: () => import('@/views/pages/finance/cashflow/cashFlow.vue'),
        meta: { requiresAuth: true, title: 'Cash Flow' }
    },
    {
        path: '/finance/cashflow/profit',
        name: 'finance-profit',
        component: () => import('@/views/pages/finance/cashflow/profit.vue'),
        meta: { requiresAuth: true, title: 'Profit & Loss' }
    },
    {
        path: '/finance/reconciliation',
        name: 'finance-reconciliation',
        component: () => import('@/views/pages/finance/reconciliation/BankStatements.vue'),
        meta: { requiresAuth: true, title: 'Bank Reconciliation' }
    },
    {
        path: '/finance/analytics',
        name: 'finance-analytics',
        component: () => import('@/components/finance/analytics/FinancialAnalytics.vue'),
        meta: { requiresAuth: true, title: 'Financial Analytics' }
    },
    // NEW: Invoice Management Routes
    {
        path: '/finance/invoices',
        name: 'finance-invoices',
        component: () => import('@/views/pages/finance/invoicing/Invoices.vue'),
        meta: { requiresAuth: true, title: 'Invoices', permission: 'view_billingdocument' }
    },
    {
        path: '/finance/invoices/create',
        name: 'finance-invoice-create',
        component: () => import('@/views/pages/finance/invoicing/InvoiceForm.vue'),
        meta: { requiresAuth: true, title: 'Create Invoice', permission: 'add_billingdocument' }
    },
    {
        path: '/finance/invoices/:id',
        name: 'finance-invoice-view',
        component: () => import('@/views/pages/finance/invoicing/InvoiceView.vue'),
        meta: { requiresAuth: true, title: 'View Invoice', permission: 'view_billingdocument' }
    },
    {
        path: '/finance/invoices/:id/edit',
        name: 'finance-invoice-edit',
        component: () => import('@/views/pages/finance/invoicing/InvoiceEditPage.vue'),
        meta: { requiresAuth: true, title: 'Edit Invoice', permission: 'change_billingdocument' }
    },
    // NEW: Quotation Management Routes
    {
        path: '/finance/quotations',
        name: 'finance-quotations',
        component: () => import('@/views/pages/finance/quotations/Quotations.vue'),
        meta: { requiresAuth: true, title: 'Quotations', permission: 'view_billingdocument' }
    },
    {
        path: '/finance/quotations/create',
        name: 'finance-quotation-create',
        component: () => import('@/views/pages/finance/quotations/QuotationForm.vue'),
        meta: { requiresAuth: true, title: 'Create Quotation', permission: 'add_billingdocument' }
    },
    {
        path: '/finance/quotations/:id',
        name: 'finance-quotation-view',
        component: () => import('@/views/pages/finance/quotations/QuotationView.vue'),
        meta: { requiresAuth: true, title: 'View Quotation', permission: 'view_billingdocument' }
    },
    {
        path: '/finance/quotations/:id/edit',
        name: 'finance-quotation-edit',
        component: () => import('@/views/pages/finance/quotations/QuotationForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Quotation', permission: 'change_billingdocument' }
    },
    // NEW: Delivery Notes Management Routes
    {
        path: '/finance/delivery-notes',
        name: 'finance-delivery-notes',
        component: () => import('@/views/pages/finance/invoicing/DeliveryNotes.vue'),
        meta: { requiresAuth: true, title: 'Delivery Notes', permission: 'view_deliverynote' }
    },
    {
        path: '/finance/delivery-notes/create',
        name: 'finance-delivery-note-create',
        component: () => import('@/views/pages/finance/invoicing/DeliveryNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Create Delivery Note', permission: 'add_deliverynote' }
    },
    {
        path: '/finance/delivery-notes/:id',
        name: 'finance-delivery-note-view',
        component: () => import('@/views/pages/finance/invoicing/DeliveryNoteView.vue'),
        meta: { requiresAuth: true, title: 'View Delivery Note', permission: 'view_deliverynote' }
    },
    {
        path: '/finance/delivery-notes/:id/edit',
        name: 'finance-delivery-note-edit',
        component: () => import('@/views/pages/finance/invoicing/DeliveryNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Delivery Note', permission: 'change_deliverynote' }
    },
    // NEW: Credit Notes Management Routes
    {
        path: '/finance/credit-notes',
        name: 'finance-credit-notes',
        component: () => import('@/views/pages/finance/invoicing/CreditNotes.vue'),
        meta: { requiresAuth: true, title: 'Credit Notes', permission: 'view_creditnote' }
    },
    {
        path: '/finance/credit-notes/create',
        name: 'finance-credit-note-create',
        component: () => import('@/views/pages/finance/invoicing/CreditNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Create Credit Note', permission: 'add_creditnote' }
    },
    {
        path: '/finance/credit-notes/:id',
        name: 'finance-credit-note-view',
        component: () => import('@/views/pages/finance/invoicing/CreditNoteView.vue'),
        meta: { requiresAuth: true, title: 'View Credit Note', permission: 'view_creditnote' }
    },
    {
        path: '/finance/credit-notes/:id/edit',
        name: 'finance-credit-note-edit',
        component: () => import('@/views/pages/finance/invoicing/CreditNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Credit Note', permission: 'change_creditnote' }
    },
    // NEW: Debit Notes Management Routes
    {
        path: '/finance/debit-notes',
        name: 'finance-debit-notes',
        component: () => import('@/views/pages/finance/invoicing/DebitNotes.vue'),
        meta: { requiresAuth: true, title: 'Debit Notes', permission: 'view_debitnote' }
    },
    {
        path: '/finance/debit-notes/create',
        name: 'finance-debit-note-create',
        component: () => import('@/views/pages/finance/invoicing/DebitNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Create Debit Note', permission: 'add_debitnote' }
    },
    {
        path: '/finance/debit-notes/:id',
        name: 'finance-debit-note-view',
        component: () => import('@/views/pages/finance/invoicing/DebitNoteView.vue'),
        meta: { requiresAuth: true, title: 'View Debit Note', permission: 'view_debitnote' }
    },
    {
        path: '/finance/debit-notes/:id/edit',
        name: 'finance-debit-note-edit',
        component: () => import('@/views/pages/finance/invoicing/DebitNoteForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Debit Note', permission: 'change_debitnote' }
    },
    // NEW: Proforma Invoices Management Routes
    {
        path: '/finance/proforma-invoices',
        name: 'finance-proforma-invoices',
        component: () => import('@/views/pages/finance/invoicing/ProformaInvoices.vue'),
        meta: { requiresAuth: true, title: 'Proforma Invoices', permission: 'view_proformainvoice' }
    },
    {
        path: '/finance/proforma-invoices/create',
        name: 'finance-proforma-invoice-create',
        component: () => import('@/views/pages/finance/invoicing/ProformaInvoiceForm.vue'),
        meta: { requiresAuth: true, title: 'Create Proforma Invoice', permission: 'add_proformainvoice' }
    },
    {
        path: '/finance/proforma-invoices/:id',
        name: 'finance-proforma-invoice-view',
        component: () => import('@/views/pages/finance/invoicing/ProformaInvoiceView.vue'),
        meta: { requiresAuth: true, title: 'View Proforma Invoice', permission: 'view_proformainvoice' }
    },
    {
        path: '/finance/proforma-invoices/:id/edit',
        name: 'finance-proforma-invoice-edit',
        component: () => import('@/views/pages/finance/invoicing/ProformaInvoiceForm.vue'),
        meta: { requiresAuth: true, title: 'Edit Proforma Invoice', permission: 'change_proformainvoice' }
    },
    // PUBLIC: Invoice View (for sharing with customers)
    {
        path: '/public/invoice/:id/:token',
        name: 'public-invoice-view',
        component: () => import('@/views/pages/public/PublicInvoiceView.vue'),
        meta: { requiresAuth: false, title: 'View Invoice', layout: 'public' }
    },
    // PUBLIC: Quotation View
    {
        path: '/public/quotation/:id/:token',
        name: 'public-quotation-view',
        component: () => import('@/views/pages/public/PublicQuotationView.vue'),
        meta: { requiresAuth: false, title: 'View Quotation', layout: 'public' }
    }
];
