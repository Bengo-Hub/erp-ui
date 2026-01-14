<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { debitNoteService } from '@/services/finance/billingDocumentsService';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(true);
const debitNote = ref(null);
const applying = ref(false);
const showSendDialog = ref(false);
const showShareDialog = ref(false);
const shareUrl = ref(null);
const shareLoading = ref(false);
const actionLoading = ref(false);

const loadDebitNote = async () => {
    try {
        loading.value = true;
        const response = await debitNoteService.getDebitNote(route.params.id);
        debitNote.value = response.data || response;
    } catch (error) {
        console.error('Error loading debit note:', error);
        showToast('error', 'Error', 'Failed to load debit note');
    } finally {
        loading.value = false;
    }
};

const applyToInvoice = async () => {
    try {
        applying.value = true;
        await debitNoteService.applyToInvoice(route.params.id);
        showToast('success', 'Success', 'Debit note applied to invoice');
        await loadDebitNote();
    } catch (error) {
        console.error('Error applying debit note:', error);
        showToast('error', 'Error', 'Failed to apply debit note');
    } finally {
        applying.value = false;
    }
};

const downloadPDF = async () => {
    try {
        const blob = await debitNoteService.getDebitNotePDF(route.params.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debit-note-${debitNote.value?.debit_note_number || route.params.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const goBack = () => {
    router.push('/finance/debit-notes');
};

const edit = () => {
    router.push(`/finance/debit-notes/${route.params.id}/edit`);
};

const openSendDialog = () => {
    showSendDialog.value = true;
};

// Share functionality
const generateShareLink = async () => {
    shareLoading.value = true;
    try {
        const response = await debitNoteService.generateShareLink(route.params.id);
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

// Handle sending debit note via email
const handleSendDebitNote = async (payload) => {
    actionLoading.value = true;
    try {
        await debitNoteService.sendDebitNote(route.params.id, payload);
        showToast('success', 'Success', 'Debit note sent successfully');
        showSendDialog.value = false;
        await loadDebitNote();
    } catch (error) {
        console.error('Error sending debit note:', error);
        showToast('error', 'Error', 'Failed to send debit note');
    } finally {
        actionLoading.value = false;
    }
};

// Handle sending via WhatsApp
const handleSendViaWhatsApp = async (payload) => {
    actionLoading.value = true;
    try {
        // First generate a share link if we don't have one
        let publicUrl = shareUrl.value;
        if (!publicUrl) {
            const response = await debitNoteService.generateShareLink(route.params.id);
            publicUrl = response.url || response.public_url;
        }

        if (!publicUrl) {
            showToast('error', 'Error', 'Failed to generate share link');
            return;
        }

        // Format phone number
        const phone = payload.phone.replace(/[^\d]/g, '');

        // Build message
        const customerName = debitNote.value?.customer_details?.full_name ||
            debitNote.value?.customer_name || 'Customer';

        const defaultMessage = `Hello ${customerName}, here is your debit note ${debitNote.value.debit_note_number}. Click the link below to view:`;
        const message = payload.message || defaultMessage;
        const fullMessage = `${message}\n\n${publicUrl}`;

        // Open WhatsApp
        const encodedMessage = encodeURIComponent(fullMessage);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        showToast('success', 'Success', 'WhatsApp opened with debit note link');
        showSendDialog.value = false;
    } catch (error) {
        console.error('Error sending via WhatsApp:', error);
        showToast('error', 'Error', 'Failed to send via WhatsApp');
    } finally {
        actionLoading.value = false;
    }
};

onMounted(() => {
    loadDebitNote();
});
</script>

<template>
    <div class="debit-note-view p-4">
        <div class="card">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">Debit Note</h1>
                        <p class="text-surface-500 m-0" v-if="debitNote">{{ debitNote.debit_note_number }}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2" v-if="debitNote">
                    <Button label="Edit" icon="pi pi-pencil" severity="secondary" @click="edit" />
                    <Button label="Send" icon="pi pi-send" @click="openSendDialog" />
                    <Button label="Share" icon="pi pi-share-alt" severity="secondary" @click="generateShareLink" :loading="shareLoading" />
                    <Button label="Download PDF" icon="pi pi-download" outlined @click="downloadPDF" />
                    <Button
                        v-if="debitNote.status === 'issued'"
                        label="Apply to Invoice"
                        icon="pi pi-check"
                        @click="applyToInvoice"
                        :loading="applying"
                    />
                </div>
            </div>

            <div v-if="loading" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="debitNote" class="space-y-6">
                <!-- Status Banner -->
                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <DocumentStatusBadge :status="debitNote.status" type="debit_note" />
                        <span class="text-surface-600">Date: {{ formatDate(debitNote.debit_note_date) }}</span>
                    </div>
                    <div class="text-2xl font-bold text-green-600">
                        +{{ formatCurrency(debitNote.total) }}
                    </div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Customer</label>
                        <p class="font-semibold m-0">{{ debitNote.customer_details?.full_name || debitNote.customer_name || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Source Invoice</label>
                        <router-link v-if="debitNote.source_invoice" :to="`/finance/invoices/${debitNote.source_invoice}`" class="text-primary font-semibold">
                            {{ debitNote.invoice_number || 'View Invoice' }}
                        </router-link>
                        <p v-else class="font-semibold m-0">N/A</p>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Reason</label>
                        <p class="font-semibold m-0">{{ debitNote.reason || 'N/A' }}</p>
                    </div>
                </div>

                <!-- Items Table -->
                <div>
                    <h3 class="font-semibold mb-4">Debit Items</h3>
                    <DataTable :value="debitNote.items || []" class="p-datatable-sm" stripedRows>
                        <Column field="name" header="Item" />
                        <Column field="description" header="Description" />
                        <Column field="quantity" header="Qty" style="width: 80px" />
                        <Column header="Unit Price" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
                        </Column>
                        <Column header="Total" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.total_price || (data.quantity * data.unit_price)) }}</template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Totals -->
                <div class="flex justify-end">
                    <div class="w-full md:w-80 space-y-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span class="font-semibold">{{ formatCurrency(debitNote.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span class="font-semibold">{{ formatCurrency(debitNote.tax_amount) }}</span>
                        </div>
                        <Divider />
                        <div class="flex justify-between text-lg">
                            <span class="font-bold">Debit Total:</span>
                            <span class="font-bold text-green-600">+{{ formatCurrency(debitNote.total) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div v-if="debitNote.notes">
                    <h3 class="font-semibold mb-2">Notes</h3>
                    <p class="text-surface-600">{{ debitNote.notes }}</p>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <p class="text-surface-500">Debit note not found</p>
            </div>
        </div>

        <!-- Email Send Dialog -->
        <EmailSendDialog
            v-model:visible="showSendDialog"
            :document="debitNote"
            documentType="debit note"
            :loading="actionLoading"
            @send="handleSendDebitNote"
            @send-via-whatsapp="handleSendViaWhatsApp"
        />

        <!-- Share Dialog -->
        <Dialog
            v-model:visible="showShareDialog"
            modal
            header="Share Debit Note"
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
                        <li>View the debit note details</li>
                        <li>Download PDF copy</li>
                        <li>Print the debit note</li>
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
                                const phone = debitNote?.customer_details?.phone || '';
                                if (phone) {
                                    const customerName = debitNote?.customer_details?.full_name || debitNote?.customer_name || 'Customer';
                                    const message = `Hello ${customerName}, here is your debit note ${debitNote.debit_note_number}. Click the link below to view:\n\n${shareUrl}`;
                                    const encodedMessage = encodeURIComponent(message);
                                    const whatsappUrl = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
                                    window.open(whatsappUrl, '_blank');
                                    showShareDialog = false;
                                } else {
                                    showShareDialog = false;
                                    openSendDialog();
                                }
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
</template>

<style scoped>
.debit-note-view .space-y-6 > * + * {
    margin-top: 1.5rem;
}
.debit-note-view .space-y-2 > * + * {
    margin-top: 0.5rem;
}
.debit-note-view .space-y-4 > * + * {
    margin-top: 1rem;
}
</style>
