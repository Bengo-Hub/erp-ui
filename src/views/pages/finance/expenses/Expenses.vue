<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { useDocumentFilters } from '@/composables/finance/useDocumentFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { expenseService } from '@/services/finance/expenseService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Use shared filter composable
const { filters, currentPage, perPage, totalRecords, onPage, onFilter, getFilterParams } = useDocumentFilters();

// Data
const expenses = ref([]);
const loading = ref(false);
const selectedExpenses = ref([]);
const summary = ref({
    total_expenses: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    total_amount: 0,
    pending_amount: 0
});

// Dialogs
const showApprovalDialog = ref(false);
const showRejectionDialog = ref(false);
const showPaymentDialog = ref(false);
const selectedExpense = ref(null);
const approvalAction = ref('approve');
const actionLoading = ref(false);

// Computed
const canCreate = computed(() => hasPermission('add_expense'));
const canApprove = computed(() => hasPermission('approve_expense'));
const canEdit = computed(() => hasPermission('change_expense'));
const canDelete = computed(() => hasPermission('delete_expense'));

// Methods
const fetchExpenses = async () => {
    loading.value = true;
    try {
        const params = getFilterParams();
        const response = await expenseService.getAll(params);
        
        // Handle different response structures
        const data = response.data || response;
        expenses.value = data?.results || data || [];
        totalRecords.value = data?.count || expenses.value.length;
        
        console.log('✅ Expenses loaded:', expenses.value.length);
    } catch (error) {
        console.error('❌ Error fetching expenses:', error);
        showToast('error', 'Error', 'Failed to load expenses');
        expenses.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
};

const fetchSummary = async () => {
    try {
        const response = await expenseService.getExpenseSummary();
        if (response.data) {
            summary.value = response.data;
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
};

const createExpense = () => {
    router.push('/finance/expenses/create');
};

const viewExpense = (expense) => {
    router.push(`/finance/expenses/${expense.id}`);
};

const editExpense = (expense) => {
    router.push(`/finance/expenses/${expense.id}/edit`);
};

const openApprovalDialog = (expense) => {
    selectedExpense.value = expense;
    approvalAction.value = 'approve';
    showApprovalDialog.value = true;
};

const openRejectionDialog = (expense) => {
    selectedExpense.value = expense;
    approvalAction.value = 'reject';
    showRejectionDialog.value = true;
};

const handleApprove = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.approve(selectedExpense.value.id, data);
        showToast('success', 'Success', 'Expense approved successfully');
        showApprovalDialog.value = false;
        await Promise.all([fetchExpenses(), fetchSummary()]);
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
        await expenseService.reject(selectedExpense.value.id, data);
        showToast('success', 'Success', 'Expense rejected');
        showRejectionDialog.value = false;
        await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (error) {
        console.error('Error rejecting expense:', error);
        showToast('error', 'Error', 'Failed to reject expense');
    } finally {
        actionLoading.value = false;
    }
};

const openPaymentDialog = (expense) => {
    selectedExpense.value = expense;
    showPaymentDialog.value = true;
};

const handleRecordPayment = async (data) => {
    actionLoading.value = true;
    try {
        await expenseService.recordPayment(selectedExpense.value.id, data);
        showToast('success', 'Success', 'Payment recorded successfully');
        showPaymentDialog.value = false;
        await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('error', 'Error', 'Failed to record payment');
    } finally {
        actionLoading.value = false;
    }
};

const deleteExpense = async (expense) => {
    if (!confirm(`Are you sure you want to delete expense "${expense.reference_no}"?`)) return;

    try {
        await expenseService.delete(expense.id);
        showToast('success', 'Success', 'Expense deleted successfully');
        await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('error', 'Error', 'Failed to delete expense');
    }
};

const bulkApprove = async () => {
    if (selectedExpenses.value.length === 0) {
        showToast('warn', 'Warning', 'Please select expenses to approve');
        return;
    }

    if (!confirm(`Approve ${selectedExpenses.value.length} selected expense(s)?`)) return;

    try {
        const ids = selectedExpenses.value.map(e => e.id);
        await expenseService.bulkApprove(ids);
        showToast('success', 'Success', 'Expenses approved successfully');
        selectedExpenses.value = [];
        await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (error) {
        console.error('Error bulk approving:', error);
        showToast('error', 'Error', 'Failed to approve expenses');
    }
};

const bulkReject = async () => {
    if (selectedExpenses.value.length === 0) {
        showToast('warn', 'Warning', 'Please select expenses to reject');
        return;
    }

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
        const ids = selectedExpenses.value.map(e => e.id);
        await expenseService.bulkReject(ids, reason);
        showToast('success', 'Success', 'Expenses rejected');
        selectedExpenses.value = [];
        await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (error) {
        console.error('Error bulk rejecting:', error);
        showToast('error', 'Error', 'Failed to reject expenses');
    }
};

const exportExpenses = async () => {
    try {
        showToast('info', 'Exporting', 'Generating export file...');
        const response = await expenseService.exportExpenses(getFilterParams(), 'csv');
        
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        showToast('success', 'Success', 'Expenses exported successfully');
    } catch (error) {
        console.error('Error exporting expenses:', error);
        showToast('error', 'Error', 'Failed to export expenses');
    }
};

// Lifecycle
onMounted(() => {
    Promise.all([fetchExpenses(), fetchSummary()]);
});
</script>

<template>
    <div class="expenses-page">
        <!-- Page Header -->
        <div class="page-header bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-10">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Expenses</h1>
                    <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">Manage and track business expenses</p>
                </div>
                <div class="flex gap-2">
                    <Button 
                        v-if="selectedExpenses.length > 0 && canApprove"
                        label="Bulk Approve" 
                        icon="pi pi-check" 
                        @click="bulkApprove"
                        class="p-button-success"
                    />
                    <Button 
                        v-if="selectedExpenses.length > 0 && canApprove"
                        label="Bulk Reject" 
                        icon="pi pi-times" 
                        @click="bulkReject"
                        class="p-button-danger"
                    />
                    <Button 
                        label="Export" 
                        icon="pi pi-download" 
                        @click="exportExpenses"
                        class="p-button-secondary"
                    />
                    <Button 
                        v-if="canCreate"
                        label="New Expense" 
                        icon="pi pi-plus" 
                        @click="createExpense"
                        class="p-button-primary"
                    />
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card class="summary-card">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-surface-600 dark:text-surface-400 text-sm mb-2">Total Expenses</div>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ summary.total_expenses }}</div>
                        </div>
                        <div class="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                            <i class="pi pi-receipt text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-surface-600 dark:text-surface-400 text-sm mb-2">Pending Approval</div>
                            <div class="text-2xl font-bold text-orange-600">{{ summary.pending }}</div>
                        </div>
                        <div class="bg-orange-100 dark:bg-orange-900 rounded-full p-3">
                            <i class="pi pi-clock text-orange-600 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-surface-600 dark:text-surface-400 text-sm mb-2">Approved</div>
                            <div class="text-2xl font-bold text-green-600">{{ summary.approved }}</div>
                        </div>
                        <div class="bg-green-100 dark:bg-green-900 rounded-full p-3">
                            <i class="pi pi-check-circle text-green-600 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-surface-600 dark:text-surface-400 text-sm mb-2">Total Amount</div>
                            <div class="text-2xl font-bold text-primary">{{ formatCurrency(summary.total_amount) }}</div>
                        </div>
                        <div class="bg-primary-100 dark:bg-primary-900 rounded-full p-3">
                            <i class="pi pi-dollar text-primary text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Filters Section -->
        <div class="filters-section bg-white border-b border-surface-200 px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium mb-2">Status</label>
                    <Dropdown 
                        v-model="filters.status_filter"
                        :options="EXPENSE_STATUS_OPTIONS"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Status"
                        class="w-full"
                        @change="onFilter(fetchExpenses)"
                    />
                </div>

                <!-- Search -->
                <div>
                    <label class="block text-sm font-medium mb-2">Search</label>
                    <InputText 
                        v-model="filters.search"
                        placeholder="Search reference, category..."
                        class="w-full"
                        @input="onFilter(fetchExpenses)"
                    />
                </div>

                <!-- Date From -->
                <div>
                    <label class="block text-sm font-medium mb-2">From Date</label>
                    <Calendar 
                        v-model="filters.date_from"
                        dateFormat="dd/mm/yy"
                        :showIcon="true"
                        class="w-full"
                        @date-select="onFilter(fetchExpenses)"
                    />
                </div>

                <!-- Date To -->
                <div>
                    <label class="block text-sm font-medium mb-2">To Date</label>
                    <Calendar 
                        v-model="filters.date_to"
                        dateFormat="dd/mm/yy"
                        :showIcon="true"
                        class="w-full"
                        @date-select="onFilter(fetchExpenses)"
                    />
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content p-6">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <Spinner />
            </div>

            <!-- Data Table -->
            <Card v-else>
                <template #content>
                    <DataTable
                        v-model:selection="selectedExpenses"
                        :value="expenses"
                        :paginator="true"
                        :rows="perPage"
                        :totalRecords="totalRecords"
                        :loading="loading"
                        :lazy="true"
                        @page="onPage($event, fetchExpenses)"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
                        :rowsPerPageOptions="[25, 50, 100]"
                        dataKey="id"
                        stripedRows
                        responsiveLayout="scroll"
                        class="p-datatable-sm"
                    >
                        <template #empty>
                            <div class="text-center py-12">
                                <i class="pi pi-inbox text-4xl text-surface-400 mb-4"></i>
                                <h3 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No expenses found</h3>
                                <p class="text-surface-600 dark:text-surface-400 mb-4">Get started by creating your first expense</p>
                                <Button v-if="canCreate" icon="pi pi-plus" label="New Expense" @click="createExpense" />
                            </div>
                        </template>

                        <!-- Selection Column -->
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <!-- Reference Number -->
                        <Column field="reference_no" header="Reference #" sortable style="min-width: 150px">
                            <template #body="{ data }">
                                <span class="font-mono font-medium text-primary cursor-pointer hover:underline" @click="viewExpense(data)">
                                    {{ data.reference_no }}
                                </span>
                            </template>
                        </Column>

                        <!-- Category -->
                        <Column field="category_name" header="Category" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.category_name" severity="info" />
                            </template>
                        </Column>

                        <!-- Date -->
                        <Column field="date_added" header="Date" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.date_added) }}
                            </template>
                        </Column>

                        <!-- Amount -->
                        <Column field="total_amount" header="Amount" sortable>
                            <template #body="{ data }">
                                <span class="font-semibold">{{ formatCurrency(data.total_amount) }}</span>
                            </template>
                        </Column>

                        <!-- Status -->
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <DocumentStatusBadge :status="data.status" documentType="expense" />
                            </template>
                        </Column>

                        <!-- Flags -->
                        <Column header="Flags" style="min-width: 100px">
                            <template #body="{ data }">
                                <div class="flex gap-1">
                                    <Tag v-if="data.is_refund" value="Refund" severity="warning" class="text-xs" />
                                    <Tag v-if="data.is_recurring" value="Recurring" severity="info" class="text-xs" />
                                </div>
                            </template>
                        </Column>

                        <!-- Actions -->
                        <Column header="Actions" :exportable="false" style="min-width: 200px">
                            <template #body="{ data }">
                                <div class="flex gap-1">
                                    <Button 
                                        icon="pi pi-eye" 
                                        class="p-button-text p-button-sm" 
                                        @click="viewExpense(data)"
                                        v-tooltip.top="'View'"
                                    />
                                    <Button 
                                        v-if="canApprove && data.status === 'pending'"
                                        icon="pi pi-check" 
                                        class="p-button-text p-button-sm p-button-success" 
                                        @click="openApprovalDialog(data)"
                                        v-tooltip.top="'Approve'"
                                    />
                                    <Button 
                                        v-if="canApprove && data.status === 'pending'"
                                        icon="pi pi-times" 
                                        class="p-button-text p-button-sm p-button-danger" 
                                        @click="openRejectionDialog(data)"
                                        v-tooltip.top="'Reject'"
                                    />
                                    <Button 
                                        v-if="data.status === 'approved'"
                                        icon="pi pi-money-bill" 
                                        class="p-button-text p-button-sm p-button-primary" 
                                        @click="openPaymentDialog(data)"
                                        v-tooltip.top="'Record Payment'"
                                    />
                                    <Button 
                                        v-if="canEdit && ['draft', 'rejected'].includes(data.status)"
                                        icon="pi pi-pencil" 
                                        class="p-button-text p-button-sm" 
                                        @click="editExpense(data)"
                                        v-tooltip.top="'Edit'"
                                    />
                                    <Button 
                                        v-if="canDelete && data.status === 'draft'"
                                        icon="pi pi-trash" 
                                        class="p-button-text p-button-sm p-button-danger" 
                                        @click="deleteExpense(data)"
                                        v-tooltip.top="'Delete'"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- Approval Dialog -->
        <ApprovalDialog 
            v-model:visible="showApprovalDialog"
            :document="selectedExpense"
            documentType="expense"
            action="approve"
            :loading="actionLoading"
            @approve="handleApprove"
        />

        <!-- Rejection Dialog -->
        <ApprovalDialog 
            v-model:visible="showRejectionDialog"
            :document="selectedExpense"
            documentType="expense"
            action="reject"
            :loading="actionLoading"
            @reject="handleReject"
        />

        <!-- Payment Dialog -->
        <PaymentRecordDialog 
            v-model:visible="showPaymentDialog"
            :document="selectedExpense"
            documentType="expense"
            :loading="actionLoading"
            @record-payment="handleRecordPayment"
        />
    </div>
</template>

<style scoped>
.expenses-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.page-header {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.summary-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .page-header .flex {
        flex-direction: column;
        gap: 1rem;
    }
    
    .page-header .flex > div:last-child {
        width: 100%;
    }
    
    .summary-cards {
        grid-template-columns: 1fr;
    }
    
    .filters-section .grid {
        grid-template-columns: 1fr;
    }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    .expenses-page {
        background-color: #1e293b;
    }
}
</style>
