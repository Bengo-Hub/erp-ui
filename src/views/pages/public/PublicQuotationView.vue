<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { quotationService } from '@/services/finance/quotationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Spinner from '@/components/ui/Spinner.vue';

const route = useRoute();
const { showToast } = useToast();

// Reactive state
const quotation = ref(null);
const loading = ref(false);
const error = ref(null);
const pdfBlobUrl = ref(null);
const pdfLoading = ref(true);
const pdfError = ref(false);
const activeTab = ref(0); // 0 = PDF preview, 1 = Details

// Accept dialog state
const showAcceptDialog = ref(false);
const acceptLoading = ref(false);
const acceptForm = ref({
    email: '',
    notes: ''
});

// Computed
const documentId = computed(() => route.params.id);
const shareToken = computed(() => route.params.token);

const subtotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

const isExpired = computed(() => {
    if (!quotation.value?.expiry_date) return false;
    return new Date(quotation.value.expiry_date) < new Date();
});

const isAccepted = computed(() => {
    return quotation.value?.status === 'accepted';
});

const businessLogo = computed(() => {
    return quotation.value?.branch?.business?.logo || null;
});

const businessName = computed(() => {
    return quotation.value?.branch?.business?.name || 'Company';
});

const primaryColor = computed(() => {
    return quotation.value?.branch?.business?.primary_color || '#7c3aed';
});

const daysUntilExpiry = computed(() => {
    if (!quotation.value?.expiry_date) return 0;
    const now = new Date();
    const expiry = new Date(quotation.value.expiry_date);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
});

// Methods
const fetchQuotation = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await quotationService.getPublicQuotation(documentId.value, shareToken.value);
        quotation.value = response;
        // Pre-fill email if customer has one
        if (response.customer?.user?.email) {
            acceptForm.value.email = response.customer.user.email;
        }
        await loadPdfBlob();
    } catch (err) {
        console.error('Error fetching quotation:', err);
        error.value = 'Unable to load quotation. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const loadPdfBlob = async () => {
    pdfLoading.value = true;
    pdfError.value = false;
    try {
        const pdfBlob = await quotationService.getPublicQuotationPDF(documentId.value, shareToken.value);
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

const retryPdfLoad = () => {
    loadPdfBlob();
};

const openAcceptDialog = () => {
    showAcceptDialog.value = true;
};

const closeAcceptDialog = () => {
    showAcceptDialog.value = false;
};

const acceptQuotation = async () => {
    if (!acceptForm.value.email) {
        showToast('warn', 'Warning', 'Please enter your email address');
        return;
    }

    acceptLoading.value = true;
    try {
        await quotationService.acceptPublicQuotation(documentId.value, shareToken.value, {
            email: acceptForm.value.email,
            notes: acceptForm.value.notes
        });

        showToast('success', 'Success', 'Quotation accepted successfully! You will receive a confirmation email shortly.');
        closeAcceptDialog();

        // Refresh quotation to show updated status
        await fetchQuotation();
    } catch (err) {
        console.error('Error accepting quotation:', err);
        showToast('error', 'Error', err.response?.data?.error || 'Failed to accept quotation. Please try again.');
    } finally {
        acceptLoading.value = false;
    }
};

const downloadQuotation = async () => {
    try {
        const pdfBlob = await quotationService.getPublicQuotationPDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Quotation_${quotation.value?.quotation_number || documentId.value}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Download error:', err);
        showToast('error', 'Error', 'Failed to download quotation');
    }
};

const printQuotation = () => {
    const printUrl = pdfBlobUrl.value || quotationService.getPublicPDFUrl(documentId.value, shareToken.value);
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
        };
    }
};

// Lifecycle
onMounted(() => {
    fetchQuotation();
});

onUnmounted(() => {
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
    }
});
</script>

<template>
    <div class="public-quotation-view">
        <!-- Header with Business Branding -->
        <header class="header" :style="{ backgroundColor: primaryColor }">
            <div class="header-content">
                <div class="brand">
                    <img v-if="businessLogo" :src="businessLogo" :alt="businessName" class="brand-logo" />
                    <div v-else class="brand-placeholder">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="brand-info">
                        <h1 class="brand-name">{{ businessName }}</h1>
                        <span class="document-type">Quotation</span>
                    </div>
                </div>
                <div class="header-actions" v-if="quotation">
                    <button class="action-btn" @click="downloadQuotation" title="Download PDF">
                        <i class="pi pi-download"></i>
                    </button>
                    <button class="action-btn" @click="printQuotation" title="Print">
                        <i class="pi pi-print"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <Spinner />
            <p>Loading quotation...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <div class="error-card">
                <div class="error-icon">
                    <i class="pi pi-exclamation-circle"></i>
                </div>
                <h2>Unable to Load Quotation</h2>
                <p>{{ error }}</p>
                <p class="error-hint">If you believe this is an error, please contact the sender.</p>
            </div>
        </div>

        <!-- Main Content -->
        <main v-else-if="quotation" class="main-content">
            <!-- Status Banner -->
            <div v-if="isAccepted" class="status-banner accepted">
                <i class="pi pi-check-circle"></i>
                <span>This quotation has been accepted</span>
            </div>
            <div v-else-if="isExpired" class="status-banner expired">
                <i class="pi pi-clock"></i>
                <span>This quotation has expired</span>
            </div>

            <div class="content-grid">
                <!-- Left Column - Document Preview -->
                <div class="preview-section">
                    <div class="preview-card">
                        <div class="preview-header">
                            <div class="tab-buttons">
                                <button
                                    class="tab-btn"
                                    :class="{ active: activeTab === 0 }"
                                    @click="activeTab = 0"
                                >
                                    <i class="pi pi-file-pdf"></i>
                                    PDF Preview
                                </button>
                                <button
                                    class="tab-btn"
                                    :class="{ active: activeTab === 1 }"
                                    @click="activeTab = 1"
                                >
                                    <i class="pi pi-list"></i>
                                    Details
                                </button>
                            </div>
                            <div class="quotation-number">
                                {{ quotation.quotation_number }}
                            </div>
                        </div>

                        <!-- PDF Tab -->
                        <div v-show="activeTab === 0" class="pdf-container">
                            <div v-if="pdfLoading" class="pdf-loading">
                                <Spinner />
                                <p>Loading document preview...</p>
                            </div>
                            <div v-else-if="pdfError" class="pdf-error">
                                <i class="pi pi-file-pdf"></i>
                                <h3>Preview Unavailable</h3>
                                <p>Unable to load PDF preview in browser</p>
                                <div class="pdf-error-actions">
                                    <button class="btn btn-secondary" @click="retryPdfLoad">
                                        <i class="pi pi-refresh"></i> Retry
                                    </button>
                                    <button class="btn btn-primary" @click="downloadQuotation">
                                        <i class="pi pi-download"></i> Download
                                    </button>
                                </div>
                            </div>
                            <iframe
                                v-else-if="pdfBlobUrl"
                                :src="pdfBlobUrl"
                                class="pdf-iframe"
                            />
                        </div>

                        <!-- Details Tab -->
                        <div v-show="activeTab === 1" class="details-container">
                            <!-- Party Information -->
                            <div class="parties-grid">
                                <div class="party-card">
                                    <span class="party-label">From</span>
                                    <h4>{{ quotation.branch?.business?.name }}</h4>
                                    <p>{{ quotation.branch?.name }}</p>
                                    <p v-if="quotation.branch?.address">{{ quotation.branch.address }}</p>
                                    <p v-if="quotation.branch?.phone">{{ quotation.branch.phone }}</p>
                                </div>
                                <div class="party-card">
                                    <span class="party-label">To</span>
                                    <h4>{{ quotation.customer?.name }}</h4>
                                    <p v-if="quotation.customer?.user?.email">{{ quotation.customer.user.email }}</p>
                                    <p v-if="quotation.customer?.user?.phone">{{ quotation.customer.user.phone }}</p>
                                </div>
                            </div>

                            <!-- Key Dates -->
                            <div class="dates-grid">
                                <div class="date-item">
                                    <span class="date-label">Quotation Date</span>
                                    <span class="date-value">{{ formatDate(quotation.quotation_date) }}</span>
                                </div>
                                <div class="date-item">
                                    <span class="date-label">Valid Until</span>
                                    <span class="date-value" :class="{ expired: isExpired }">
                                        {{ formatDate(quotation.expiry_date) }}
                                    </span>
                                </div>
                                <div class="date-item">
                                    <span class="date-label">Status</span>
                                    <span class="status-badge" :class="quotation.status">
                                        {{ quotation.status }}
                                    </span>
                                </div>
                            </div>

                            <!-- Line Items -->
                            <div class="items-section">
                                <h3>Line Items</h3>
                                <div class="items-table">
                                    <div class="items-header">
                                        <span class="col-desc">Description</span>
                                        <span class="col-qty">Qty</span>
                                        <span class="col-price">Price</span>
                                        <span class="col-amount">Amount</span>
                                    </div>
                                    <div
                                        v-for="item in quotation.items"
                                        :key="item.id"
                                        class="items-row"
                                    >
                                        <span class="col-desc">{{ item.description }}</span>
                                        <span class="col-qty">{{ item.quantity }}</span>
                                        <span class="col-price">{{ formatCurrency(item.unit_price) }}</span>
                                        <span class="col-amount">{{ formatCurrency(item.subtotal) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Terms -->
                            <div v-if="quotation.terms_conditions" class="terms-section">
                                <h3>Terms & Conditions</h3>
                                <p>{{ quotation.terms_conditions }}</p>
                            </div>

                            <!-- Notes -->
                            <div v-if="quotation.notes" class="notes-section">
                                <h3>Notes</h3>
                                <p>{{ quotation.notes }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Summary & Actions -->
                <div class="sidebar">
                    <!-- Summary Card -->
                    <div class="summary-card">
                        <h3>Quotation Summary</h3>
                        <div class="summary-rows">
                            <div class="summary-row">
                                <span>Subtotal</span>
                                <span>{{ formatCurrency(subtotal) }}</span>
                            </div>
                            <div v-if="taxTotal > 0" class="summary-row">
                                <span>Tax</span>
                                <span>{{ formatCurrency(taxTotal) }}</span>
                            </div>
                            <div v-if="quotation.discount_amount > 0" class="summary-row discount">
                                <span>Discount</span>
                                <span>-{{ formatCurrency(quotation.discount_amount) }}</span>
                            </div>
                        </div>
                        <div class="summary-total">
                            <span>Total</span>
                            <span class="total-amount">{{ formatCurrency(quotation.total) }}</span>
                        </div>
                    </div>

                    <!-- Action Card - Accept -->
                    <div v-if="!isExpired && !isAccepted" class="action-card" :style="{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }">
                        <div class="action-icon">
                            <i class="pi pi-check-circle"></i>
                        </div>
                        <h3>Ready to proceed?</h3>
                        <p>Accept this quotation to confirm your interest</p>
                        <button class="accept-btn" @click="openAcceptDialog">
                            <i class="pi pi-check"></i>
                            Accept Quotation
                        </button>
                        <span class="validity-note" v-if="daysUntilExpiry > 0">
                            <i class="pi pi-clock"></i>
                            Valid for {{ daysUntilExpiry }} more day{{ daysUntilExpiry !== 1 ? 's' : '' }}
                        </span>
                    </div>

                    <!-- Accepted State -->
                    <div v-else-if="isAccepted" class="accepted-card">
                        <div class="accepted-icon">
                            <i class="pi pi-check"></i>
                        </div>
                        <h3>Quotation Accepted</h3>
                        <p>Thank you for accepting this quotation. The supplier will be in touch with next steps.</p>
                    </div>

                    <!-- Expired State -->
                    <div v-else-if="isExpired" class="expired-card">
                        <div class="expired-icon">
                            <i class="pi pi-clock"></i>
                        </div>
                        <h3>Quotation Expired</h3>
                        <p>This quotation is no longer valid. Please contact the supplier for a new quotation.</p>
                    </div>

                    <!-- Contact Card -->
                    <div class="contact-card">
                        <h4>Need Help?</h4>
                        <p>Contact {{ businessName }} for any questions about this quotation.</p>
                        <div v-if="quotation.branch?.email" class="contact-item">
                            <i class="pi pi-envelope"></i>
                            <a :href="`mailto:${quotation.branch.email}`">{{ quotation.branch.email }}</a>
                        </div>
                        <div v-if="quotation.branch?.phone" class="contact-item">
                            <i class="pi pi-phone"></i>
                            <a :href="`tel:${quotation.branch.phone}`">{{ quotation.branch.phone }}</a>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Accept Dialog -->
        <Dialog
            v-model:visible="showAcceptDialog"
            modal
            header="Accept Quotation"
            :style="{ width: '450px' }"
            :closable="!acceptLoading"
        >
            <div class="accept-dialog-content">
                <p class="dialog-intro">
                    By accepting this quotation, you confirm your interest in the products/services quoted.
                    The supplier will receive notification and contact you with next steps.
                </p>

                <div class="form-field">
                    <label for="accept-email">Your Email <span class="required">*</span></label>
                    <InputText
                        id="accept-email"
                        v-model="acceptForm.email"
                        placeholder="Enter your email address"
                        class="w-full"
                        :disabled="acceptLoading"
                    />
                </div>

                <div class="form-field">
                    <label for="accept-notes">Additional Notes</label>
                    <Textarea
                        id="accept-notes"
                        v-model="acceptForm.notes"
                        placeholder="Any additional comments or requirements..."
                        rows="3"
                        class="w-full"
                        :disabled="acceptLoading"
                    />
                </div>

                <div class="quotation-summary">
                    <div class="summary-item">
                        <span>Quotation</span>
                        <span>{{ quotation?.quotation_number }}</span>
                    </div>
                    <div class="summary-item total">
                        <span>Total Amount</span>
                        <span>{{ formatCurrency(quotation?.total) }}</span>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    class="p-button-text"
                    @click="closeAcceptDialog"
                    :disabled="acceptLoading"
                />
                <Button
                    label="Accept Quotation"
                    icon="pi pi-check"
                    :loading="acceptLoading"
                    @click="acceptQuotation"
                    :style="{ backgroundColor: primaryColor, borderColor: primaryColor }"
                />
            </template>
        </Dialog>

        <!-- Footer -->
        <footer class="footer">
            <p>Powered by <strong>BengoBox ERP</strong></p>
        </footer>
    </div>
</template>

<style scoped>
.public-quotation-view {
    min-height: 100vh;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
}

/* Header */
.header {
    color: white;
    padding: 0 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.brand-logo {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: contain;
    background: white;
    padding: 4px;
}

.brand-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-placeholder i {
    font-size: 1.5rem;
}

.brand-info {
    display: flex;
    flex-direction: column;
}

.brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
}

.document-type {
    font-size: 0.75rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.action-btn i {
    font-size: 1.1rem;
}

/* Loading */
.loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #64748b;
}

/* Error */
.error-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.error-card {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
}

.error-card p {
    color: #64748b;
    margin: 0;
}

.error-hint {
    margin-top: 1rem !important;
    font-size: 0.875rem;
}

/* Main Content */
.main-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

/* Status Banner */
.status-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.status-banner.accepted {
    background: #dcfce7;
    color: #166534;
}

.status-banner.expired {
    background: #fef2f2;
    color: #dc2626;
}

.status-banner i {
    font-size: 1.25rem;
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

/* Preview Section */
.preview-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.tab-buttons {
    display: flex;
    gap: 0.5rem;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: #e2e8f0;
}

.tab-btn.active {
    background: #7c3aed;
    color: white;
}

.quotation-number {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.875rem;
}

/* PDF Container */
.pdf-container {
    height: 700px;
    background: #e2e8f0;
}

.pdf-loading,
.pdf-error {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #64748b;
}

.pdf-error i {
    font-size: 3rem;
    color: #94a3b8;
}

.pdf-error h3 {
    margin: 0;
    color: #475569;
}

.pdf-error p {
    margin: 0;
    font-size: 0.875rem;
}

.pdf-error-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary {
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
}

.btn-secondary:hover {
    background: #f8fafc;
}

.btn-primary {
    background: #7c3aed;
    border: none;
    color: white;
}

.btn-primary:hover {
    background: #6d28d9;
}

.pdf-iframe {
    width: 100%;
    height: 100%;
    border: none;
}

/* Details Container */
.details-container {
    padding: 1.5rem;
}

.parties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
    .parties-grid {
        grid-template-columns: 1fr;
    }
}

.party-card {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
}

.party-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.party-card h4 {
    margin: 0.5rem 0 0.25rem;
    color: #1e293b;
    font-size: 1rem;
}

.party-card p {
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.5;
}

.dates-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
    .dates-grid {
        grid-template-columns: 1fr;
    }
}

.date-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.date-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
}

.date-value {
    font-weight: 600;
    color: #1e293b;
}

.date-value.expired {
    color: #dc2626;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    width: fit-content;
}

.status-badge.draft {
    background: #f1f5f9;
    color: #475569;
}

.status-badge.sent {
    background: #dbeafe;
    color: #1d4ed8;
}

.status-badge.accepted {
    background: #dcfce7;
    color: #166534;
}

.status-badge.rejected {
    background: #fef2f2;
    color: #dc2626;
}

/* Items Section */
.items-section {
    margin-bottom: 1.5rem;
}

.items-section h3 {
    font-size: 1rem;
    color: #1e293b;
    margin: 0 0 1rem;
}

.items-table {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
}

.items-header {
    display: grid;
    grid-template-columns: 1fr 80px 100px 100px;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #f8fafc;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.items-row {
    display: grid;
    grid-template-columns: 1fr 80px 100px 100px;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.875rem;
    color: #475569;
}

.items-row:nth-child(even) {
    background: #fafafa;
}

@media (max-width: 640px) {
    .items-header {
        display: none;
    }

    .items-row {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .col-desc {
        grid-column: 1 / -1;
        font-weight: 500;
    }
}

.col-qty,
.col-price,
.col-amount {
    text-align: right;
}

/* Terms & Notes */
.terms-section,
.notes-section {
    margin-bottom: 1.5rem;
}

.terms-section h3,
.notes-section h3 {
    font-size: 1rem;
    color: #1e293b;
    margin: 0 0 0.5rem;
}

.terms-section p,
.notes-section p {
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
    white-space: pre-wrap;
    line-height: 1.6;
}

/* Sidebar */
.sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Summary Card */
.summary-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-card h3 {
    font-size: 1rem;
    color: #1e293b;
    margin: 0 0 1rem;
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
    color: #16a34a;
}

.summary-total {
    display: flex;
    justify-content: space-between;
    padding-top: 1rem;
    margin-top: 1rem;
    border-top: 2px solid #e2e8f0;
    font-weight: 600;
    color: #1e293b;
}

.total-amount {
    font-size: 1.25rem;
}

/* Action Card */
.action-card {
    border-radius: 12px;
    padding: 1.5rem;
    color: white;
    text-align: center;
}

.action-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

.action-icon i {
    font-size: 1.75rem;
}

.action-card h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
}

.action-card p {
    margin: 0 0 1.25rem;
    opacity: 0.9;
    font-size: 0.875rem;
}

.accept-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: white;
    color: #7c3aed;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
}

.accept-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.validity-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    margin-top: 1rem;
    font-size: 0.75rem;
    opacity: 0.9;
}

/* Accepted Card */
.accepted-card {
    background: #dcfce7;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
}

.accepted-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #16a34a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
}

.accepted-icon i {
    font-size: 1.75rem;
}

.accepted-card h3 {
    color: #166534;
    margin: 0 0 0.5rem;
}

.accepted-card p {
    color: #15803d;
    margin: 0;
    font-size: 0.875rem;
}

/* Expired Card */
.expired-card {
    background: #fef2f2;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
}

.expired-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
}

.expired-icon i {
    font-size: 1.75rem;
}

.expired-card h3 {
    color: #991b1b;
    margin: 0 0 0.5rem;
}

.expired-card p {
    color: #b91c1c;
    margin: 0;
    font-size: 0.875rem;
}

/* Contact Card */
.contact-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.contact-card h4 {
    margin: 0 0 0.25rem;
    color: #1e293b;
    font-size: 0.875rem;
}

.contact-card > p {
    margin: 0 0 1rem;
    color: #64748b;
    font-size: 0.8rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.875rem;
}

.contact-item i {
    color: #64748b;
    width: 20px;
}

.contact-item a {
    color: #7c3aed;
    text-decoration: none;
}

.contact-item a:hover {
    text-decoration: underline;
}

/* Accept Dialog */
.accept-dialog-content {
    padding: 0.5rem 0;
}

.dialog-intro {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0 0 1.5rem;
    line-height: 1.5;
}

.form-field {
    margin-bottom: 1rem;
}

.form-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
}

.form-field .required {
    color: #dc2626;
}

.quotation-summary {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1.5rem;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #64748b;
    padding: 0.25rem 0;
}

.summary-item.total {
    font-weight: 600;
    color: #1e293b;
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
}

/* Footer */
.footer {
    padding: 1.5rem;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    background: white;
}

.footer p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.8rem;
}

.footer strong {
    color: #64748b;
}

/* Responsive Adjustments */
@media (max-width: 640px) {
    .header-content {
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .brand-name {
        font-size: 1rem;
    }

    .main-content {
        padding: 1rem;
    }

    .preview-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .pdf-container {
        height: 500px;
    }

    .summary-card,
    .action-card,
    .contact-card {
        padding: 1.25rem;
    }
}

/* Print Styles */
@media print {
    .header,
    .header-actions,
    .action-card,
    .contact-card,
    .footer,
    .tab-buttons,
    .status-banner {
        display: none !important;
    }

    .public-quotation-view {
        background: white;
    }

    .main-content {
        padding: 0;
        max-width: none;
    }

    .content-grid {
        display: block;
    }

    .preview-card,
    .summary-card {
        box-shadow: none;
        border: 1px solid #e2e8f0;
    }
}
</style>
