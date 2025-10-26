<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { formatDate } from '@/utils/formatters';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const confirm = useConfirm();

const formulas = ref([]);
const filters = ref({ type: null, category: null, effective_date: null, search: '' });
const selectedFormula = ref(null);
const selectedFormulas = ref([]);
const activeTab = ref(0); // Active formula type tab

// Tab categories matching Image 2 design
const formulaTabs = [
    { label: 'Income Tax', value: 'income', icon: 'pi pi-percentage' },
    { label: 'Deductions', value: 'deduction', icon: 'pi pi-minus-circle' },
    { label: 'Levies', value: 'levy', icon: 'pi pi-building' },
    { label: 'FBT', value: 'fbt', icon: 'pi pi-briefcase' },
    { label: 'Earnings', value: 'earning', icon: 'pi pi-plus-circle' },
    { label: 'Relief Allowances', value: 'relief_allowance', icon: 'pi pi-shield' }
];

// Dialogs
const formulaDialog = ref(false);
const deleteDialog = ref(false);
const viewDialog = ref(false);
const editMode = ref(false);
const submitted = ref(false);

// Loading states
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Form
const formulaForm = ref({
    title: '',
    type: null,
    category: null,
    description: '',
    effective_from: null,
    effective_to: null,
    is_current: false,
    is_active: true
});

// Formula type options matching backend model choices
const typeOptions = [
    { label: 'Income Tax Formula', value: 'income' },
    { label: 'Deduction Formula', value: 'deduction' },
    { label: 'Earning Formula', value: 'earning' },
    { label: 'Fridge Benefit Tax Formula', value: 'fbt' },
    { label: 'Levy Formula', value: 'levy' },
    { label: 'Relief Allowance Formula', value: 'relief_allowance' }
];

// Formula category options matching backend model choices
const categoryOptions = [
    { label: 'P.A.Y.E Primary Employee', value: 'primary' },
    { label: 'P.A.Y.E Secondary Employee', value: 'secondary' },
    { label: 'Fridge Benefit Tax', value: 'fbt' },
    { label: 'Housing Levy', value: 'housing_levy' },
    { label: 'Social Security Fund', value: 'social_security_fund' },
    { label: 'NHIF Contributions', value: 'nhif' },
    { label: 'SHIF Contributions', value: 'shif' }
];

const fetchFormulas = async () => {
    const params = {};
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.effective_date) params.effective_date = filters.value.effective_date;
    
    console.log('Fetching formulas with params:', params);
    
    loading.value = true;
    try {
        const { data } = await payrollService.listFormulas(params);
        formulas.value = data.results || data || [];
        
        console.log('Fetched formulas:', formulas.value.length, 'formulas');
        
        if (formulas.value.length === 0) {
            console.log('No formulas found for filter:', filters.value);
        }
    } catch (error) {
        console.error('Error loading formulas:', error);
        showToast('error', 'Failed to load formulas', error?.response?.data?.detail || error.message);
        formulas.value = [];
    } finally {
        loading.value = false;
    }
};

const showAddFormulaDialog = () => {
    formulaForm.value = {
        title: '',
        type: formulaTabs[activeTab.value]?.value || null,
        category: null,
        description: '',
        effective_from: null,
        effective_to: null,
        is_current: false,
        is_active: true
    };
    editMode.value = false;
    submitted.value = false;
    formulaDialog.value = true;
};

const createFormulaOfType = (type) => {
    formulaForm.value = {
        title: '',
        type: type,
        category: null,
        description: '',
        effective_from: null,
        effective_to: null,
        is_current: false,
        is_active: true
    };
    editMode.value = false;
    submitted.value = false;
    formulaDialog.value = true;
};

const editFormula = (formula) => {
    // Navigate to detail page for full editing
    router.push(`/settings/payroll/formulas/${formula.id}`);
};

const viewFormula = (formula) => {
    // Navigate to detail page for viewing
    router.push(`/settings/payroll/formulas/${formula.id}`);
};

const viewFormulaDetails = (formula) => {
    router.push(`/settings/payroll/formulas/${formula.id}`);
};

const saveFormula = async () => {
    submitted.value = true;

    if (!formulaForm.value.title || !formulaForm.value.type || !formulaForm.value.category) {
        showToast('warn', 'Please fill all required fields', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        const payload = {
            ...formulaForm.value,
            effective_from: formulaForm.value.effective_from ? 
                new Date(formulaForm.value.effective_from).toISOString().split('T')[0] : null,
            effective_to: formulaForm.value.effective_to ? 
                new Date(formulaForm.value.effective_to).toISOString().split('T')[0] : null
        };

        if (editMode.value && formulaForm.value.id) {
            await payrollService.updateFormula(formulaForm.value.id, payload);
            showToast('success', 'Formula updated successfully', 'Success');
            formulaDialog.value = false;
            await fetchFormulas();
        } else {
            // Create new formula and navigate to detail page for full configuration
            const { data: newFormula } = await payrollService.createFormula(payload);
            showToast('success', 'Formula created! Configure tax brackets now.', 'Success');
            formulaDialog.value = false;
            router.push(`/settings/payroll/formulas/${newFormula.id}`);
        }
    } catch (error) {
        console.error('Error saving formula:', error);
        showToast('error', error.response?.data?.message || 'Failed to save formula', 'Error');
    } finally {
        saving.value = false;
    }
};

const confirmDeleteFormula = (formula) => {
    selectedFormula.value = formula;
    deleteDialog.value = true;
};

const deleteFormula = async () => {
    deleting.value = true;
    try {
        await payrollService.deleteFormula(selectedFormula.value.id);
        showToast('success', 'Formula deleted successfully', 'Success');
        deleteDialog.value = false;
        await fetchFormulas();
    } catch (error) {
        console.error('Error deleting formula:', error);
        showToast('error', 'Failed to delete formula', 'Error');
    } finally {
        deleting.value = false;
    }
};

const changeTab = (index) => {
    console.log('Changing tab to index:', index, 'Type:', formulaTabs[index].value);
    activeTab.value = index;
    filters.value.type = formulaTabs[index].value;
    filters.value.category = null;
    filters.value.effective_date = null;
    filters.value.search = '';
    fetchFormulas();
};

const clearFilters = () => {
    filters.value = { 
        type: formulaTabs[activeTab.value]?.value || null, 
        category: null, 
        effective_date: null,
        search: ''
    };
    fetchFormulas();
};

// Helper function to format dates as "Month, Year"
const formatMonthYear = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Helper function to get category label
const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.label || category?.replace('_', ' ') || '-';
};

// Watch for filter changes (for debugging)
watch(() => filters.value.type, (newType, oldType) => {
    console.log('Filter type changed from', oldType, 'to', newType);
});

watch(() => activeTab.value, (newTab, oldTab) => {
    console.log('Active tab changed from', oldTab, 'to', newTab);
});

onMounted(() => {
    // Set initial filter to first tab (Income Tax)
    console.log('Component mounted, setting initial filter to:', formulaTabs[0].value);
    filters.value.type = formulaTabs[0].value;
    fetchFormulas();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- DEBUG INFO (Remove in production) -->
        <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded text-xs">
            <strong>DEBUG:</strong> 
            Active Tab: {{ activeTab }} | 
            Filter Type: {{ filters.type }} | 
            Formulas Count: {{ formulas.length }} | 
            Loading: {{ loading }}
        </div>

        <!-- Header with Back Button -->
        <div class="mb-4">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.push('/settings/payroll')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Formulas :</span>
            </div>
            
            <!-- Search/Filter Input and Add Button -->
            <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center mb-4">
                <InputText 
                    v-model="filters.search" 
                    placeholder="Search formulas..." 
                    class="flex-1"
                />
                <SplitButton 
                    label="Add a Formula" 
                    icon="pi pi-calculator" 
                    severity="primary"
                    @click="showAddFormulaDialog"
                    :model="[
                        { label: 'Income Tax Formula', command: () => createFormulaOfType('income') },
                        { label: 'Deduction Formula', command: () => createFormulaOfType('deduction') },
                        { label: 'Levy Formula', command: () => createFormulaOfType('levy') },
                        { label: 'FBT Formula', command: () => createFormulaOfType('fbt') }
                    ]"
                />
            </div>
        </div>

        <!-- Formula Category Tabs -->
        <div class="mb-4">
            <div class="flex gap-2 border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
                <div 
                    v-for="(tab, index) in formulaTabs" 
                    :key="index"
                    @click="changeTab(index)"
                    class="px-4 py-3 cursor-pointer whitespace-nowrap transition-colors"
                    :class="activeTab === index 
                        ? 'text-primary-500 border-b-2 border-primary-500 font-semibold' 
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-0'"
                >
                    <i :class="tab.icon" class="mr-2"></i>
                    {{ tab.label }}
                </div>
            </div>
        </div>

        <!-- Secondary Filters -->
        <div class="flex flex-wrap gap-3 mb-4">
            <Dropdown 
                v-model="filters.category" 
                :options="categoryOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Filter by Category" 
                class="w-full md:w-56" 
                showClear
                @change="fetchFormulas"
            />
            <DatePicker 
                v-model="filters.effective_date" 
                dateFormat="yy-mm-dd" 
                placeholder="Effective Date" 
                :showIcon="true" 
                class="w-full md:w-56"
                showButtonBar
                @date-select="fetchFormulas"
            />
            <Button 
                label="Clear" 
                icon="pi pi-filter-slash" 
                @click="clearFilters" 
                outlined
                severity="secondary"
            />
        </div>

        <!-- Data Table matching Image 2 design -->
        <DataTable 
            :value="formulas" 
            :loading="loading"
            :paginator="true" 
            :rows="15" 
            :rowsPerPageOptions="[15, 30, 50]"
            responsiveLayout="scroll"
            class="mt-4"
            dataKey="id"
            v-model:selection="selectedFormulas"
            @row-click="(event) => viewFormula(event.data)"
            :rowHover="true"
        >
            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-calculator text-4xl text-surface-400 mb-3"></i>
                    <p class="text-surface-600 dark:text-surface-400">No formulas found. Create your first formula to get started.</p>
                </div>
            </template>

            <!-- Selection Column -->
            <Column selectionMode="multiple" headerStyle="width: 3rem" />
            
            <!-- Title Column -->
            <Column field="title" header="Title" sortable class="font-medium">
                <template #body="{ data }">
                    <div class="flex items-center gap-2 cursor-pointer">
                        <span class="text-surface-900 dark:text-surface-0 hover:text-primary-500">{{ data.title }}</span>
                        <Tag 
                            v-if="data.is_current" 
                            value="Current" 
                            severity="success" 
                            class="text-xs"
                        />
                    </div>
                </template>
            </Column>
            
            <!-- Effective Date Range Column -->
            <Column header="Effective Date" sortable field="effective_from">
                <template #body="{ data }">
                    <span class="text-surface-700 dark:text-surface-300">
                        {{ formatMonthYear(data.effective_from) }} - 
                        {{ data.effective_to ? formatMonthYear(data.effective_to) : 'Present' }}
                    </span>
                </template>
            </Column>
            
            <!-- Category Column -->
            <Column field="category" header="Category" sortable>
                <template #body="{ data }">
                    <span class="text-surface-600 dark:text-surface-400 capitalize">
                        {{ getCategoryLabel(data.category) }}
                    </span>
                </template>
            </Column>
            
            <!-- Actions Column -->
            <Column header="Actions" style="width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2" @click.stop>
                        <Button 
                            icon="pi pi-pencil" 
                            text
                            rounded
                            severity="secondary"
                            @click="editFormula(data)" 
                            v-tooltip.top="'Edit'" 
                        />
                        <Button 
                            icon="pi pi-trash" 
                            text
                            rounded
                            severity="danger"
                            @click="confirmDeleteFormula(data)" 
                            v-tooltip.top="'Delete'" 
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Formula Dialog (Create/Edit) -->
        <Dialog 
            v-model:visible="formulaDialog" 
            :header="editMode ? 'Edit Formula' : 'Create Formula'" 
            :modal="true" 
            :closable="true"
            :style="{ width: '600px' }"
            class="p-fluid"
        >
            <div class="flex flex-col gap-4 mt-4">
                <div class="field">
                    <label for="title" class="font-semibold">Title <span class="text-red-500">*</span></label>
                    <InputText 
                        id="title" 
                        v-model="formulaForm.title" 
                        :class="{'p-invalid': submitted && !formulaForm.title}"
                        placeholder="e.g., PAYE Tax 2025"
                    />
                    <small v-if="submitted && !formulaForm.title" class="p-error">Title is required</small>
                </div>

                <div class="field">
                    <label for="type" class="font-semibold">Type <span class="text-red-500">*</span></label>
                    <Dropdown 
                        id="type" 
                        v-model="formulaForm.type" 
                        :options="typeOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Select Type"
                        :class="{'p-invalid': submitted && !formulaForm.type}"
                    />
                    <small v-if="submitted && !formulaForm.type" class="p-error">Type is required</small>
                </div>

                <div class="field">
                    <label for="category" class="font-semibold">Category <span class="text-red-500">*</span></label>
                    <Dropdown 
                        id="category" 
                        v-model="formulaForm.category" 
                        :options="categoryOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Select Category"
                        :class="{'p-invalid': submitted && !formulaForm.category}"
                    />
                    <small v-if="submitted && !formulaForm.category" class="p-error">Category is required</small>
                </div>

                <div class="field">
                    <label for="description" class="font-semibold">Description</label>
                    <Textarea 
                        id="description" 
                        v-model="formulaForm.description" 
                        rows="3"
                        placeholder="Enter formula description"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label for="effective_from" class="font-semibold">Effective From</label>
                        <DatePicker 
                            id="effective_from" 
                            v-model="formulaForm.effective_from" 
                            dateFormat="yy-mm-dd"
                            showButtonBar
                        />
                    </div>

                    <div class="field">
                        <label for="effective_to" class="font-semibold">Effective To</label>
                        <DatePicker 
                            id="effective_to" 
                            v-model="formulaForm.effective_to" 
                            dateFormat="yy-mm-dd"
                            showButtonBar
                        />
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="field-checkbox">
                        <Checkbox id="is_current" v-model="formulaForm.is_current" :binary="true" />
                        <label for="is_current" class="ml-2">Set as Current</label>
                    </div>

                    <div class="field-checkbox">
                        <Checkbox id="is_active" v-model="formulaForm.is_active" :binary="true" />
                        <label for="is_active" class="ml-2">Active</label>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    outlined
                    @click="formulaDialog = false" 
                    :disabled="saving"
                />
                <Button 
                    :label="editMode ? 'Update' : 'Create'" 
                    icon="pi pi-check" 
                    @click="saveFormula" 
                    :loading="saving"
                />
            </template>
        </Dialog>

        <!-- View Dialog -->
        <Dialog 
            v-model:visible="viewDialog" 
            header="Formula Details" 
            :modal="true" 
            :closable="true"
            :style="{ width: '600px' }"
        >
            <div v-if="selectedFormula" class="flex flex-col gap-4 mt-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Title</label>
                        <p class="text-surface-900 dark:text-surface-0 mt-1">{{ selectedFormula.title }}</p>
                    </div>
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Type</label>
                        <p class="mt-1">
                            <Tag :value="selectedFormula.type" :severity="selectedFormula.type === 'income' ? 'success' : 'danger'" />
                        </p>
                    </div>
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Category</label>
                        <p class="text-surface-900 dark:text-surface-0 mt-1">{{ selectedFormula.category }}</p>
                    </div>
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Status</label>
                        <p class="mt-1">
                            <Tag :value="selectedFormula.is_current ? 'Active' : 'Inactive'" :severity="selectedFormula.is_current ? 'success' : 'secondary'" />
                        </p>
                    </div>
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Effective From</label>
                        <p class="text-surface-900 dark:text-surface-0 mt-1">{{ selectedFormula.effective_from ? formatDate(selectedFormula.effective_from) : '-' }}</p>
                    </div>
                    <div>
                        <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Effective To</label>
                        <p class="text-surface-900 dark:text-surface-0 mt-1">{{ selectedFormula.effective_to ? formatDate(selectedFormula.effective_to) : '-' }}</p>
                    </div>
                </div>
                <div v-if="selectedFormula.description">
                    <label class="font-semibold text-surface-600 dark:text-surface-400 text-sm">Description</label>
                    <p class="text-surface-900 dark:text-surface-0 mt-1">{{ selectedFormula.description }}</p>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Close" 
                    icon="pi pi-times" 
                    outlined
                    @click="viewDialog = false" 
                />
                <Button 
                    label="Edit" 
                    icon="pi pi-pencil" 
                    @click="editFormula(selectedFormula); viewDialog = false" 
                />
            </template>
        </Dialog>

        <!-- Delete Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            header="Confirm Delete" 
            :modal="true" 
            :closable="true"
            :style="{ width: '450px' }"
        >
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                <span v-if="selectedFormula">
                    Are you sure you want to delete the formula <strong>{{ selectedFormula.title }}</strong>? This action cannot be undone.
                </span>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    outlined
                    @click="deleteDialog = false" 
                    :disabled="deleting"
                />
                <Button 
                    label="Delete" 
                    icon="pi pi-trash" 
                    severity="danger"
                    @click="deleteFormula" 
                    :loading="deleting"
                />
            </template>
        </Dialog>
    </div>
</template>
