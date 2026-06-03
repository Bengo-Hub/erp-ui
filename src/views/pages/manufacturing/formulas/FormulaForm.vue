<script setup>
import { useToast } from '@/composables/useToast';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import ProductForm from '@/components/products/ProductForm.vue';
import { formatDate } from '@/utils/formatters';

const { formatCurrencySync } = useGlobalCurrency();
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

const { showToast } = useToast();
const route = useRoute();
const router = useRouter();

const isEditMode = computed(() => !!route.params.id);
const formula = reactive({
    name: '',
    description: '',
    final_product: null,
    expected_output_quantity: null,
    output_unit: null,
    is_active: true,
    ingredients: []
});

const products = ref([]);
const rawMaterials = ref([]);
const units = ref([]);
const submitted = ref(false);
const saving = ref(false);
const markupPercentage = ref(30);

const productDialog = ref(false);
const editMode = ref(false);

const ingredientDialog = reactive({
    visible: false,
    isEdit: false,
    editIndex: -1,
    item: {
        raw_material: null,
        quantity: null,
        unit: null,
        notes: ''
    }
});

// Validation rules
const rules = {
    name: { required },
    final_product: { required },
    expected_output_quantity: { required, minValue: minValue(0.01) },
    output_unit: { required }
};
const v$ = useVuelidate(rules, formula);

//methods

const openProductDialog = () => {
    productDialog.value = true;
};

// Calculate total cost of raw materials
const calculateTotalCost = () => {
    if (!formula.ingredients.length) return 0;

    return formula.ingredients.reduce((total, ingredient) => {
        const materialCost = ingredient.raw_material?.buying_price || 0;
        return total + materialCost * ingredient.quantity;
    }, 0);
};

// Format currency values

// Fetch required data
const fetchData = async () => {
    try {
        const productsResponse = await manufacturingService.getFinishedProducts();
        const rawMaterialsResponse = await manufacturingService.getRawMaterials();
        const unitsResponse = await ecommerceService.getUnits();

        products.value = productsResponse.data.results;
        rawMaterials.value = rawMaterialsResponse.data.results;
        units.value = unitsResponse.data.results;
    } catch (error) {
        console.error('Error fetching data:', error);
        // For demonstration purposes, using mock data
        initMockData();
        showToast('error', 'Error', 'Failed to load required data', 3000);
    }
};

// Helper functions to find items by ID in mock data
const findProductById = (id) => products.value.find((p) => p.id === id) || null;
const findRawMaterialById = (id) => rawMaterials.value.find((r) => r.id === id) || null;
const findUnitById = (id) => units.value.find((u) => u.id === id) || null;

// Mock data initialization
const initMockData = () => {
    units.value = [{ id: 1, title: 'Kg' }];

    products.value = [{ id: 1, product: { title: 'Liquid Detergent 1L' } }];

    rawMaterials.value = [{ id: 1, product: { title: 'Sodium Lauryl Sulfate' }, buying_price: 450 }];
};

// Form submission
const saveFormula = async () => {
    submitted.value = true;
    const isValid = await v$.value.$validate();

    if (!isValid) {
        showToast('error', 'Validation Error', 'Please check the form for errors', 3000);
        return;
    }

    if (formula.ingredients.length === 0) {
        showToast('error', 'Validation Error', 'At least one ingredient is required', 3000);
        return;
    }

    saving.value = true;

    try {
        // Prepare the data in the format expected by the API
        const payload = {
            name: formula.name,
            description: formula.description,
            final_product: formula.final_product.id, // Just send the ID
            expected_output_quantity: formula.expected_output_quantity,
            output_unit: formula.output_unit.id, // Just send the ID
            is_active: formula.is_active,
            ingredients: formula.ingredients.map((ingredient) => ({
                raw_material: ingredient.raw_material.id, // Just send the ID
                quantity: ingredient.quantity,
                unit: ingredient.unit.id, // Just send the ID
                notes: ingredient.notes || ''
            }))
        };

        let response;
        if (isEditMode.value) {
            response = await manufacturingService.updateFormula(route.params.id, payload);
        } else {
            response = await manufacturingService.createFormula(payload);
        }

        showToast('success', 'Success', `Formula ${isEditMode.value ? 'updated' : 'created'} successfully`, 3000);

        goBack();
    } catch (error) {
        console.error('Error saving formula:', error);
        showToast('error', 'Error', error.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} formula`, 3000);
    } finally {
        saving.value = false;
    }
};

// Update fetchFormulaDetails to handle the API response
const fetchFormulaDetails = async () => {
    if (!isEditMode.value) return;

    try {
        const response = await manufacturingService.getFormulaById(route.params.id);
        const apiData = response.data;

        // Map the API data to our form structure
        formula.name = apiData.name;
        formula.description = apiData.description;
        formula.final_product = apiData.final_product; // This should be the full product object
        formula.expected_output_quantity = apiData.expected_output_quantity;
        formula.output_unit = apiData.output_unit; // This should be the full unit object
        formula.is_active = apiData.is_active;

        // Map ingredients - assuming the API returns full objects for related fields
        formula.ingredients = apiData.ingredients.map((ing) => ({
            id: ing.id,
            raw_material: ing.raw_material, // Full raw material object
            quantity: ing.quantity,
            unit: ing.unit, // Full unit object
            notes: ing.notes
        }));
    } catch (error) {
        console.error('Error fetching formula:', error);
        showToast('error', 'Error', 'Failed to load formula details', 3000);
    }
};

const saveIngredient = () => {
    // Validate ingredient
    if (!ingredientDialog.item.raw_material || !ingredientDialog.item.quantity || !ingredientDialog.item.unit) {
        showToast('error', 'Validation Error', 'Raw material, quantity, and unit are required', 3000);
        return;
    }

    // Maintain full objects in the form for display purposes
    const newIngredient = {
        raw_material: ingredientDialog.item.raw_material,
        quantity: ingredientDialog.item.quantity,
        unit: ingredientDialog.item.unit,
        notes: ingredientDialog.item.notes || ''
    };

    if (ingredientDialog.isEdit) {
        formula.ingredients[ingredientDialog.editIndex] = newIngredient;
    } else {
        formula.ingredients.push(newIngredient);
    }

    closeIngredientDialog();
};

// Ingredient dialog functions
const openIngredientDialog = () => {
    ingredientDialog.isEdit = false;
    ingredientDialog.editIndex = -1;
    ingredientDialog.item = {
        raw_material: null,
        quantity: null,
        unit: null,
        notes: ''
    };
    ingredientDialog.visible = true;
};

const editIngredient = (ingredient, index) => {
    ingredientDialog.isEdit = true;
    ingredientDialog.editIndex = index;
    ingredientDialog.item = { ...ingredient };
    ingredientDialog.visible = true;
};

const removeIngredient = (index) => {
    formula.ingredients.splice(index, 1);
};

const closeIngredientDialog = () => {
    ingredientDialog.visible = false;
};

const goBack = () => {
    router.push('/manufacturing/formulas');
};

onMounted(() => {
    fetchData();
    fetchFormulaDetails();
});
</script>

<template>
    <div class="max-w-7xl mx-auto p-6">
        <Card class="mb-6">
            <template #content>
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">{{ isEditMode ? 'Edit Formula' : 'Create Formula' }}</h2>
                    <Button label="Back to Formulas" icon="pi pi-arrow-left" outlined @click="goBack" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="name" class="block text-sm font-medium mb-2">Formula Name*</label>
                        <InputText id="name" v-model="formula.name" :invalid="v$.name.$invalid && submitted" class="w-full" />
                        <small v-if="v$.name.$invalid && submitted" class="text-red-500">Formula name is required</small>
                    </div>

                    <div>
                        <label for="final_product" class="block text-sm font-medium mb-2">Final Product*</label>
                        <Dropdown
                            id="final_product"
                            v-model="formula.final_product"
                            :options="products"
                            optionLabel="title"
                            :filter="true"
                            :showClear="true"
                            :invalid="v$.final_product.$invalid && submitted"
                            placeholder="Select a product"
                            class="w-full"
                        />
                        <small v-if="v$.final_product.$invalid && submitted" class="text-red-500">Final product is required</small>
                        <Button icon="pi pi-plus" rounded text size="small" class="mt-2" @click="openProductDialog" label="Add Product" />
                    </div>

                    <div>
                        <label for="expected_output_quantity" class="block text-sm font-medium mb-2">Expected Output Quantity*</label>
                        <InputNumber id="expected_output_quantity" v-model="formula.expected_output_quantity" :invalid="v$.expected_output_quantity.$invalid && submitted" class="w-full" />
                        <small v-if="v$.expected_output_quantity.$invalid && submitted" class="text-red-500">Output quantity is required</small>
                    </div>

                    <div>
                        <label for="output_unit" class="block text-sm font-medium mb-2">Output Unit*</label>
                        <Dropdown id="output_unit" v-model="formula.output_unit" :options="units" optionLabel="title" :invalid="v$.output_unit.$invalid && submitted" placeholder="Select unit" class="w-full" />
                        <small v-if="v$.output_unit.$invalid && submitted" class="text-red-500">Output unit is required</small>
                    </div>

                    <div class="col-span-2">
                        <label for="description" class="block text-sm font-medium mb-2">Description</label>
                        <Textarea id="description" v-model="formula.description" rows="3" class="w-full" />
                    </div>
                </div>

                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-4">Formula Ingredients</h3>
                <div class="mb-4 flex justify-end">
                    <Button label="Add Ingredient" icon="pi pi-plus" @click="openIngredientDialog" />
                </div>

                <DataTable :value="formula.ingredients" responsiveLayout="scroll" stripedRows showGridlines>
                    <Column field="raw_material.product.title" header="Raw Material">
                        <template #body="slotProps">
                            {{ slotProps.data.raw_material?.title || 'N/A' }}
                        </template>
                    </Column>

                    <Column field="quantity" header="Quantity">
                        <template #body="slotProps"> {{ slotProps.data.quantity }} {{ slotProps.data.unit?.title || '' }} </template>
                    </Column>

                    <Column field="cost" header="Cost">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.quantity * (slotProps.data.raw_material?.buying_price || 0)) }}
                        </template>
                    </Column>

                    <Column field="notes" header="Notes">
                        <template #body="slotProps">
                            {{ slotProps.data.notes || '-' }}
                        </template>
                    </Column>

                    <Column header="Actions" style="width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" rounded text severity="secondary" @click="editIngredient(slotProps.data, slotProps.index)" />
                                <Button icon="pi pi-trash" rounded text severity="danger" @click="removeIngredient(slotProps.index)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6">
                    <div class="space-y-2">
                        <div class="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Total Raw Material Cost:
                            {{ formatCurrency(calculateTotalCost()) }}
                        </div>
                        <div class="text-gray-700 dark:text-gray-300">
                            Suggested Selling Price ({{ markupPercentage }}% markup):
                            {{ formatCurrency(calculateTotalCost() * (1 + markupPercentage / 100)) }}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
                        <Button label="Save Formula" icon="pi pi-save" @click="saveFormula" :loading="saving" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Ingredient Dialog -->
        <Dialog v-model:visible="ingredientDialog.visible" :header="ingredientDialog.isEdit ? 'Edit Ingredient' : 'Add Ingredient'" modal class="w-full md:w-1/2 lg:w-1/3">
            <div class="space-y-4">
                <div>
                    <label for="raw_material" class="block text-sm font-medium mb-2">Raw Material*</label>
                    <Dropdown id="raw_material" v-model="ingredientDialog.item.raw_material" :options="rawMaterials" optionLabel="title" placeholder="Select raw material" class="w-full" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="quantity" class="block text-sm font-medium mb-2">Quantity*</label>
                        <InputNumber id="quantity" v-model="ingredientDialog.item.quantity" class="w-full" />
                    </div>

                    <div>
                        <label for="unit" class="block text-sm font-medium mb-2">Unit*</label>
                        <Dropdown id="unit" v-model="ingredientDialog.item.unit" :options="units" optionLabel="title" placeholder="Select unit" class="w-full" />
                    </div>
                </div>

                <div>
                    <label for="notes" class="block text-sm font-medium mb-2">Notes</label>
                    <Textarea id="notes" v-model="ingredientDialog.item.notes" rows="2" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="closeIngredientDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveIngredient" />
            </template>
        </Dialog>

        <!-- New Product Dialog -->
        <Dialog
            v-model:visible="productDialog"
            :header="editMode ? 'Edit Product' : 'Add Product'"
            :modal="true"
            editMode="editMode"
            class="w-full md:w-3/4"
            :closeOnEscape="true"
            :maximizable="true"
            @hide="resetForm"
        >
            <ProductForm :product="null" :editMode="false" :is_manufactured="true" :mainCategories="[]" :categories="[]" :subcategories="[]" :brands="[]" :models="[]" @fetch-products="fetchData" @cancel="productDialog = false" />
        </Dialog>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

:deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-800;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}
</style>
