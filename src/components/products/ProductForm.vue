<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const router = useRouter();
const route = useRoute();
const toast = useToast();

//define emits
const emit = defineEmits(['fetch-products']);

// Form data
const product = ref({
    title: '',
    sku: '',
    serial: '',
    description: '',
    maincategory: null,
    category: null,
    subcategory: null,
    brand: null,
    model: null,
    weight: '',
    dimensions: '',
    status: 'active',
    is_featured: false,
    is_manufactured: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
});

const productImages = ref([]);
const loading = ref(false);
const editMode = ref(false);

// Options
const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]);

// Dependencies data
const mainCategories = ref([]);
const categories = ref([]);
const subcategories = ref([]);
const brands = ref([]);
const models = ref([]);

// Dialogs
const showAddMainCategoryDialog = ref(false);
const showAddCategoryDialog = ref(false);
const showAddSubcategoryDialog = ref(false);
const showAddBrandDialog = ref(false);
const showAddModelDialog = ref(false);

// Computed
const filteredCategories = computed(() => {
    if (!product.value.maincategory) return [];
    return categories.value.filter((cat) => cat.maincategory?.id === product.value.maincategory || cat.maincategory === product.value.maincategory);
});

const filteredSubcategories = computed(() => {
    if (!product.value.category) return [];
    return subcategories.value.filter((sub) => sub.category?.id === product.value.category || sub.category === product.value.category);
});

//props
const props = defineProps({
    product: {
        type: Number,
        default: null
    },
    is_manufactured: {
        type: Boolean,
        default: false
    },
    editMode: {
        type: Boolean,
        default: false
    },
    mainCategories: {
        type: Array,
        default: () => []
    },
    categories: {
        type: Array,
        default: () => []
    },
    subcategories: {
        type: Array,
        default: () => []
    },
    brands: {
        type: Array,
        default: () => []
    },
    models: {
        type: Array,
        default: () => []
    }
});

// Lifecycle hooks
onMounted(async () => {
    if (props.editMode) {
        // Fetch product data if in edit mode
        product.value = props.product;
        product.value.maincategory = props.product.maincategory.id;
        product.value.status = 'active';
        productImages.value = props.product.images || [];
        mainCategories.value = props.mainCategories;
        categories.value = props.categories;
        subcategories.value = props.subcategories;
        brands.value = props.brands;
        models.value = props.models;
        editMode.value = props.editMode;
    } else {
        // Fetch dependencies if in add mode
        await fetchDependencies();
    }
    if (props.is_manufactured) {
        product.value.is_manufactured = props.is_manufactured;
    }
});

// Methods
const fetchDependencies = async () => {
    try {
        let mainCatsRes = await ecommerceService.getMainCategories();
        let catsRes = await ecommerceService.getCategories();
        let subcatsRes = await ecommerceService.getSubcategories();
        let brandsRes = await ecommerceService.getBrands();
        let modelsRes = await ecommerceService.getModels();

        mainCategories.value = mainCatsRes.data.results;
        console.log(mainCategories.value);
        categories.value = catsRes.data.results;
        subcategories.value = subcatsRes.data.results;
        brands.value = brandsRes.data.results;
        models.value = modelsRes.data.results;
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        showError('Failed to load dependencies');
    }
};

const fetchProduct = async (id) => {
    try {
        loading.value = true;
        const response = await ecommerceService.getProduct(id);
        product.value = response.data;

        // Set images if they exist
        if (response.data.images) {
            productImages.value = response.data.images;
        }
    } catch (error) {
        showError('Failed to load product');
    } finally {
        loading.value = false;
    }
};

const submitForm = async () => {
    try {
        loading.value = true;

        // Prepare form data for upload
        const formData = new FormData();

        // Prepare the product data object
        const productData = {
            ...product.value,
            // Ensure related fields are IDs only
            maincategory: product.value.maincategory,
            brand: product.value.brand ? product.value.brand.id : null,
            model: product.value.model ? product.value.model.id : null
        };

        // Append product data
        for (const key in productData) {
            if (productData[key] !== null && productData[key] !== undefined) {
                // Handle boolean values
                if (typeof productData[key] === 'boolean') {
                    formData.append(key, productData[key] ? 'true' : 'false');
                } else {
                    formData.append(key, productData[key]);
                }
            }
        }

        //apend categories and subcategories
        if (product.value.category) {
            formData.append('category', product.value.category);
        }
        if (product.value.subcategory) {
            formData.append('subcategory', product.value.subcategory);
        }

        // Append images - only new files
        productImages.value.forEach((image, index) => {
            if (image instanceof File) {
                formData.append('images', image); // Changed to match backend expectation
            }
        });

        // Determine if we're creating or updating
        if (editMode.value) {
            await ecommerceService.updateProduct(product.value.id, formData);
        } else {
            console.log(formData);
            await ecommerceService.createProduct(formData);
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: editMode.value ? 'Product updated' : 'Product created',
            life: 3000
        });
        //emit fetch products
        emit('fetch-products');

        //router.push({ name: 'products' })
    } catch (error) {
        console.error('Error saving product:', error);
        showError('Failed to save product: ' + (error.response?.data?.message || error.message));
    } finally {
        loading.value = false;
    }
};

const onImageSelect = (event) => {
    for (const file of event.files) {
        if (file.type.match('image.*')) {
            productImages.value.push(file);
        }
    }
};

const isFile = (obj) => {
    return typeof File !== 'undefined' && obj instanceof File;
};

function getImageSrc(image) {
    if (typeof window === 'undefined' || typeof URL === 'undefined') return '';

    if (isFile(image)) {
        return URL.createObjectURL(image);
    }

    return image.image;
}
const removeImage = (index) => {
    productImages.value.splice(index, 1);
};

const showAddDialog = (type) => {
    switch (type) {
        case 'main':
            showAddMainCategoryDialog.value = true;
            break;
        case 'category':
            showAddCategoryDialog.value = true;
            break;
        case 'subcategory':
            showAddSubcategoryDialog.value = true;
            break;
        case 'brand':
            showAddBrandDialog.value = true;
            break;
        case 'model':
            showAddModelDialog.value = true;
            break;
    }
};

const handleMainCategoryAdded = (newCategory) => {
    mainCategories.value.push(newCategory);
    product.value.maincategory = newCategory.id;
    showAddMainCategoryDialog.value = false;
};

const handleCategoryAdded = (newCategory) => {
    categories.value.push(newCategory);
    product.value.category = newCategory.id;
    showAddCategoryDialog.value = false;
};

const handleSubcategoryAdded = (newSubcategory) => {
    subcategories.value.push(newSubcategory);
    product.value.subcategory = newSubcategory.id;
    showAddSubcategoryDialog.value = false;
};

const handleBrandAdded = (newBrand) => {
    brands.value.push(newBrand);
    product.value.brand = newBrand.id;
    showAddBrandDialog.value = false;
};

const handleModelAdded = (newModel) => {
    models.value.push(newModel);
    product.value.model = newModel.id;
    showAddModelDialog.value = false;
};

const showError = (message) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000
    });
};
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <Card>
            <template #title>
                {{ editMode ? 'Edit Product' : 'Add New Product' }}
            </template>
            <template #content>
                <form @submit.prevent="submitForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Basic Information -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Basic Information</h3>

                            <div class="field">
                                <label for="title" class="block mb-2 font-medium">Product Title*</label>
                                <InputText id="title" v-model="product.title" class="w-full" required />
                            </div>

                            <div class="field">
                                <label for="sku" class="block mb-2 font-medium">SKU</label>
                                <InputText id="sku" v-model="product.sku" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="serial" class="block mb-2 font-medium">Serial Number</label>
                                <InputText id="serial" v-model="product.serial" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="description" class="block mb-2 font-medium">Description</label>
                                <Textarea id="description" v-model="product.description" rows="3" class="w-full" />
                            </div>
                        </div>

                        <!-- Categories & Organization -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Categories & Organization</h3>

                            <div class="field">
                                <label for="mainCategory" class="block mb-2 font-medium">Main Category*</label>
                                <div class="flex gap-2">
                                    <Dropdown id="mainCategory" v-model="product.maincategory" :options="mainCategories" optionLabel="name" optionValue="id" placeholder="Select Main Category" class="flex-1" required />
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showAddDialog('main')" />
                                </div>
                            </div>

                            <div class="field">
                                <label for="category" class="block mb-2 font-medium">Category</label>
                                <div class="flex gap-2">
                                    <Dropdown id="category" v-model="product.category" :options="filteredCategories" optionLabel="name" optionValue="id" placeholder="Select Category" class="flex-1" :disabled="!product.maincategory" />
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showAddDialog('category')" :disabled="!product.maincategory" />
                                </div>
                            </div>

                            <div class="field">
                                <label for="subcategory" class="block mb-2 font-medium">Subcategory</label>
                                <div class="flex gap-2">
                                    <Dropdown id="subcategory" v-model="product.subcategory" :options="filteredSubcategories" optionLabel="name" optionValue="id" placeholder="Select Subcategory" class="flex-1" :disabled="!product.category" />
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showAddDialog('subcategory')" :disabled="!product.category" />
                                </div>
                            </div>
                        </div>

                        <!-- Brand & Model -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Brand & Model</h3>

                            <div class="field">
                                <label for="brand" class="block mb-2 font-medium">Brand</label>
                                <div class="flex gap-2">
                                    <Dropdown id="brand" v-model="product.brand" :options="brands" optionLabel="title" optionValue="id" placeholder="Select Brand" class="flex-1" />
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showAddDialog('brand')" />
                                </div>
                            </div>

                            <div class="field">
                                <label for="model" class="block mb-2 font-medium">Model</label>
                                <div class="flex gap-2">
                                    <Dropdown id="model" v-model="product.model" :options="models" optionLabel="title" optionValue="id" placeholder="Select Model" class="flex-1" />
                                    <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showAddDialog('model')" />
                                </div>
                            </div>
                        </div>

                        <!-- Specifications -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Specifications</h3>

                            <div class="field">
                                <label for="weight" class="block mb-2 font-medium">Weight</label>
                                <InputText id="weight" v-model="product.weight" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="dimensions" class="block mb-2 font-medium">Dimensions</label>
                                <InputText id="dimensions" v-model="product.dimensions" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="status" class="block mb-2 font-medium">Status</label>
                                <Dropdown id="status" v-model="product.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                            </div>

                            <div class="field flex items-center gap-3">
                                <Checkbox id="featured" v-model="product.is_featured" :binary="true" />
                                <label for="featured" class="font-medium">Featured Product</label>
                            </div>
                        </div>

                        <!-- Images -->
                        <div class="md:col-span-2 space-y-4">
                            <h3 class="text-lg font-semibold">Product Images</h3>

                            <FileUpload name="images[]" :multiple="true" accept="image/*" :maxFileSize="2000000" :customUpload="true" @select="onImageSelect" chooseLabel="Add Images">
                                <template #empty>
                                    <p>Drag and drop images here or click to browse</p>
                                </template>
                            </FileUpload>

                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                <div v-for="(image, index) in productImages" :key="index" class="relative group">
                                    <img :src="isFile(image) ? getImageSrc(image) : image.image" :alt="`${product.title} - ${index}`" class="w-full h-32 object-cover rounded border" />
                                    <Button icon="pi pi-times" class="absolute top-1 right-1 p-button-rounded p-button-danger p-button-sm opacity-0 group-hover:opacity-100 transition-opacity" @click="removeImage(index)" />
                                </div>
                            </div>
                        </div>

                        <!-- SEO -->
                        <div class="md:col-span-2 space-y-4">
                            <h3 class="text-lg font-semibold">SEO Information</h3>

                            <div class="field">
                                <label for="seoTitle" class="block mb-2 font-medium">SEO Title</label>
                                <InputText id="seoTitle" v-model="product.seo_title" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="seoDescription" class="block mb-2 font-medium">SEO Description</label>
                                <Textarea id="seoDescription" v-model="product.seo_description" rows="3" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="seoKeywords" class="block mb-2 font-medium">SEO Keywords</label>
                                <InputText id="seoKeywords" v-model="product.seo_keywords" class="w-full" />
                                <small class="text-gray-500">Separate keywords with commas</small>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="$router.go(-1)" />
                        <Button type="submit" :label="editMode ? 'Update Product' : 'Add Product'" icon="pi pi-check" :loading="loading" />
                    </div>
                </form>
            </template>
        </Card>

        <!-- Add Dependency Dialogs -->
        <Dialog v-model:visible="showAddMainCategoryDialog" header="Add Main Category" :modal="true" :style="{ width: '50vw' }">
            <AddCategoryForm type="main" @saved="handleMainCategoryAdded" @cancel="showAddMainCategoryDialog = false" />
        </Dialog>

        <Dialog v-model:visible="showAddCategoryDialog" header="Add Category" :modal="true" :style="{ width: '50vw' }">
            <AddCategoryForm type="category" :mainCategoryId="product.maincategory" @saved="handleCategoryAdded" @cancel="showAddCategoryDialog = false" />
        </Dialog>

        <Dialog v-model:visible="showAddSubcategoryDialog" header="Add Subcategory" :modal="true" :style="{ width: '50vw' }">
            <AddCategoryForm type="subcategory" :categoryId="product.category" @saved="handleSubcategoryAdded" @cancel="showAddSubcategoryDialog = false" />
        </Dialog>

        <Dialog v-model:visible="showAddBrandDialog" header="Add Brand" :modal="true" :style="{ width: '50vw' }">
            <AddSimpleItemForm type="brand" @saved="handleBrandAdded" @cancel="showAddBrandDialog = false" />
        </Dialog>

        <Dialog v-model:visible="showAddModelDialog" header="Add Model" :modal="true" :style="{ width: '50vw' }">
            <AddSimpleItemForm type="model" @saved="handleModelAdded" @cancel="showAddModelDialog = false" />
        </Dialog>
    </div>
</template>

<style scoped>
.field {
    @apply mb-4;
}

@media (max-width: 640px) {
    .p-dialog {
        width: 95vw !important;
    }
}
</style>
