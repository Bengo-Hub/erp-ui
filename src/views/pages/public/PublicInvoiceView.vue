<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { invoiceService } from '@/services/finance/invoiceService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Spinner from '@/components/ui/Spinner.vue';
import axios from 'axios';

const route = useRoute();
const { showToast } = useToast();

// Reactive state
const invoice = ref(null);
const loading = ref(false);
const error = ref(null);
const showPaymentDialog = ref(false);
const pdfBlobUrl = ref(null);
const pdfLoading = ref(true);
const pdfError = ref(false);
const activeTab = ref(0);
const paymentLoading = ref(false);

// Payment form
const paymentEmail = ref('');
const paymentName = ref('');
const paymentAmount = ref(0);

// Computed
const documentId = computed(() => route.params.id);
const shareToken = computed(() => route.params.token);

const balanceDue = computed(() => {
    return invoice.value?.balance_due || invoice.value?.total || 0;
});

const isPaid = computed(() => {
    return invoice.value?.status === 'paid';
});

const companyLogo = computed(() => {
    return invoice.value?.branch?.business?.logo || invoice.value?.company_logo || null;
});

const companyName = computed(() => {
    return invoice.value?.branch?.business?.name || invoice.value?.company_name || 'Company';
});

const companyEmail = computed(() => {
    return invoice.value?.branch?.business?.email || invoice.value?.branch?.email || '';
});

const companyPhone = computed(() => {
    return invoice.value?.branch?.business?.phone || invoice.value?.branch?.phone || '';
});

const primaryColor = computed(() => {
    return invoice.value?.branch?.business?.primary_color || '#4f46e5';
});

// Methods
const fetchInvoice = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await invoiceService.getPublicInvoice(documentId.value, shareToken.value);
        invoice.value = response;
        paymentEmail.value = response.customer?.user?.email || '';
        paymentName.value = response.customer?.name || response.customer?.business_name || '';
        paymentAmount.value = response.balance_due || response.total || 0;
        await loadPdfBlob();
    } catch (err) {
        console.error('Error fetching invoice:', err);
        error.value = 'Unable to load invoice. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const loadPdfBlob = async () => {
    pdfLoading.value = true;
    pdfError.value = false;
    try {
        const pdfBlob = await invoiceService.getPublicInvoicePDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            if (pdfBlobUrl.value) {
                URL.revokeObjectURL(pdfBlobUrl.value);
            }
            pdfBlobUrl.value = URL.createObjectURL(pdfBlob);
        } else {
            throw new Error('Invalid PDF response');
        }
    } catch (err) {
        console.error('Error loading PDF:', err);
        pdfError.value = true;
    } finally {
        pdfLoading.value = false;
    }
};

const openPaymentDialog = () => {
    showPaymentDialog.value = true;
};

const processPaystackPayment = async () => {
    if (!paymentEmail.value) {
        showToast('warn', 'Validation', 'Please enter your email address');
        return;
    }

    if (paymentAmount.value <= 0) {
        showToast('warn', 'Validation', 'Please enter a valid amount');
        return;
    }

    paymentLoading.value = true;
    try {
        const response = await axios.post(`/api/v1/finance/payment/public/invoice/${documentId.value}/${shareToken.value}/pay/`, {
            payment_method: 'paystack',
            email: paymentEmail.value,
            amount: paymentAmount.value,
            name: paymentName.value,
            channels: ['card', 'bank', 'mobile_money']
        });

        if (response.data?.success && response.data?.authorization_url) {
            showToast('info', 'Redirecting', 'Redirecting to secure payment page...');
            window.location.href = response.data.authorization_url;
        } else {
            showToast('error', 'Error', response.data?.error || 'Failed to initialize payment');
        }
    } catch (err) {
        console.error('Payment error:', err);
        showToast('error', 'Error', err.response?.data?.error || 'Failed to initiate payment');
    } finally {
        paymentLoading.value = false;
    }
};

const downloadInvoice = async () => {
    try {
        const pdfBlob = await invoiceService.getPublicInvoicePDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${invoice.value?.invoice_number || documentId.value}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Download error:', err);
        showToast('error', 'Error', 'Failed to download invoice');
    }
};

const printInvoice = () => {
    const printUrl = pdfBlobUrl.value || invoiceService.getPublicPDFUrl(documentId.value, shareToken.value);
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
        };
    }
};

const retryPdfLoad = () => {
    loadPdfBlob();
};

// Lifecycle
onMounted(() => {
    fetchInvoice();
});

onUnmounted(() => {
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
    }
});
</script>

<template>
    <div class="public-invoice-page">
        <!-- Modern Header with Business Branding -->
        <header class="page-header" :style="{ '--brand-color': primaryColor }">
            <div class="header-content">
                <div class="brand-section">
                    <div v-if="companyLogo" class="logo-container">
                        <img :src="companyLogo" :alt="companyName" class="company-logo" />
                    </div>
                    <div v-else class="logo-placeholder">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="brand-info">
                        <h1 class="company-name">{{ companyName }}</h1>
                        <p class="company-contact" v-if="companyEmail || companyPhone">
                            <span v-if="companyEmail">{{ companyEmail }}</span>
                            <span v-if="companyEmail && companyPhone" class="separator">|</span>
                            <span v-if="companyPhone">{{ companyPhone }}</span>
                        </p>
                    </div>
                </div>
                <div class="header-actions" v-if="invoice && !loading">
                    <Button icon="pi pi-download" class="action-btn" @click="downloadInvoice" v-tooltip.bottom="'Download PDF'" />
                    <Button icon="pi pi-print" class="action-btn" @click="printInvoice" v-tooltip.bottom="'Print'" />
                </div>
            </div>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <Spinner />
            <p>Loading invoice...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <div class="error-card">
                <div class="error-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <h2>Unable to Load Invoice</h2>
                <p>{{ error }}</p>
                <p class="error-help">If you believe this is an error, please contact the sender.</p>
            </div>
        </div>

        <!-- Main Content -->
        <main v-else-if="invoice" class="main-content">
            <!-- Invoice Header Card -->
            <div class="invoice-header-card">
                <div class="invoice-title-section">
                    <div>
                        <span class="document-label">INVOICE</span>
                        <h2 class="invoice-number">{{ invoice.invoice_number }}</h2>
                    </div>
                    <div class="status-badge" :class="invoice.status">
                        {{ invoice.status?.toUpperCase() }}
                    </div>
                </div>
                <div class="invoice-meta">
                    <div class="meta-item">
                        <span class="meta-label">Issue Date</span>
                        <span class="meta-value">{{ formatDate(invoice.invoice_date) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Due Date</span>
                        <span class="meta-value" :class="{ 'overdue': new Date(invoice.due_date) < new Date() && !isPaid }">
                            {{ formatDate(invoice.due_date) }}
                        </span>
                    </div>
                    <div class="meta-item amount-due">
                        <span class="meta-label">{{ isPaid ? 'Total Paid' : 'Amount Due' }}</span>
                        <span class="meta-value large" :class="{ 'paid': isPaid }">
                            {{ formatCurrency(isPaid ? invoice.total : balanceDue, invoice.currency) }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="content-grid">
                <!-- Left Column - Document Preview -->
                <div class="preview-section">
                    <div class="section-card">
                        <div class="card-header">
                            <div class="tab-buttons">
                                <button :class="['tab-btn', { active: activeTab === 0 }]" @click="activeTab = 0">
                                    <i class="pi pi-file-pdf"></i> Preview
                                </button>
                                <button :class="['tab-btn', { active: activeTab === 1 }]" @click="activeTab = 1">
                                    <i class="pi pi-list"></i> Details
                                </button>
                            </div>
                        </div>

                        <!-- PDF Preview -->
                        <div v-show="activeTab === 0" class="pdf-container">
                            <div v-if="pdfLoading" class="pdf-loading">
                                <Spinner />
                                <p>Loading preview...</p>
                            </div>
                            <div v-else-if="pdfError" class="pdf-error">
                                <i class="pi pi-file-pdf"></i>
                                <h3>Preview Unavailable</h3>
                                <p>Unable to display PDF preview in browser</p>
                                <div class="pdf-error-actions">
                                    <Button label="Retry" icon="pi pi-refresh" class="p-button-outlined" @click="retryPdfLoad" />
                                    <Button label="Download" icon="pi pi-download" @click="downloadInvoice" />
                                </div>
                            </div>
                            <iframe v-else-if="pdfBlobUrl" :src="pdfBlobUrl" class="pdf-iframe" />
                        </div>

                        <!-- Details View -->
                        <div v-show="activeTab === 1" class="details-container">
                            <!-- Parties -->
                            <div class="parties-section">
                                <div class="party-card">
                                    <span class="party-label">From</span>
                                    <h4>{{ invoice.branch?.business?.name || companyName }}</h4>
                                    <p v-if="invoice.branch?.name">{{ invoice.branch.name }}</p>
                                    <p v-if="invoice.branch?.address">{{ invoice.branch.address }}</p>
                                </div>
                                <div class="party-card">
                                    <span class="party-label">Bill To</span>
                                    <h4>{{ invoice.customer?.business_name || invoice.customer?.name }}</h4>
                                    <p v-if="invoice.customer?.user?.email">{{ invoice.customer.user.email }}</p>
                                    <p v-if="invoice.customer?.user?.phone">{{ invoice.customer.user.phone }}</p>
                                </div>
                            </div>

                            <!-- Line Items -->
                            <div class="items-section">
                                <h3>Line Items</h3>
                                <div class="items-table">
                                    <div class="table-header">
                                        <span class="col-desc">Description</span>
                                        <span class="col-qty">Qty</span>
                                        <span class="col-price">Price</span>
                                        <span class="col-amount">Amount</span>
                                    </div>
                                    <div v-for="item in invoice.items" :key="item.id" class="table-row">
                                        <span class="col-desc">{{ item.description }}</span>
                                        <span class="col-qty">{{ item.quantity }}</span>
                                        <span class="col-price">{{ formatCurrency(item.unit_price, invoice.currency) }}</span>
                                        <span class="col-amount">{{ formatCurrency(item.subtotal, invoice.currency) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Notes -->
                            <div v-if="invoice.notes || invoice.terms_conditions" class="notes-section">
                                <div v-if="invoice.notes">
                                    <h4>Notes</h4>
                                    <p>{{ invoice.notes }}</p>
                                </div>
                                <div v-if="invoice.terms_conditions">
                                    <h4>Terms & Conditions</h4>
                                    <p>{{ invoice.terms_conditions }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Payment -->
                <div class="payment-section">
                    <!-- Amount Summary -->
                    <div class="section-card summary-card">
                        <h3>Payment Summary</h3>
                        <div class="summary-rows">
                            <div class="summary-row">
                                <span>Subtotal</span>
                                <span>{{ formatCurrency(invoice.subtotal, invoice.currency) }}</span>
                            </div>
                            <div v-if="invoice.tax_amount" class="summary-row">
                                <span>Tax</span>
                                <span>{{ formatCurrency(invoice.tax_amount, invoice.currency) }}</span>
                            </div>
                            <div v-if="invoice.discount_amount" class="summary-row discount">
                                <span>Discount</span>
                                <span>-{{ formatCurrency(invoice.discount_amount, invoice.currency) }}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total</span>
                                <span>{{ formatCurrency(invoice.total, invoice.currency) }}</span>
                            </div>
                            <div v-if="invoice.amount_paid > 0" class="summary-row paid">
                                <span>Paid</span>
                                <span>{{ formatCurrency(invoice.amount_paid, invoice.currency) }}</span>
                            </div>
                            <div v-if="!isPaid && balanceDue > 0" class="summary-row balance">
                                <span>Balance Due</span>
                                <span>{{ formatCurrency(balanceDue, invoice.currency) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Action -->
                    <div v-if="!isPaid && balanceDue > 0" class="section-card payment-card" :style="{ '--brand-color': primaryColor }">
                        <div class="payment-header">
                            <i class="pi pi-credit-card"></i>
                            <div>
                                <h3>Pay Now</h3>
                                <p>Secure payment via Paystack</p>
                            </div>
                        </div>
                        <Button
                            :label="`Pay ${formatCurrency(balanceDue, invoice.currency)}`"
                            icon="pi pi-lock"
                            class="pay-button"
                            @click="openPaymentDialog"
                        />
                        <p class="security-note">
                            <i class="pi pi-shield"></i>
                            256-bit SSL encrypted
                        </p>
                    </div>

                    <!-- Paid Status -->
                    <div v-else-if="isPaid" class="section-card paid-card">
                        <div class="paid-content">
                            <i class="pi pi-check-circle"></i>
                            <h3>Paid in Full</h3>
                            <p>Thank you for your payment!</p>
                        </div>
                    </div>

                    <!-- Bank Transfer Info -->
                    <div v-if="invoice.payment_accounts?.length > 0 && !isPaid" class="section-card bank-card">
                        <h3>Bank Transfer</h3>
                        <p class="bank-subtitle">Alternative payment method</p>
                        <div v-for="account in invoice.payment_accounts" :key="account.id" class="bank-account">
                            <p class="account-name">{{ account.account_name }}</p>
                            <p class="account-number">{{ account.account_number }}</p>
                            <p v-if="account.additional_info" class="account-info">{{ account.additional_info }}</p>
                        </div>
                        <p class="reference-note">Reference: <strong>{{ invoice.invoice_number }}</strong></p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Payment Dialog -->
        <Dialog
            v-model:visible="showPaymentDialog"
            modal
            header="Complete Payment"
            :style="{ width: '480px' }"
            :dismissableMask="true"
            class="payment-dialog"
        >
            <div class="dialog-content">
                <div class="amount-display">
                    <span class="amount-label">Amount to Pay</span>
                    <span class="amount-value">{{ formatCurrency(balanceDue, invoice?.currency) }}</span>
                </div>

                <div class="form-group">
                    <label>Your Name</label>
                    <InputText v-model="paymentName" placeholder="Full name" class="w-full" />
                </div>

                <div class="form-group">
                    <label>Email Address *</label>
                    <InputText v-model="paymentEmail" type="email" placeholder="email@example.com" class="w-full" />
                    <small>Receipt will be sent to this email</small>
                </div>

                <div class="paystack-info">
                    <img src="/images/paystack-badge.svg" alt="Paystack" class="paystack-badge" onerror="this.style.display='none'" />
                    <div class="payment-methods-icons">
                        <span>Pay with:</span>
                        <i class="pi pi-credit-card" v-tooltip="'Card'"></i>
                        <i class="pi pi-building" v-tooltip="'Bank Transfer'"></i>
                        <i class="pi pi-mobile" v-tooltip="'Mobile Money'"></i>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showPaymentDialog = false" :disabled="paymentLoading" />
                <Button
                    :label="`Pay ${formatCurrency(balanceDue, invoice?.currency)}`"
                    icon="pi pi-lock"
                    @click="processPaystackPayment"
                    :loading="paymentLoading"
                    class="p-button-success"
                />
            </template>
        </Dialog>

        <!-- Footer -->
        <footer class="page-footer">
            <p>Powered by <strong>BengoBox ERP</strong></p>
        </footer>
    </div>
</template>

<style scoped>
.public-invoice-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.page-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand-section {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo-container {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    background: #f1f5f9;
}

.company-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.logo-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--brand-color, #4f46e5), #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
}

.company-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.company-contact {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
}

.separator {
    margin: 0 0.5rem;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    background: #f1f5f9 !important;
    border: none !important;
    color: #475569 !important;
    width: 40px;
    height: 40px;
}

.action-btn:hover {
    background: #e2e8f0 !important;
}

/* Loading & Error */
.loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
}

.loading-container p {
    margin-top: 1rem;
    color: #64748b;
}

.error-card {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.error-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #fef2f2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
}

.error-icon i {
    font-size: 2.5rem;
    color: #ef4444;
}

.error-card h2 {
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.error-card p {
    color: #64748b;
}

.error-help {
    font-size: 0.875rem;
    margin-top: 1rem;
}

/* Main Content */
.main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
}

/* Invoice Header Card */
.invoice-header-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.invoice-title-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}

.document-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.invoice-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0.25rem 0 0 0;
}

.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.draft { background: #f1f5f9; color: #475569; }
.status-badge.sent { background: #dbeafe; color: #1d4ed8; }
.status-badge.paid { background: #dcfce7; color: #15803d; }
.status-badge.overdue { background: #fef3c7; color: #b45309; }
.status-badge.cancelled { background: #fee2e2; color: #dc2626; }

.invoice-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}

.meta-item {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
}

.meta-item.amount-due {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.meta-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
}

.meta-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.meta-value.large {
    font-size: 1.25rem;
}

.meta-value.overdue {
    color: #dc2626;
}

.meta-value.paid {
    color: #15803d;
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.5rem;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}

/* Section Cards */
.section-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Preview Section */
.card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.tab-buttons {
    display: flex;
    gap: 0.5rem;
}

.tab-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: #f1f5f9;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.tab-btn.active {
    background: #1e293b;
    color: white;
}

.tab-btn:hover:not(.active) {
    background: #e2e8f0;
}

/* PDF Container */
.pdf-container {
    min-height: 600px;
    position: relative;
}

.pdf-loading, .pdf-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
}

.pdf-loading p, .pdf-error p {
    color: #64748b;
    margin-top: 1rem;
}

.pdf-error i {
    font-size: 3rem;
    color: #cbd5e1;
}

.pdf-error h3 {
    color: #475569;
    margin: 1rem 0 0.5rem;
}

.pdf-error-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.pdf-iframe {
    width: 100%;
    height: 700px;
    border: none;
}

/* Details Container */
.details-container {
    padding: 1.5rem;
}

.parties-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.party-card {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
}

.party-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.party-card h4 {
    color: #1e293b;
    margin: 0.5rem 0 0.25rem;
}

.party-card p {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
}

/* Items Table */
.items-section h3 {
    color: #1e293b;
    margin-bottom: 1rem;
}

.items-table {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
}

.table-header, .table-row {
    display: grid;
    grid-template-columns: 1fr 80px 100px 120px;
    padding: 0.75rem 1rem;
}

.table-header {
    background: #f8fafc;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.table-row {
    border-top: 1px solid #e2e8f0;
    font-size: 0.875rem;
    color: #475569;
}

.col-qty, .col-price, .col-amount {
    text-align: right;
}

/* Notes Section */
.notes-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.notes-section h4 {
    color: #1e293b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.notes-section p {
    color: #64748b;
    font-size: 0.875rem;
    white-space: pre-wrap;
}

/* Payment Section */
.payment-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Summary Card */
.summary-card {
    padding: 1.5rem;
}

.summary-card h3 {
    color: #1e293b;
    margin-bottom: 1rem;
}

.summary-rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #64748b;
}

.summary-row.discount span:last-child {
    color: #15803d;
}

.summary-row.total {
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
    font-weight: 600;
    font-size: 1rem;
    color: #1e293b;
}

.summary-row.paid span:last-child {
    color: #15803d;
}

.summary-row.balance {
    padding-top: 0.75rem;
    font-weight: 700;
    font-size: 1.125rem;
    color: #dc2626;
}

/* Payment Card */
.payment-card {
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--brand-color, #4f46e5), #7c3aed);
    color: white;
}

.payment-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.payment-header i {
    font-size: 2rem;
    opacity: 0.9;
}

.payment-header h3 {
    margin: 0;
    font-size: 1.25rem;
}

.payment-header p {
    margin: 0;
    opacity: 0.8;
    font-size: 0.875rem;
}

.pay-button {
    width: 100%;
    background: white !important;
    color: var(--brand-color, #4f46e5) !important;
    border: none !important;
    font-weight: 600;
    padding: 0.875rem 1.5rem !important;
}

.security-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.75rem;
    opacity: 0.8;
}

/* Paid Card */
.paid-card {
    padding: 2rem;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

.paid-content {
    text-align: center;
}

.paid-content i {
    font-size: 3rem;
    color: #15803d;
}

.paid-content h3 {
    color: #15803d;
    margin: 1rem 0 0.5rem;
}

.paid-content p {
    color: #166534;
    margin: 0;
}

/* Bank Card */
.bank-card {
    padding: 1.5rem;
}

.bank-card h3 {
    color: #1e293b;
    margin-bottom: 0.25rem;
}

.bank-subtitle {
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.bank-account {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 0.75rem;
}

.account-name {
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.account-number {
    color: #475569;
    font-size: 0.875rem;
    margin: 0.25rem 0 0;
}

.account-info {
    color: #64748b;
    font-size: 0.75rem;
    margin: 0.25rem 0 0;
}

.reference-note {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 1rem;
}

/* Dialog */
.dialog-content {
    padding: 0.5rem 0;
}

.amount-display {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 1.5rem;
}

.amount-label {
    display: block;
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.25rem;
}

.amount-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.form-group small {
    color: #64748b;
    font-size: 0.75rem;
}

.paystack-info {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1.5rem;
    text-align: center;
}

.paystack-badge {
    height: 24px;
    margin-bottom: 0.75rem;
}

.payment-methods-icons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
}

.payment-methods-icons i {
    font-size: 1.25rem;
    color: #475569;
}

/* Footer */
.page-footer {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
    font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
    .page-header {
        padding: 1rem;
    }

    .brand-section {
        gap: 0.75rem;
    }

    .company-name {
        font-size: 1rem;
    }

    .company-contact {
        display: none;
    }

    .main-content {
        padding: 1rem;
    }

    .invoice-meta {
        grid-template-columns: 1fr 1fr;
    }

    .parties-section {
        grid-template-columns: 1fr;
    }

    .table-header, .table-row {
        grid-template-columns: 1fr 60px 80px 80px;
        font-size: 0.75rem;
    }
}
</style>
