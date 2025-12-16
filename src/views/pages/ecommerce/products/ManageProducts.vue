<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProductForm from '@/components/products/ProductForm.vue';
import ProductDetail from '@/components/products/ProductDetail.vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const toast = useToast();

// Data
const products = ref([]);
const loading = ref(false);
const searchTerm = ref('');
const productTypeFilter = ref('all');
const productDialog = ref(false);
const deleteDialog = ref(false);
const detailDialog = ref(false);
const editMode = ref(false);
const selectedProduct = ref(null);
const productToDelete = ref(null);

// Dependencies
const mainCategories = ref([]);
const categories = ref([]);
const subcategories = ref([]);
const brands = ref([]);
const models = ref([]);

// Current product being edited/added
const currentProduct = ref({
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
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    images: []
});

// Lifecycle hook
onMounted(async () => {
    await Promise.all([fetchProducts(), fetchDependencies()]);
});

// Methods
    const fetchProducts = async () => {
        try {
            loading.value = true;
            // Build params from filters
            const params = {};
            if (searchTerm.value) params.search = searchTerm.value;
            if (productTypeFilter.value && productTypeFilter.value !== 'all') params.product_type = productTypeFilter.value;

            // Use the standard products endpoint which supports filtering (returns StockInventory objects)
            const response = await ecommerceService.getProducts(params);
            // Support APIResponse wrapper or plain results
            const payload = response.data || response || {};
            let data = payload.data ?? payload.results ?? payload;
            const raw = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);

            // Normalize/flatten data for the table so templates are simpler and consistent
            products.value = raw.map((item) => {
                const prod = item.product || {};
                // Derive a boolean is_active for consistent frontend usage. Backend
                // may return either `status: 'active'` or `is_active: true` in different
                // endpoints; normalize to a single source of truth here.
                const isActive = prod.hasOwnProperty('is_active') ? !!prod.is_active : (String(prod.status).toLowerCase() === 'active');

                return {
                    id: item.id,
                    title: prod.title || prod.name || '',
                    image: prod.images && prod.images.length ? prod.images[0].image : null,
                    sku: prod.sku || '',
                    serial: prod.serial || '',
                    product_type: prod.product_type || prod.type || '', // goods/service
                    inventory_type: item.product_type || item.product_type || '', // single/variable/combo
                    selling_price: item.selling_price ?? null,
                    default_price: prod.default_price ?? null,
                    stock_level: item.stock_level ?? null,
                    availability: item.availability ?? (item.stock_level > 0 ? 'In Stock' : 'Out of Stock'),
                    applicable_tax: item.applicable_tax ?? null,
                    is_active: isActive,
                    status_label: isActive ? 'Active' : 'Inactive',
                    is_featured: prod.is_featured || false,
                    branch_name: item.branch?.name || item.branch?.business?.name || null,
                    raw: item
                };
            });
        } catch (error) {
            showError('Failed to fetch products');
        } finally {
            loading.value = false;
        }
    };

const clearFilters = async () => {
    searchTerm.value = '';
    productTypeFilter.value = 'all';
    await fetchProducts();
};

const fetchDependencies = async () => {
    try {
        const [mainCatsRes, catsRes, subcatsRes, brandsRes, modelsRes] = await Promise.all([
            ecommerceService.getMainCategories(),
            ecommerceService.getCategories(),
            ecommerceService.getSubcategories(),
            ecommerceService.getBrands(),
            ecommerceService.getModels()
        ]);

        mainCategories.value = mainCatsRes.data.results;
        categories.value = catsRes.data.results;
        subcategories.value = subcatsRes.data.results;
        brands.value = brandsRes.data.results;
        models.value = modelsRes.data.results;
    } catch (error) {
        showError('Failed to load dependencies');
    }
};

const openAddDialog = () => {
    editMode.value = false;
    currentProduct.value = {
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
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        images: []
    };
    productDialog.value = true;
};

const editProduct = async (id) => {
    try {
        loading.value = true;
        const response = await ecommerceService.getAllProductsById(id);
        currentProduct.value = response.data;
        editMode.value = true;
        productDialog.value = true;
    } catch (error) {
        showError('Failed to load product');
    } finally {
        loading.value = false;
    }
};

const viewProduct = async (id) => {
    try {
        console.log('viewProduct', id);
        loading.value = true;
        const response = await ecommerceService.getAllProductsById(id);
        selectedProduct.value = response.data;
        detailDialog.value = true;
    } catch (error) {
        showError('Failed to load product details');
    } finally {
        loading.value = false;
    }
};

const confirmDeleteProduct = (id) => {
    productToDelete.value = id;
    deleteDialog.value = true;
};

const deleteProduct = async () => {
    try {
        loading.value = true;
        await ecommerceService.deleteProduct(productToDelete.value);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product deleted',
            life: 3000
        });
        await fetchProducts();
    } catch (error) {
        showError('Failed to delete product');
    } finally {
        loading.value = false;
        deleteDialog.value = false;
        productToDelete.value = null;
    }
};

const handleProductSubmit = async (productData) => {
    try {
        loading.value = true;

        if (editMode.value) {
            await ecommerceService.updateProduct(currentProduct.value.id, productData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Product updated',
                life: 3000
            });
        } else {
            await ecommerceService.createProduct(productData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Product created',
                life: 3000
            });
        }

        productDialog.value = false;
        await fetchProducts();
    } catch (error) {
        showError(`Failed to ${editMode.value ? 'update' : 'create'} product`);
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    currentProduct.value = {
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
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        images: []
    };
    editMode.value = false;
};

const showError = (message) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000
    });
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    try {
        // Use Intl to format numbers consistently
        return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
        return value;
    }
};
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <span>Product Management</span>
                        <InputText v-model="searchTerm" placeholder="Search products..." class="w-64" @input="fetchProducts" />
                        <Dropdown v-model="productTypeFilter" :options="[{label:'All',value:'all'},{label:'Goods',value:'goods'},{label:'Services',value:'service'}]" optionLabel="label" optionValue="value" class="w-40" @change="fetchProducts" />
                        <Button label="Clear" icon="pi pi-filter-slash" class="p-button-text" @click="clearFilters" />
                    </div>
                    <Button label="Add Product" icon="pi pi-plus" @click="openAddDialog" />
                </div>
            </template>
            <template #content>
                <!-- Product List -->
                <DataTable
                    :value="products"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                    stripedRows
                >
                    <Column field="id" header="ID" :sortable="true" style="min-width:80px"></Column>
                    <Column field="title" header="Name" :sortable="true" style="min-width:220px">
                        <template #body="{ data }">
                            <div class="flex items-center gap-3">
                                <img v-if="data.image" :src="data.image" :alt="data.title" class="w-10 h-10 object-cover rounded" />
                                <span class="truncate">{{ data.title }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="sku" header="SKU" :sortable="true" style="min-width:120px"></Column>
                    <Column field="product_type" header="Type" :sortable="true" style="min-width:120px">
                        <template #body="{ data }">
                            <Tag :value="data.product_type" :severity="data.product_type === 'service' ? 'info' : 'success'" />
                        </template>
                    </Column>
                    <Column field="selling_price" header="Price" :sortable="true" style="min-width:120px">
                        <template #body="{ data }">
                            <div>
                                <span v-if="data.selling_price !== null">{{ formatCurrency(data.selling_price) }}</span>
                                <span v-else-if="data.default_price !== null">{{ formatCurrency(data.default_price) }}</span>
                                <span v-else>—</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="default_price" header="Default" :sortable="true" style="min-width:120px">
                        <template #body="{ data }">
                            <span>{{ data.default_price !== null ? formatCurrency(data.default_price) : '-' }}</span>
                        </template>
                    </Column>
                    <Column field="stock_level" header="Stock" :sortable="true" style="min-width:100px">
                        <template #body="{ data }">
                            <span>{{ data.stock_level !== null ? data.stock_level : (data.product_type === 'service' ? '-' : 'N/A') }}</span>
                        </template>
                    </Column>
                    <Column field="availability" header="Availability" :sortable="true" style="min-width:120px">
                        <template #body="{ data }">
                            <span>{{ data.availability || (data.product_type === 'service' ? 'Service' : '-') }}</span>
                        </template>
                    </Column>
                    <Column header="Tax (%)" :sortable="true" style="min-width:100px">
                        <template #body="{ data }">
                            <span>{{ data.applicable_tax?.percentage ?? (data.raw?.product?.applicable_tax?.percentage ?? '-') }}</span>
                        </template>
                    </Column>
                    <Column header="Branch" :sortable="true" style="min-width:140px">
                        <template #body="{ data }">
                            <span>{{ data.branch_name || '-' }}</span>
                        </template>
                    </Column>
                    <Column header="Status" :sortable="true" style="min-width:100px">
                        <template #body="{ data }">
                            <Tag :value="data.status_label" :severity="data.is_active ? 'success' : 'danger'" />
                        </template>
                    </Column>
                    <!-- removed duplicate/unused columns to avoid header overlap -->
                    <Column header="Featured" :sortable="false">
                        <template #body="{ data }">
                            <i class="pi" :class="data.is_featured ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'" />
                        </template>
                    </Column>
                    <Column header="Actions" :exportable="false" style="min-width: 10rem">
                        <template #body="{ data }">
                            <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm mr-2" @click="viewProduct(data.raw.product.id)" />
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" @click="editProduct(data.raw.product.id)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDeleteProduct(data.raw.product.id)" />
                        </template>
                    </Column>
                </DataTable>

                <!-- Add/Edit Product Dialog -->
                <Dialog
                    v-model:visible="productDialog"
                    :header="editMode ? 'Edit Product' : 'Add Product'"
                    :modal="true"
                    editMode="editMode"
                    :style="{ width: '70vw' }"
                    :mainCategories="mainCategories"
                    :categories="categories"
                    :subcategories="subcategories"
                    :brands="brands"
                    :models="models"
                    :maximizable="true"
                    @hide="resetForm"
                >
                    <ProductForm
                        :product="currentProduct"
                        :editMode="editMode"
                        :mainCategories="mainCategories"
                        :categories="categories"
                        :subcategories="subcategories"
                        :brands="brands"
                        :models="models"
                        @fetch-products="fetchProducts"
                        @submit="handleProductSubmit"
                        @cancel="productDialog = false"
                    />
                </Dialog>

                <!-- Delete Confirmation Dialog -->
                <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{ width: '350px' }">
                    <div class="confirmation-content">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span>Are you sure you want to delete this product?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteProduct" />
                    </template>
                </Dialog>

                <!-- Product Detail Dialog -->
                <Dialog v-model:visible="detailDialog" :header="selectedProduct?.title" :modal="true" :style="{ width: '50vw' }" :maximizable="true">
                    <ProductDetail :product="selectedProduct" />
                </Dialog>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-datatable {
    font-size: 0.875rem;
}

@media (max-width: 640px) {
    .p-dialog {
        width: 95vw !important;
    }
}
</style>
