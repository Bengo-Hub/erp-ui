<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatDate } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, watch } from 'vue';

// Composables
const { showToast } = useToast();
const confirm = useConfirm();

// Reactive data
const loading = ref(false);
const categoriesLoading = ref(false);
const saving = ref(false);
const savingCategory = ref(false);
const selectedCategory = ref(null);
const selectedStatus = ref(null);
const searchQuery = ref('');
const showTaxForm = ref(false);
const showCategoryForm = ref(false);
const dialogMode = ref('add');
const categoryDialogMode = ref('add');
const activeTab = ref(0);

const summary = reactive({
    total_taxes: 0,
    active_taxes: 0,
    total_categories: 0,
    compliance_score: 0
});

const taxRates = ref([]);
const categories = ref([]);

// Forms
const taxForm = reactive({
    name: '',
    code: '',
    category: '',
    rate: 0,
    rate_type: 'percentage',
    effective_date: null,
    expiry_date: null,
    status: 'active',
    description: ''
});

const categoryForm = reactive({
    name: '',
    description: '',
    color: '#6B7280'
});

// Filters
const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Options
const categoryOptions = [
    { label: 'All Categories', value: null },
    { label: 'VAT', value: 'vat' },
    { label: 'Income Tax', value: 'income_tax' },
    { label: 'Withholding Tax', value: 'withholding_tax' },
    { label: 'Excise Duty', value: 'excise_duty' },
    { label: 'Import Duty', value: 'import_duty' },
    { label: 'Other', value: 'other' }
];

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Expired', value: 'expired' }
];

const rateTypeOptions = [
    { label: 'Percentage', value: 'percentage' },
    { label: 'Fixed Amount', value: 'fixed' }
];

const colorOptions = ['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];

// Methods
const loadData = async () => {
    loading.value = true;

    try {
        const params = {
            category: selectedCategory.value,
            status: selectedStatus.value,
            search: searchQuery.value
        };

        const response = await financeService.getTaxRates(params);
        taxRates.value = response.data.results || [];
        calculateSummary();
    } catch (err) {
        console.error('Error loading tax rates:', err);
        showToast('error', 'Failed to load tax rates');
    } finally {
        loading.value = false;
    }
};

const loadCategories = async () => {
    categoriesLoading.value = true;

    try {
        const response = await financeService.getTaxCategories();
        categories.value = response.data.results || [];
    } catch (err) {
        console.error('Error loading categories:', err);
        showToast('error', 'Failed to load categories');
    } finally {
        categoriesLoading.value = false;
    }
};

const calculateSummary = () => {
    const taxes = taxRates.value;
    summary.total_taxes = taxes.length;
    summary.active_taxes = taxes.filter((t) => t.status === 'active').length;
    summary.total_categories = categories.value.length;
    summary.compliance_score = summary.total_taxes > 0 ? Math.round((summary.active_taxes / summary.total_taxes) * 100) : 0;
};

const onCategoryChange = () => {
    loadData();
};

const onStatusChange = () => {
    loadData();
};

const onSearchInput = () => {
    loadData();
};

const clearFilters = () => {
    selectedCategory.value = null;
    selectedStatus.value = null;
    searchQuery.value = '';
    filters.global.value = null;
    loadData();
};

const openNewTax = () => {
    dialogMode.value = 'add';
    resetTaxForm();
    showTaxForm.value = true;
};

const editTax = (tax) => {
    dialogMode.value = 'edit';
    Object.assign(taxForm, tax);
    showTaxForm.value = true;
};

const viewTax = (tax) => {
    showToast('info', `Viewing tax: ${tax.name}`);
};

const deleteTax = (tax) => {
    confirm.require({
        message: `Are you sure you want to delete tax "${tax.name}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await financeService.deleteTaxRate(tax.id);
                showToast('success', 'Tax rate deleted successfully');
                loadData();
            } catch (err) {
                console.error('Error deleting tax rate:', err);
                showToast('error', 'Failed to delete tax rate');
            }
        }
    });
};

const saveTax = async () => {
    saving.value = true;

    try {
        if (dialogMode.value === 'add') {
            await financeService.createTaxRate(taxForm);
            showToast('success', 'Tax rate created successfully');
        } else {
            await financeService.updateTaxRate(taxForm.id, taxForm);
            showToast('success', 'Tax rate updated successfully');
        }

        closeTaxForm();
        loadData();
    } catch (err) {
        console.error('Error saving tax rate:', err);
        showToast('error', 'Failed to save tax rate');
    } finally {
        saving.value = false;
    }
};

const closeTaxForm = () => {
    showTaxForm.value = false;
    resetTaxForm();
};

const resetTaxForm = () => {
    Object.assign(taxForm, {
        name: '',
        code: '',
        category: '',
        rate: 0,
        rate_type: 'percentage',
        effective_date: null,
        expiry_date: null,
        status: 'active',
        description: ''
    });
};

const openNewCategory = () => {
    categoryDialogMode.value = 'add';
    resetCategoryForm();
    showCategoryForm.value = true;
};

const editCategory = (category) => {
    categoryDialogMode.value = 'edit';
    Object.assign(categoryForm, category);
    showCategoryForm.value = true;
};

const deleteCategory = (category) => {
    confirm.require({
        message: `Are you sure you want to delete category "${category.name}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await financeService.deleteTaxCategory(category.id);
                showToast('success', 'Category deleted successfully');
                loadCategories();
            } catch (err) {
                console.error('Error deleting category:', err);
                showToast('error', 'Failed to delete category');
            }
        }
    });
};

const saveCategory = async () => {
    savingCategory.value = true;

    try {
        if (categoryDialogMode.value === 'add') {
            await financeService.createTaxCategory(categoryForm);
            showToast('success', 'Category created successfully');
        }

        closeCategoryForm();
        loadCategories();
    } catch (err) {
        console.error('Error saving category:', err);
        showToast('error', 'Failed to save category');
    } finally {
        savingCategory.value = false;
    }
};

const closeCategoryForm = () => {
    showCategoryForm.value = false;
    resetCategoryForm();
};

const resetCategoryForm = () => {
    Object.assign(categoryForm, {
        name: '',
        description: '',
        color: '#6B7280'
    });
};

const getCategoryLabel = (category) => {
    const option = categoryOptions.find((opt) => opt.value === category);
    return option ? option.label : category;
};

const getCategorySeverity = (category) => {
    const severityMap = {
        vat: 'primary',
        income_tax: 'warning',
        withholding_tax: 'info',
        excise_duty: 'danger',
        import_duty: 'secondary',
        other: 'help'
    };
    return severityMap[category] || 'info';
};

const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
};

const getStatusSeverity = (status) => {
    const severityMap = {
        active: 'success',
        inactive: 'secondary',
        expired: 'danger'
    };
    return severityMap[status] || 'info';
};

// Lifecycle
onMounted(async () => {
    await loadData();
    await loadCategories();
});

// Watch for changes
watch([selectedCategory, selectedStatus, searchQuery], () => {
    loadData();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Header Section -->
        <div class="mb-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <i class="pi pi-percentage text-blue-600"></i>
                        Tax Management
                    </h1>
                    <p class="text-gray-600 mt-2">Manage tax rates, categories, and compliance requirements</p>
                </div>
                <div class="flex flex-wrap gap-3">
                    <Button icon="pi pi-plus" label="Add Tax Rate" severity="success" @click="openNewTax" class="flex-1 lg:flex-none" />
                    <Button icon="pi pi-refresh" label="Refresh" severity="secondary" outlined :loading="loading" @click="loadData" class="flex-1 lg:flex-none" />
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="pi pi-percentage text-blue-600 text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600">Total Tax Rates</p>
                            <p class="text-2xl font-bold text-blue-600">{{ summary.total_taxes || 0 }}</p>
                            <p class="text-xs text-gray-500">Active tax rates</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="pi pi-check-circle text-green-600 text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600">Active Rates</p>
                            <p class="text-2xl font-bold text-green-600">{{ summary.active_taxes || 0 }}</p>
                            <p class="text-xs text-gray-500">Currently in effect</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="pi pi-tags text-purple-600 text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600">Categories</p>
                            <p class="text-2xl font-bold text-purple-600">{{ summary.total_categories || 0 }}</p>
                            <p class="text-xs text-gray-500">Tax categories</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i class="pi pi-shield text-orange-600 text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600">Compliance</p>
                            <p class="text-2xl font-bold text-orange-600">{{ summary.compliance_score || 0 }}%</p>
                            <p class="text-xs text-gray-500">Up to date</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Main Content -->
        <div class="space-y-6">
            <!-- Filters Section -->
            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Tax Category</label>
                            <Dropdown v-model="selectedCategory" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="All Categories" class="w-full" @change="onCategoryChange" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Status</label>
                            <Dropdown v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-full" @change="onStatusChange" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Search</label>
                            <InputText v-model="searchQuery" placeholder="Search tax rates..." class="w-full" @input="onSearchInput" />
                        </div>

                        <div class="flex gap-2">
                            <Button icon="pi pi-search" label="Apply" :loading="loading" @click="loadData" class="flex-1" />
                            <Button icon="pi pi-times" label="Clear" severity="secondary" outlined @click="clearFilters" class="flex-1" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Tab Navigation -->
            <Card class="shadow-sm border-0">
                <template #content>
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8">
                            <button
                                @click="activeTab = 0"
                                :class="[activeTab === 0 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm']"
                            >
                                <i class="pi pi-table mr-2"></i>
                                Tax Rates
                                <Badge :value="taxRates.length" severity="info" class="ml-2" />
                            </button>
                            <button
                                @click="activeTab = 1"
                                :class="[activeTab === 1 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm']"
                            >
                                <i class="pi pi-tags mr-2"></i>
                                Categories
                                <Badge :value="categories.length" severity="info" class="ml-2" />
                            </button>
                        </nav>
                    </div>

                    <!-- Tax Rates Tab -->
                    <div v-if="activeTab === 0" class="mt-6">
                        <DataTable
                            :value="taxRates"
                            :loading="loading"
                            dataKey="id"
                            class="w-full"
                            stripedRows
                            showGridlines
                            responsiveLayout="scroll"
                            :paginator="true"
                            :rows="20"
                            :rowsPerPageOptions="[10, 20, 50, 100]"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            :filters="filters"
                            filterDisplay="menu"
                            :globalFilterFields="['name', 'code', 'category', 'description']"
                        >
                            <template #header>
                                <div class="flex justify-between items-center">
                                    <div class="flex-1 max-w-md">
                                        <span class="p-input-icon-left w-full">
                                            <i class="pi pi-search" />
                                            <InputText v-model="filters['global'].value" placeholder="Search tax rates..." class="w-full" />
                                        </span>
                                    </div>
                                </div>
                            </template>

                            <Column field="name" header="Tax Name" sortable>
                                <template #body="{ data }">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <i class="pi pi-percentage text-purple-600"></i>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="font-medium text-gray-900">{{ data.name }}</span>
                                            <span class="text-sm text-gray-500">{{ data.code }}</span>
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <Column field="category" header="Category" sortable>
                                <template #body="{ data }">
                                    <Tag :value="getCategoryLabel(data.category)" :severity="getCategorySeverity(data.category)" />
                                </template>
                            </Column>

                            <Column field="rate" header="Rate" sortable>
                                <template #body="{ data }">
                                    <div class="flex flex-col">
                                        <span class="font-bold text-lg text-purple-600">{{ data.rate }}%</span>
                                        <span class="text-sm text-gray-500">
                                            {{ data.rate_type === 'percentage' ? 'Percentage' : 'Fixed' }}
                                        </span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="effective_date" header="Effective Date" sortable>
                                <template #body="{ data }">
                                    <div class="flex flex-col">
                                        <span class="text-gray-900">{{ formatDate(data.effective_date) }}</span>
                                        <span v-if="data.expiry_date" class="text-sm text-gray-500"> Expires: {{ formatDate(data.expiry_date) }} </span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="status" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>

                            <Column field="description" header="Description">
                                <template #body="{ data }">
                                    <div class="max-w-xs truncate">
                                        {{ data.description || 'No description' }}
                                    </div>
                                </template>
                            </Column>

                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <div class="flex gap-1">
                                        <Button icon="pi pi-eye" severity="info" text rounded @click="viewTax(data)" />
                                        <Button icon="pi pi-pencil" severity="warning" text rounded @click="editTax(data)" />
                                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteTax(data)" />
                                    </div>
                                </template>
                            </Column>

                            <template #empty>
                                <div class="flex flex-col items-center justify-center py-8">
                                    <i class="pi pi-percentage text-gray-400 text-4xl mb-4"></i>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No tax rates found</h3>
                                    <p class="text-gray-600 mb-4">Add your first tax rate to get started</p>
                                    <Button icon="pi pi-plus" label="Add Tax Rate" @click="openNewTax" />
                                </div>
                            </template>
                        </DataTable>
                    </div>

                    <!-- Categories Tab -->
                    <div v-if="activeTab === 1" class="mt-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Tax Categories</h3>
                            <Button icon="pi pi-plus" label="Add Category" size="small" severity="success" outlined @click="openNewCategory" />
                        </div>

                        <DataTable :value="categories" :loading="categoriesLoading" dataKey="id" class="w-full" stripedRows showGridlines responsiveLayout="scroll">
                            <Column field="name" header="Category Name">
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full" :style="{ backgroundColor: data.color || '#6B7280' }"></div>
                                        <span class="font-medium">{{ data.name }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="description" header="Description">
                                <template #body="{ data }">
                                    <div class="max-w-xs truncate">
                                        {{ data.description || 'No description' }}
                                    </div>
                                </template>
                            </Column>

                            <Column field="tax_count" header="Tax Rates">
                                <template #body="{ data }">
                                    <Badge :value="data.tax_count || 0" severity="info" />
                                </template>
                            </Column>

                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <div class="flex gap-1">
                                        <Button icon="pi pi-pencil" severity="warning" text rounded @click="editCategory(data)" />
                                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteCategory(data)" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Tax Form Dialog -->
        <Dialog v-model:visible="showTaxForm" :header="dialogMode === 'add' ? 'Add Tax Rate' : 'Edit Tax Rate'" modal class="p-fluid" :style="{ width: '50rem' }">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label for="name" class="block text-sm font-medium text-gray-700">Tax Name</label>
                    <InputText id="name" v-model="taxForm.name" required autofocus class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="code" class="block text-sm font-medium text-gray-700">Tax Code</label>
                    <InputText id="code" v-model="taxForm.code" required class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
                    <Dropdown id="category" v-model="taxForm.category" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="Select Category" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="rate" class="block text-sm font-medium text-gray-700">Rate (%)</label>
                    <InputNumber id="rate" v-model="taxForm.rate" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="rate_type" class="block text-sm font-medium text-gray-700">Rate Type</label>
                    <Dropdown id="rate_type" v-model="taxForm.rate_type" :options="rateTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Rate Type" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="effective_date" class="block text-sm font-medium text-gray-700">Effective Date</label>
                    <Calendar id="effective_date" v-model="taxForm.effective_date" required class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="expiry_date" class="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <Calendar id="expiry_date" v-model="taxForm.expiry_date" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
                    <Dropdown id="status" v-model="taxForm.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-full" />
                </div>

                <div class="space-y-2 md:col-span-2">
                    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea id="description" v-model="taxForm.description" rows="3" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeTaxForm" />
                <Button label="Save" icon="pi pi-check" @click="saveTax" :loading="saving" />
            </template>
        </Dialog>

        <!-- Category Form Dialog -->
        <Dialog v-model:visible="showCategoryForm" :header="categoryDialogMode === 'add' ? 'Add Category' : 'Edit Category'" modal class="p-fluid" :style="{ width: '40rem' }">
            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="category_name" class="block text-sm font-medium text-gray-700">Category Name</label>
                    <InputText id="category_name" v-model="categoryForm.name" required autofocus class="w-full" />
                </div>

                <div class="space-y-2">
                    <label for="category_description" class="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea id="category_description" v-model="categoryForm.description" rows="3" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Color</label>
                    <div class="flex flex-wrap gap-2">
                        <div
                            v-for="color in colorOptions"
                            :key="color"
                            class="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 transition-all hover:scale-110"
                            :class="{ 'border-gray-800 scale-110': categoryForm.color === color }"
                            :style="{ backgroundColor: color }"
                            @click="categoryForm.color = color"
                        ></div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeCategoryForm" />
                <Button label="Save" icon="pi pi-check" @click="saveCategory" :loading="savingCategory" />
            </template>
        </Dialog>

        <!-- Confirmation Dialog -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
/* Custom styles for better responsiveness */
@media (max-width: 768px) {
    .p-datatable {
        font-size: 0.875rem;
    }

    .p-datatable .p-datatable-thead > tr > th {
        padding: 0.5rem;
    }

    .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.5rem;
    }
}
</style>
