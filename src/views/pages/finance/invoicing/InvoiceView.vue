<script setup>
import PaymentRecordDialog from '@/components/finance/invoicing/PaymentRecordDialog.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { invoiceService } from '@/services/finance/invoiceService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Data
const invoice = ref(null);
const loading = ref(false);
const showSendDialog = ref(false);
const showPaymentDialog = ref(false);
const actionLoading = ref(false);

// Computed
const canEdit = computed(() => hasPermission('change_billingdocument') && invoice.value?.status === 'draft');
const canDelete = computed(() => hasPermission('delete_billingdocument') && invoice.value?.status === 'draft');
const canSend = computed(() => ['draft', 'sent'].includes(invoice.value?.status));
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

// Methods
const fetchInvoice = async () => {
    loading.value = true;
    try {
        const response = await invoiceService.getInvoice(route.params.id);
        invoice.value = response.data || response;
    } catch (error) {
        console.error('Error fetching invoice:', error);
        showToast('error', 'Error', 'Failed to load invoice');
        router.push('/finance/invoices');
    } finally {
        loading.value = false;
    }
};

const editInvoice = () => {
    router.push(`/finance/invoices/${invoice.value.id}/edit`);
};

const deleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
        await invoiceService.delete(invoice.value.id);
        showToast('success', 'Success', 'Invoice deleted successfully');
        router.push('/finance/invoices');
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast('error', 'Error', 'Failed to delete invoice');
    }
};

const openSendDialog = () => {
    showSendDialog.value = true;
};

const handleSendInvoice = async (data) => {
    actionLoading.value = true;
    try {
        await invoiceService.sendInvoice(invoice.value.id, data);
        showToast('success', 'Success', 'Invoice sent successfully');
        showSendDialog.value = false;
        await fetchInvoice();
    } catch (error) {
        console.error('Error sending invoice:', error);
        showToast('error', 'Error', 'Failed to send invoice');
    } finally {
        actionLoading.value = false;
    }
};

const handleScheduleInvoice = async (data) => {
    actionLoading.value = true;
    try {
        await invoiceService.scheduleInvoice(invoice.value.id, data);
        showToast('success', 'Success', 'Invoice scheduled successfully');
        showSendDialog.value = false;
        await fetchInvoice();
    } catch (error) {
        console.error('Error scheduling invoice:', error);
        showToast('error', 'Error', 'Failed to schedule invoice');
    } finally {
        actionLoading.value = false;
    }
};

const openPaymentDialog = () => {
    showPaymentDialog.value = true;
};

const handleRecordPayment = async (data) => {
    actionLoading.value = true;
    try {
        await invoiceService.recordPayment(invoice.value.id, data);
        showToast('success', 'Success', 'Payment recorded successfully');
        showPaymentDialog.value = false;
        await fetchInvoice();
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

const downloadPDF = async () => {
    try {
        showToast('info', 'Generating PDF', 'Please wait...');
        const response = await invoiceService.downloadPDF(invoice.value.id);
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.value.invoice_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const goBack = () => {
    router.push('/finance/invoices');
};

// Lifecycle
onMounted(() => {
    fetchInvoice();
});
</script>

<template>
    <div class="invoice-view-page">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <Spinner />
        </div>

        <!-- Content -->
        <div v-else-if="invoice" class="space-y-6">
            <!-- Header -->
            <div class="bg-white border-b border-surface-200 px-6 py-4">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <Button 
                                icon="pi pi-arrow-left" 
                                class="p-button-text p-button-sm" 
                                @click="goBack"
                                v-tooltip.bottom="'Back to Invoices'"
                            />
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                Invoice {{ invoice.invoice_number }}
                            </h1>
                            <DocumentStatusBadge 
                                :status="invoice.status" 
                                documentType="invoice"
                            />
                            <Badge v-if="isOverdue" value="Overdue" severity="danger" />
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm ml-12">
                            Created {{ formatDate(invoice.created_at) }} • Due {{ formatDate(invoice.due_date) }}
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap gap-2">
                        <Button 
                            v-if="canSend"
                            label="Send" 
                            icon="pi pi-send" 
                            @click="openSendDialog"
                            class="p-button-primary"
                        />
                        <Button 
                            v-if="canRecordPayment"
                            label="Record Payment" 
                            icon="pi pi-money-bill" 
                            @click="openPaymentDialog"
                            class="p-button-success"
                        />
                        <Button 
                            v-if="invoice.status === 'sent' || isOverdue"
                            label="Send Reminder" 
                            icon="pi pi-bell" 
                            @click="sendReminder"
                            class="p-button-secondary"
                        />
                        <Button 
                            label="Download PDF" 
                            icon="pi pi-file-pdf" 
                            @click="downloadPDF"
                            class="p-button-secondary"
                        />
                        <Button 
                            label="Clone" 
                            icon="pi pi-copy" 
                            @click="cloneInvoice"
                            class="p-button-secondary"
                        />
                        <Button 
                            v-if="canEdit"
                            label="Edit" 
                            icon="pi pi-pencil" 
                            @click="editInvoice"
                            class="p-button-secondary"
                        />
                        <Button 
                            v-if="canVoid"
                            label="Void" 
                            icon="pi pi-ban" 
                            @click="voidInvoice"
                            class="p-button-danger p-button-outlined"
                        />
                        <Button 
                            v-if="canDelete"
                            label="Delete" 
                            icon="pi pi-trash" 
                            @click="deleteInvoice"
                            class="p-button-danger p-button-outlined"
                        />
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Content (Left Column) -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Invoice Details Card -->
                        <Card>
                            <template #title>Invoice Details</template>
                            <template #content>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Customer Info -->
                                    <div>
                                        <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Bill To:</h3>
                                        <div class="space-y-1">
                                            <p class="font-semibold">{{ invoice.customer_details?.business_name || 'N/A' }}</p>
                                            <p class="text-sm text-surface-600">
                                                {{ invoice.customer_details?.user?.first_name }} {{ invoice.customer_details?.user?.last_name }}
                                            </p>
                                            <p class="text-sm text-surface-600">{{ invoice.customer_details?.user?.email }}</p>
                                            <p class="text-sm text-surface-600">{{ invoice.customer_details?.user?.phone }}</p>
                                        </div>
                                    </div>

                                    <!-- Invoice Info -->
                                    <div>
                                        <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Invoice Info:</h3>
                                        <div class="space-y-2">
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Invoice Date:</span>
                                                <span class="font-medium">{{ formatDate(invoice.invoice_date) }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Due Date:</span>
                                                <span class="font-medium" :class="{ 'text-red-600': isOverdue }">
                                                    {{ formatDate(invoice.due_date) }}
                                                </span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Payment Terms:</span>
                                                <span class="font-medium">{{ invoice.payment_terms || 'N/A' }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-surface-600">Template:</span>
                                                <span class="font-medium">{{ invoice.template_name || 'Standard' }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <!-- Customer Notes -->
                                <div v-if="invoice.customer_notes">
                                    <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Notes:</h3>
                                    <p class="text-surface-700 dark:text-surface-300">{{ invoice.customer_notes }}</p>
                                </div>
                            </template>
                        </Card>

                        <!-- Line Items Card -->
                        <Card>
                            <template #title>Invoice Items ({{ totalItems }})</template>
                            <template #content>
                                <DataTable :value="invoice.items" responsiveLayout="scroll">
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
                                            <span>{{ formatCurrency(invoice.subtotal || subtotal) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Tax:</span>
                                            <span>{{ formatCurrency(invoice.tax_amount || taxTotal) }}</span>
                                        </div>
                                        <div v-if="invoice.discount_amount > 0" class="flex justify-between text-orange-600">
                                            <span>Discount:</span>
                                            <span>-{{ formatCurrency(invoice.discount_amount) }}</span>
                                        </div>
                                        <div v-if="invoice.shipping_cost > 0" class="flex justify-between">
                                            <span>Shipping:</span>
                                            <span>{{ formatCurrency(invoice.shipping_cost) }}</span>
                                        </div>
                                        <Divider />
                                        <div class="flex justify-between text-xl font-bold">
                                            <span>Total:</span>
                                            <span class="text-primary">{{ formatCurrency(invoice.total) }}</span>
                                        </div>
                                        <div v-if="invoice.amount_paid > 0" class="flex justify-between text-green-600">
                                            <span>Paid:</span>
                                            <span>-{{ formatCurrency(invoice.amount_paid) }}</span>
                                        </div>
                                        <div v-if="invoice.balance_due > 0" class="flex justify-between text-xl font-bold text-orange-600">
                                            <span>Balance Due:</span>
                                            <span>{{ formatCurrency(invoice.balance_due) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Payment History -->
                        <Card v-if="invoice.payments && invoice.payments.length > 0">
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

                    <!-- Sidebar (Right Column) -->
                    <div class="space-y-6">
                        <!-- Status Card -->
                        <Card>
                            <template #title>Status</template>
                            <template #content>
                                <div class="text-center py-4 space-y-3">
                                    <DocumentStatusBadge 
                                        :status="invoice.status" 
                                        documentType="invoice"
                                        class="text-lg"
                                    />
                                    <div v-if="isOverdue" class="text-red-600 font-semibold flex items-center justify-center gap-2">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Overdue</span>
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Email History -->
                        <Card v-if="invoice.email_logs && invoice.email_logs.length > 0">
                            <template #title>Email History</template>
                            <template #content>
                                <Timeline :value="invoice.email_logs" layout="vertical">
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
                        <Card v-if="invoice.terms_and_conditions">
                            <template #title>Terms & Conditions</template>
                            <template #content>
                                <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                                    {{ invoice.terms_and_conditions }}
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
            @record-payment="handleRecordPayment"
        />
    </div>
</template>

<style scoped>
.invoice-view-page {
    min-height: 100vh;
    background-color: #f8fafc;
}
</style>
