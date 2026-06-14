<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const activeTab = ref(0); // 0: Deductions, 1: Benefits, 2: Earnings

// Available items to select from
const availableDeductions = ref([]);
const availableBenefits = ref([]);
const availableEarnings = ref([]);

// Current default items (configured with amounts/percentages)
const defaultDeductions = ref([]);
const defaultBenefits = ref([]);
const defaultEarnings = ref([]);

// Selected items to add
const selectedDeduction = ref(null);
const selectedBenefit = ref(null);
const selectedEarning = ref(null);

const fetchData = async () => {
    loading.value = true;
    try {
        const [deductionsRes, benefitsRes, earningsRes] = await Promise.all([
            payrollService.listDeductions(),
            payrollService.listBenefits(),
            payrollService.listEarnings()
        ]);

        availableDeductions.value = deductionsRes.data?.results || deductionsRes.data || [];
        availableBenefits.value = benefitsRes.data?.results || benefitsRes.data || [];
        availableEarnings.value = earningsRes.data?.results || earningsRes.data || [];

        // Initialize with default template structure
        initializeDefaults();
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('error', 'Failed to load data', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const initializeDefaults = () => {
    defaultDeductions.value = [];
    defaultBenefits.value = [];
    defaultEarnings.value = [];
};

const addDeduction = () => {
    if (!selectedDeduction.value) return;
    
    const existing = defaultDeductions.value.find(d => d.id === selectedDeduction.value.id);
    if (existing) {
        showToast('warn', 'This deduction is already added', 'Duplicate');
        return;
    }

    defaultDeductions.value.push({
        id: selectedDeduction.value.id,
        title: selectedDeduction.value.title,
        registration_no: '',
        employee_fixed: 0,
        employee_percentage: 0,
        employer_fixed: 0,
        employer_percentage: 0,
        checkoff: false,
        paid_to_date: 0
    });

    selectedDeduction.value = null;
};

const addBenefit = () => {
    if (!selectedBenefit.value) return;
    
    const existing = defaultBenefits.value.find(b => b.id === selectedBenefit.value.id);
    if (existing) {
        showToast('warn', 'This benefit is already added', 'Duplicate');
        return;
    }

    defaultBenefits.value.push({
        id: selectedBenefit.value.id,
        title: selectedBenefit.value.title,
        fixed_amount: 0,
        percentage: 0,
        taxable: false,
        is_housing: selectedBenefit.value.title === 'Housing Benefit',
        housing_amount: 0,
        housing_type: '',
        rent_recovered: 0
    });

    selectedBenefit.value = null;
};

const addEarning = () => {
    if (!selectedEarning.value) return;
    
    const existing = defaultEarnings.value.find(e => e.id === selectedEarning.value.id);
    if (existing) {
        showToast('warn', 'This earning is already added', 'Duplicate');
        return;
    }

    const hasSpecialFields = ['Daily Wages', 'Payment in Lieu of Leave'].includes(selectedEarning.value.title);

    defaultEarnings.value.push({
        id: selectedEarning.value.id,
        title: selectedEarning.value.title,
        fixed_amount: 0,
        percentage: 0,
        taxable: false,
        quantity: 0,
        rate: 0,
        amount: 0,
        has_special_fields: hasSpecialFields
    });

    selectedEarning.value = null;
};

const removeDeduction = (index) => {
    defaultDeductions.value.splice(index, 1);
};

const removeBenefit = (index) => {
    defaultBenefits.value.splice(index, 1);
};

const removeEarning = (index) => {
    defaultEarnings.value.splice(index, 1);
};

const updateDeductions = () => {
    saving.value = true;
    setTimeout(() => {
        showToast('success', 'Deductions updated successfully', 'Success');
        saving.value = false;
    }, 500);
};

const updateBenefits = () => {
    saving.value = true;
    setTimeout(() => {
        showToast('success', 'Benefits updated successfully', 'Success');
        saving.value = false;
    }, 500);
};

const updateEarnings = () => {
    saving.value = true;
    setTimeout(() => {
        showToast('success', 'Earnings updated successfully', 'Success');
        saving.value = false;
    }, 500);
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-4">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Default Payroll Settings :</span>
            </div>
        </div>

        <!-- Tabs -->
        <div class="mb-4">
            <div class="flex gap-2 border-b border-surface-200 dark:border-surface-700">
                <div 
                    @click="activeTab = 0"
                    class="px-4 py-3 cursor-pointer whitespace-nowrap transition-colors"
                    :class="activeTab === 0 
                        ? 'text-primary-500 border-b-2 border-primary-500 font-semibold bg-surface-0 dark:bg-surface-900' 
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-0'"
                >
                    Deductions
                </div>
                <div 
                    @click="activeTab = 1"
                    class="px-4 py-3 cursor-pointer whitespace-nowrap transition-colors"
                    :class="activeTab === 1 
                        ? 'text-primary-500 border-b-2 border-primary-500 font-semibold bg-surface-0 dark:bg-surface-900' 
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-0'"
                >
                    Benefits
                </div>
                <div 
                    @click="activeTab = 2"
                    class="px-4 py-3 cursor-pointer whitespace-nowrap transition-colors"
                    :class="activeTab === 2 
                        ? 'text-primary-500 border-b-2 border-primary-500 font-semibold bg-surface-0 dark:bg-surface-900' 
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-0'"
                >
                    Earnings
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <!-- Deductions Tab -->
        <div v-else-if="activeTab === 0" class="flex flex-col gap-4">
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead class="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300" style="width: 40px"></th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Title</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Registration No (Optional)</th>
                            <th colspan="2" class="p-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-300 border-l border-surface-200 dark:border-surface-700">Employee's Deduction</th>
                            <th colspan="2" class="p-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-300 border-l border-surface-200 dark:border-surface-700">Employer's Contribution</th>
                            <th class="p-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-300 border-l border-surface-200 dark:border-surface-700">Checkoff</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Paid to Date (KES)</th>
                        </tr>
                        <tr class="bg-surface-100 dark:bg-surface-700">
                            <th></th>
                            <th></th>
                            <th></th>
                            <th class="p-2 text-xs text-surface-600 dark:text-surface-400 text-center">Fixed Amount (KES)</th>
                            <th class="p-2 text-xs text-surface-600 dark:text-surface-400 text-center">or % of Basic Pay</th>
                            <th class="p-2 text-xs text-surface-600 dark:text-surface-400 text-center">Fixed Amount (KES)</th>
                            <th class="p-2 text-xs text-surface-600 dark:text-surface-400 text-center">or % of Basic Pay</th>
                            <th class="p-2 text-xs text-surface-600 dark:text-surface-400 text-center">Deduct on employee's behalf</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(item, index) in defaultDeductions" 
                            :key="index"
                            class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                        >
                            <td class="p-2 text-center">
                                <Button 
                                    icon="pi pi-times" 
                                    text 
                                    rounded 
                                    severity="danger"
                                    size="small"
                                    @click="removeDeduction(index)"
                                />
                                <span class="text-sm text-surface-600 dark:text-surface-400 ml-1">{{ index + 1 }}.</span>
                            </td>
                            <td class="p-2">
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ item.title }}</span>
                            </td>
                            <td class="p-2">
                                <InputText v-model="item.registration_no" class="w-full" placeholder="Optional" />
                            </td>
                            <td class="p-2">
                                <InputNumber v-model="item.employee_fixed" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" />
                            </td>
                            <td class="p-2">
                                <InputNumber v-model="item.employee_percentage" class="w-full" suffix=" %" />
                            </td>
                            <td class="p-2">
                                <InputNumber v-model="item.employer_fixed" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" />
                            </td>
                            <td class="p-2">
                                <InputNumber v-model="item.employer_percentage" class="w-full" suffix=" %" />
                            </td>
                            <td class="p-2 text-center">
                                <Checkbox v-model="item.checkoff" :binary="true" />
                            </td>
                            <td class="p-2">
                                <span class="text-sm text-surface-600 dark:text-surface-400">{{ item.paid_to_date.toFixed(2) }}</span>
                            </td>
                        </tr>
                        <tr v-if="defaultDeductions.length === 0">
                            <td colspan="9" class="p-8 text-center text-surface-500 dark:text-surface-400">
                                No deductions configured. Add one below.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center mt-4">
                <Dropdown 
                    v-model="selectedDeduction" 
                    :options="availableDeductions"
                    optionLabel="title"
                    placeholder="Add Deduction"
                    class="w-64"
                    @change="addDeduction"
                />
                <Button 
                    label="Update Deductions" 
                    icon="pi pi-check" 
                    severity="success"
                    @click="updateDeductions"
                    :loading="saving"
                />
            </div>
        </div>

        <!-- Benefits Tab -->
        <div v-else-if="activeTab === 1" class="flex flex-col gap-4">
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead class="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300" style="width: 40px"></th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Title</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Fixed Amount (KES)</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">or percentage (overrides fixed amount)</th>
                            <th class="p-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-300">Taxable</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(item, index) in defaultBenefits" 
                            :key="index"
                            class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                        >
                            <td class="p-2 text-center">
                                <Button 
                                    icon="pi pi-times" 
                                    text 
                                    rounded 
                                    severity="danger"
                                    size="small"
                                    @click="removeBenefit(index)"
                                />
                                <span class="text-sm text-surface-600 dark:text-surface-400 ml-1">{{ index + 1 }}.</span>
                            </td>
                            <td class="p-2">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ item.title }}</span>
                                    <Button 
                                        v-if="item.is_housing"
                                        label="Edit" 
                                        outlined 
                                        size="small"
                                        severity="info"
                                    />
                                </div>
                                <div v-if="item.is_housing" class="mt-2 flex flex-col gap-1 text-xs">
                                    <div>Amount: {{ item.housing_amount.toFixed(2) }}</div>
                                    <div>Housing Type: <InputText v-model="item.housing_type" size="small" placeholder="Type" /></div>
                                    <div>Rent Recovered: {{ item.rent_recovered.toFixed(2) }}</div>
                                </div>
                            </td>
                            <td class="p-2">
                                <InputNumber v-if="!item.is_housing" v-model="item.fixed_amount" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" />
                            </td>
                            <td class="p-2">
                                <div v-if="!item.is_housing" class="flex items-center gap-2">
                                    <InputNumber v-model="item.percentage" class="flex-1" suffix=" %" />
                                    <span class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap">of Basic Pay</span>
                                </div>
                            </td>
                            <td class="p-2 text-center">
                                <Dropdown 
                                    v-if="!item.is_housing"
                                    v-model="item.taxable" 
                                    :options="[{label: 'Yes', value: true}, {label: 'No', value: false}]"
                                    optionLabel="label"
                                    optionValue="value"
                                    class="w-24"
                                >
                                    <template #value="slotProps">
                                        <div class="flex items-center gap-1">
                                            <i :class="slotProps.value ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                                            <span>{{ slotProps.value ? 'Yes' : 'No' }}</span>
                                        </div>
                                    </template>
                                </Dropdown>
                            </td>
                        </tr>
                        <tr v-if="defaultBenefits.length === 0">
                            <td colspan="5" class="p-8 text-center text-surface-500 dark:text-surface-400">
                                No benefits configured. Add one below.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center mt-4">
                <Dropdown 
                    v-model="selectedBenefit" 
                    :options="availableBenefits"
                    optionLabel="title"
                    placeholder="Add Addition"
                    class="w-64"
                    @change="addBenefit"
                />
                <Button 
                    label="Update Benefits" 
                    icon="pi pi-check" 
                    severity="success"
                    @click="updateBenefits"
                    :loading="saving"
                />
            </div>
        </div>

        <!-- Earnings Tab -->
        <div v-else-if="activeTab === 2" class="flex flex-col gap-4">
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead class="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300" style="width: 40px"></th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Title</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Fixed Amount (KES)</th>
                            <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">or percentage (overrides fixed amount)</th>
                            <th class="p-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-300">Taxable</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(item, index) in defaultEarnings" 
                            :key="index"
                            class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                        >
                            <td class="p-2 text-center">
                                <Button 
                                    icon="pi pi-times" 
                                    text 
                                    rounded 
                                    severity="danger"
                                    size="small"
                                    @click="removeEarning(index)"
                                />
                                <span class="text-sm text-surface-600 dark:text-surface-400 ml-1">{{ index + 1 }}.</span>
                            </td>
                            <td class="p-2">
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ item.title }}</span>
                            </td>
                            <td class="p-2">
                                <div v-if="item.has_special_fields" class="flex flex-col gap-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs">Quantity:</span>
                                        <InputNumber v-model="item.quantity" class="flex-1" suffix=" Units" />
                                    </div>
                                </div>
                                <InputNumber v-else v-model="item.fixed_amount" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" />
                            </td>
                            <td class="p-2">
                                <div v-if="item.has_special_fields" class="flex flex-col gap-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs">Rate:</span>
                                        <InputNumber v-model="item.rate" class="flex-1" :minFractionDigits="2" suffix=" Per Unit" />
                                    </div>
                                </div>
                                <div v-else class="flex items-center gap-2">
                                    <InputNumber v-model="item.percentage" class="flex-1" suffix=" %" />
                                    <span class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap">of Basic Pay</span>
                                </div>
                            </td>
                            <td class="p-2">
                                <div v-if="item.has_special_fields" class="flex items-center gap-2">
                                    <span class="text-xs">Amount:</span>
                                    <InputNumber v-model="item.amount" class="flex-1" :minFractionDigits="2" :maxFractionDigits="2" />
                                </div>
                                <div v-else class="text-center">
                                    <Dropdown 
                                        v-model="item.taxable" 
                                        :options="[{label: 'Yes', value: true}, {label: 'No', value: false}]"
                                        optionLabel="label"
                                        optionValue="value"
                                        class="w-24"
                                    >
                                        <template #value="slotProps">
                                            <div class="flex items-center gap-1">
                                                <i :class="slotProps.value ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                                                <span>{{ slotProps.value ? 'Yes' : 'No' }}</span>
                                            </div>
                                        </template>
                                    </Dropdown>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="defaultEarnings.length === 0">
                            <td colspan="5" class="p-8 text-center text-surface-500 dark:text-surface-400">
                                No earnings configured. Add one below.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center mt-4">
                <Dropdown 
                    v-model="selectedEarning" 
                    :options="availableEarnings"
                    optionLabel="title"
                    placeholder="Add Addition"
                    class="w-64"
                    @change="addEarning"
                />
                <Button 
                    label="Update Earnings" 
                    icon="pi pi-check" 
                    severity="success"
                    @click="updateEarnings"
                    :loading="saving"
                />
            </div>
        </div>
    </div>
</template>
