<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { deliveryNoteService } from '@/services/finance/billingDocumentsService';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(true);
const deliveryNote = ref(null);
const markingDelivered = ref(false);
const showSendDialog = ref(false);
const showShareDialog = ref(false);
const shareUrl = ref(null);
const shareLoading = ref(false);
const actionLoading = ref(false);

const loadDeliveryNote = async () => {
    try {
        loading.value = true;
        const response = await deliveryNoteService.getDeliveryNote(route.params.id);
        deliveryNote.value = response.data || response;
    } catch (error) {
        console.error('Error loading delivery note:', error);
        showToast('error', 'Error', 'Failed to load delivery note');
    } finally {
        loading.value = false;
    }
};

const markDelivered = async () => {
    try {
        markingDelivered.value = true;
        await deliveryNoteService.markDelivered(route.params.id, {
            delivered_at: new Date().toISOString(),
            notes: 'Marked as delivered'
        });
        showToast('success', 'Success', 'Delivery note marked as delivered');
        await loadDeliveryNote();
    } catch (error) {
        console.error('Error marking delivered:', error);
        showToast('error', 'Error', 'Failed to mark as delivered');
    } finally {
        markingDelivered.value = false;
    }
};

const downloadPDF = async () => {
    try {
        const blob = await deliveryNoteService.getDeliveryNotePDF(route.params.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `delivery-note-${deliveryNote.value?.delivery_note_number || route.params.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const goBack = () => {
    router.push('/finance/delivery-notes');
};

const edit = () => {
    router.push(`/finance/delivery-notes/${route.params.id}/edit`);
};

const openSendDialog = () => {
    showSendDialog.value = true;
};

// Share functionality
const generateShareLink = async () => {
    shareLoading.value = true;
    try {
        const response = await deliveryNoteService.generateShareLink(route.params.id);
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

// Handle sending delivery note via email
const handleSendDeliveryNote = async (payload) => {
    actionLoading.value = true;
    try {
        await deliveryNoteService.sendDeliveryNote(route.params.id, payload);
        showToast('success', 'Success', 'Delivery note sent successfully');
        showSendDialog.value = false;
        await loadDeliveryNote();
    } catch (error) {
        console.error('Error sending delivery note:', error);
        showToast('error', 'Error', 'Failed to send delivery note');
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
            const response = await deliveryNoteService.generateShareLink(route.params.id);
            publicUrl = response.url || response.public_url;
        }

        if (!publicUrl) {
            showToast('error', 'Error', 'Failed to generate share link');
            return;
        }

        // Format phone number
        const phone = payload.phone.replace(/[^\d]/g, '');

        // Build message
        const customerName = deliveryNote.value?.customer_details?.full_name ||
            deliveryNote.value?.supplier_details?.full_name ||
            deliveryNote.value?.customer_name || 'Customer';

        const defaultMessage = `Hello ${customerName}, here is your delivery note ${deliveryNote.value.delivery_note_number}. Click the link below to view:`;
        const message = payload.message || defaultMessage;
        const fullMessage = `${message}\n\n${publicUrl}`;

        // Open WhatsApp
        const encodedMessage = encodeURIComponent(fullMessage);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        showToast('success', 'Success', 'WhatsApp opened with delivery note link');
        showSendDialog.value = false;
    } catch (error) {
        console.error('Error sending via WhatsApp:', error);
        showToast('error', 'Error', 'Failed to send via WhatsApp');
    } finally {
        actionLoading.value = false;
    }
};

onMounted(() => {
    loadDeliveryNote();
});
</script>

<template>
    <div class="delivery-note-view p-4">
        <div class="card">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">Delivery Note</h1>
                        <p class="text-surface-500 m-0" v-if="deliveryNote">{{ deliveryNote.delivery_note_number }}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2" v-if="deliveryNote">
                    <Button label="Edit" icon="pi pi-pencil" severity="secondary" @click="edit" />
                    <Button label="Send" icon="pi pi-send" @click="openSendDialog" />
                    <Button label="Share" icon="pi pi-share-alt" severity="secondary" @click="generateShareLink" :loading="shareLoading" />
                    <Button label="Download PDF" icon="pi pi-download" outlined @click="downloadPDF" />
                    <Button
                        v-if="deliveryNote.status !== 'delivered'"
                        label="Mark Delivered"
                        icon="pi pi-check"
                        @click="markDelivered"
                        :loading="markingDelivered"
                    />
                </div>
            </div>

            <div v-if="loading" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="deliveryNote" class="space-y-6">
                <!-- Status Banner -->
                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <DocumentStatusBadge :status="deliveryNote.status" type="delivery_note" />
                        <span class="text-surface-600">Delivery Date: {{ formatDate(deliveryNote.delivery_date) }}</span>
                    </div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Customer</label>
                        <p class="font-semibold m-0">{{ deliveryNote.customer_details?.full_name || deliveryNote.supplier_details?.full_name || deliveryNote.customer_name || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Source Invoice</label>
                        <router-link v-if="deliveryNote.source_invoice" :to="`/finance/invoices/${deliveryNote.source_invoice}`" class="text-primary font-semibold">
                            {{ deliveryNote.invoice_number || 'View Invoice' }}
                        </router-link>
                        <p v-else class="font-semibold m-0">N/A</p>
                    </div>
                    <div v-if="deliveryNote.source_purchase_order">
                        <label class="text-sm text-surface-500 block mb-1">Source Purchase Order</label>
                        <router-link :to="`/procurement/purchase-orders/${deliveryNote.source_purchase_order}`" class="text-primary font-semibold">
                            {{ deliveryNote.purchase_order_number || 'View PO' }}
                        </router-link>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Driver</label>
                        <p class="font-semibold m-0">{{ deliveryNote.driver_name || 'N/A' }}</p>
                        <small v-if="deliveryNote.driver_phone" class="text-surface-500">{{ deliveryNote.driver_phone }}</small>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Vehicle Number</label>
                        <p class="font-semibold m-0">{{ deliveryNote.vehicle_number || 'N/A' }}</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="text-sm text-surface-500 block mb-1">Delivery Address</label>
                        <p class="font-semibold m-0">{{ deliveryNote.delivery_address || 'N/A' }}</p>
                    </div>
                </div>

                <!-- Items Table -->
                <div>
                    <h3 class="font-semibold mb-4">Delivery Items</h3>
                    <DataTable :value="deliveryNote.items || []" class="p-datatable-sm" stripedRows>
                        <Column field="name" header="Item" />
                        <Column field="description" header="Description" />
                        <Column field="quantity" header="Qty" style="width: 100px" />
                        <Column header="Unit Price" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
                        </Column>
                        <Column header="Total" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.total_price || (data.quantity * data.unit_price)) }}</template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Notes -->
                <div v-if="deliveryNote.notes">
                    <h3 class="font-semibold mb-2">Notes</h3>
                    <p class="text-surface-600">{{ deliveryNote.notes }}</p>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <p class="text-surface-500">Delivery note not found</p>
            </div>
        </div>

        <!-- Email Send Dialog -->
        <EmailSendDialog
            v-model:visible="showSendDialog"
            :document="deliveryNote"
            documentType="delivery note"
            :loading="actionLoading"
            @send="handleSendDeliveryNote"
            @send-via-whatsapp="handleSendViaWhatsApp"
        />

        <!-- Share Dialog -->
        <Dialog
            v-model:visible="showShareDialog"
            modal
            header="Share Delivery Note"
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
                        <li>View the delivery note details</li>
                        <li>Download PDF copy</li>
                        <li>Print the delivery note</li>
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
                                const phone = deliveryNote?.customer_details?.phone || deliveryNote?.supplier_details?.phone || '';
                                if (phone) {
                                    const customerName = deliveryNote?.customer_details?.full_name || deliveryNote?.supplier_details?.full_name || deliveryNote?.customer_name || 'Customer';
                                    const message = `Hello ${customerName}, here is your delivery note ${deliveryNote.delivery_note_number}. Click the link below to view:\n\n${shareUrl}`;
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
.delivery-note-view .space-y-6 > * + * {
    margin-top: 1.5rem;
}
.delivery-note-view .space-y-2 > * + * {
    margin-top: 0.5rem;
}
.delivery-note-view .space-y-4 > * + * {
    margin-top: 1rem;
}
</style>
