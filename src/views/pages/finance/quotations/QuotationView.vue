<script setup>
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import Spinner from '@/components/ui/Spinner.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { quotationService } from '@/services/finance/quotationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PAYMENT_TERMS } from '@/constants/finance/paymentMethods';
import { computed, onMounted, ref } from 'vue';
import PDFPreview from '@/components/shared/PDFPreview.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Data
const quotation = ref(null);
const loading = ref(false);
const showSendDialog = ref(false);
const showConvertDialog = ref(false);
const actionLoading = ref(false);
const showPdfModal = ref(false);
const pdfBlob = ref(null);

// Conversion data
const conversionData = ref({
    payment_terms: 'net_30',
    invoice_date: new Date(),
    custom_message: ''
});

// Computed
const canEdit = computed(() => hasPermission('change_billingdocument') && quotation.value?.status === 'draft');
const canDelete = computed(() => hasPermission('delete_billingdocument') && quotation.value?.status === 'draft');
const canSend = computed(() => ['draft', 'sent'].includes(quotation.value?.status));
const canAccept = computed(() => ['sent', 'viewed'].includes(quotation.value?.status));
const canDecline = computed(() => ['sent', 'viewed'].includes(quotation.value?.status));
const canConvert = computed(() => quotation.value?.status === 'accepted');

const totalItems = computed(() => quotation.value?.items?.length || 0);

const subtotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

const isExpired = computed(() => {
    if (!quotation.value?.valid_until || quotation.value?.status === 'accepted') return false;
    return new Date(quotation.value.valid_until) < new Date();
});

const daysUntilExpiry = computed(() => {
    if (!quotation.value?.valid_until) return null;
    const today = new Date();
    const expiry = new Date(quotation.value.valid_until);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
});

// Methods
const fetchQuotation = async () => {
    loading.value = true;
    try {
        const response = await quotationService.getQuotation(route.params.id);
        quotation.value = response.data || response;
    } catch (error) {
        console.error('Error fetching quotation:', error);
        showToast('error', 'Error', 'Failed to load quotation');
        router.push('/finance/quotations');
    } finally {
        loading.value = false;
    }
};

const editQuotation = () => {
    router.push(`/finance/quotations/${quotation.value.id}/edit`);
};

const deleteQuotation = async () => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
        await quotationService.deleteQuotation(quotation.value.id);
        showToast('success', 'Success', 'Quotation deleted successfully');
        router.push('/finance/quotations');
    } catch (error) {
        console.error('Error deleting quotation:', error);
        showToast('error', 'Error', 'Failed to delete quotation');
    }
};

const openSendDialog = () => {
    showSendDialog.value = true;
};

const handleSendQuotation = async (data) => {
    actionLoading.value = true;
    try {
        await quotationService.sendQuotation(quotation.value.id, data);
        showToast('success', 'Success', 'Quotation sent successfully');
        showSendDialog.value = false;
        await fetchQuotation();
    } catch (error) {
        console.error('Error sending quotation:', error);
        showToast('error', 'Error', 'Failed to send quotation');
    } finally {
        actionLoading.value = false;
    }
};

const handleScheduleQuotation = async (data) => {
    actionLoading.value = true;
    try {
        await quotationService.scheduleQuotation(quotation.value.id, data);
        showToast('success', 'Success', 'Quotation scheduled successfully');
        showSendDialog.value = false;
        await fetchQuotation();
    } catch (error) {
        console.error('Error scheduling quotation:', error);
        showToast('error', 'Error', 'Failed to schedule quotation');
    } finally {
        actionLoading.value = false;
    }
};

const acceptQuotation = async () => {
    if (!confirm('Accept this quotation?')) return;

    try {
        await quotationService.acceptQuotation(quotation.value.id);
        showToast('success', 'Success', 'Quotation accepted');
        await fetchQuotation();
    } catch (error) {
        console.error('Error accepting quotation:', error);
        showToast('error', 'Error', 'Failed to accept quotation');
    }
};

const declineQuotation = async () => {
    const reason = prompt('Please provide a reason for declining:');
    if (!reason) return;

    try {
        await quotationService.declineQuotation(quotation.value.id, { reason });
        showToast('success', 'Success', 'Quotation declined');
        await fetchQuotation();
    } catch (error) {
        console.error('Error declining quotation:', error);
        showToast('error', 'Error', 'Failed to decline quotation');
    }
};

const openConvertDialog = () => {
    conversionData.value = {
        payment_terms: 'net_30',
        invoice_date: new Date(),
        custom_message: ''
    };
    showConvertDialog.value = true;
};

const convertToInvoice = async () => {
    actionLoading.value = true;
    try {
        const data = {
            ...conversionData.value,
            invoice_date: conversionData.value.invoice_date instanceof Date
                ? conversionData.value.invoice_date.toISOString().split('T')[0]
                : conversionData.value.invoice_date
        };
        
        const response = await quotationService.convertToInvoice(quotation.value.id, data);
        showToast('success', 'Success', 'Quotation converted to invoice');
        showConvertDialog.value = false;

        // Navigate to the new invoice (response contains { invoice: {...}, quotation: {...} })
        if (response?.invoice?.id) {
            router.push(`/finance/invoices/${response.invoice.id}`);
        } else {
            router.push('/finance/invoices');
        }
    } catch (error) {
        console.error('Error converting quotation:', error);
        showToast('error', 'Error', 'Failed to convert quotation');
    } finally {
        actionLoading.value = false;
    }
};

const cloneQuotation = async () => {
    try {
        const response = await quotationService.cloneQuotation(quotation.value.id);
        showToast('success', 'Success', 'Quotation cloned successfully');
        router.push(`/finance/quotations/${response.data.id}/edit`);
    } catch (error) {
        console.error('Error cloning quotation:', error);
        showToast('error', 'Error', 'Failed to clone quotation');
    }
};

const sendFollowUp = async () => {
    try {
        await quotationService.sendFollowUp(quotation.value.id);
        showToast('success', 'Success', 'Follow-up sent successfully');
        await fetchQuotation();
    } catch (error) {
        console.error('Error sending follow-up:', error);
        showToast('error', 'Error', 'Failed to send follow-up');
    }
};

const downloadPDF = async () => {
    try {
        showToast('info', 'Generating PDF', 'Please wait...');
        const blob = await quotationService.getQuotationPDF(quotation.value.id);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quotation-${quotation.value.quotation_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const previewPDF = async () => {
    try {
        showToast('info', 'Generating PDF', 'Please wait...');
        const blob = await quotationService.getQuotationPDF(quotation.value.id);
        pdfBlob.value = blob;
        showPdfModal.value = true;
        showToast('success', 'Success', 'Preview ready');
    } catch (error) {
        console.error('Error generating preview:', error);
        showToast('error', 'Error', 'Failed to generate preview');
    }
};

const goBack = () => {
    router.push('/finance/quotations');
};

// Lifecycle
onMounted(() => {
    fetchQuotation();
});
</script>

<template>
    <div class="quotation-view-page">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <Spinner />
        </div>

        <!-- Content -->
        <div v-else-if="quotation" class="space-y-6">
            <!-- Header -->
            <div class="bg-white border-b border-surface-200 px-6 py-4">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <Button 
                                icon="pi pi-arrow-left" 
                                class="p-button-text p-button-sm" 
                                @click="goBack"
                                v-tooltip.bottom="'Back to Quotations'"
                            />
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                Quotation {{ quotation.quotation_number }}
                            </h1>
                            <DocumentStatusBadge 
                                :status="quotation.status" 
                                documentType="quotation"
                            />
                            <Badge v-if="isExpired" value="Expired" severity="danger" />
                            <Badge v-else-if="daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0" 
                                   :value="`${daysUntilExpiry}d left`" 
                                   severity="warning" />
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm ml-12">
                            Created {{ formatDate(quotation.created_at) }} • Valid Until {{ formatDate(quotation.valid_until) }}
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap gap-2">
                        <PermissionButton 
                            v-if="canConvert"
                            :permission="'convert_quotation'"
                            label="Convert to Invoice" 
                            icon="pi pi-arrow-right" 
                            @click="openConvertDialog"
                            class="p-button-success"
                            v-tooltip.bottom="'Convert this quotation to an invoice'"
                        />
                        <PermissionButton 
                            v-if="canAccept"
                            :permission="'accept_quotation'"
                            label="Accept" 
                            icon="pi pi-check" 
                            @click="acceptQuotation"
                            class="p-button-success"
                        />
                        <PermissionButton 
                            v-if="canDecline"
                            :permission="'decline_quotation'"
                            label="Decline" 
                            icon="pi pi-times" 
                            @click="declineQuotation"
                            class="p-button-danger"
                        />
                        <PermissionButton 
                            v-if="canSend"
                            :permission="'send_quotation'"
                            label="Send" 
                            icon="pi pi-send" 
                            @click="openSendDialog"
                            class="p-button-primary"
                        />
                        <PermissionButton 
                            v-if="quotation" 
                            :permission="'view_quotation'"
                            icon="pi pi-eye" 
                            label="Preview" 
                            class="p-button-secondary" 
                            @click="previewPDF" 
                        />
                        <PermissionButton 
                            v-if="quotation.status === 'sent'"
                            :permission="'send_followup'"
                            label="Send Follow-up" 
                            icon="pi pi-bell" 
                            @click="sendFollowUp"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            :permission="'download_quotation'"
                            label="Download PDF" 
                            icon="pi pi-file-pdf" 
                            @click="downloadPDF"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            :permission="'clone_quotation'"
                            label="Clone" 
                            icon="pi pi-copy" 
                            @click="cloneQuotation"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            v-if="canEdit"
                            :permission="'change_quotation'"
                            label="Edit" 
                            icon="pi pi-pencil" 
                            @click="editQuotation"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            v-if="canDelete"
                            :permission="'delete_quotation'"
                            label="Delete" 
                            icon="pi pi-trash" 
                            @click="deleteQuotation"
                            class="p-button-danger p-button-outlined"
                        />
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Content (Left Column) -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Quotation Details Card -->
                        <Card>
                            <template #title>Quotation Details</template>
                            <template #content>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Customer Info -->
                                    <div>
                                        <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Quote For:</h3>
                                        <div class="space-y-1">
                                            <p class="font-semibold">{{ quotation.customer_details?.business_name || 'N/A' }}</p>
                                            <p class="text-sm text-surface-600">
                                                {{ quotation.customer_details?.user?.first_name }} {{ quotation.customer_details?.user?.last_name }}
                                            </p>
                                            <p class="text-sm text-surface-600">{{ quotation.customer_details?.user?.email }}</p>
                                            <p class="text-sm text-surface-600">{{ quotation.customer_details?.user?.phone }}</p>
                                        </div>
                                    </div>

                                    <!-- Quotation Info -->
                                    <div>
                                        <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Quotation Info:</h3>
                                        <div class="space-y-2">
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Quotation Date:</span>
                                                <span class="font-medium">{{ formatDate(quotation.quotation_date) }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Valid Until:</span>
                                                <span class="font-medium" :class="{ 'text-red-600': isExpired, 'text-orange-600': daysUntilExpiry <= 7 && daysUntilExpiry > 0 }">
                                                    {{ formatDate(quotation.valid_until) }}
                                                </span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Validity:</span>
                                                <span class="font-medium">{{ quotation.validity_days }} days</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Template:</span>
                                                <span class="font-medium">{{ quotation.template_name || 'Standard' }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <!-- Customer Notes -->
                                <div v-if="quotation.customer_notes">
                                    <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Notes:</h3>
                                    <p class="text-surface-700 dark:text-surface-300">{{ quotation.customer_notes }}</p>
                                </div>
                            </template>
                        </Card>

                        <!-- Line Items Card -->
                        <Card>
                            <template #title>Quotation Items ({{ totalItems }})</template>
                            <template #content>
                                <DataTable :value="quotation.items" responsiveLayout="scroll">
                                    <Column field="name" header="Item" style="min-width: 200px"></Column>
                                    <Column field="description" header="Description"></Column>
                                    <Column field="quantity" header="Qty">
                                        <template #body="{ data }">
                                            {{ data.quantity || 1 }}
                                        </template>
                                    </Column>
                                    <Column field="unit_price" header="Unit Price">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.unit_price) }}
                                        </template>
                                    </Column>
                                    <Column field="tax_amount" header="Tax">
                                        <template #body="{ data }">
                                            {{ formatCurrency(data.tax_amount) }}
                                        </template>
                                    </Column>
                                    <Column field="total" header="Total">
                                        <template #body="{ data }">
                                            <span class="font-semibold">{{ formatCurrency(data.total) }}</span>
                                        </template>
                                    </Column>
                                </DataTable>

                                <!-- Totals -->
                                <div class="mt-6 flex justify-end">
                                    <div class="w-80 space-y-2">
                                        <div class="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>{{ formatCurrency(quotation.subtotal || subtotal) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Tax:</span>
                                            <span>{{ formatCurrency(quotation.tax_amount || taxTotal) }}</span>
                                        </div>
                                        <div v-if="quotation.discount_amount > 0" class="flex justify-between text-orange-600">
                                            <span>Discount:</span>
                                            <span>-{{ formatCurrency(quotation.discount_amount) }}</span>
                                        </div>
                                        <div v-if="quotation.shipping_cost > 0" class="flex justify-between">
                                            <span>Shipping:</span>
                                            <span>{{ formatCurrency(quotation.shipping_cost) }}</span>
                                        </div>
                                        <Divider />
                                        <div class="flex justify-between text-2xl font-bold">
                                            <span>Total:</span>
                                            <span class="text-primary">{{ formatCurrency(quotation.total) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <!-- Sidebar (Right Column) -->
                    <div class="space-y-6">
                        <!-- Status & Validity Card -->
                        <Card>
                            <template #title>Status & Validity</template>
                            <template #content>
                                <div class="text-center py-4 space-y-3">
                                    <DocumentStatusBadge 
                                        :status="quotation.status" 
                                        documentType="quotation"
                                        class="text-lg"
                                    />
                                    
                                    <Divider />
                                    
                                    <div v-if="!isExpired && daysUntilExpiry !== null" class="text-sm">
                                        <div class="text-surface-600">Valid for</div>
                                        <div class="text-2xl font-bold" :class="daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-green-600'">
                                            {{ daysUntilExpiry }} days
                                        </div>
                                    </div>
                                    
                                    <div v-else-if="isExpired" class="text-red-600 font-semibold flex flex-col items-center gap-2">
                                        <i class="pi pi-exclamation-triangle text-2xl"></i>
                                        <span>Expired</span>
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Quick Actions -->
                        <Card v-if="canConvert">
                            <template #content>
                                <Button 
                                    label="Convert to Invoice" 
                                    icon="pi pi-arrow-right" 
                                    @click="openConvertDialog"
                                    class="p-button-success w-full p-button-lg"
                                />
                                <p class="text-xs text-surface-500 text-center mt-2">
                                    This will create an invoice from this quotation
                                </p>
                            </template>
                        </Card>

                        <!-- Email History -->
                        <Card v-if="quotation.email_logs && quotation.email_logs.length > 0">
                            <template #title>Email History</template>
                            <template #content>
                                <Timeline :value="quotation.email_logs" layout="vertical">
                                    <template #content="slotProps">
                                        <div class="space-y-1">
                                            <div class="font-semibold">{{ slotProps.item.email_type }}</div>
                                            <div class="text-sm text-surface-600">To: {{ slotProps.item.recipient_email }}</div>
                                            <div class="text-xs text-surface-500">{{ formatDate(slotProps.item.sent_at) }}</div>
                                            <Tag :value="slotProps.item.status" :severity="slotProps.item.status === 'opened' ? 'success' : 'info'" class="text-xs" />
                                        </div>
                                    </template>
                                    <template #marker="slotProps">
                                        <span class="flex w-6 h-6 items-center justify-center text-white rounded-full z-1" 
                                              :style="{ backgroundColor: slotProps.item.status === 'opened' ? 'var(--green-500)' : 'var(--blue-500)' }">
                                            <i :class="slotProps.item.status === 'opened' ? 'pi pi-eye' : 'pi pi-envelope'"></i>
                                        </span>
                                    </template>
                                </Timeline>
                            </template>
                        </Card>

                        <!-- Terms & Conditions -->
                        <Card v-if="quotation.terms_and_conditions">
                            <template #title>Terms & Conditions</template>
                            <template #content>
                                <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                                    {{ quotation.terms_and_conditions }}
                                </p>
                            </template>
                        </Card>
                    </div>
                </div>
            </div>
        </div>

        <!-- Email Send Dialog -->
        <EmailSendDialog 
            v-model:visible="showSendDialog"
            :document="quotation"
            documentType="quotation"
            :loading="actionLoading"
            @send="handleSendQuotation"
            @schedule="handleScheduleQuotation"
        />

        <!-- PDF Preview Modal -->
        <PDFPreview v-model:isOpen="showPdfModal" :pdfBlob="pdfBlob" :title="`Quotation - ${quotation?.quotation_number || ''}`" :filename="`quotation-${quotation?.quotation_number || ''}.pdf`" />

        <!-- Convert to Invoice Dialog -->
        <Dialog 
            v-model:visible="showConvertDialog" 
            modal 
            header="Convert to Invoice" 
            :style="{ width: '600px' }"
            :dismissableMask="true"
        >
            <div v-if="quotation" class="space-y-4">
                <!-- Quotation Summary -->
                <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-surface-600 dark:text-surface-400">Quotation #:</span>
                        <span class="font-semibold font-mono">{{ quotation.quotation_number }}</span>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-surface-600 dark:text-surface-400">Customer:</span>
                        <span class="font-medium">{{ quotation.customer_details?.business_name }}</span>
                    </div>
                    <Divider />
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-semibold">Total Amount:</span>
                        <span class="text-2xl font-bold text-primary">{{ formatCurrency(quotation.total) }}</span>
                    </div>
                </div>

                <!-- Payment Terms -->
                <div>
                    <label class="block text-sm font-medium mb-2">Payment Terms *</label>
                    <Dropdown 
                        v-model="conversionData.payment_terms"
                        :options="PAYMENT_TERMS"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select payment terms"
                        class="w-full"
                    />
                </div>

                <!-- Invoice Date -->
                <div>
                    <label class="block text-sm font-medium mb-2">Invoice Date *</label>
                    <Calendar 
                        v-model="conversionData.invoice_date"
                        dateFormat="dd/mm/yy"
                        :showIcon="true"
                        class="w-full"
                    />
                </div>

                <!-- Custom Message -->
                <div>
                    <label class="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                    <Textarea 
                        v-model="conversionData.custom_message"
                        rows="3"
                        class="w-full"
                        placeholder="Add a message for the invoice..."
                    />
                </div>

                <Message severity="info" :closable="false">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-info-circle"></i>
                        <span>This will create a new invoice with all items and customer details from this quotation</span>
                    </div>
                </Message>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    @click="showConvertDialog = false" 
                    class="p-button-text" 
                    :disabled="actionLoading"
                />
                <Button 
                    label="Convert to Invoice" 
                    icon="pi pi-arrow-right" 
                    @click="convertToInvoice" 
                    class="p-button-success"
                    :loading="actionLoading"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.quotation-view-page {
    min-height: 100vh;
    background-color: #f8fafc;
}
</style>
