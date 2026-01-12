<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import CategoryManager from '@/components/products/CategoryManager.vue';
import SimpleItemManager from '@/components/products/SimpleItemManager.vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const toast = useToast();

// Data
const activeTab = ref(0);
const settingsVisible = ref(false);
const apiEndpoint = ref(import.meta.env.VITE_API_BASE_URL || '');

// Category data - unified categories with tree hierarchy
const categories = ref([]);
const brands = ref([]);
const models = ref([]);

// Fetch all data on mount
onMounted(async () => {
    await Promise.all([fetchCategories(), fetchBrands(), fetchModels()]);
});

// Fetch functions
const fetchCategories = async () => {
    try {
        const response = await ecommerceService.getCategories();
        categories.value = response.data?.results || response.data || [];
    } catch (error) {
        showError('Failed to fetch categories');
    }
};

const fetchBrands = async () => {
    try {
        const response = await ecommerceService.getBrands();
        brands.value = response.data?.results || response.data || [];
    } catch (error) {
        showError('Failed to fetch brands');
    }
};

const fetchModels = async () => {
    try {
        const response = await ecommerceService.getModels();
        models.value = response.data?.results || response.data || [];
    } catch (error) {
        showError('Failed to fetch models');
    }
};

// Category save handler - unified for all category levels
const handleSaveCategory = async (categoryData) => {
    try {
        if (categoryData.id) {
            await ecommerceService.updateCategory(categoryData.id, categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Category updated', life: 3000 });
        } else {
            await ecommerceService.createCategory(categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Category created', life: 3000 });
        }
        await fetchCategories();
    } catch (error) {
        showError('Failed to save category');
    }
};

// Category delete handler
const handleDeleteCategory = async (id) => {
    try {
        await ecommerceService.deleteCategory(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Category deleted', life: 3000 });
        await fetchCategories();
    } catch (error) {
        showError('Failed to delete category');
    }
};

const handleSaveBrand = async (brandData) => {
    try {
        if (brandData.id) {
            await ecommerceService.updateBrand(brandData.id, brandData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Brand updated', life: 3000 });
        } else {
            await ecommerceService.createBrand(brandData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Brand created', life: 3000 });
        }
        await fetchBrands();
    } catch (error) {
        showError('Failed to save brand');
    }
};

const handleSaveModel = async (modelData) => {
    try {
        if (modelData.id) {
            await ecommerceService.updateModel(modelData.id, modelData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Model updated', life: 3000 });
        } else {
            await ecommerceService.createModel(modelData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Model created', life: 3000 });
        }
        await fetchModels();
    } catch (error) {
        showError('Failed to save model');
    }
};

const handleDeleteBrand = async (id) => {
    try {
        await ecommerceService.deleteBrand(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Brand deleted', life: 3000 });
        await fetchBrands();
    } catch (error) {
        showError('Failed to delete brand');
    }
};

const handleDeleteModel = async (id) => {
    try {
        await ecommerceService.deleteModel(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Model deleted', life: 3000 });
        await fetchModels();
    } catch (error) {
        showError('Failed to delete model');
    }
};

// Settings
const toggleSettings = () => {
    settingsVisible.value = !settingsVisible.value;
};

const saveSettings = () => {
    settingsVisible.value = false;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Settings saved', life: 3000 });
};

// Helper functions
const showError = (message) => {
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
};
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <Card class="mb-6">
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Product Management</span>
                    <Button icon="pi pi-cog" class="p-button-rounded p-button-text" @click="toggleSettings" />
                </div>
            </template>
            <template #content>
                <TabView v-model:activeIndex="activeTab">
                    <TabPanel header="Categories">
                        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                            <div class="flex items-center gap-2 text-blue-700">
                                <i class="pi pi-info-circle"></i>
                                <span class="text-sm">Categories support unlimited nesting. Create root categories or assign a parent to create subcategories.</span>
                            </div>
                        </div>
                        <CategoryManager
                            type="category"
                            :items="categories"
                            @save="handleSaveCategory"
                            @delete="handleDeleteCategory"
                        />
                    </TabPanel>
                    <TabPanel header="Brands">
                        <SimpleItemManager title="Brand" :items="brands" @save="handleSaveBrand" @delete="handleDeleteBrand" />
                    </TabPanel>
                    <TabPanel header="Models">
                        <SimpleItemManager title="Model" :items="models" @save="handleSaveModel" @delete="handleDeleteModel" />
                    </TabPanel>
                </TabView>
            </template>
        </Card>

        <Dialog v-model:visible="settingsVisible" header="Settings" :modal="true" :style="{ width: '50vw' }">
            <div class="grid grid-cols-1 gap-4">
                <div class="field">
                    <label for="apiEndpoint" class="block mb-2">API Endpoint</label>
                    <InputText id="apiEndpoint" v-model="apiEndpoint" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Save" icon="pi pi-check" @click="saveSettings" />
            </template>
        </Dialog>
    </div>
</template>
