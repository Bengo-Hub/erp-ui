<script setup>
import AddExpense from '@/components/finance/expenses/AddExpense.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { expenseService } from '@/services/finance/expenseService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Data
const title = ref('Expenses');
const expenses = ref([]);
const filter = ref('');
const fromdate = ref('');
const todate = ref('');
const currentPage = ref(1);
const perPage = ref(25);
const pageOptions = ref([
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
]);
const totalRows = ref(0);
const isLoading = ref(false);
const modals = ref({
    'modal-expense': false,
    'modal-receipt': false
});

// Business context - get from session storage
const business = ref(JSON.parse(sessionStorage.getItem('business') || '{}'));

// Computed
const filteredExpenses = computed(() => {
    if (!filter.value) return expenses.value;

    const searchTerm = filter.value.toLowerCase();
    return expenses.value.filter((expense) => {
        return expense.reference_no?.toLowerCase().includes(searchTerm) || expense.category_name?.toLowerCase().includes(searchTerm) || expense.expense_note?.toLowerCase().includes(searchTerm);
    });
});

// Methods
const fetchExpenses = async () => {
    isLoading.value = true;
    try {
        const params = {
            limit: perPage.value,
            offset: (currentPage.value - 1) * perPage.value,
            branch_code: business.value.branch_code,
            fromdate: fromdate.value,
            todate: todate.value
        };
        const response = await expenseService.getExpenses(params);
        expenses.value = response.data.results || response.data || [];
        totalRows.value = response.data.count || expenses.value.length;
    } catch (error) {
        console.error('Error fetching expenses:', error);
        showToast('error', 'Failed to load expenses');
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (page) => {
    currentPage.value = page.page + 1;
    fetchExpenses();
};

const exportToCSV = () => {
    const csvRows = [];
    const headers = ['Ref No.', 'Category', 'Total Amount', 'Date Added', 'Note', 'Is Refund'];
    csvRows.push(headers.join(','));

    expenses.value.forEach((expense) => {
        const values = [expense.reference_no, expense.category_name, expense.total_amount, expense.date_added, expense.expense_note, expense.is_refund ? 'Yes' : 'No'];
        csvRows.push(values.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('success', 'Expenses exported successfully');
};

const deleteExpense = async (expense) => {
    if (!confirm(`Are you sure you want to delete expense "${expense.reference_no}"?`)) return;

    try {
        await expenseService.deleteExpense(expense.id);
        showToast('success', 'Expense deleted successfully!');
        fetchExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('error', 'Failed to delete expense');
    }
};

const openAddExpenseModal = () => {
    modals.value['modal-expense'] = true;
};

const closeAddExpenseModal = () => {
    modals.value['modal-expense'] = false;
    fetchExpenses(); // Refresh data after adding
};

const viewExpense = (_expense) => {
    showToast('info', 'View functionality coming soon');
};

const editExpense = (_expense) => {
    showToast('info', 'Edit functionality coming soon');
};

// Lifecycle
onMounted(() => {
    fetchExpenses();
});
</script>

<template>
    <div class="expenses-page">
        <!-- Filters Section -->
        <div class="filters-section bg-white border-b border-gray-200 px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Search Filter -->
                <div class="search-filter">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <InputText v-model="filter" placeholder="Search expenses..." class="w-full" icon="pi pi-search" />
                </div>

                <!-- Date Range Filters -->
                <div class="date-filter">
                    <label class="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <Calendar v-model="fromdate" placeholder="From Date" class="w-full" dateFormat="dd/mm/yy" />
                </div>

                <div class="date-filter">
                    <label class="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <Calendar v-model="todate" placeholder="To Date" class="w-full" dateFormat="dd/mm/yy" />
                </div>

                <!-- Items Per Page -->
                <div class="per-page-filter">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
                    <Dropdown v-model="perPage" :options="pageOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" @change="fetchExpenses" />
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content p-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center py-12">
                <Spinner />
            </div>

            <!-- Data Table -->
            <div v-else class="bg-white rounded-lg shadow">
                <DataTable
                    :value="filteredExpenses"
                    :paginator="true"
                    :rows="perPage"
                    :totalRecords="totalRows"
                    :loading="isLoading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
                    :rowsPerPageOptions="[25, 50, 100]"
                    @page="handlePageChange"
                    stripedRows
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                >
                    <!-- Reference Number -->
                    <Column field="reference_no" header="Reference No." sortable>
                        <template #body="{ data }">
                            <span class="font-medium text-blue-600">{{ data.reference_no }}</span>
                        </template>
                    </Column>

                    <!-- Category -->
                    <Column field="category_name" header="Category" sortable>
                        <template #body="{ data }">
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {{ data.category_name }}
                            </span>
                        </template>
                    </Column>

                    <!-- Total Amount -->
                    <Column field="total_amount" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold text-green-600">
                                {{ formatCurrency(data.total_amount) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Date Added -->
                    <Column field="date_added" header="Date Added" sortable>
                        <template #body="{ data }">
                            <span class="text-gray-600">{{ formatDate(data.date_added) }}</span>
                        </template>
                    </Column>

                    <!-- Note -->
                    <Column field="expense_note" header="Note">
                        <template #body="{ data }">
                            <span class="text-gray-700 truncate max-w-xs block" :title="data.expense_note">
                                {{ data.expense_note || 'No note' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Is Refund -->
                    <Column field="is_refund" header="Refund" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.is_refund ? 'Yes' : 'No'" :severity="data.is_refund ? 'warning' : 'success'" />
                        </template>
                    </Column>

                    <!-- Actions -->
                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button icon="pi pi-eye" class="p-button-text p-button-sm p-button-info" @click="viewExpense(data)" v-tooltip.top="'View Details'" />
                                <Button icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning" @click="editExpense(data)" v-tooltip.top="'Edit Expense'" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="deleteExpense(data)" v-tooltip.top="'Delete Expense'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Empty State -->
                <div v-if="!isLoading && filteredExpenses.length === 0" class="text-center py-12">
                    <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p class="text-gray-600 mb-4">Get started by adding your first expense</p>
                    <Button icon="pi pi-plus" label="Add Expense" class="p-button-primary" @click="openAddExpenseModal" />
                </div>
            </div>
        </div>

        <!-- Add Expense Modal -->
        <Dialog v-model:visible="modals['modal-expense']" modal header="Add New Expense" :style="{ width: '50rem' }" :closable="true" @hide="closeAddExpenseModal">
            <AddExpense @expense-added="closeAddExpenseModal" />
        </Dialog>
    </div>
</template>

<style scoped>
.expenses-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.page-header {
    position: sticky;
    top: 0;
    z-index: 10;
}

.filters-section {
    position: sticky;
    top: 80px;
    z-index: 9;
}

.main-content {
    min-height: calc(100vh - 200px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .page-header {
        padding: 1rem;
    }

    .filters-section {
        padding: 1rem;
    }

    .main-content {
        padding: 1rem;
    }

    .filters-section .grid {
        grid-template-columns: 1fr;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: light) {
    .expenses-page {
        background-color: #fffefe;
    }

    .page-header,
    .filters-section {
        background-color: #dee5e7;
        border-color: #f4eef3;
    }
}
</style>
