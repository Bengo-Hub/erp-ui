/**
 * Payment Methods Constants
 * Shared across all finance modules
 */

export const PAYMENT_METHODS = [
    { label: 'Bank Transfer', value: 'bank', icon: 'pi-building' },
    { label: 'M-Pesa', value: 'mpesa', icon: 'pi-mobile' },
    { label: 'Cash', value: 'cash', icon: 'pi-money-bill' },
    { label: 'Card', value: 'card', icon: 'pi-credit-card' },
    { label: 'Cheque', value: 'cheque', icon: 'pi-file' },
    { label: 'PayPal', value: 'paypal', icon: 'pi-paypal' },
    { label: 'Other', value: 'other', icon: 'pi-ellipsis-h' }
];

export const PAYMENT_TERMS = [
    { label: 'Due on Receipt', value: 'due_on_receipt' },
    { label: 'Net 15', value: 'net_15' },
    { label: 'Net 30', value: 'net_30' },
    { label: 'Net 45', value: 'net_45' },
    { label: 'Net 60', value: 'net_60' },
    { label: 'Net 90', value: 'net_90' },
    { label: 'Custom', value: 'custom' }
];

export const TEMPLATE_OPTIONS = [
    { label: 'Standard', value: 'standard' },
    { label: 'Modern', value: 'modern' },
    { label: 'Classic', value: 'classic' },
    { label: 'Minimalist', value: 'minimalist' }
];

export default {
    PAYMENT_METHODS,
    PAYMENT_TERMS,
    TEMPLATE_OPTIONS
};

