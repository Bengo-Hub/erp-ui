<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { usePermissions } from '@/composables/usePermissions';
import axios from '@/utils/axiosConfig';

const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Props
const props = defineProps({
    product: {
        type: [Number, Object],
        default: null
    },
    editMode: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['saved', 'fetch-products', 'close']);

// Form state
const form = ref({
    title: '',
    sku: '',
    serial: '',
    description: '',
    category: null,
    brand: null,
    model: null,
    weight: '',
    dimentions: '',
    status: 'active',
    is_featured: false,
    is_manufactured: false,
    product_type: 'goods',
    unit_price: 0.00,
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
});

// State
const loading = ref(false);
const submitting = ref(false);
const productImages = ref([]);
const newImages = ref([]);

// Dependency Management
const showCategoryDialog = ref(false);
const showBrandDialog = ref(false);
const showModelDialog = ref(false);

const categoryForm = ref({
    name: '',
    parent: null,
    status: 'active'
});

const brandForm = ref({
    title: ''
});

const modelForm = ref({
    title: ''
});

const categorySubmitting = ref(false);
const brandSubmitting = ref(false);
const modelSubmitting = ref(false);

// Options
const categories = ref([]);
const brands = ref([]);
const models = ref([]);

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
];

const productTypeOptions = [
    { label: 'Goods', value: 'goods' },
    { label: 'Service', value: 'service' }
];

// Computed
const title = computed(() => props.editMode ? 'Edit Product' : 'Create Product');
const submitLabel = computed(() => props.editMode ? 'Update Product' : 'Create Product');

// Methods
const fetchDependencies = async () => {
    loading.value = true;
    try {
        const [categoriesRes, brandsRes, modelsRes] = await Promise.all([
            axios.get('/ecommerce/product/categories/'),
            axios.get('/ecommerce/product/brands/'),
            axios.get('/ecommerce/product/models/')
        ]);

        categories.value = categoriesRes.data?.results || categoriesRes.data || [];
        brands.value = brandsRes.data?.results || brandsRes.data || [];
        models.value = modelsRes.data?.results || modelsRes.data || [];
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        showToast('error', 'Error', 'Failed to load form dependencies');
    } finally {
        loading.value = false;
    }
};

const fetchProduct = async (id) => {
    loading.value = true;
    try {
        const response = await axios.get(`/ecommerce/product/products-crud/${id}/`);
        const product = response.data?.data || response.data;
        
        // Populate form with product data
        form.value = {
            title: product.title || '',
            sku: product.sku || '',
            serial: product.serial || '',
            description: product.description || '',
            category: product.category?.id || product.category || null,
            brand: product.brand?.id || product.brand || null,
            model: product.model?.id || product.model || null,
            weight: product.weight || '',
            dimentions: product.dimentions || '',
            status: product.status || 'active',
            is_featured: product.is_featured || false,
            is_manufactured: product.is_manufactured || false,
            product_type: product.product_type || 'goods',
            unit_price: product.default_price || product.unit_price || 0.00,
            seo_title: product.seo_title || '',
            seo_description: product.seo_description || '',
            seo_keywords: product.seo_keywords || ''
        };

        productImages.value = product.images || [];
    } catch (error) {
        console.error('Error fetching product:', error);
        showToast('error', 'Error', 'Failed to load product');
    } finally {
        loading.value = false;
    }
};

const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    newImages.value = [...newImages.value, ...files];
};

const removeNewImage = (index) => {
    newImages.value.splice(index, 1);
};

const removeExistingImage = async (imageId) => {
    if (confirm('Are you sure you want to remove this image?')) {
        try {
            // You may need to implement image deletion endpoint
            productImages.value = productImages.value.filter(img => img.id !== imageId);
            showToast('success', 'Success', 'Image removed');
        } catch (error) {
            console.error('Error removing image:', error);
            showToast('error', 'Error', 'Failed to remove image');
        }
    }
};

const validateForm = () => {
    if (!form.value.title) {
        showToast('error', 'Validation Error', 'Product title is required');
        return false;
    }
    return true;
};

const submitForm = async () => {
    if (!validateForm()) return;

    submitting.value = true;
    try {
        const formData = new FormData();

        // Append all form fields
        Object.keys(form.value).forEach(key => {
            const value = form.value[key];
            if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else {
                    formData.append(key, value);
                }
            }
        });

        // Backward compatibility: ensure backend receives default_price
        if (form.value.unit_price !== undefined && form.value.unit_price !== null) {
            formData.append('default_price', form.value.unit_price);
        }

        // Append new images
        newImages.value.forEach(image => {
            formData.append('images', image);
        });

        let response;
        if (props.editMode && props.product) {
            const productId = typeof props.product === 'object' ? (props.product.id || props.product.product_id) : props.product;
            response = await axios.put(`/ecommerce/product/products-crud/${productId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            response = await axios.post('/ecommerce/product/products-crud/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }

        const savedProduct = response.data?.data || response.data;
        showToast('success', 'Success', `Product ${props.editMode ? 'updated' : 'created'} successfully`);
        emit('saved', savedProduct);
        emit('fetch-products');
        emit('close');
    } catch (error) {
        console.error('Error saving product:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to save product';
        showToast('error', 'Error', errorMessage);
    } finally {
        submitting.value = false;
    }
};

const cancel = () => {
    emit('close');
};

// Category Management
const handleAddCategory = () => {
    categoryForm.value = { name: '', parent: null, status: 'active' };
    showCategoryDialog.value = true;
};

const handleEditCategory = (category) => {
    categoryForm.value = {
        name: category.name || '',
        parent: category.parent?.id || null,
        status: category.status || 'active',
        id: category.id
    };
    showCategoryDialog.value = true;
};

const submitCategory = async () => {
    if (!categoryForm.value.name) {
        showToast('error', 'Validation Error', 'Category name is required');
        return;
    }

    categorySubmitting.value = true;
    try {
        const data = {
            name: categoryForm.value.name,
            status: categoryForm.value.status
        };
        if (categoryForm.value.parent) {
            data.parent = categoryForm.value.parent;
        }

        if (categoryForm.value.id) {
            await axios.put(`/ecommerce/product/categories/${categoryForm.value.id}/`, data);
        } else {
            await axios.post('/ecommerce/product/categories/', data);
        }

        showToast('success', 'Success', `Category ${categoryForm.value.id ? 'updated' : 'created'} successfully`);
        showCategoryDialog.value = false;
        await fetchDependencies();
    } catch (error) {
        console.error('Error saving category:', error);
        const errorMessage = error.response?.data?.message || 'Failed to save category';
        showToast('error', 'Error', errorMessage);
    } finally {
        categorySubmitting.value = false;
    }
};

// Brand Management
const handleAddBrand = () => {
    brandForm.value = { title: '' };
    showBrandDialog.value = true;
};

const handleEditBrand = (brand) => {
    brandForm.value = {
        title: brand.title || '',
        id: brand.id
    };
    showBrandDialog.value = true;
};

const submitBrand = async () => {
    if (!brandForm.value.title) {
        showToast('error', 'Validation Error', 'Brand name is required');
        return;
    }

    brandSubmitting.value = true;
    try {
        const data = { title: brandForm.value.title };

        if (brandForm.value.id) {
            await axios.put(`/ecommerce/product/brands/${brandForm.value.id}/`, data);
        } else {
            await axios.post('/ecommerce/product/brands/', data);
        }

        showToast('success', 'Success', `Brand ${brandForm.value.id ? 'updated' : 'created'} successfully`);
        showBrandDialog.value = false;
        await fetchDependencies();
    } catch (error) {
        console.error('Error saving brand:', error);
        const errorMessage = error.response?.data?.message || 'Failed to save brand';
        showToast('error', 'Error', errorMessage);
    } finally {
        brandSubmitting.value = false;
    }
};

// Model Management
const handleAddModel = () => {
    modelForm.value = { title: '' };
    showModelDialog.value = true;
};

const handleEditModel = (model) => {
    modelForm.value = {
        title: model.title || '',
        id: model.id
    };
    showModelDialog.value = true;
};

const submitModel = async () => {
    if (!modelForm.value.title) {
        showToast('error', 'Validation Error', 'Model name is required');
        return;
    }

    modelSubmitting.value = true;
    try {
        const data = { title: modelForm.value.title };

        if (modelForm.value.id) {
            await axios.put(`/ecommerce/product/models/${modelForm.value.id}/`, data);
        } else {
            await axios.post('/ecommerce/product/models/', data);
        }

        showToast('success', 'Success', `Model ${modelForm.value.id ? 'updated' : 'created'} successfully`);
        showModelDialog.value = false;
        await fetchDependencies();
    } catch (error) {
        console.error('Error saving model:', error);
        const errorMessage = error.response?.data?.message || 'Failed to save model';
        showToast('error', 'Error', errorMessage);
    } finally {
        modelSubmitting.value = false;
    }
};

// Lifecycle
onMounted(async () => {
    await fetchDependencies();
    
    if (props.editMode && props.product) {
        if (typeof props.product === 'object' && props.product.title) {
            // Full product object passed
            form.value = {
                title: props.product.title || '',
                sku: props.product.sku || '',
                serial: props.product.serial || '',
                description: props.product.description || '',
                category: props.product.category?.id || props.product.category || null,
                brand: props.product.brand?.id || props.product.brand || null,
                model: props.product.model?.id || props.product.model || null,
                weight: props.product.weight || '',
                dimentions: props.product.dimentions || '',
                status: props.product.status || 'active',
                is_featured: props.product.is_featured || false,
                is_manufactured: props.product.is_manufactured || false,
                product_type: props.product.product_type || 'goods',
                    unit_price: props.product.unit_price || props.product.default_price || 0.00,
                seo_title: props.product.seo_title || '',
                seo_description: props.product.seo_description || '',
                seo_keywords: props.product.seo_keywords || ''
            };
            productImages.value = props.product.images || [];
        } else {
            // Product ID passed, fetch full details
            const productId = typeof props.product === 'object' ? props.product.id : props.product;
            await fetchProduct(productId);
        }
    }
});
</script>

<template>
    <div class="product-form">
        <div v-if="loading" class="flex justify-center items-center py-12">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Basic Information -->
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-4">Basic Information</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Product/Service Title <span class="text-red-500">*</span></label>
                        <InputText v-model="form.title" placeholder="Enter product/service title" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Product Type</label>
                        <Dropdown 
                            v-model="form.product_type" 
                            :options="productTypeOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select type" 
                            class="w-full"
                        />
                        <small v-if="form.product_type === 'service'" class="text-sm text-gray-500 mt-2 block">💡 Services are billable items and are <strong>not</strong> added to inventory or stock.</small>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">SKU</label>
                        <InputText v-model="form.sku" placeholder="Stock Keeping Unit (optional)" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Serial Number</label>
                        <InputText v-model="form.serial" placeholder="Serial number (optional)" class="w-full" />
                    </div>

                    <div class="col-span-2">
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <Textarea v-model="form.description" rows="4" placeholder="Product description" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Classification (hidden for services) -->
            <div class="card p-6" v-if="form.product_type !== 'service'">
                <h3 class="text-lg font-semibold mb-4">Classification</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium">Category</label>
                            <Button 
                                v-if="hasPermission('add_category')"
                                icon="pi pi-plus" 
                                class="p-button-sm p-button-text"
                                @click="handleAddCategory"
                                v-tooltip="'Add New Category'"
                            />
                        </div>
                        <Dropdown 
                            v-model="form.category" 
                            :options="categories" 
                            optionLabel="name" 
                            optionValue="id"
                            placeholder="Select category" 
                            class="w-full"
                            :filter="true"
                        >
                            <template #option="slotProps">
                                <div class="flex items-center justify-between w-full pr-2">
                                    <span>{{ slotProps.option.name }}</span>
                                    <Button 
                                        v-if="hasPermission('change_category')"
                                        icon="pi pi-pencil" 
                                        class="p-button-sm p-button-text"
                                        @click.stop="handleEditCategory(slotProps.option)"
                                    />
                                </div>
                            </template>
                        </Dropdown>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium">Brand</label>
                            <Button 
                                v-if="hasPermission('add_brand')"
                                icon="pi pi-plus" 
                                class="p-button-sm p-button-text"
                                @click="handleAddBrand"
                                v-tooltip="'Add New Brand'"
                            />
                        </div>
                        <Dropdown 
                            v-model="form.brand" 
                            :options="brands" 
                            optionLabel="title" 
                            optionValue="id"
                            placeholder="Select brand" 
                            class="w-full"
                            :filter="true"
                        >
                            <template #option="slotProps">
                                <div class="flex items-center justify-between w-full pr-2">
                                    <span>{{ slotProps.option.title }}</span>
                                    <Button 
                                        v-if="hasPermission('change_brand')"
                                        icon="pi pi-pencil" 
                                        class="p-button-sm p-button-text"
                                        @click.stop="handleEditBrand(slotProps.option)"
                                    />
                                </div>
                            </template>
                        </Dropdown>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium">Model</label>
                            <Button 
                                v-if="hasPermission('add_model')"
                                icon="pi pi-plus" 
                                class="p-button-sm p-button-text"
                                @click="handleAddModel"
                                v-tooltip="'Add New Model'"
                            />
                        </div>
                        <Dropdown 
                            v-model="form.model" 
                            :options="models" 
                            optionLabel="title" 
                            optionValue="id"
                            placeholder="Select model" 
                            class="w-full"
                            :filter="true"
                        >
                            <template #option="slotProps">
                                <div class="flex items-center justify-between w-full pr-2">
                                    <span>{{ slotProps.option.title }}</span>
                                    <Button 
                                        v-if="hasPermission('change_model')"
                                        icon="pi pi-pencil" 
                                        class="p-button-sm p-button-text"
                                        @click.stop="handleEditModel(slotProps.option)"
                                    />
                                </div>
                            </template>
                        </Dropdown>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Product Type</label>
                        <Dropdown 
                            v-model="form.product_type" 
                            :options="productTypeOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select type" 
                            class="w-full"
                        />
                        <small v-if="form.product_type === 'service'" class="text-sm text-gray-500 mt-2 block">💡 Services are billable items and are <strong>not</strong> added to inventory or stock.</small>
                    </div>
                </div>
            </div>

            <!-- Pricing & Physical Details -->
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-4">Pricing & Physical Details</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Unit Price</label>
                        <InputNumber 
                            v-model="form.unit_price" 
                            mode="currency" 
                            currency="KES" 
                            locale="en-KE"
                            placeholder="0.00" 
                            class="w-full"
                        />
                    </div>

                    <div v-if="form.product_type !== 'service'">
                        <label class="block text-sm font-medium mb-2">Weight</label>
                        <InputText v-model="form.weight" placeholder="e.g., 2.5kg" class="w-full" />
                    </div>

                    <div v-if="form.product_type !== 'service'">
                        <label class="block text-sm font-medium mb-2">Dimensions</label>
                        <InputText v-model="form.dimentions" placeholder="e.g., 10x20x30 cm" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Status</label>
                        <Dropdown 
                            v-model="form.status" 
                            :options="statusOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select status" 
                            class="w-full"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div class="flex items-center" v-if="form.product_type !== 'service'">
                        <Checkbox v-model="form.is_featured" inputId="is_featured" binary />
                        <label for="is_featured" class="ml-2">Featured Product</label>
                    </div>

                    <div class="flex items-center" v-if="form.product_type !== 'service'">
                        <Checkbox v-model="form.is_manufactured" inputId="is_manufactured" binary />
                        <label for="is_manufactured" class="ml-2">Manufactured Product</label>
                    </div>
                </div>
            </div>

            <!-- Product Images -->
            <div class="card p-6" v-if="form.product_type !== 'service'">
                <h3 class="text-lg font-semibold mb-4">Product Images</h3>
                
                <div class="space-y-4">
                    <!-- Existing Images -->
                    <div v-if="productImages.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="(image, index) in productImages" :key="index" class="relative">
                            <img :src="image.image" alt="Product" class="w-full h-32 object-cover rounded" />
                            <Button 
                                icon="pi pi-times" 
                                class="p-button-rounded p-button-danger p-button-sm absolute top-2 right-2"
                                @click="removeExistingImage(image.id)"
                            />
                        </div>
                    </div>

                    <!-- New Images Preview -->
                    <div v-if="newImages.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="(image, index) in newImages" :key="`new-${index}`" class="relative">
                            <img :src="URL.createObjectURL(image)" alt="New" class="w-full h-32 object-cover rounded" />
                            <Button 
                                icon="pi pi-times" 
                                class="p-button-rounded p-button-danger p-button-sm absolute top-2 right-2"
                                @click="removeNewImage(index)"
                            />
                        </div>
                    </div>

                    <!-- Upload Button -->
                    <div>
                        <label class="cursor-pointer">
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary">
                                <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-2"></i>
                                <p class="text-sm text-gray-600">Click to upload images</p>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    class="hidden" 
                                    @change="handleImageSelect"
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- SEO (Optional) -->
            <Accordion>
                <AccordionTab header="SEO Settings (Optional)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">SEO Title</label>
                            <InputText v-model="form.seo_title" placeholder="SEO title for search engines" class="w-full" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">SEO Description</label>
                            <Textarea v-model="form.seo_description" rows="3" placeholder="SEO description" class="w-full" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">SEO Keywords</label>
                            <InputText v-model="form.seo_keywords" placeholder="comma, separated, keywords" class="w-full" />
                        </div>
                    </div>
                </AccordionTab>
            </Accordion>

            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-4">
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="cancel" :disabled="submitting" />
                <Button 
                    :label="submitLabel" 
                    icon="pi pi-check" 
                    @click="submitForm" 
                    :loading="submitting"
                />
            </div>

            <!-- Category Form Dialog -->
            <Dialog 
                v-model:visible="showCategoryDialog" 
                header="Create New Category"
                :modal="true" 
                class="w-full md:w-1/2"
            >
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Category Name <span class="text-red-500">*</span></label>
                        <InputText v-model="categoryForm.name" placeholder="Enter category name" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Parent Category</label>
                        <Dropdown 
                            v-model="categoryForm.parent" 
                            :options="categories" 
                            optionLabel="name" 
                            optionValue="id"
                            placeholder="Select parent category (optional)" 
                            class="w-full"
                            :filter="true"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Status</label>
                        <Dropdown 
                            v-model="categoryForm.status" 
                            :options="[
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' }
                            ]" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Select status" 
                            class="w-full"
                        />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showCategoryDialog = false" :disabled="categorySubmitting" />
                        <Button 
                            label="Save" 
                            icon="pi pi-check" 
                            @click="submitCategory" 
                            :loading="categorySubmitting"
                        />
                    </div>
                </div>
            </Dialog>

            <!-- Brand Form Dialog -->
            <Dialog 
                v-model:visible="showBrandDialog" 
                header="Create New Brand"
                :modal="true" 
                class="w-full md:w-1/2"
            >
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Brand Name <span class="text-red-500">*</span></label>
                        <InputText v-model="brandForm.title" placeholder="Enter brand name" class="w-full" />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showBrandDialog = false" :disabled="brandSubmitting" />
                        <Button 
                            label="Save" 
                            icon="pi pi-check" 
                            @click="submitBrand" 
                            :loading="brandSubmitting"
                        />
                    </div>
                </div>
            </Dialog>

            <!-- Model Form Dialog -->
            <Dialog 
                v-model:visible="showModelDialog" 
                header="Create New Model"
                :modal="true" 
                class="w-full md:w-1/2"
            >
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Model Name <span class="text-red-500">*</span></label>
                        <InputText v-model="modelForm.title" placeholder="Enter model name" class="w-full" />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showModelDialog = false" :disabled="modelSubmitting" />
                        <Button 
                            label="Save" 
                            icon="pi pi-check" 
                            @click="submitModel" 
                            :loading="modelSubmitting"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
.product-form {
    max-height: 70vh;
    overflow-y: auto;
}

.card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}
</style>
