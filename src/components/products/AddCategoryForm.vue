<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const props = defineProps({
    // Parent category for creating subcategories (hierarchical support)
    parentCategory: {
        type: Object,
        default: null
    },
    // For editing existing category
    category: {
        type: Object,
        default: null
    },
    isEdit: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['saved', 'cancel']);

const toast = useToast();

// Form data - matches backend Category model
const formData = ref({
    name: '',
    parent: null,  // Parent category ID for hierarchy
    status: 'active',  // Backend uses string 'active'/'inactive'
    order: 0,  // Display order within same level
    display_image: null
});

const imagePreview = ref(null);
const uploadError = ref(null);
const loading = ref(false);
const parentCategories = ref([]);  // Available parent categories
const loadingParents = ref(false);

// Status options matching backend choices
const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]);

// Computed - category type/level display
const categoryLevel = computed(() => {
    if (formData.value.parent) {
        const parent = parentCategories.value.find(c => c.id === formData.value.parent);
        if (parent) {
            return (parent.level || 0) + 1;
        }
        return 1;
    }
    return 0;
});

const categoryLevelLabel = computed(() => {
    switch (categoryLevel.value) {
        case 0: return 'Root Category';
        case 1: return 'Main Category';
        case 2: return 'Subcategory';
        default: return `Level ${categoryLevel.value} Category`;
    }
});

// Load parent categories for dropdown
const loadParentCategories = async () => {
    try {
        loadingParents.value = true;
        const response = await ecommerceService.getCategories({ page_size: 500 });
        const data = response.data?.results || response.data || [];
        // Flatten and filter to show only potential parents
        parentCategories.value = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            level: cat.level || 0,
            displayName: cat.level > 0 ? `${'  '.repeat(cat.level)}${cat.name}` : cat.name
        }));
    } catch (error) {
        console.error('Error loading parent categories:', error);
    } finally {
        loadingParents.value = false;
    }
};

// Methods
const saveItem = async () => {
    if (!formData.value.name) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    try {
        loading.value = true;

        // Create form data for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.value.name);
        formDataToSend.append('status', formData.value.status);
        formDataToSend.append('order', formData.value.order || 0);

        // Add parent if selected (for subcategories)
        if (formData.value.parent) {
            formDataToSend.append('parent', formData.value.parent);
        }

        // Add image if uploaded
        if (formData.value.display_image instanceof File) {
            formDataToSend.append('display_image', formData.value.display_image);
        }

        let response;
        if (props.isEdit && props.category?.id) {
            response = await ecommerceService.updateCategory(props.category.id, formDataToSend);
        } else {
            response = await ecommerceService.createCategory(formDataToSend);
        }

        emit('saved', response.data);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Category ${props.isEdit ? 'updated' : 'created'} successfully`,
            life: 3000
        });
    } catch (error) {
        console.error('Error saving category:', error);
        const errorMsg = error.response?.data?.detail || error.response?.data?.message || `Failed to ${props.isEdit ? 'update' : 'create'} category`;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const onImageSelect = (event) => {
    const file = event.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
        uploadError.value = 'Only image files are allowed';
        return;
    }

    // Validate file size (2MB max)
    if (file.size > 2000000) {
        uploadError.value = 'File size must be less than 2MB';
        return;
    }

    uploadError.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
        formData.value.display_image = file;
    };
    reader.readAsDataURL(file);
};

const clearImage = () => {
    imagePreview.value = null;
    formData.value.display_image = null;
};

// Initialize form when editing
const initForm = () => {
    if (props.isEdit && props.category) {
        formData.value = {
            name: props.category.name || '',
            parent: props.category.parent || null,
            status: props.category.status || 'active',
            order: props.category.order || 0,
            display_image: null  // Will be handled separately
        };
        if (props.category.display_image) {
            imagePreview.value = props.category.display_image;
        }
    } else if (props.parentCategory) {
        // Creating a subcategory
        formData.value.parent = props.parentCategory.id;
    }
};

// Watch for category prop changes
watch(() => props.category, () => {
    initForm();
}, { immediate: true });

watch(() => props.parentCategory, () => {
    if (props.parentCategory) {
        formData.value.parent = props.parentCategory.id;
    }
});

onMounted(() => {
    loadParentCategories();
    initForm();
});
</script>

<template>
    <div class="category-form">
        <div class="grid grid-cols-1 gap-4">
            <!-- Name Field -->
            <div class="field">
                <label for="name" class="block mb-2 font-medium">Category Name <span class="text-red-500">*</span></label>
                <InputText
                    id="name"
                    v-model="formData.name"
                    class="w-full"
                    placeholder="Enter category name"
                    required
                />
            </div>

            <!-- Parent Category (for hierarchical structure) -->
            <div class="field">
                <label for="parent" class="block mb-2 font-medium">Parent Category</label>
                <Dropdown
                    id="parent"
                    v-model="formData.parent"
                    :options="parentCategories"
                    optionLabel="displayName"
                    optionValue="id"
                    class="w-full"
                    placeholder="None (Root Category)"
                    showClear
                    :filter="parentCategories.length > 10"
                    :loading="loadingParents"
                >
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i v-if="slotProps.option.level === 0" class="pi pi-folder text-primary"></i>
                            <i v-else-if="slotProps.option.level === 1" class="pi pi-folder-open text-blue-500"></i>
                            <i v-else class="pi pi-file text-surface-400"></i>
                            <span>{{ slotProps.option.displayName }}</span>
                        </div>
                    </template>
                </Dropdown>
                <small class="text-surface-500 mt-1 block">
                    Leave empty for root category, or select a parent to create a subcategory
                </small>
            </div>

            <!-- Category Level Display -->
            <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-sitemap text-primary"></i>
                    <span class="text-surface-600 dark:text-surface-300">Category Level:</span>
                    <Tag :value="categoryLevelLabel" :severity="categoryLevel === 0 ? 'primary' : categoryLevel === 1 ? 'info' : 'secondary'" />
                </div>
            </div>

            <!-- Status -->
            <div class="field">
                <label for="status" class="block mb-2 font-medium">Status</label>
                <Dropdown
                    id="status"
                    v-model="formData.status"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                />
            </div>

            <!-- Display Order -->
            <div class="field">
                <label for="order" class="block mb-2 font-medium">Display Order</label>
                <InputNumber
                    id="order"
                    v-model="formData.order"
                    class="w-full"
                    :min="0"
                    placeholder="0"
                />
                <small class="text-surface-500">Lower numbers appear first. Categories with same order are sorted alphabetically.</small>
            </div>

            <!-- Display Image -->
            <div class="field">
                <label for="image" class="block mb-2 font-medium">Display Image</label>
                <div class="flex items-start gap-4">
                    <FileUpload
                        mode="basic"
                        name="display_image"
                        accept="image/*"
                        :maxFileSize="2000000"
                        chooseLabel="Choose Image"
                        :auto="false"
                        customUpload
                        @select="onImageSelect"
                        class="p-button-outlined"
                    />
                    <div v-if="imagePreview" class="relative">
                        <img :src="imagePreview" class="w-20 h-20 object-cover rounded border" alt="Category image" />
                        <Button
                            icon="pi pi-times"
                            class="p-button-rounded p-button-danger p-button-sm absolute -top-2 -right-2"
                            @click="clearImage"
                            v-tooltip.top="'Remove image'"
                        />
                    </div>
                </div>
                <small class="text-red-500 block mt-1" v-if="uploadError">{{ uploadError }}</small>
                <small class="text-surface-500 block mt-1" v-else>Max file size: 2MB. Supported formats: JPG, PNG, GIF</small>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-text"
                @click="$emit('cancel')"
            />
            <Button
                :label="isEdit ? 'Update' : 'Create'"
                icon="pi pi-check"
                @click="saveItem"
                :loading="loading"
            />
        </div>
    </div>
</template>

<style scoped>
.category-form {
    min-width: 400px;
}

@media (max-width: 640px) {
    .category-form {
        min-width: 100%;
    }
}
</style>
