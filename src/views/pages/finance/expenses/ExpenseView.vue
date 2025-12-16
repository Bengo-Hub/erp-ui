<script setup>
import PaymentRecordDialog from '@/components/finance/invoicing/PaymentRecordDialog.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import ApprovalDialog from '@/components/finance/shared/ApprovalDialog.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import Spinner from '@/components/ui/Spinner.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { expenseService } from '@/services/finance/expenseService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Data
const expense = ref(null);
const loading = ref(false);
const showApprovalDialog = ref(false);
const showRejectionDialog = ref(false);
const showPaymentDialog = ref(false);
const showSendDialog = ref(false);
const approvalAction = ref('approve');
const actionLoading = ref(false);

// Computed
const canApprove = computed(() => hasPermission('approve_expense'));
const canEdit = computed(() => hasPermission('change_expense') && ['draft', 'rejected'].includes(expense.value?.status));
const canDelete = computed(() => hasPermission('delete_expense') && expense.value?.status === 'draft');
const canRecordPayment = computed(() => hasPermission('record_payment') && expense.value?.status === 'approved');

const totalItems = computed(() => expense.value?.items?.length || 0);

const subtotal = computed(() => {
    if (!expense.value?.items) return 0;
    return expense.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!expense.value?.items) return 0;
    return expense.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

// Methods
const fetchExpense = async () => {
    loading.value = true;
    try {
        const response = await expenseService.getById(route.params.id);
        expense.value = response.data || response;
    } catch (error) {
        console.error('Error fetching expense:', error);
        showToast('error', 'Error', 'Failed to load expense');
        router.push('/finance/expenses');
    } finally {
        loading.value = false;
    }
};

const editExpense = () => {
    router.push(`/finance/expenses/${expense.value.id}/edit`);
};

const deleteExpense = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        await expenseService.delete(expense.value.id);
        showToast('success', 'Success', 'Expense deleted successfully');
        router.push('/finance/expenses');
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('error', 'Error', 'Failed to delete expense');
    }
};

const openApprovalDialog = () => {
    approvalAction.value = 'approve';
    showApprovalDialog.value = true;
};

const openRejectionDialog = () => {
    approvalAction.value = 'reject';
    showRejectionDialog.value = true;
};

const handleApprove = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.approve(expense.value.id, data);
        showToast('success', 'Success', 'Expense approved successfully');
        showApprovalDialog.value = false;
        await fetchExpense(); // Reload
    } catch (error) {
        console.error('Error approving expense:', error);
        showToast('error', 'Error', 'Failed to approve expense');
    } finally {
        actionLoading.value = false;
    }
};

const handleReject = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.reject(expense.value.id, data);
        showToast('success', 'Success', 'Expense rejected');
        showRejectionDialog.value = false;
        await fetchExpense(); // Reload
    } catch (error) {
        console.error('Error rejecting expense:', error);
        showToast('error', 'Error', 'Failed to reject expense');
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
        await expenseService.recordPayment(expense.value.id, data);
        showToast('success', 'Success', 'Payment recorded successfully');
        showPaymentDialog.value = false;
        await fetchExpense(); // Reload
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('error', 'Error', 'Failed to record payment');
    } finally {
        actionLoading.value = false;
    }
};

const openSendDialog = () => {
    showSendDialog.value = true;
};

const handleSendExpense = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.sendExpense(expense.value.id, data);
        showToast('success', 'Success', 'Expense report sent successfully');
        showSendDialog.value = false;
        await fetchExpense();
    } catch (error) {
        console.error('Error sending expense:', error);
        showToast('error', 'Error', 'Failed to send expense report');
    } finally {
        actionLoading.value = false;
    }
};

const handleScheduleExpense = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.scheduleExpense(expense.value.id, data);
        showToast('success', 'Success', 'Expense report scheduled successfully');
        showSendDialog.value = false;
        await fetchExpense();
    } catch (error) {
        console.error('Error scheduling expense:', error);
        showToast('error', 'Error', 'Failed to schedule expense report');
    } finally {
        actionLoading.value = false;
    }
};

const downloadPDF = async () => {
    try {
        showToast('info', 'Generating PDF', 'Please wait...');
        const response = await expenseService.downloadPDF(expense.value.id);
        
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-${expense.value.reference_no || expense.value.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const goBack = () => {
    router.push('/finance/expenses');
};

// Lifecycle
onMounted(() => {
    fetchExpense();
});
</script>

<template>
    <div class="expense-view-page">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <Spinner />
        </div>

        <!-- Content -->
        <div v-else-if="expense" class="space-y-6">
            <!-- Header -->
            <div class="bg-white border-b border-surface-200 px-6 py-4">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <Button 
                                icon="pi pi-arrow-left" 
                                class="p-button-text p-button-sm" 
                                @click="goBack"
                                v-tooltip.bottom="'Back to Expenses'"
                            />
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                Expense {{ expense.reference_no }}
                            </h1>
                            <DocumentStatusBadge 
                                :status="expense.status" 
                                documentType="expense"
                            />
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm ml-12">
                            Created {{ formatDate(expense.created_at) }}
                        </p>
                    </div>
                    <!-- Action Buttons -->
                    <div class="flex flex-wrap gap-2">
                        <PermissionButton 
                            v-if="canApprove && expense.status === 'pending'"
                            :permission="'approve_expense'"
                            label="Approve" 
                            icon="pi pi-check" 
                            @click="openApprovalDialog"
                            class="p-button-success"
                        />
                        <PermissionButton 
                            v-if="canApprove && expense.status === 'pending'"
                            :permission="'reject_expense'"
                            label="Reject" 
                            icon="pi pi-times" 
                            @click="openRejectionDialog"
                            class="p-button-danger"
                        />
                        <PermissionButton 
                            v-if="['approved', 'paid'].includes(expense.status)"
                            :permission="'send_expense_report'"
                            label="Send Report" 
                            icon="pi pi-send" 
                            @click="openSendDialog"
                            class="p-button-primary"
                        />
                        <PermissionButton 
                            v-if="canRecordPayment"
                            :permission="'record_expense_payment'"
                            label="Record Payment" 
                            icon="pi pi-money-bill" 
                            @click="openPaymentDialog"
                            class="p-button-success"
                        />
                        <PermissionButton 
                            :permission="'download_expense'"
                            label="Download PDF" 
                            icon="pi pi-file-pdf" 
                            @click="downloadPDF"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            v-if="canEdit"
                            :permission="'change_expense'"
                            label="Edit" 
                            icon="pi pi-pencil" 
                            @click="editExpense"
                            class="p-button-secondary"
                        />
                        <PermissionButton 
                            v-if="canDelete"
                            :permission="'delete_expense'"
                            label="Delete" 
                            icon="pi pi-trash" 
                            @click="deleteExpense"
                            class="p-button-danger p-button-outlined"
                        />
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Content (Left Column) -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Expense Details Card -->
                        <Card>
                            <template #title>Expense Details</template>
                            <template #content>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Category</label>
                                        <p class="font-semibold">{{ expense.category_name || 'N/A' }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Date</label>
                                        <p class="font-semibold">{{ formatDate(expense.date_added) }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Payment Method</label>
                                        <p class="font-semibold">{{ expense.payment_method || 'N/A' }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Total Amount</label>
                                        <p class="text-2xl font-bold text-primary">{{ formatCurrency(expense.total_amount) }}</p>
                                    </div>
                                    <div v-if="expense.expense_for_user" class="md:col-span-2">
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Expense For</label>
                                        <p class="font-semibold">{{ expense.expense_for_user }}</p>
                                    </div>
                                    <div v-if="expense.expense_note" class="md:col-span-2">
                                        <label class="text-sm text-surface-600 dark:text-surface-400">Notes</label>
                                        <p class="text-surface-700 dark:text-surface-300">{{ expense.expense_note }}</p>
                                    </div>
                                </div>

                                <!-- Flags -->
                                <div v-if="expense.is_refund || expense.is_recurring" class="mt-4 flex gap-2">
                                    <Tag v-if="expense.is_refund" value="Refund" severity="warning" />
                                    <Tag v-if="expense.is_recurring" value="Recurring" severity="info" />
                                </div>
                            </template>
                        </Card>

                        <!-- Line Items Card -->
                        <Card v-if="expense.items && expense.items.length > 0">
                            <template #title>Expense Items ({{ totalItems }})</template>
                            <template #content>
                                <DataTable :value="expense.items" responsiveLayout="scroll">
                                    <Column field="name" header="Item"></Column>
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
                                    <div class="w-64 space-y-2">
                                        <div class="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>{{ formatCurrency(subtotal) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Tax:</span>
                                            <span>{{ formatCurrency(taxTotal) }}</span>
                                        </div>
                                        <Divider />
                                        <div class="flex justify-between text-xl font-bold">
                                            <span>Total:</span>
                                            <span class="text-primary">{{ formatCurrency(expense.total_amount) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Payment History -->
                        <Card v-if="expense.payments && expense.payments.length > 0">
                            <template #title>Payment History</template>
                            <template #content>
                                <Timeline :value="expense.payments" align="left">
                                    <template #opposite="slotProps">
                                        <small class="text-surface-500">{{ formatDate(slotProps.item.payment_date) }}</small>
                                    </template>
                                    <template #content="slotProps">
                                        <div>
                                            <div class="font-semibold">{{ formatCurrency(slotProps.item.amount) }}</div>
                                            <div class="text-sm text-surface-600">
                                                {{ slotProps.item.payment_method }} 
                                                <span v-if="slotProps.item.reference">- {{ slotProps.item.reference }}</span>
                                            </div>
                                        </div>
                                    </template>
                                    <template #marker="slotProps">
                                        <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-1 shadow-sm" 
                                              :style="{ backgroundColor: 'var(--green-500)' }">
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
                                <div class="text-center py-4">
                                    <DocumentStatusBadge 
                                        :status="expense.status" 
                                        documentType="expense"
                                        class="text-lg"
                                    />
                                </div>
                            </template>
                        </Card>

                        <!-- Approval History -->
                        <Card v-if="expense.approval_history && expense.approval_history.length > 0">
                            <template #title>Approval History</template>
                            <template #content>
                                <Timeline :value="expense.approval_history" layout="vertical">
                                    <template #content="slotProps">
                                        <div class="space-y-1">
                                            <div class="font-semibold">{{ slotProps.item.action }}</div>
                                            <div class="text-sm text-surface-600">{{ slotProps.item.user }}</div>
                                            <div class="text-xs text-surface-500">{{ formatDate(slotProps.item.date) }}</div>
                                            <div v-if="slotProps.item.comments" class="text-sm italic text-surface-700 mt-2">
                                                "{{ slotProps.item.comments }}"
                                            </div>
                                        </div>
                                    </template>
                                    <template #marker="slotProps">
                                        <span class="flex w-6 h-6 items-center justify-center text-white rounded-full z-1" 
                                              :style="{ backgroundColor: slotProps.item.action === 'Approved' ? 'var(--green-500)' : 'var(--red-500)' }">
                                            <i :class="slotProps.item.action === 'Approved' ? 'pi pi-check' : 'pi pi-times'"></i>
                                        </span>
                                    </template>
                                </Timeline>
                            </template>
                        </Card>

                        <!-- Attachment -->
                        <Card v-if="expense.attach_document">
                            <template #title>Attachment</template>
                            <template #content>
                                <a :href="expense.attach_document" target="_blank" class="flex items-center gap-2 text-primary hover:underline">
                                    <i class="pi pi-paperclip"></i>
                                    <span>View Document</span>
                                </a>
                            </template>
                        </Card>

                        <!-- Recurring Info -->
                        <Card v-if="expense.is_recurring">
                            <template #title>Recurring Schedule</template>
                            <template #content>
                                <div class="space-y-2 text-sm">
                                    <div>
                                        <span class="text-surface-600">Frequency:</span>
                                        <span class="font-semibold ml-2">
                                            Every {{ expense.recurring_interval }} {{ expense.interval_type }}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-surface-600">Repetitions:</span>
                                        <span class="font-semibold ml-2">{{ expense.repetitions }}</span>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>
            </div>
        </div>

        <!-- Approval Dialog -->
        <ApprovalDialog 
            v-model:visible="showApprovalDialog"
            :document="expense"
            documentType="expense"
            action="approve"
            :loading="actionLoading"
            @approve="handleApprove"
        />

        <!-- Rejection Dialog -->
        <ApprovalDialog 
            v-model:visible="showRejectionDialog"
            :document="expense"
            documentType="expense"
            action="reject"
            :loading="actionLoading"
            @reject="handleReject"
        />

        <!-- Email Send Dialog -->
        <EmailSendDialog 
            v-model:visible="showSendDialog"
            :document="expense"
            documentType="expense"
            :loading="actionLoading"
            @send="handleSendExpense"
            @schedule="handleScheduleExpense"
        />

        <!-- Payment Dialog -->
        <PaymentRecordDialog 
            v-model:visible="showPaymentDialog"
            :document="expense"
            documentType="expense"
            :loading="actionLoading"
            @record-payment="handleRecordPayment"
        />
    </div>
</template>

<style scoped>
.expense-view-page {
    min-height: 100vh;
    background-color: #f8fafc;
}
</style>

