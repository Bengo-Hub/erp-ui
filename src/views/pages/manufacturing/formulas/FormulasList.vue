<script setup>
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import { useToast } from '@/composables/useToast';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const router = useRouter();
const { showToast } = useToast();
const confirm = useConfirm();

// Reactive state
const formulas = ref([]);
const selectedFormulas = ref([]);
const loading = ref(false);
const markupPercentage = ref(30); // Default markup percentage

// Formula ingredients dialog
const ingredientsDialog = reactive({
    visible: false,
    title: '',
    formula: null,
    ingredients: [],
    totalCost: 0
});

// Filters for data table
const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch formulas from API
const fetchFormulas = async () => {
    loading.value = true;
    try {
        const response = await manufacturingService.getFormulas();
        formulas.value = response.data.results;
        console.log('Formulas loaded:', formulas.value);
    } catch (error) {
        console.error('Error fetching formulas:', error);
        showToast('error', 'Failed to load formulas');
    } finally {
        loading.value = false;
    }
};

// Navigation functions
const navigateToNewFormula = () => {
    router.push('/manufacturing/formulas/new');
};

const editFormula = (formula) => {
    router.push(`/manufacturing/formulas/${formula.id}/edit`);
};

// Formula operations
const createNewVersion = (formula) => {
    confirm.require({
        message: `Create a new version of formula "${formula.name}"?`,
        header: 'Create New Version',
        icon: 'pi pi-copy',
        accept: () => {
            showToast('info', `Creating new version of ${formula.name}`);
            // Navigate to new version creation page
            router.push(`/manufacturing/formulas/${formula.id}/new-version`);
        }
    });
};

const toggleFormulaStatus = (formula) => {
    confirm.require({
        message: `Are you sure you want to ${formula.is_active ? 'deactivate' : 'activate'} "${formula.name}"?`,
        header: formula.is_active ? 'Deactivate Formula' : 'Activate Formula',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // Call the actual API to update formula status
                const response = await manufacturingService.updateFormulaStatus(formula.id, !formula.is_active);

                // Update local state with the response data
                const updatedFormula = response.data;

                // Update the formulas array with the modified formula
                const index = formulas.value.findIndex((f) => f.id === formula.id);
                if (index !== -1) {
                    formulas.value[index] = updatedFormula;
                    // Create a new array reference to trigger reactivity
                    formulas.value = [...formulas.value];
                }

                showToast('success', `Formula ${updatedFormula.is_active ? 'activated' : 'deactivated'} successfully`);
            } catch (error) {
                console.error('Error updating formula status:', error);
                showToast('error', 'Failed to update formula status');
            }
        }
    });
};

const createBatch = async (formula) => {
    loading.value = true;
    ingredientsDialog.title = `Create Batch: ${formula.name}`;
    ingredientsDialog.formula = formula;

    try {
        // Fetch the formula ingredients from the API
        const response = await manufacturingService.getFormulaIngredients(formula.id);
        ingredientsDialog.ingredients = response.data.results || [];

        // Calculate total cost
        ingredientsDialog.totalCost = ingredientsDialog.ingredients.reduce((sum, item) => sum + item.quantity * (item.raw_material_details?.buying_price || 0), 0);

        ingredientsDialog.visible = true;
    } catch (error) {
        console.error('Error fetching formula ingredients:', error);
        showToast('error', 'Failed to load formula ingredients');
    } finally {
        loading.value = false;
    }
};

const createBatchFromDialog = () => {
    // Close dialog and navigate to batch creation page
    ingredientsDialog.visible = false;
    router.push({
        path: '/manufacturing/batches/new',
        query: { formula_id: ingredientsDialog.formula.id }
    });

    showToast('success', `Creating new batch from ${ingredientsDialog.formula.name}`);
};

// Helper functions

onMounted(() => {
    // Fetch real data from the API
    fetchFormulas();
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <!-- Breadcrumb -->
            <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Formulas' }]" />

            <!-- Toolbar -->
            <ManufacturingToolbar title="Product Formulas" icon="pi pi-flask">
                <template #actions>
                    <span class="p-input-icon-left w-full sm:w-auto">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.global.value" placeholder="Search formulas" class="w-full" />
                    </span>
                    <Button label="New Formula" icon="pi pi-plus" class="p-button-raised w-full sm:w-auto" @click="navigateToNewFormula" />
                </template>
            </ManufacturingToolbar>

            <div class="card shadow-2 border-round-xl p-4">
                <DataTable
                    :value="formulas"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} formulas"
                    responsiveLayout="stack"
                    breakpoint="960px"
                    class="p-datatable-sm"
                    v-model:selection="selectedFormulas"
                    :loading="loading"
                    stripedRows
                    showGridlines
                    removableSort
                >
                    <Column selectionMode="multiple" headerStyle="width: 3rem" />

                    <Column field="name" header="Formula Name" sortable>
                        <template #body="slotProps">
                            <router-link :to="'/manufacturing/formulas/' + slotProps.data.id">
                                {{ slotProps.data.name }}
                            </router-link>
                        </template>
                    </Column>

                    <Column field="final_product_details.title" header="Product" sortable>
                        <template #body="slotProps">
                            {{ slotProps.data.final_product_details?.title || 'N/A' }}
                        </template>
                    </Column>

                    <Column field="expected_output_quantity" header="Qty" sortable>
                        <template #body="slotProps"> {{ slotProps.data.expected_output_quantity }} {{ slotProps.data.output_unit_details?.title || '' }} </template>
                    </Column>

                    <Column field="raw_material_cost" header="Raw Material Cost" sortable>
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.raw_material_cost) }}
                        </template>
                    </Column>

                    <Column field="suggested_selling_price" header="Suggested Price" sortable>
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.suggested_selling_price) }}
                        </template>
                    </Column>

                    <Column field="is_active" header="Status" sortable style="width: 100px">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.is_active ? 'Active' : 'Inactive'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                        </template>
                    </Column>

                    <Column field="version" header="Version" sortable style="width: 90px">
                        <template #body="slotProps">
                            <Badge :value="slotProps.data.version" severity="info" />
                        </template>
                    </Column>

                    <Column field="created_at" header="Created" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.created_at) }}
                        </template>
                    </Column>

                    <Column header="Actions" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-2">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm" tooltip="Edit Formula" tooltipOptions="{position:'top'}" @click="editFormula(slotProps.data)" />
                                <Button icon="pi pi-copy" class="p-button-rounded p-button-text p-button-sm" tooltip="Create New Version" tooltipOptions="{position:'top'}" @click="createNewVersion(slotProps.data)" />
                                <Button
                                    icon="pi pi-cog"
                                    class="p-button-rounded p-button-text p-button-sm"
                                    tooltip="Toggle Status"
                                    tooltipOptions="{position:'top'}"
                                    @click="toggleFormulaStatus(slotProps.data)"
                                    :disabled="!slotProps.data.is_active"
                                />
                                <Button icon="pi pi-play" class="p-button-rounded p-button-success p-button-text p-button-sm" tooltip="Create Batch" tooltipOptions="{position:'top'}" @click="createBatch(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Formula Ingredients Preview Dialog -->
        <Dialog v-model:visible="ingredientsDialog.visible" :header="ingredientsDialog.title" modal style="width: 50vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="p-dialog-md">
            <DataTable :value="ingredientsDialog.ingredients" responsiveLayout="stack" breakpoint="960px" class="p-datatable-sm" stripedRows showGridlines>
                <Column field="raw_material_details.product.title" header="Raw Material">
                    <template #body="slotProps">
                        {{ slotProps.data.raw_material_details?.product?.title || 'N/A' }}
                    </template>
                </Column>
                <Column field="quantity" header="Quantity">
                    <template #body="slotProps"> {{ slotProps.data.quantity }} {{ slotProps.data.unit_details?.title || '' }} </template>
                </Column>
                <Column field="raw_material_details.buying_price" header="Cost per Unit">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.raw_material_details?.buying_price) }}
                    </template>
                </Column>
                <Column field="itemCost" header="Cost">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.quantity * (slotProps.data.raw_material_details?.buying_price || 0)) }}
                    </template>
                </Column>
            </DataTable>
            <div class="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 mt-4">
                <div>
                    <div class="text-lg font-bold mb-2">
                        Total Raw Material Cost:
                        {{ formatCurrency(ingredientsDialog.totalCost) }}
                    </div>
                    <div>
                        Suggested Selling Price ({{ markupPercentage }}% markup):
                        {{ formatCurrency(ingredientsDialog.totalCost * (1 + markupPercentage / 100)) }}
                    </div>
                </div>
                <Button label="Create Batch" icon="pi pi-play" class="p-button-raised w-full sm:w-auto mt-3 sm:mt-0" @click="createBatchFromDialog" />
            </div>
        </Dialog>
    </div>
</template>
