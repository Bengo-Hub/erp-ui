<script setup>
import { useToast } from '@/composables/useToast';
import { coreService } from '@/services/shared/coreService';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { useVuelidate } from '@vuelidate/core';
import { minValue, required } from '@vuelidate/validators';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

// UI State
const loading = ref(false);
const saving = ref(false);
const checkingMaterials = ref(false);
const submitted = ref(false);
const confirmShortage = ref(false);

// Steps for batch creation
const currentStep = ref(0);
const steps = ref([{ label: 'Formula Selection' }, { label: 'Production Details' }, { label: 'Material Verification' }, { label: 'Review & Submit' }]);

// Add step navigation logic
const nextStep = async () => {
    submitted.value = true;
    let isValid = true;

    // Step-specific validation
    switch (currentStep.value) {
        case 0:
            isValid = !v$.value.formula.$invalid;
            break;
        case 1:
            isValid = !v$.value.location.$invalid && !v$.value.scheduled_date.$invalid && !v$.value.planned_quantity.$invalid;
            break;
        case 2:
            if (materialShortages.value.length > 0 && !confirmShortage.value) {
                showToast('error', 'Error', 'Please confirm material shortage to proceed', 3000);
                isValid = false;
            }
            break;
    }

    if (isValid) {
        if (currentStep.value < steps.value.length - 1) {
            currentStep.value++;
            submitted.value = false;

            // Scroll to top of form for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        showToast('error', 'Validation Error', 'Please complete required fields', 3000);
    }
};

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
        submitted.value = false;
    }
};

// Add date formatting helper
const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(date));
};

// Form state
const batch = reactive({
    formula: null,
    branch: null,
    scheduled_date: null,
    planned_quantity: null,
    supervisor: null,
    notes: ''
});

const formulas = ref([]);
const branches = ref([]);
const supervisors = ref([]);
const requiredMaterials = ref([]);
const materialShortages = ref([]);

// Validation rules
const rules = {
    formula: { required },
    branch: { required },
    scheduled_date: { required },
    planned_quantity: { required, minValue: minValue(0.01) }
};
const v$ = useVuelidate(rules, batch);

// Computed properties
const selectedFormula = computed(() => batch.formula);

const totalMaterialCost = computed(() => {
    if (!requiredMaterials.value.length) return 0;
    return requiredMaterials.value.reduce((total, material) => {
        return total + (material.raw_material_details.buying_price || 0);
    }, 0);
});

// Watch for formula and planned quantity changes to update required materials
watch([() => batch.formula, () => batch.planned_quantity], () => {
    if (batch.formula && batch.planned_quantity) {
        calculateRequiredMaterials();
    } else {
        requiredMaterials.value = [];
        materialShortages.value = [];
    }
});

// Format helpers
const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat().format(num);
};

// Data loading
const fetchFormulas = async () => {
    try {
        loading.value = true;
        const response = await manufacturingService.getFormulas({ is_active: true });
        formulas.value = response.data.results;
        // If we received empty formulas, show a notification
        if (formulas.value.length === 0) {
            showToast('info', 'No Formulas', 'No active formulas found. Please create a formula first.', 5000);
        }
    } catch (error) {
        console.error('Error fetching formulas:', error);
        showToast('error', 'Error', 'Failed to load formulas', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchBranches = async () => {
    try {
        loading.value = true;
        const response = await coreService.getBranches();
        branches.value = response.data.results;
    } catch (error) {
        console.error('Error fetching branches:', error);
        showToast('error', 'Error', 'Failed to load production branches', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchSupervisors = async () => {
    try {
        loading.value = true;
        const response = await manufacturingService.getInspectors();
        supervisors.value = response.data;
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        showToast('error', 'Error', 'Failed to load supervisors', 3000);
    } finally {
        loading.value = false;
    }
};

// Calculate required materials based on formula and planned quantity
const calculateRequiredMaterials = async () => {
    if (!batch.formula || !batch.planned_quantity) {
        requiredMaterials.value = [];
        materialShortages.value = [];
        return;
    }

    checkingMaterials.value = true;

    try {
        // Find the selected formula's ingredients
        requiredMaterials.value = [];
        materialShortages.value = [];
        batch.formula.ingredients.value = batch.formula.ingredients;
        batch.planned_quantity = batch.formula.expected_output_quantity;
        // Call the API to check material availability
        const response = await manufacturingService.checkMaterialAvailability(batch.formula.id, batch.planned_quantity);

        const result = response.data;
        requiredMaterials.value = batch.formula.ingredients || [];
        materialShortages.value = result.shortages || [];
    } catch (error) {
        console.error('Error checking material availability:', error);
        showToast('error', 'Error', 'Failed to check material availability', 3000);

        // Fallback to client-side calculation if API fails
        if (batch.formula.ingredients) {
            const ratio = batch.planned_quantity / batch.formula.expected_output_quantity;
            const materials = [];
            const shortages = [];

            batch.formula.ingredients.forEach((ingredient) => {
                const requiredQty = ingredient.quantity * ratio;
                const availableQty = ingredient.raw_material.stock_level;
                const cost = ingredient.raw_material.buying_price * requiredQty;
                const status = availableQty >= requiredQty ? 'Available' : 'Insufficient';

                materials.push({
                    raw_material: ingredient.raw_material,
                    required_quantity: requiredQty,
                    available_quantity: availableQty,
                    unit: ingredient.unit,
                    status: status,
                    cost: cost
                });

                if (status === 'Insufficient') {
                    shortages.push({
                        raw_material: ingredient.raw_material,
                        shortage: requiredQty - availableQty,
                        unit: ingredient.unit
                    });
                }
            });

            requiredMaterials.value = materials;
            materialShortages.value = shortages;
        }
    } finally {
        checkingMaterials.value = false;
    }
};

// Form handling
const onFormulaChange = async () => {
    // Reset planned quantity to formula's expected output
    if (batch.formula) {
        batch.planned_quantity = batch.formula.expected_output_quantity;

        // If we selected a formula but don't have ingredients, fetch the complete formula details
        if (!batch.formula.ingredients || batch.formula.ingredients.length === 0) {
            try {
                loading.value = true;
                const response = await manufacturingService.getFormula(batch.formula.id);
                // Update the formula with complete details
                const fullFormula = response.data;

                // Keep the selected formula reference but update with full details
                Object.assign(batch.formula, fullFormula);
            } catch (error) {
                console.error('Error fetching formula details:', error);
                showToast('error', 'Error', 'Failed to load formula details', 3000);
            } finally {
                loading.value = false;
            }
        }

        // Calculate required materials after formula change
        await calculateRequiredMaterials();
    } else {
        batch.planned_quantity = null;
        requiredMaterials.value = [];
        materialShortages.value = [];
    }
};

const saveBatch = async () => {
    submitted.value = true;
    const isValid = await v$.value.$validate();

    if (!isValid) {
        showToast('error', 'Validation Error', 'Please check the form for errors', 3000);
        return;
    }

    // Check if there are material shortages
    if (materialShortages.value.length > 0) {
        // Show a confirmation dialog to proceed despite shortages
        const proceed = confirm('There are insufficient materials for this batch. Do you want to proceed anyway?');

        if (!proceed) {
            return;
        }
    }

    saving.value = true;

    try {
        // Prepare the payload for API
        const payload = {
            formula: batch.formula.id,
            branch: batch.branch.id,
            scheduled_date: batch.scheduled_date.toISOString(),
            planned_quantity: batch.planned_quantity,
            supervisor: batch.supervisor?.id || null,
            notes: batch.notes,
            status: 'planned'
        };

        // Call the API to create the batch
        const response = await manufacturingService.createBatch(payload);

        showToast('success', 'Success', 'Production batch created successfully', 3000);

        // Navigate to the batch details page for the newly created batch
        router.push(`/manufacturing/batches/${response.data.id}`);
    } catch (error) {
        console.error('Error creating batch:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to create production batch', 5000);
    } finally {
        saving.value = false;
    }
};

const goBack = () => {
    // Ask for confirmation if form has been filled out
    if (batch.formula || batch.planned_quantity || batch.notes) {
        confirm.require({
            message: 'You have unsaved changes. Are you sure you want to leave?',
            header: 'Confirm Navigation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                router.push('/manufacturing/batches');
            }
        });
    } else {
        router.push('/manufacturing/batches');
    }
};

const saveAsDraft = async () => {
    try {
        saving.value = true;

        // Prepare payload with draft status
        const payload = {
            formula_id: batch.formula?.id,
            branch_code: batch.branch?.branch_code,
            scheduled_date: batch.scheduled_date?.toISOString(),
            planned_quantity: batch.planned_quantity,
            supervisor_id: batch.supervisor?.id || null,
            notes: batch.notes,
            status: 'draft' // Save as draft status
        };

        // Call the API to create the batch as draft
        const response = await manufacturingService.createBatch(payload);

        showToast('success', 'Draft Saved', 'Production batch saved as draft successfully', 3000);

        router.push('/manufacturing/batches');
    } catch (error) {
        console.error('Error saving draft:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to save batch as draft', 5000);
    } finally {
        saving.value = false;
    }
};

const navigateToInventory = () => {
    router.push('/inventory/stock');
};

// Watch for changes in planned quantity to recalculate materials
watch(
    () => batch.planned_quantity,
    async (newValue, oldValue) => {
        if (newValue !== oldValue && batch.formula && newValue > 0) {
            await calculateRequiredMaterials();
        }
    }
);

onMounted(async () => {
    // Default schedule date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9:00 AM
    batch.scheduled_date = tomorrow;

    // Load initial data
    await Promise.all([fetchFormulas(), fetchBranches(), fetchSupervisors()]);
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card relative">
                <!-- Loading Overlay -->
                <div v-if="loading" class="flex flex-column align-items-center justify-content-center absolute w-full h-full z-5" style="background-color: rgba(255, 255, 255, 0.8)">
                    <ProgressSpinner class="w-4rem h-4rem" strokeWidth="5" />
                    <span class="mt-3 font-medium">Loading...</span>
                </div>

                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Create Production Batch</h5>
                    <Button label="Back to Batches" icon="pi pi-arrow-left" outlined @click="goBack" />
                </div>

                <!-- Progress Steps -->
                <Steps :key="'steps-' + currentStep" :model="steps" :readonly="false" :activeIndex="currentStep" class="mb-5" />
                <!-- Step 1: Formula Selection -->
                <div v-if="currentStep === 0" class="formgrid grid p-fluid">
                    <div class="field col-12">
                        <label for="formula" class="font-bold">Formula*</label>
                        <Dropdown id="formula" v-model="batch.formula" :options="formulas" optionLabel="name" :class="{ 'p-invalid': v$.formula.$invalid && submitted }" placeholder="Select a formula" class="w-full" @change="onFormulaChange" />
                        <small v-if="v$.formula.$invalid && submitted" class="p-error">Formula is required</small>
                    </div>
                </div>

                <!-- Step 2: Production Details -->
                <div v-if="currentStep === 1" class="formgrid grid p-fluid">
                    <div class="field col-12 md:col-6">
                        <label for="branch" class="font-bold">Production Branch*</label>
                        <Dropdown
                            id="branch"
                            v-model="batch.branch"
                            :options="branches"
                            optionLabel="name"
                            :filter="true"
                            filterPlaceholder="Search branch"
                            :class="{ 'p-invalid': v$.branch.$invalid && submitted }"
                            placeholder="Select branch"
                            class="w-full"
                        />
                        <small v-if="v$.branch.$invalid && submitted" class="p-error">Branch is required</small>
                    </div>

                    <div class="field col-12 md:col-6">
                        <label for="scheduled_date" class="font-bold">Scheduled Date*</label>
                        <Calendar id="scheduled_date" v-model="batch.scheduled_date" showTime hourFormat="24" :class="{ 'p-invalid': v$.scheduled_date.$invalid && submitted }" class="w-full" />
                        <small v-if="v$.scheduled_date.$invalid && submitted" class="p-error">Scheduled date is required</small>
                    </div>

                    <div class="field col-12 md:col-6">
                        <label for="planned_quantity" class="font-bold">Planned Quantity*</label>
                        <div class="p-inputgroup">
                            <InputNumber id="planned_quantity" v-model="batch.planned_quantity" :class="{ 'p-invalid': v$.planned_quantity.$invalid && submitted }" class="w-full" />
                            <span class="p-inputgroup-addon">{{ selectedFormula?.output_unit_details?.title || 'Units' }}</span>
                        </div>
                        <small v-if="v$.planned_quantity.$invalid && submitted" class="p-error">Planned quantity is required</small>
                    </div>

                    <div class="field col-12 md:col-6">
                        <label for="supervisor" class="font-bold">Supervisor</label>
                        <Dropdown id="supervisor" v-model="batch.supervisor" :options="supervisors" optionLabel="email" :filter="true" filterPlaceholder="Search supervisor" placeholder="Select supervisor" class="w-full" />
                    </div>

                    <div class="field col-12">
                        <label for="notes" class="font-bold">Notes</label>
                        <Textarea id="notes" v-model="batch.notes" rows="3" class="w-full" />
                    </div>
                </div>

                <!-- Step 3: Material Verification -->
                <div v-if="currentStep === 2" class="formgrid grid p-fluid">
                    <h5 class="mt-0 mb-3 flex align-items-center">
                        <span>Required Raw Materials</span>
                        <div v-if="checkingMaterials" class="ml-3 flex align-items-center">
                            <ProgressSpinner style="width: 1.5rem; height: 1.5rem" strokeWidth="6" />
                            <span class="ml-2 text-sm">Checking availability...</span>
                        </div>
                    </h5>
                    <DataTable :value="requiredMaterials" responsiveLayout="stack" breakpoint="960px" stripedRows class="p-datatable-sm" showGridlines :loading="checkingMaterials">
                        <Column field="raw_material_details.product.title" header="Material">
                            <template #body="slotProps">
                                {{ slotProps.data?.raw_material_details?.product?.title || 'N/A' }}
                            </template>
                        </Column>

                        <Column field="required_quantity" header="Required Quantity">
                            <template #body="slotProps"> {{ formatNumber(slotProps.data.quantity) }} {{ slotProps.data.unit_details?.title || '' }} </template>
                        </Column>

                        <Column field="available_quantity" header="Available">
                            <template #body="slotProps"> {{ formatNumber(slotProps.data.raw_material_details?.stock_level) }} {{ slotProps.data.unit_details?.title || '' }} </template>
                        </Column>

                        <Column field="status" header="Status">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.raw_material_details.availability" :severity="slotProps.data.raw_material_details.availability === 'In Stock' ? 'success' : 'danger'" />
                            </template>
                        </Column>

                        <Column field="cost" header="Cost">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.raw_material_details.buying_price) }}
                            </template>
                        </Column>
                    </DataTable>

                    <!-- Material Shortages Alert -->
                    <div v-if="materialShortages.length > 0" class="p-4 border-round surface-card shadow-1 mt-4 mb-4">
                        <div class="flex align-items-center mb-3">
                            <Checkbox v-model="confirmShortage" binary class="mr-2" />
                            <label class="text-yellow-800">I understand the material shortage and want to proceed anyway</label>
                        </div>

                        <div class="flex align-items-center mb-3">
                            <i class="pi pi-exclamation-triangle text-yellow-500 mr-2" style="font-size: 1.5rem"></i>
                            <h5 class="m-0 text-yellow-700">Material Shortages Detected</h5>
                        </div>

                        <div class="text-700 mb-4">The following materials have insufficient stock levels:</div>
                        <ul class="mt-2 mb-3 pl-4">
                            <li v-for="(shortage, index) in materialShortages" :key="index" class="mb-2">
                                <div class="flex align-items-center flex-wrap gap-2">
                                    <span class="font-medium">{{ shortage.raw_material.product.title }}:</span>
                                    <Tag severity="danger" value="Shortage" />
                                    <span
                                        >Need additional <span class="font-bold">{{ formatNumber(shortage.shortage) }} {{ shortage.unit.title }}</span></span
                                    >
                                </div>
                            </li>
                        </ul>
                        <div class="flex gap-2 mt-3">
                            <Button label="View Inventory" icon="pi pi-box" outlined @click="navigateToInventory" />
                            <Button label="Order Materials" icon="pi pi-shopping-cart" severity="warning" text @click="navigateToInventory" />
                        </div>
                    </div>

                    <!-- Total Cost -->
                    <div v-if="totalMaterialCost > 0" class="flex justify-content-end mt-4 mb-4">
                        <div class="p-3 border-round surface-card shadow-1 w-auto">
                            <div class="text-500 mb-1">Total Material Cost</div>
                            <div class="text-900 font-medium text-xl">{{ formatCurrency(totalMaterialCost) }}</div>
                        </div>
                    </div>
                </div>

                <!-- Step 4: Review & Submit -->
                <div v-if="currentStep === 3" class="review-content">
                    <div class="grid flex-column md:flex-row">
                        <div class="col-12 md:col-6 lg:col-6">
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Formula:</label>
                                <span>{{ batch.formula?.name || 'N/A' }}</span>
                            </div>
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Production Branch:</label>
                                <span>{{ batch.branch?.name || 'N/A' }}</span>
                            </div>
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Scheduled Date:</label>
                                <span>{{ formatDateTime(batch.scheduled_date) }}</span>
                            </div>
                        </div>
                        <div class="col-12 md:col-6 lg:col-6">
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Planned Quantity:</label>
                                <span>{{ batch.planned_quantity }} {{ selectedFormula?.output_unit_details?.title || 'Units' }}</span>
                            </div>
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Supervisor:</label>
                                <span>{{ batch.supervisor?.email || 'N/A' }}</span>
                            </div>
                            <div class="field mb-4">
                                <label class="font-bold block mb-2">Notes:</label>
                                <span class="whitespace-pre-wrap">{{ batch.notes || 'N/A' }}</span>
                            </div>
                        </div>
                    </div>

                    <Divider />

                    <h5 class="mt-0 mb-3">Material Requirements</h5>
                    <DataTable :value="requiredMaterials" class="p-datatable-sm"> <!-- DataTable columns same as before --> </DataTable
                    ><DataTable :value="requiredMaterials" responsiveLayout="stack" breakpoint="960px" stripedRows class="p-datatable-sm" showGridlines :loading="checkingMaterials">
                        <Column field="raw_material_details.product.title" header="Material">
                            <template #body="slotProps">
                                {{ slotProps.data?.raw_material_details?.product?.title || 'N/A' }}
                            </template>
                        </Column>

                        <Column field="required_quantity" header="Required Quantity">
                            <template #body="slotProps"> {{ formatNumber(slotProps.data.quantity) }} {{ slotProps.data.unit_details?.title || '' }} </template>
                        </Column>

                        <Column field="available_quantity" header="Available">
                            <template #body="slotProps"> {{ formatNumber(slotProps.data.raw_material_details?.stock_level) }} {{ slotProps.data.unit_details?.title || '' }} </template>
                        </Column>

                        <Column field="status" header="Status">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.raw_material_details.availability" :severity="slotProps.data.raw_material_details.availability === 'In Stock' ? 'success' : 'danger'" />
                            </template>
                        </Column>

                        <Column field="cost" header="Cost">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.raw_material_details.buying_price) }}
                            </template>
                        </Column>
                    </DataTable>

                    <div class="flex justify-content-end mt-4">
                        <div class="p-3 border-round surface-card shadow-1 w-auto">
                            <div class="text-500 mb-1">Total Material Cost</div>
                            <div class="text-900 font-medium text-xl">{{ formatCurrency(totalMaterialCost) }}</div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-content-between mt-5">
                    <Button v-if="currentStep > 0" label="Previous" icon="pi pi-arrow-left" outlined @click="previousStep" />
                    <Button v-else label="Cancel" icon="pi pi-times" outlined class="p-button-danger" @click="goBack" />

                    <div class="flex gap-2">
                        <Button label="Save as Draft" icon="pi pi-save" outlined @click="saveAsDraft" />
                        <Button v-if="currentStep < steps.length - 1" label="Next" icon="pi pi-arrow-right" @click="nextStep" :loading="saving" />
                        <Button v-else label="Create Batch" icon="pi pi-check" @click="saveBatch" :loading="saving" :disabled="materialShortages.length > 0 && !confirmShortage" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.review-content .field label {
    color: var(--surface-700);
}
.whitespace-pre-wrap {
    white-space: pre-wrap;
}
</style>
