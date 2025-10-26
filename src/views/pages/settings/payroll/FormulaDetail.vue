<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const { showToast } = useToast();
const route = useRoute();
const router = useRouter();
const formulaId = route.params.id;
const loading = ref(false);
const saving = ref(false);

// Formula data matching backend model fields
const formula = ref({
    title: '',
    type: null,
    category: null,
    unit: 'KES',
    effective_from: null,
    effective_to: null,
    progressive: false,
    personal_relief: 0,
    relief_carry_forward: false,
    min_taxable_income: 0,
    upper_limit: 0,
    upper_limit_amount: 0,
    upper_limit_percentage: 0,
    is_current: false,
    version: '1.0',
    transition_date: null,
    replaces_formula: null,
    regulatory_source: '',
    notes: '',
    deduction_order: []
});

// Formula items (tax brackets)
const formulaItems = ref([]);
const splitRatio = ref({ employee_percentage: 0, employer_percentage: 0 });

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

const fetchFormulaData = async () => {
    loading.value = true;
    try {
        // Fetch formula details
        const { data: formulaData } = await payrollService.getFormula(formulaId);
        formula.value = {
            ...formulaData,
            effective_from: formulaData.effective_from ? new Date(formulaData.effective_from) : null,
            effective_to: formulaData.effective_to ? new Date(formulaData.effective_to) : null
        };

        // Fetch formula items
        const { data: itemsData } = await payrollService.getFormulaItems(formulaId);
        formulaItems.value = itemsData?.results || itemsData || [];
        
        // Ensure at least one row exists
        if (formulaItems.value.length === 0) {
            formulaItems.value = [{ amount_from: 0, amount_to: 0, deduct_amount: 0, deduct_percentage: 0 }];
        }

        // Fetch split ratio
        try {
            const { data: splitData } = await payrollService.getFormulaSplitRatio(formulaId);
            if (splitData?.results?.length > 0) {
                splitRatio.value = splitData.results[0];
            } else if (splitData) {
                splitRatio.value = splitData;
            }
        } catch (error) {
            // Split ratio might not exist
            console.log('No split ratio found, using defaults');
        }
    } catch (error) {
        console.error('Error fetching formula data:', error);
        showToast('error', 'Failed to load formula', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const addBracket = () => {
    formulaItems.value.push({ 
        amount_from: 0, 
        amount_to: 0, 
        deduct_amount: 0, 
        deduct_percentage: 0 
    });
};

const removeBracket = (index) => {
    if (formulaItems.value.length > 1) {
        formulaItems.value.splice(index, 1);
    } else {
        showToast('warn', 'At least one bracket is required', 'Validation');
    }
};

const updateFormula = async () => {
    if (!formula.value.title || !formula.value.type || !formula.value.category) {
        showToast('warn', 'Please fill all required fields', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        // Update formula
        const formulaPayload = {
            ...formula.value,
            effective_from: formula.value.effective_from ? 
                new Date(formula.value.effective_from).toISOString().split('T')[0] : null,
            effective_to: formula.value.effective_to ? 
                new Date(formula.value.effective_to).toISOString().split('T')[0] : null
        };
        
        await payrollService.updateFormula(formulaId, formulaPayload);

        // Save formula items
        if (formulaItems.value.length > 0) {
            await payrollService.createFormulaItems(formulaId, formulaItems.value);
        }

        // Save split ratio if applicable (for deductions and levies)
        if ((formula.value.type === 'deduction' || formula.value.type === 'levy') && 
            (splitRatio.value.employee_percentage > 0 || splitRatio.value.employer_percentage > 0)) {
            await payrollService.createFormulaSplitRatio(formulaId, splitRatio.value);
        }

        showToast('success', 'Formula updated successfully', 'Success');
        router.push('/settings/payroll/formulas');
    } catch (error) {
        console.error('Error updating formula:', error);
        showToast('error', 'Failed to update formula', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const formatMonthYear = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

onMounted(fetchFormulaData);
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-4 cursor-pointer" @click="router.push('/settings/payroll/formulas')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Edit Formula :</span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="flex flex-col gap-6">
            <!-- Formula Title & Basic Info -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-6">
                    <label for="formula_title" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Formula Title: <span class="text-red-500">*</span>
                    </label>
                    <InputText 
                        id="formula_title" 
                        v-model="formula.title" 
                        class="w-full"
                        placeholder="e.g., P.A.Y.E. Kenya - 2023"
                    />
                </div>
                <div class="md:col-span-3">
                    <label for="units" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Units:</label>
                    <InputText 
                        id="units" 
                        v-model="formula.unit" 
                        class="w-full"
                        disabled
                    />
                </div>
                <div class="md:col-span-3">
                    <label for="round_off" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Round Off to:</label>
                    <InputNumber 
                        id="round_off" 
                        v-model="formula.upper_limit" 
                        suffix=" KES"
                        :minFractionDigits="0"
                        :maxFractionDigits="0"
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Formula Type & Category -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="type" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Formula Type:</label>
                    <Dropdown 
                        id="type" 
                        v-model="formula.type" 
                        :options="typeOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
            </div>
            <div>
                    <label for="category" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Category:</label>
                    <Dropdown 
                        id="category" 
                        v-model="formula.category" 
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Effective Dates & Progressive -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-3">
                    <label for="from_date" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">From:</label>
                    <DatePicker 
                        id="from_date" 
                        v-model="formula.effective_from" 
                        view="month"
                        dateFormat="MM, yy"
                        class="w-full"
                        placeholder="Month, Year"
                    />
                </div>
                <div class="md:col-span-3">
                    <label for="to_date" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">To:</label>
                    <DatePicker 
                        id="to_date" 
                        v-model="formula.effective_to" 
                        view="month"
                        dateFormat="MM, yy"
                        class="w-full"
                        placeholder="Optional"
                    />
                </div>
                <div class="md:col-span-6">
                    <div class="flex items-center h-full pb-2">
                        <Checkbox id="progressive" v-model="formula.progressive" :binary="true" />
                        <label for="progressive" class="ml-2 font-semibold text-surface-900 dark:text-surface-0">
                            Apply Formula Progressively
                        </label>
                    </div>
                </div>
            </div>

            <!-- Tax Brackets Table -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">Tax Brackets / Formula Items</h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-surface-100 dark:bg-surface-700">
                            <tr>
                                <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0 w-20">Level</th>
                                <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">From (KES)</th>
                                <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">To (KES)</th>
                                <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">Deduction Amount (KES)</th>
                                <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">OR Deduction %</th>
                                <th class="p-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(item, index) in formulaItems" 
                                :key="index"
                                class="border-t border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                            >
                                <td class="p-3 font-semibold text-surface-600 dark:text-surface-400">
                                    {{ index < formulaItems.length - 1 ? `Level ${index + 1}` : 'Any Amount Above' }}
                                </td>
                                <td class="p-3">
                                    <InputNumber 
                                        v-model="item.amount_from" 
                                        :minFractionDigits="6"
                                        :maxFractionDigits="6"
                                        class="w-full"
                                        :min="0"
                                    />
                                </td>
                                <td class="p-3">
                                    <InputNumber 
                                        v-model="item.amount_to" 
                                        :minFractionDigits="6"
                                        :maxFractionDigits="6"
                                        class="w-full"
                                        :min="0"
                                    />
                                </td>
                                <td class="p-3">
                                    <InputNumber 
                                        v-model="item.deduct_amount" 
                                        :minFractionDigits="6"
                                        :maxFractionDigits="6"
                                        class="w-full"
                                        :min="0"
                                    />
                                </td>
                                <td class="p-3">
                                    <InputNumber 
                                        v-model="item.deduct_percentage" 
                                        :minFractionDigits="6"
                                        :maxFractionDigits="6"
                                        class="w-full"
                                        suffix="%"
                                        :min="0"
                                        :max="100"
                                    />
                                </td>
                                <td class="p-3 text-center">
                                    <Button 
                                        v-if="formulaItems.length > 1"
                                        icon="pi pi-trash" 
                                        text
                                        rounded
                                        severity="danger"
                                        size="small"
                                        @click="removeBracket(index)"
                                        v-tooltip.top="'Remove'"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
        </div>

                <div class="p-3 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                    <Button 
                        label="Add Bracket" 
                        icon="pi pi-plus" 
                        outlined
                        size="small"
                        @click="addBracket"
                    />
                </div>
            </div>

            <!-- Relief & Minimum Income -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-4">
                    <label for="relief" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Monthly Personal Relief:</label>
                    <InputNumber 
                        id="relief" 
                        v-model="formula.personal_relief" 
                        prefix="KES "
                        :minFractionDigits="6"
                        :maxFractionDigits="6"
                        class="w-full"
                    />
                </div>
                <div class="md:col-span-4 flex items-end">
                    <div class="flex items-center pb-2">
                        <Checkbox id="carry_forward" v-model="formula.relief_carry_forward" :binary="true" />
                        <label for="carry_forward" class="ml-2 font-semibold text-surface-900 dark:text-surface-0">
                            Allow Personal Relief Balance Carry Forward
                        </label>
                    </div>
                </div>
                <div class="md:col-span-4">
                    <label for="min_income" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Minimum Taxable Income:</label>
                    <InputNumber 
                        id="min_income" 
                        v-model="formula.min_taxable_income" 
                        prefix="KES "
                        :minFractionDigits="6"
                        :maxFractionDigits="6"
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Split Ratio (for deductions) -->
            <div v-if="formula.type === 'deduction' || formula.type === 'levy'" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Split Ratio (Employee vs Employer)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="emp_percent" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Employee %:</label>
                        <InputNumber 
                            id="emp_percent" 
                            v-model="splitRatio.employee_percentage" 
                            :minFractionDigits="2"
                            :maxFractionDigits="2"
                            suffix="%"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label for="empr_percent" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Employer %:</label>
                        <InputNumber 
                            id="empr_percent" 
                            v-model="splitRatio.employer_percentage" 
                            :minFractionDigits="2"
                            :maxFractionDigits="2"
                            suffix="%"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Advanced Settings (Collapsible) -->
            <Accordion class="border border-surface-200 dark:border-surface-700 rounded-lg">
                <AccordionTab header="Advanced Settings (Optional)">
                    <div class="flex flex-col gap-4">
                        <!-- Version & Regulatory Source -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="version" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Version:</label>
                                <InputText 
                                    id="version" 
                                    v-model="formula.version" 
                                    class="w-full"
                                    placeholder="e.g., 2023.1"
                                />
                                <small class="text-surface-600 dark:text-surface-400">Formula version number (e.g., 2023.1, 2024.2)</small>
                            </div>
                            <div>
                                <label for="regulatory_source" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Regulatory Source:</label>
                                <InputText 
                                    id="regulatory_source" 
                                    v-model="formula.regulatory_source" 
                                    class="w-full"
                                    placeholder="e.g., Finance Act 2023"
                                />
                                <small class="text-surface-600 dark:text-surface-400">Source of regulatory change</small>
                            </div>
                        </div>

                        <!-- Is Current Flag -->
                        <div class="flex items-center gap-2">
                            <Checkbox id="is_current" v-model="formula.is_current" :binary="true" />
                            <label for="is_current" class="font-semibold text-surface-900 dark:text-surface-0">
                                Mark as Current Formula
                            </label>
                        </div>

                        <!-- Notes -->
                        <div>
                            <label for="notes" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Notes:</label>
                            <Textarea 
                                id="notes" 
                                v-model="formula.notes" 
                                rows="3"
                                class="w-full"
                                placeholder="Additional notes about this formula..."
                            />
                        </div>
                    </div>
                </AccordionTab>
            </Accordion>

            <!-- Actions -->
            <div class="flex justify-center gap-3 mt-4">
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    outlined
                    @click="router.push('/settings/payroll/formulas')"
                    :disabled="saving"
                />
                <Button 
                    label="Update Formula" 
                    icon="pi pi-save" 
                    severity="success"
                    @click="updateFormula"
                    :loading="saving"
                />
            </div>
        </div>
    </div>
</template>
