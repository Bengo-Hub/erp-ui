<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Modern Page Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                        <i class="pi pi-tags text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-1">Asset Categories</h1>
                        <p class="text-gray-600">Organize and manage your asset categories and classifications</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        class="p-button-outlined border-gray-300 text-gray-600 hover:bg-gray-50"
                        @click="loadCategories"
                        :loading="loading"
                    />
                    <Button
                        v-if="hasPermission('add_assetcategory')"
                        label="Add Category"
                        icon="pi pi-plus"
                        class="p-button-primary bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                        @click="openNew"
                    />
                </div>
            </div>
        </div>

        <!-- Categories Table Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
            <!-- Table Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="bg-green-100 p-2 rounded-lg">
                            <i class="pi pi-list text-green-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Category List</h3>
                            <p class="text-sm text-gray-500">{{ categories.length }} categories total</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <Button
                            icon="pi pi-refresh"
                            class="p-button-rounded p-button-secondary border-gray-300"
                            @click="loadCategories"
                            :loading="loading"
                        />
                    </div>
                </div>
            </div>

            <!-- Table Content -->
            <div class="p-6">
                <!-- Loading State -->
                <div v-if="loading" class="flex items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <span class="ml-4 text-gray-600">Loading categories...</span>
                </div>

                <!-- Empty State -->
                <div v-else-if="categories.length === 0" class="text-center py-12">
                    <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-tags text-gray-400 text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
                    <p class="text-gray-500 mb-6">Get started by creating your first asset category</p>
                    <Button
                        v-if="hasPermission('add_assetcategory')"
                        label="Add First Category"
                        icon="pi pi-plus"
                        class="p-button-primary bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                        @click="openNew"
                    />
                </div>

                <!-- Categories Grid -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="category in categories.filter(cat => cat && cat.id)"
                         :key="category.id"
                         class="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md hover:bg-white transition-all duration-200">

                        <!-- Category Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="bg-green-100 p-2 rounded-lg">
                                    <i class="pi pi-tag text-green-600 text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">{{ category.name }}</h4>
                                    <p class="text-sm text-gray-500">Category</p>
                                </div>
                            </div>
                            <Tag
                                :value="category.is_active ? 'Active' : 'Inactive'"
                                :severity="category.is_active ? 'success' : 'danger'"
                                class="text-xs"
                            />
                        </div>

                        <!-- Category Description -->
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                            {{ category.description || 'No description provided' }}
                        </p>

                        <!-- Category Meta -->
                        <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>Created {{ formatDate(category.created_at) }}</span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center justify-between">
                            <div class="flex space-x-2">
                                <Button
                                    icon="pi pi-pencil"
                                    class="p-button-rounded p-button-success p-button-text p-button-sm"
                                    @click="editCategory(category)"
                                    v-tooltip="'Edit Category'"
                                />
                                <Button
                                    :icon="category.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                    class="p-button-rounded p-button-warning p-button-text p-button-sm"
                                    @click="toggleCategoryStatus(category)"
                                    v-tooltip="category.is_active ? 'Deactivate' : 'Activate'"
                                />
                            </div>
                            <Button
                                v-if="hasPermission('delete_assetcategory')"
                                icon="pi pi-trash"
                                class="p-button-rounded p-button-danger p-button-text p-button-sm"
                                @click="confirmDeleteCategory(category)"
                                v-tooltip="'Delete Category'"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <!-- Total Categories -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Total Categories</p>
                        <p class="text-2xl font-bold text-gray-900">{{ (categories || []).length }}</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="pi pi-tags text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Active Categories -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Active Categories</p>
                        <p class="text-2xl font-bold text-gray-900">{{ (categories || []).filter(c => c && c.is_active).length }}</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="pi pi-check-circle text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Inactive Categories -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Inactive Categories</p>
                        <p class="text-2xl font-bold text-gray-900">{{ (categories || []).filter(c => c && !c.is_active).length }}</p>
                    </div>
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="pi pi-eye-slash text-orange-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Recently Added -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Recently Added</p>
                        <p class="text-2xl font-bold text-gray-900">{{ getRecentCategoriesCount() }}</p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="pi pi-clock text-purple-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Category Dialog -->
    <AssetCategoryDialog
        :visible="categoryDialog"
        :category="category"
        @hide="hideDialog"
        @save="saveCategory"
    />

    <!-- Toast and Confirm Dialog -->
    <Toast />
    <ConfirmDialog />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import AssetCategoryDialog from '@/components/inventory/AssetCategoryDialog.vue';
import assetService from '@/services/assets/assetService';
import { formatCurrency, formatDate } from '@/utils/formatters';

// Composables
const toast = useToast();
const confirm = useConfirm();

// Data
const categories = ref([]);
const loading = ref(false);

const categoryDialog = ref(false);
const category = ref({});
const submitted = ref(false);

// Computed
const getRecentCategoriesCount = () => {
    if (!categories.value || !Array.isArray(categories.value)) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return categories.value.filter(cat => {
        if (!cat || !cat.created_at) return false;
        const createdDate = new Date(cat.created_at);
        return createdDate >= sevenDaysAgo;
    }).length;
};

// Methods
const loadCategories = async () => {
    loading.value = true;
    try {
        const response = await assetService.getCategories();

        // Handle new paginated response format
        if (response.data) {
            // New format: { data: [...], count: number, next: url, previous: url, totalPages: number }
            categories.value = response.data;
        } else {
            // Fallback for non-paginated responses
            categories.value = response;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categories.value = []; // Set empty array on error to prevent null reference
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load categories',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const openNew = () => {
    category.value = {};
    submitted.value = false;
    categoryDialog.value = true;
    console.log('Opening category dialog for new category');
};

const editCategory = (categoryData) => {
    category.value = { ...categoryData };
    categoryDialog.value = true;
    console.log('Opening category dialog for editing', categoryData);
};

const saveCategory = async (categoryData) => {
    try {
        if (categoryData.id) {
            await assetService.updateCategory(categoryData.id, categoryData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Category updated successfully',
                life: 3000
            });
        } else {
            await assetService.createCategory(categoryData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Category created successfully',
                life: 3000
            });
        }
        categoryDialog.value = false;
        loadCategories();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save category',
            life: 3000
        });
    }
};

const toggleCategoryStatus = async (categoryData) => {
    try {
        await assetService.updateCategory(categoryData.id, {
            is_active: !categoryData.is_active
        });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Category ${categoryData.is_active ? 'deactivated' : 'activated'} successfully`,
            life: 3000
        });
        loadCategories();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update category status',
            life: 3000
        });
    }
};

const confirmDeleteCategory = (categoryData) => {
    confirm.require({
        message: 'Are you sure you want to delete this category? This action cannot be undone.',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteCategory(categoryData)
    });
};

const deleteCategory = async (categoryData) => {
    try {
        await assetService.deleteCategory(categoryData.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Category deleted successfully',
            life: 3000
        });
        loadCategories();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete category',
            life: 3000
        });
    }
};

const hasPermission = (permission) => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.permissions?.includes(permission) || false;
};

const hideDialog = () => {
    categoryDialog.value = false;
    submitted.value = false;
};

// Lifecycle
onMounted(() => {
    loadCategories();
});
</script>

<style scoped>
/* Line clamp utility */
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3; /* Standard property for compatibility */
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Smooth transitions */
* {
    transition: all 0.2s ease-in-out;
}

/* Hover effects */
.bg-gray-50:hover {
    transform: translateY(-1px);
}

/* Loading animation */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
