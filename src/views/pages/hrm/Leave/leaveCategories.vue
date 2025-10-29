<script setup>
import { useToast } from '@/composables/useToast';
import { leaveService } from '@/services/hrm/leaveService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const dt = ref();
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const categories = ref([]);
const totalRecords = ref(0);
const showAddDialog = ref(false);
const showDeleteDialog = ref(false);
const editingCategory = ref(null);

const categoryForm = ref({
    name: '',
    description: '',
    is_active: true
});

// Fetch categories
const fetchCategories = async () => {
    loading.value = true;
    try {
        const response = await leaveService.getCategories();
        categories.value = response.data.results;
        totalRecords.value = response.data.count;
    } catch (error) {
        console.error('Error fetching leave categories:', error);
        showToast('error', 'Error', 'Failed to fetch leave categories', 3000);
    } finally {
        loading.value = false;
    }
};

// Save category
const saveCategory = async () => {
    if (!categoryForm.value.name?.trim()) {
        showToast('warning', 'Warning', 'Category name is required', 3000);
        return;
    }
    
    saving.value = true;
    try {
        if (editingCategory.value) {
            await leaveService.updateCategory(editingCategory.value.id, categoryForm.value);
            showToast('success', 'Success', 'Category updated successfully', 3000);
        } else {
            await leaveService.createCategory(categoryForm.value);
            showToast('success', 'Success', 'Category created successfully', 3000);
        }
        closeDialog();
        fetchCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to save category', 3000);
    } finally {
        saving.value = false;
    }
};

// Delete category
const deleteCategory = async () => {
    deleting.value = true;
    try {
        await leaveService.deleteCategory(editingCategory.value.id);
        showToast('success', 'Success', 'Category deleted successfully', 3000);
        showDeleteDialog.value = false;
        fetchCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to delete category', 3000);
    } finally {
        deleting.value = false;
    }
};

// Edit category
const editCategory = (category) => {
    editingCategory.value = category;
    categoryForm.value = {
        name: category.name,
        description: category.description,
        is_active: category.is_active
    };
    showAddDialog.value = true;
};

// Confirm delete
const confirmDelete = (category) => {
    editingCategory.value = category;
    showDeleteDialog.value = true;
};

// Close dialog
const closeDialog = () => {
    showAddDialog.value = false;
    editingCategory.value = null;
    categoryForm.value = {
        name: '',
        description: '',
        is_active: true
    };
};

// Refresh data
const refreshData = () => {
    fetchCategories();
};

// Format date
// Get category severity
const getCategorySeverity = (name) => {
    switch (name) {
        case 'Annual Leave':
            return 'success';
        case 'Sick Leave':
            return 'warning';
        case 'Maternity Leave':
            return 'help';
        case 'Paternity Leave':
            return 'info';
        default:
            return null;
    }
};

// Initialize data
onMounted(() => {
    fetchCategories();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-primary text-white py-2 shadow-md">
            <div class="container mx-auto px-4">
                <h2 class="text-xl font-bold">Leave Categories</h2>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-6">
            <!-- Action Toolbar -->
            <Card class="mb-4">
                <template #content>
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex items-center space-x-4">
                            <span class="text-sm font-medium"> Total Categories: <Badge :value="totalRecords" severity="info" /> </span>
                        </div>

                        <div class="flex space-x-2">
                            <Button label="Add Category" icon="pi pi-plus" class="p-button-sm" @click="showAddDialog = true" />
                            <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm p-button-outlined" @click="refreshData" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Data Table -->
            <Card>
                <template #content>
                    <DataTable
                        ref="dt"
                        :value="categories"
                        :paginator="true"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 25, 50]"
                        :loading="loading"
                        dataKey="id"
                        responsiveLayout="scroll"
                        class="p-datatable-sm"
                        stripedRows
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    >
                        <Column field="name" header="Name" :sortable="true">
                            <template #body="{ data }">
                                <Tag :value="data.name" :severity="getCategorySeverity(data.name)" />
                            </template>
                        </Column>

                        <Column field="description" header="Description" :sortable="true">
                            <template #body="{ data }">
                                <span class="text-gray-600">{{ data.description || 'No description' }}</span>
                            </template>
                        </Column>

                        <Column field="is_active" header="Status" :sortable="true">
                            <template #body="{ data }">
                                <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                            </template>
                        </Column>

                        <Column field="created_at" header="Created At" :sortable="true">
                            <template #body="{ data }">
                                {{ formatDate(data.created_at) }}
                            </template>
                        </Column>

                        <Column header="Actions" :exportable="false" style="min-width: 8rem">
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm p-button-warning" @click="editCategory(data)" v-tooltip="'Edit category'" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDelete(data)" v-tooltip="'Delete category'" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Add/Edit Dialog -->
            <Dialog v-model:visible="showAddDialog" :header="editingCategory ? 'Edit Leave Category' : 'Add Leave Category'" :modal="true" :style="{ width: '50vw' }">
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <InputText v-model="categoryForm.name" class="w-full" placeholder="Enter category name" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Textarea v-model="categoryForm.description" class="w-full" rows="3" placeholder="Enter category description" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <InputSwitch v-model="categoryForm.is_active" />
                    </div>
                </div>

                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="closeDialog" />
                    <Button :label="editingCategory ? 'Update' : 'Save'" icon="pi pi-check" @click="saveCategory" :loading="saving" />
                </template>
            </Dialog>

            <!-- Delete Confirmation Dialog -->
            <Dialog v-model:visible="showDeleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '450px' }">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span>Are you sure you want to delete this category?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" class="p-button-text" @click="showDeleteDialog = false" />
                    <Button label="Yes" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteCategory" :loading="deleting" />
                </template>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
/* Responsive adjustments */
@media screen and (max-width: 960px) {
    :deep(.p-datatable) {
        font-size: 0.875rem;
    }

    :deep(.p-datatable .p-column-header-content) {
        flex-wrap: wrap;
    }

    :deep(.p-datatable .p-button) {
        padding: 0.25rem 0.5rem;
    }
}

/* Print styles */
@media print {
    .no-print {
        display: none !important;
    }

    :deep(.p-datatable) {
        font-size: 10pt !important;
    }
}
</style>
