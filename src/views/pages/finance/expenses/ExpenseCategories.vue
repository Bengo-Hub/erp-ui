<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { expenseService } from '@/services/finance/expenseService';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Data
const expense_categories = ref([]);
const fromdate = ref('');
const todate = ref('');
const business = ref(null);
const perPage = ref(25);
const currentPage = ref(1);
const pageOptions = ref([
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
]);
const filter = ref('');
const isLoading = ref(false);

// Modal state
const modals = ref({
    'modal-add-category': false,
    'modal-edit-category': false
});

// Form data
const categoryForm = ref({
    name: '',
    description: ''
});
const editingCategory = ref(null);

// Computed
const filteredCategories = computed(() => {
    if (!filter.value) return expense_categories.value;

    const searchTerm = filter.value.toLowerCase();
    return expense_categories.value.filter((category) => {
        return category.name?.toLowerCase().includes(searchTerm) || category.description?.toLowerCase().includes(searchTerm);
    });
});

// Methods
const fetchCategories = async () => {
    isLoading.value = true;
    try {
        const params = {
            limit: perPage.value,
            offset: (currentPage.value - 1) * perPage.value,
            branch_code: business.value.branch_code,
            fromdate: fromdate.value,
            todate: todate.value
        };
        const response = await expenseService.getExpenseCategories(params);
        expense_categories.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        showToast('error', 'Failed to load expense categories');
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (page) => {
    currentPage.value = page.page + 1;
    fetchCategories();
};

const exportToCSV = () => {
    const csvRows = [];
    const headers = ['ID', 'Name', 'Description', 'Created Date'];
    csvRows.push(headers.join(','));

    expense_categories.value.forEach((category) => {
        const values = [category.id, category.name, category.description || '', category.created_at || ''];
        csvRows.push(values.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense-categories.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('success', 'Expense categories exported successfully');
};

const openAddCategoryModal = () => {
    categoryForm.value = { name: '', description: '' };
    editingCategory.value = null;
    modals.value['modal-add-category'] = true;
};

const openEditCategoryModal = (category) => {
    categoryForm.value = {
        name: category.name,
        description: category.description || ''
    };
    editingCategory.value = category;
    modals.value['modal-edit-category'] = true;
};

const closeAddCategoryModal = () => {
    modals.value['modal-add-category'] = false;
    categoryForm.value = { name: '', description: '' };
    editingCategory.value = null;
};

const closeEditCategoryModal = () => {
    modals.value['modal-edit-category'] = false;
    categoryForm.value = { name: '', description: '' };
    editingCategory.value = null;
};

const saveCategory = async () => {
    if (!categoryForm.value.name.trim()) {
        showToast('error', 'Category name is required');
        return;
    }

    try {
        if (editingCategory.value) {
            await expenseService.updateExpenseCategory(editingCategory.value.id, categoryForm.value);
            showToast('success', 'Expense category updated successfully!');
        } else {
            await expenseService.createExpenseCategory(categoryForm.value);
            showToast('success', 'Expense category created successfully!');
        }

        closeAddCategoryModal();
        closeEditCategoryModal();
        fetchCategories();
    } catch (error) {
        console.error('Error saving expense category:', error);
        showToast('error', 'Failed to save expense category');
    }
};

const deleteExpenseCategory = async (category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    try {
        await expenseService.deleteExpenseCategory(category.id);
        showToast('success', 'Expense category deleted successfully!');
        fetchCategories();
    } catch (error) {
        console.error('Error deleting expense category:', error);
        showToast('error', 'Failed to delete expense category');
    }
};

// Lifecycle
onMounted(() => {
    business.value = JSON.parse(sessionStorage.getItem('business') || '{}');
    fetchCategories();
});
</script>

<template>
    <div class="expense-categories-page">
        <!-- Filters Section -->
        <div class="filters-section bg-white border-b border-gray-200 px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Search Filter -->
                <div class="search-filter">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <InputText v-model="filter" placeholder="Search categories..." class="w-full" icon="pi pi-search" />
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
                    <Dropdown v-model="perPage" :options="pageOptions" optionLabel="label" optionValue="value" placeholder="Select" class="w-full" @change="fetchCategories" />
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
                    :value="filteredCategories"
                    :paginator="true"
                    :rows="perPage"
                    :totalRecords="expense_categories.length"
                    :loading="isLoading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
                    :rowsPerPageOptions="[25, 50, 100]"
                    @page="handlePageChange"
                    stripedRows
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                >
                    <!-- ID -->
                    <Column field="id" header="ID" sortable style="width: 80px">
                        <template #body="{ data }">
                            <span class="font-medium text-gray-600">#{{ data.id }}</span>
                        </template>
                    </Column>

                    <!-- Name -->
                    <Column field="name" header="Category Name" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold text-gray-900">{{ data.name }}</span>
                        </template>
                    </Column>

                    <!-- Description -->
                    <Column field="description" header="Description">
                        <template #body="{ data }">
                            <span class="text-gray-600 truncate max-w-xs block" :title="data.description">
                                {{ data.description || 'No description' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Created Date -->
                    <Column field="created_at" header="Created Date" sortable>
                        <template #body="{ data }">
                            <span class="text-gray-600">{{ formatDate(data.created_at) }}</span>
                        </template>
                    </Column>

                    <!-- Actions -->
                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning" @click="openEditCategoryModal(data)" v-tooltip.top="'Edit Category'" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="deleteExpenseCategory(data)" v-tooltip.top="'Delete Category'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Empty State -->
                <div v-if="!isLoading && filteredCategories.length === 0" class="text-center py-12">
                    <i class="pi pi-tags text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No expense categories found</h3>
                    <p class="text-gray-600 mb-4">Get started by creating your first expense category</p>
                    <Button icon="pi pi-plus" label="Add Category" class="p-button-primary" @click="openAddCategoryModal" />
                </div>
            </div>
        </div>

        <!-- Add Category Modal -->
        <Dialog v-model:visible="modals['modal-add-category']" modal header="Add New Expense Category" :style="{ width: '40rem' }" :closable="true" @hide="closeAddCategoryModal">
            <div class="space-y-4">
                <div class="field">
                    <label for="categoryName" class="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <InputText id="categoryName" v-model="categoryForm.name" placeholder="Enter category name" class="w-full" :class="{ 'p-invalid': !categoryForm.name.trim() }" />
                </div>

                <div class="field">
                    <label for="categoryDescription" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <Textarea id="categoryDescription" v-model="categoryForm.description" placeholder="Enter category description (optional)" class="w-full" rows="3" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeAddCategoryModal" />
                    <Button label="Save Category" class="p-button-primary" @click="saveCategory" :disabled="!categoryForm.name.trim()" />
                </div>
            </template>
        </Dialog>

        <!-- Edit Category Modal -->
        <Dialog v-model:visible="modals['modal-edit-category']" modal header="Edit Expense Category" :style="{ width: '40rem' }" :closable="true" @hide="closeEditCategoryModal">
            <div class="space-y-4">
                <div class="field">
                    <label for="editCategoryName" class="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <InputText id="editCategoryName" v-model="categoryForm.name" placeholder="Enter category name" class="w-full" :class="{ 'p-invalid': !categoryForm.name.trim() }" />
                </div>

                <div class="field">
                    <label for="editCategoryDescription" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <Textarea id="editCategoryDescription" v-model="categoryForm.description" placeholder="Enter category description (optional)" class="w-full" rows="3" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeEditCategoryModal" />
                    <Button label="Update Category" class="p-button-primary" @click="saveCategory" :disabled="!categoryForm.name.trim()" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.expense-categories-page {
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
    .expense-categories-page {
        background-color: #fffefe;
    }

    .page-header,
    .filters-section {
        background-color: #dee5e7;
        border-color: #f4eef3;
    }
}
</style>
