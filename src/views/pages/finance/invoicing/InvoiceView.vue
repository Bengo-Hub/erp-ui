<script setup>
import PaymentRecordDialog from '@/components/finance/invoicing/PaymentRecordDialog.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import Spinner from '@/components/ui/Spinner.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { invoiceService } from '@/services/finance/invoiceService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import PDFPreview from '@/components/shared/PDFPreview.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Reactive state
const invoice = ref(null);
const loading = ref(false);
const showSendDialog = ref(false);
const showPaymentDialog = ref(false);
const actionLoading = ref(false);
const previewBlobUrl = ref(null);
const previewBlob = ref(null);
const previewLoading = ref(false);
const showPdfModal = ref(false);
const showShareDialog = ref(false);
const shareUrl = ref(null);
const shareLoading = ref(false);
const paymentAccounts = ref([]);
const paymentAccountsLoading = ref(false);

// Computed
const canEdit = computed(() => hasPermission('change_billingdocument') && invoice.value?.status === 'draft');
const canDelete = computed(() => hasPermission('delete_billingdocument') && invoice.value?.status === 'draft');
const canSend = computed(() => ['sent', 'overdue'].includes(invoice.value?.status));
const canRecordPayment = computed(() => !['paid', 'void', 'cancelled'].includes(invoice.value?.status) && invoice.value?.balance_due > 0);
const canVoid = computed(() => !['paid', 'void', 'cancelled'].includes(invoice.value?.status));

const totalItems = computed(() => invoice.value?.items?.length || 0);

const subtotal = computed(() => {
    if (!invoice.value?.items) return 0;
    return invoice.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!invoice.value?.items) return 0;
    return invoice.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

const isOverdue = computed(() => {
    if (!invoice.value?.due_date || invoice.value?.status === 'paid') return false;
    return new Date(invoice.value.due_date) < new Date();
});

const daysOverdue = computed(() => {
    if (!invoice.value?.due_date) return 0;
    const due = new Date(invoice.value.due_date);
    const diffMs = new Date() - due;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
});

// Bulk selection on single invoice view (used for bulk actions UI in list)
const selectedForBulk = ref(false);

// Menu for overflow actions (three dots)
const actionMenu = ref(null);
const actionMenuItems = () => [
    { label: 'Create Debit Note', icon: 'pi pi-plus-circle', command: () => createDebitNote() },
    { label: 'Clone', icon: 'pi pi-copy', command: () => cloneInvoice() },
    { label: 'Void', icon: 'pi pi-ban', command: () => voidInvoice(), disabled: !canVoid.value },
    { label: 'Delete', icon: 'pi pi-trash', command: () => deleteInvoice(), disabled: !canDelete.value },
    { separator: true },
    { label: 'Invoice Preferences', icon: 'pi pi-cog', command: () => showToast('info','Info','Invoice Preferences not implemented'), class: 'menu-invoice-preferences' }
];

const openSendDialog = () => showSendDialog.value = true;
const handleScheduleInvoice = (opts = {}) => showToast('info', 'Info', 'Schedule invoice not implemented');

const approveInvoice = async () => {
    if (!confirm('Are you sure you want to approve this invoice? It will be ready to send to the customer.')) {
        return;
    }
    try {
        await invoiceService.approveInvoice(invoice.value.id);
        showToast('success', 'Success', 'Invoice approved successfully');
        await fetchInvoice();
    } catch (error) {
        console.error('Error approving invoice:', error);
        showToast('error', 'Error', 'Failed to approve invoice');
    }
};

const createDebitNote = () => {
    // If the create invoice route supports a document type param, navigate there; otherwise show a message
    try {
        router.push({ name: 'finance-invoice-create', query: { document_type: 'debit_note', copy_from: invoice.value?.id } });
    } catch (e) {
        showToast('info', 'Info', 'Create Debit Note not implemented');
    }
};

const deleteInvoice = async () => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.value.invoice_number}?`)) return;
    try {
        await invoiceService.deleteInvoice(invoice.value.id);
        showToast('success', 'Success', 'Invoice deleted');
        router.push('/finance/invoices');
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast('error', 'Error', 'Failed to delete invoice');
    }
};

// Fetch invoice details
const fetchInvoice = async () => {
    loading.value = true;
    try {
        const response = await invoiceService.getInvoice(route.params.id);
        invoice.value = response.data || response;
        // Fetch preview for this invoice
        fetchPreview('invoice');
    } catch (error) {
        console.error('Error fetching invoice:', error);
        showToast('error', 'Error', 'Failed to load invoice');
        router.push('/finance/invoices');
    } finally {
        loading.value = false;
    }
};

const fetchPaymentAccounts = async () => {
    paymentAccountsLoading.value = true;
    try {
        const response = await invoiceService.getPaymentAccounts();
        // Handle both direct array and APIResponse with data nested
        paymentAccounts.value = Array.isArray(response) ? response : (response.data || response.results || []);
    } catch (error) {
        console.error('Error fetching payment accounts:', error);
        paymentAccounts.value = [];
        // Don't show error toast to avoid cluttering UI - it's not critical
    } finally {
        paymentAccountsLoading.value = false;
    }
};

const openPaymentDialog = async () => {
    // Ensure payment accounts are loaded before opening the dialog
    if (paymentAccounts.value.length === 0 && !paymentAccountsLoading.value) {
        await fetchPaymentAccounts();
    }
    showPaymentDialog.value = true;
};

const handleRecordPayment = async (data) => {
    actionLoading.value = true;
    try {
        const response = await invoiceService.recordPayment(invoice.value.id, data);
        const updated = response?.invoice || null;
        if (updated) {
            invoice.value = updated;
        } else {
            await fetchInvoice();
        }
        showToast('success', 'Success', 'Payment recorded successfully');
        showPaymentDialog.value = false;
            // Refresh payment accounts and notify account detail views to refresh transactions
            try {
                await fetchPaymentAccounts();
                // Dispatch a custom event that account detail views can listen to
                if (data && data.payment_account) {
                    window.dispatchEvent(new CustomEvent('finance.payment.recorded', { detail: { account_id: data.payment_account } }));
                }
            } catch (e) {
                // non-fatal
                console.error('Error refreshing accounts after payment:', e);
            }
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('error', 'Error', 'Failed to record payment');
    } finally {
        actionLoading.value = false;
    }
};

const voidInvoice = async () => {
    if (!confirm(`Are you sure you want to void invoice ${invoice.value.invoice_number}?`)) return;

    try {
        await invoiceService.voidInvoice(invoice.value.id);
        showToast('success', 'Success', 'Invoice voided successfully');
        await fetchInvoice();
    } catch (error) {
        console.error('Error voiding invoice:', error);
        showToast('error', 'Error', 'Failed to void invoice');
    }
};

// Edit modal state
const showEditModal = ref(false);
const editForm = ref({});

const openEditModal = () => {
    if (!invoice.value) return;
    // shallow copy essential fields for editing
    editForm.value = {
        invoice_date: invoice.value.invoice_date,
        due_date: invoice.value.due_date,
        payment_terms: invoice.value.payment_terms,
        customer_notes: invoice.value.customer_notes,
        terms_and_conditions: invoice.value.terms_and_conditions
    };
    showEditModal.value = true;
};

const saveEdit = async () => {
    actionLoading.value = true;
    try {
        const payload = { ...editForm.value };
        await invoiceService.updateInvoice(invoice.value.id, payload);
        showToast('success', 'Success', 'Invoice updated successfully');
        showEditModal.value = false;
        await fetchInvoice();
    } catch (error) {
        console.error('Error updating invoice:', error);
        showToast('error', 'Error', 'Failed to update invoice');
    } finally {
        actionLoading.value = false;
    }
};

const cloneInvoice = async () => {
    try {
        const response = await invoiceService.cloneInvoice(invoice.value.id);
        showToast('success', 'Success', 'Invoice cloned successfully');
        router.push(`/finance/invoices/${response.data.id}/edit`);
    } catch (error) {
        console.error('Error cloning invoice:', error);
        showToast('error', 'Error', 'Failed to clone invoice');
    }
};

const sendReminder = async () => {
    try {
        await invoiceService.sendReminder(invoice.value.id);
        showToast('success', 'Success', 'Reminder sent successfully');
        await fetchInvoice();
    } catch (error) {
        console.error('Error sending reminder:', error);
        showToast('error', 'Error', 'Failed to send reminder');
    }
};

const generateShareLink = async () => {
    shareLoading.value = true;
    try {
        const response = await invoiceService.generateShareLink(invoice.value.id, {
            allow_payment: true
        });
        shareUrl.value = response.url || response.public_url;
        showShareDialog.value = true;
        showToast('success', 'Success', 'Share link generated');
    } catch (error) {
        console.error('Error generating share link:', error);
        showToast('error', 'Error', 'Failed to generate share link');
    } finally {
        shareLoading.value = false;
    }
};

const copyShareUrlToClipboard = async () => {
    if (!shareUrl.value) return;
    try {
        await navigator.clipboard.writeText(shareUrl.value);
        showToast('success', 'Copied', 'Share URL copied to clipboard');
    } catch (error) {
        showToast('error', 'Error', 'Failed to copy URL');
    }
};

// Handle sending invoice via EmailSendDialog
const handleSendInvoice = async (payload) => {
    actionLoading.value = true;
    try {
        await invoiceService.sendInvoice(invoice.value.id, payload);
        showToast('success', 'Success', 'Invoice sent successfully');
        showSendDialog.value = false;
        await fetchInvoice();
    } catch (error) {
        console.error('Error sending invoice:', error);
        // Surface server-side validation errors when possible
        const serverData = error?.response?.data;
        let serverMsg = 'Failed to send invoice';
        try {
            if (serverData) {
                if (serverData.detail) serverMsg = serverData.detail;
                else if (serverData.message) serverMsg = serverData.message;
                else if (typeof serverData === 'object') serverMsg = Object.values(serverData).flat().join('; ');
                else serverMsg = String(serverData);
            }
        } catch (e) {
            // ignore
        }
        showToast('error', 'Error', serverMsg);
    } finally {
        actionLoading.value = false;
    }
};

const fetchPreview = async (type = 'invoice') => {
    if (!invoice.value) return;
    previewLoading.value = true;
    try {
        const blob = await invoiceService.getInvoicePDF(invoice.value.id, { type, download: false });
        // blob is returned directly
        // Revoke previous URL if any
        if (previewBlobUrl.value) {
            window.URL.revokeObjectURL(previewBlobUrl.value);
        }
        // Store both blob and URL for modal and inline preview
        previewBlob.value = blob;
        const url = window.URL.createObjectURL(blob);
        previewBlobUrl.value = url;
        showToast('success', 'Success', 'Preview ready');
    } catch (error) {
        console.error('Error fetching PDF preview:', error);
        showToast('error', 'Error', 'Failed to generate preview');
    } finally {
        previewLoading.value = false;
    }
};

const downloadOrOpenPDF = async (opts = { type: 'invoice', download: true, openInNewTab: false, print: false }) => {
    if (!invoice.value) return;
    try {
        showToast('info', 'Generating PDF', 'Please wait...');
        const blob = await invoiceService.getInvoicePDF(invoice.value.id, { type: opts.type, download: opts.download });
        const url = window.URL.createObjectURL(blob);

        if (opts.openInNewTab) {
            window.open(url, '_blank');
        } else if (opts.print) {
            const w = window.open(url);
            // let user print manually in the opened tab
            w && w.focus();
        } else {
            // trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice.value.invoice_number}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        }

        showToast('success', 'Success', 'PDF ready');
    } catch (error) {
        console.error('Error getting PDF:', error);
        showToast('error', 'Error', 'Failed to generate PDF');
    }
};

const getPdfActions = (inv) => {
    return [
        { label: 'PDF', icon: 'pi pi-file-pdf', command: () => fetchPreview('invoice').then(() => showPdfModal.value = true) },
        { label: 'Print', icon: 'pi pi-print', command: () => downloadOrOpenPDF({ type: 'invoice', download: false, openInNewTab: true }) },
        { label: 'Print Delivery Note', icon: 'pi pi-truck', command: () => downloadOrOpenPDF({ type: 'delivery_note', download: false, openInNewTab: true }) },
        { label: 'Print Packing Slip', icon: 'pi pi-box', command: () => downloadOrOpenPDF({ type: 'packing_slip', download: false, openInNewTab: true }) },
    ];
};

const goBack = () => {
    router.push('/finance/invoices');
};

// Lifecycle
onMounted(() => {
    fetchInvoice();
    fetchPaymentAccounts();
    // fetch preview after invoice loads (handled in fetchInvoice)
});

// Cleanup blob URLs when leaving component
onUnmounted(() => {
    if (previewBlobUrl.value) {
        window.URL.revokeObjectURL(previewBlobUrl.value);
        previewBlobUrl.value = null;
    }
});
</script>

<template>
    <div class="invoice-view-page">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <Spinner />
        </div>

        <!-- Content -->
        <div v-if="invoice" class="flex flex-col lg:flex-row gap-6">
            <!-- Left Quick Details Panel (static) -->
            <div class="lg:w-1/5 w-full">
                <!-- Quick Summary (minimal for preview) -->
                <Card class="sticky top-20">
                    <template #title>Summary</template>
                    <template #content>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <Checkbox v-model="selectedForBulk" :binary="true" />
                                    <div>
                                        <div class="font-semibold text-lg">{{ invoice.customer_details?.business_name || invoice.customer_details?.user?.first_name + ' ' + invoice.customer_details?.user?.last_name || 'Customer' }}</div>
                                        <div class="text-sm text-surface-600">{{ invoice.invoice_number }} • {{ formatDate(invoice.invoice_date) }}</div>
                                        <div v-if="isOverdue" class="text-sm text-orange-600 font-semibold uppercase">OVERDUE BY {{ daysOverdue }} DAYS</div>
                                    </div>
                                </div>
                                <div class="text-lg font-semibold">{{ formatCurrency(invoice.total) }}</div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Bulk Actions floating bar (appears when selectedForBulk true) -->
                <div v-if="selectedForBulk" class="bulk-actions-panel">
                    <div class="flex items-center gap-2">
                        <SplitButton label="Bulk Actions" :model="[{ label: 'Send', icon: 'pi pi-send', command: () => openSendDialog() }, { label: 'Delete', icon: 'pi pi-trash', command: () => deleteInvoice() } ]" />
                        <div class="px-3 py-1 rounded-full bg-surface-100 text-surface-700">1 Selected</div>
                        <Button icon="pi pi-times" class="p-button-text" @click="selectedForBulk=false" />
                    </div>
                </div>
            </div>

            <!-- Right Preview Panel (large & scrollable) -->
            <div class="lg:w-4/5 w-full" style="max-height: calc(100vh - 120px); overflow: auto;">
                <!-- Action bar for preview (buttons + 3-dots menu) -->
                <div class="mb-4 flex items-center justify-between gap-2 header-strip">
                    <div class="invoice-number-heading">{{ invoice.invoice_number }}</div>
                    <div class="flex items-center gap-2">
                        <PermissionButton 
                            v-if="canEdit"
                            :permission="'change_billingdocument'"
                            label="Edit" 
                            icon="pi pi-pencil" 
                            class="p-button-sm"
                            @click="() => router.push(`/finance/invoices/${invoice.id}/edit`)"
                        />
                        <PermissionButton 
                            v-if="invoice?.status === 'draft'"
                            :permission="'change_billingdocument'"
                            label="Approve" 
                            icon="pi pi-check" 
                            class="p-button-sm p-button-success"
                            @click="approveInvoice"
                        />
                        <PermissionButton 
                            v-if="canSend"
                            :permission="'send_invoice'"
                            label="Send" 
                            icon="pi pi-send" 
                            class="p-button-sm"
                            @click="openSendDialog"
                        />
                        <PermissionButton 
                            :permission="'share_invoice'"
                            label="Share" 
                            icon="pi pi-share-alt" 
                            class="p-button-sm" 
                            @click="generateShareLink" 
                            :loading="shareLoading" 
                        />
                        <PermissionButton 
                            :permission="'send_reminder'"
                            label="Reminders" 
                            icon="pi pi-clock" 
                            class="p-button-sm" 
                            @click="sendReminder" 
                        />
                        <Button label="PDF/Print" icon="pi pi-file-pdf" :model="getPdfActions(invoice)" class="p-button-sm" />
                        <PermissionButton 
                            v-if="canRecordPayment" 
                            :permission="'add_payment'"
                            label="Record Payment" 
                            icon="pi pi-money-bill" 
                            class="p-button-sm" 
                            @click="openPaymentDialog" 
                        />
                        <Button icon="pi pi-ellipsis-v" class="p-button-sm p-button-text" @click="actionMenu.toggle($event)" />
                        <Menu ref="actionMenu" :model="actionMenuItems()" :popup="true" />
                    </div>
                </div>

                <!-- PDF Preview area (takes most of the space) -->
                <div class="space-y-6">
                    <Card v-if="previewLoading">
                        <template #title>Preview</template>
                        <template #content>
                            <div class="flex items-center justify-center py-12">
                                <Spinner />
                            </div>
                        </template>
                    </Card>

                    <Card v-else-if="previewBlobUrl">
                        <template #content>
                            <div class="w-full">
                                <object :data="previewBlobUrl" type="application/pdf" width="100%" height="1100px">
                                    <p>Preview not available. <a :href="previewBlobUrl" target="_blank">Open in new tab</a></p>
                                </object>
                            </div>
                        </template>
                    </Card>

                    <!-- Payment History (optional, leave as extra below preview) -->
                    <Card v-if="invoice && invoice.payments && invoice.payments.length > 0">
                        <template #title>Payment History</template>
                        <template #content>
                            <Timeline :value="invoice.payments" align="left">
                                <template #opposite="slotProps">
                                    <small class="text-surface-500">{{ formatDate(slotProps.item.payment_date) }}</small>
                                </template>
                                <template #content="slotProps">
                                    <div>
                                        <div class="font-semibold text-green-600">{{ formatCurrency(slotProps.item.amount) }}</div>
                                        <div class="text-sm text-surface-600">
                                            {{ slotProps.item.payment_method }} 
                                            <span v-if="slotProps.item.reference">- {{ slotProps.item.reference }}</span>
                                        </div>
                                        <div v-if="slotProps.item.notes" class="text-sm text-surface-500 mt-1">
                                            {{ slotProps.item.notes }}
                                        </div>
                                    </div>
                                </template>
                                <template #marker="slotProps">
                                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-1 shadow-sm" 
                                          style="background-color: var(--green-500)">
                                        <i class="pi pi-check"></i>
                                    </span>
                                </template>
                            </Timeline>
                        </template>
                    </Card>
                </div>

                <!-- Reusable PDF Preview Modal -->
                <PDFPreview v-model:isOpen="showPdfModal" :pdfBlob="previewBlob" :title="`Invoice - ${invoice.invoice_number}`" :filename="`invoice-${invoice.invoice_number}.pdf`" />
                
                    <!-- Overdue ribbon overlay on preview -->
                    <div v-if="isOverdue" class="invoice-ribbon">Overdue</div>

                    <!-- Edit Invoice Modal -->
                    <Dialog v-model:visible="showEditModal" header="Edit Invoice" :modal="true" :style="{ width: '700px' }">
                        <div class="grid grid-cols-1 gap-4">
                            <div class="flex gap-4">
                                <label class="w-32">Invoice Date</label>
                                <input type="date" v-model="editForm.invoice_date" class="p-inputtext p-component" />
                            </div>
                            <div class="flex gap-4">
                                <label class="w-32">Due Date</label>
                                <input type="date" v-model="editForm.due_date" class="p-inputtext p-component" />
                            </div>
                            <div class="flex gap-4">
                                <label class="w-32">Payment Terms</label>
                                <input type="text" v-model="editForm.payment_terms" class="p-inputtext p-component" />
                            </div>
                            <div>
                                <label>Customer Notes</label>
                                <textarea rows="3" v-model="editForm.customer_notes" class="p-inputtextarea p-component w-full"></textarea>
                            </div>
                        </div>
                        <template #footer>
                            <div class="flex justify-end gap-2">
                                <Button label="Cancel" @click="showEditModal=false" />
                                <Button label="Save" @click="saveEdit" :loading="actionLoading" />
                            </div>
                        </template>
                    </Dialog>

            <!-- Sidebar removed for preview page (kept on edit/update page) -->
        </div>

        <!-- Email Send Dialog -->
        <EmailSendDialog 
            v-model:visible="showSendDialog"
            :document="invoice"
            documentType="invoice"
            :loading="actionLoading"
            @send="handleSendInvoice"
            @schedule="handleScheduleInvoice"
        />

        <!-- Payment Dialog -->
        <PaymentRecordDialog 
            v-model:visible="showPaymentDialog"
            :document="invoice"
            documentType="invoice"
            :loading="actionLoading"
            :payment-accounts="paymentAccounts"
            @record-payment="handleRecordPayment"
        />

        <!-- Share Dialog -->
        <Dialog
            v-model:visible="showShareDialog"
            modal
            header="Share Invoice"
            :style="{ width: '500px' }"
            :dismissableMask="true"
        >
            <div v-if="shareUrl" class="space-y-4">
                <Message severity="success" :closable="false">
                    <i class="pi pi-check-circle mr-2"></i>
                    <span>Public link generated successfully</span>
                </Message>

                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this link with your customer:</p>
                    <div class="flex gap-2">
                        <InputText 
                            :value="shareUrl"
                            readonly
                            class="flex-1"
                        />
                        <Button 
                            icon="pi pi-copy"
                            class="p-button-outlined"
                            @click="copyShareUrlToClipboard"
                            v-tooltip="'Copy to clipboard'"
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Your customer can:</p>
                    <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                        <li>View the invoice details</li>
                        <li>Download PDF copy</li>
                        <li>Pay the invoice online via M-Pesa, Card, or Bank Transfer</li>
                        <li>Print the invoice</li>
                    </ul>
                </div>

                <Divider />

                <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Or send directly:</p>
                    <div class="flex gap-2">
                        <Button 
                            label="Send via Email" 
                            icon="pi pi-envelope" 
                            class="flex-1"
                            @click="() => {
                                showShareDialog = false;
                                openSendDialog();
                            }"
                        />
                        <Button 
                            label="Send via WhatsApp" 
                            icon="pi pi-whatsapp" 
                            class="flex-1 p-button-success"
                            @click="() => {
                                showShareDialog = false;
                                openSendDialog();
                            }"
                        />
                    </div>
                </div>
            </div>

            <template #footer v-if="shareUrl">
                <Button label="Done" @click="showShareDialog = false" />
            </template>
        </Dialog>
</div>
    </div>
</template>

<style scoped>
.invoice-view-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.invoice-ribbon {
    position: absolute;
    left: 40px;
    top: 240px;
    background: #f59e0b; /* orange */
    color: white;
    padding: 8px 12px;
    transform: rotate(-45deg);
    font-weight: bold;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    z-index: 50;
}

/* Style the invoice preferences menu item to stand out like a button */
.menu-invoice-preferences .p-menuitem-link {
    background: #2563eb; /* blue-600 */
    color: #fff !important;
    border-radius: 6px;
    padding: 6px 12px;
    margin: 6px 8px;
    display: inline-block;
}

.bulk-actions-panel {
    position: absolute;
    left: 12px;
    top: 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(16,24,40,0.08);
    padding: 8px 12px;
    z-index: 60;
}

.invoice-number-heading {
    font-weight: 600;
    font-size: 1.125rem;
}

.header-strip {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.04);
    padding: 10px 14px;
    border-radius: 8px;
}
</style>
