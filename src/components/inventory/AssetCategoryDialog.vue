<template>
    <Dialog
        :visible="visible"
        :header="category.id ? 'Edit Category' : 'Add Category'"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-category-dialog"
        :style="{ width: '600px', maxWidth: '95vw' }"
        @hide="hide"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-green-100 p-2 rounded-lg">
                    <i class="pi pi-tag text-green-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        {{ category.id ? 'Edit Category' : 'Add Category' }}
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        {{ category.id ? 'Update category information' : 'Create a new asset category' }}
                    </p>
                </div>
            </div>
        </template>

        <div class="space-y-6">
            <!-- Basic Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-info-circle text-green-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Category Information</h4>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <!-- Category Name -->
                    <div class="space-y-2">
                        <label for="name" class="block text-sm font-medium text-gray-700">
                            Category Name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="name"
                            v-model="category.name"
                            :class="{ 'p-invalid': submitted && !category.name }"
                            placeholder="Enter category name"
                            class="w-full"
                            autofocus
                        />
                        <small v-if="submitted && !category.name" class="p-error block">Category name is required.</small>
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <label for="description" class="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            v-model="category.description"
                            rows="3"
                            placeholder="Enter category description"
                            class="w-full"
                        />
                    </div>

                    <!-- Active Status -->
                    <div class="space-y-2">
                        <label class="flex items-center space-x-3">
                            <Checkbox
                                id="is_active"
                                v-model="category.is_active"
                                :binary="true"
                            />
                            <span class="text-sm font-medium text-gray-700">Active</span>
                        </label>
                        <p class="text-xs text-gray-500">Inactive categories will not be available for new assets</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-end space-x-3 pt-6 border-t">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-text border-gray-300 text-gray-700 hover:bg-gray-50"
                    @click="hide"
                />
                <Button
                    :label="category.id ? 'Update Category' : 'Create Category'"
                    :icon="category.id ? 'pi pi-pencil' : 'pi pi-plus'"
                    class="p-button-primary bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                    @click="saveCategory"
                    :loading="saving"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import assetService from '@/services/assets/assetService';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    category: {
        type: Object,
        default: () => ({})
    }
});

// Emits
const emit = defineEmits(['hide', 'save']);

// Composables
const toast = useToast();

// Data
const category = ref({ ...props.category });
const submitted = ref(false);
const saving = ref(false);

// Methods
const saveCategory = async () => {
    submitted.value = true;

    // Basic validation
    if (!category.value.name) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields.',
            life: 3000
        });
        return;
    }

    saving.value = true;

    try {
        const categoryData = {
            ...category.value,
            is_active: category.value.is_active !== undefined ? category.value.is_active : true
        };

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

        emit('save', categoryData);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save category',
            life: 3000
        });
    } finally {
        saving.value = false;
    }
};

const hide = () => {
    emit('hide');
};

// Watch for prop changes
watch(() => props.category, (newCategory) => {
    category.value = { ...newCategory };
    submitted.value = false;
}, { deep: true });

watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        category.value = {};
        submitted.value = false;
    }
});
</script>

<style scoped>
/* Modern Dialog Styling */
.modern-category-dialog .p-dialog-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 8px 8px 0 0;
}

.modern-category-dialog .p-dialog-header .p-dialog-title {
    color: white;
    font-weight: 600;
}

/* Section Styling */
.bg-gray-50 {
    background-color: rgb(249 250 251);
}

.bg-green-100 {
    background-color: rgb(209 250 229);
}

/* Form Field Styling */
.field {
    margin-bottom: 1.5rem;
}

.field label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
    color: rgb(55 65 81);
}

.field .p-error {
    margin-top: 0.25rem;
    color: rgb(239 68 68);
    font-size: 0.875rem;
}

/* Section Headers */
h4 {
    margin: 0;
    font-weight: 600;
    color: rgb(17 24 39);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Icon Styling */
.w-6.h-6 {
    width: 1.5rem;
    height: 1.5rem;
}

.rounded-full {
    border-radius: 9999px;
}

.rounded-lg {
    border-radius: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modern-category-dialog {
        width: 95vw !important;
        margin: 2.5vw;
    }

    .grid {
        gap: 1rem;
    }
}

/* Custom scrollbar for dialog content */
.p-dialog-content::-webkit-scrollbar {
    width: 6px;
}

.p-dialog-content::-webkit-scrollbar-track {
    background: rgb(243 244 246);
    border-radius: 3px;
}

.p-dialog-content::-webkit-scrollbar-thumb {
    background: rgb(156 163 175);
    border-radius: 3px;
}

.p-dialog-content::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
}
</style>
