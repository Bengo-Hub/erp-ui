/**
 * Status Options Constants
 * Shared status configurations for all finance document types
 */

export const INVOICE_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Viewed', value: 'viewed' },
    { label: 'Partially Paid', value: 'partially_paid' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Void', value: 'void' }
];

export const QUOTATION_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Viewed', value: 'viewed' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Declined', value: 'declined' },
    { label: 'Expired', value: 'expired' },
    { label: 'Converted', value: 'converted' },
    { label: 'Cancelled', value: 'cancelled' }
];

export const EXPENSE_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Paid', value: 'paid' },
    { label: 'Partially Paid', value: 'partially_paid' },
    { label: 'Cancelled', value: 'cancelled' }
];

export const CREDIT_NOTE_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Applied', value: 'applied' },
    { label: 'Void', value: 'void' }
];

export const DEBIT_NOTE_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Applied', value: 'applied' },
    { label: 'Void', value: 'void' }
];

export default {
    INVOICE_STATUS_OPTIONS,
    QUOTATION_STATUS_OPTIONS,
    EXPENSE_STATUS_OPTIONS,
    CREDIT_NOTE_STATUS_OPTIONS,
    DEBIT_NOTE_STATUS_OPTIONS
};

