<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { computed, onMounted, ref, watch } from 'vue';

// Props
const props = defineProps({
    employeeId: {
        type: Number,
        required: true
    },
    employeeName: {
        type: String,
        default: ''
    }
});

// Emits
const emit = defineEmits(['components-updated']);

// Composables
const toast = useToast();
const { formatCurrencySync } = useGlobalCurrency();

// Currency formatting helper
const formatComponentAmount = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

// Local state
const activeTab = ref('deductions');
const isLoading = ref(false);
const payrollComponents = ref([]);
const selectedComponent = ref(null);
const employeeComponents = ref({
    deductions: [],
    earnings: [],
    benefits: [],
    loans: []
});

// Component categories
const categories = [
    { key: 'deductions', label: 'Deductions', icon: 'pi pi-minus', color: 'red' },
    { key: 'earnings', label: 'Earnings', icon: 'pi pi-plus', color: 'green' },
    { key: 'benefits', label: 'Benefits', icon: 'pi pi-receipt', color: 'blue' },
    { key: 'loans', label: 'Loans', icon: 'pi pi-money-bill', color: 'orange' }
];

// Computed
const currentComponents = computed(() => {
    return employeeComponents.value[activeTab.value] || [];
});

const availableComponents = computed(() => {
    return payrollComponents.value.filter(
        (comp) => comp.category?.toLowerCase() === activeTab.value.slice(0, -1) // Remove 's' from end
    );
});

// Methods
const fetchPayrollComponents = async () => {
    isLoading.value = true;
    try {
        const response = await payrollService.listPayrollComponents({ is_active: true });
        payrollComponents.value = response.data || [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch payroll components',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const fetchEmployeeComponents = async () => {
    if (!props.employeeId) return;

    isLoading.value = true;
    try {
        // Fetch existing components for the employee using employee service
        const params = { emp_id: props.employeeId };

        try {
            const deductionsResponse = await employeeService.listEmployeeDeductions(params);
            employeeComponents.value.deductions = deductionsResponse.data || [];
        } catch (error) {
            console.warn('Failed to fetch deductions for employee:', error);
            employeeComponents.value.deductions = [];
        }

        try {
            const earningsResponse = await employeeService.listEmployeeEarnings(params);
            employeeComponents.value.earnings = earningsResponse.data || [];
        } catch (error) {
            console.warn('Failed to fetch earnings for employee:', error);
            employeeComponents.value.earnings = [];
        }

        try {
            const benefitsResponse = await employeeService.listEmployeeBenefits(params);
            employeeComponents.value.benefits = benefitsResponse.data || [];
        } catch (error) {
            console.warn('Failed to fetch benefits for employee:', error);
            employeeComponents.value.benefits = [];
        }

        try {
            const loansResponse = await employeeService.listEmployeeLoans(params);
            employeeComponents.value.loans = loansResponse.data || [];
        } catch (error) {
            console.warn('Failed to fetch loans for employee:', error);
            employeeComponents.value.loans = [];
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch employee components',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const addComponent = () => {
    if (!selectedComponent.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select a component first!',
            life: 3000
        });
        return;
    }

    const componentData = {
        id: null, // Will be set by backend
        component: selectedComponent.value,
        employee: { id: props.employeeId },
        amount: 0,
        percent_of_basic: 0,
        quantity: 0,
        rate: selectedComponent.value.mode === 'perhour' ? 0 : selectedComponent.value.mode === 'perday' ? 0 : 0,
        employer_contribution: 0,
        employer_percent: 0,
        paid_to_date: 0,
        wb_code: selectedComponent.value.wb_code || ''
    };

    // Check if component already exists
    const exists = currentComponents.value.find((item) => item.component?.id === selectedComponent.value.id);

    if (exists) {
        toast.add({
            severity: 'info',
            summary: 'Duplicate',
            detail: `${selectedComponent.value.title} already exists!`,
            life: 3000
        });
        return;
    }

    employeeComponents.value[activeTab.value] = [...employeeComponents.value[activeTab.value], componentData];

    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${selectedComponent.value.title} added!`,
        life: 3000
    });

    selectedComponent.value = null;
    emit('components-updated', employeeComponents.value);
};

const removeComponent = (index) => {
    const component = currentComponents.value[index];
    employeeComponents.value[activeTab.value].splice(index, 1);

    toast.add({
        severity: 'success',
        summary: 'Removed',
        detail: `${component.component?.title || 'Component'} removed!`,
        life: 3000
    });

    emit('components-updated', employeeComponents.value);
};

const updateComponent = (index, field, value) => {
    if (employeeComponents.value[activeTab.value][index]) {
        employeeComponents.value[activeTab.value][index][field] = value;
        emit('components-updated', employeeComponents.value);
    }
};

const getComponentTypeLabel = () => {
    const typeMap = {
        deductions: 'Deduction',
        earnings: 'Earning',
        benefits: 'Benefit',
        loans: 'Loan'
    };
    return typeMap[activeTab.value] || 'Component';
};

const getModeLabel = (mode) => {
    const modeMap = {
        monthly: 'Monthly',
        perhour: 'Per Hour',
        perday: 'Per Day',
        perpiece: 'Per Piece',
        commission: 'Commission'
    };
    return modeMap[mode] || mode || 'N/A';
};

// Lifecycle
onMounted(async () => {
    await fetchPayrollComponents();
    await fetchEmployeeComponents();
});

// Watch for employee changes
watch(
    () => props.employeeId,
    async (newId) => {
        if (newId) {
            await fetchEmployeeComponents();
        }
    }
);

const saveComponents = async () => {
    if (!props.employeeId) return;

    isLoading.value = true;
    try {
        // Save each component type
        const savePromises = [];

        if (employeeComponents.value.deductions.length > 0) {
            savePromises.push(employeeService.bulkUpsertDeductions(employeeComponents.value.deductions));
        }

        if (employeeComponents.value.earnings.length > 0) {
            savePromises.push(employeeService.bulkUpsertEarnings(employeeComponents.value.earnings));
        }

        if (employeeComponents.value.benefits.length > 0) {
            savePromises.push(employeeService.bulkUpsertBenefits(employeeComponents.value.benefits));
        }

        if (employeeComponents.value.loans.length > 0) {
            savePromises.push(employeeService.bulkUpsertLoans(employeeComponents.value.loans));
        }

        await Promise.all(savePromises);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Employee components saved successfully!',
            life: 3000
        });

        emit('components-updated', employeeComponents.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save components: ' + error.message,
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="payroll-components-selector">
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payroll Components for {{ employeeName }}</h3>
            <p class="text-sm text-gray-600">Manage deductions, earnings, benefits, and loans for this employee</p>
        </div>

        <!-- Component Type Tabs -->
        <div class="mb-6">
            <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                    v-for="category in categories"
                    :key="category.key"
                    @click="activeTab = category.key"
                    :class="['flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors', activeTab === category.key ? `bg-white text-${category.color}-600 shadow-sm` : 'text-gray-600 hover:text-gray-900']"
                >
                    <i :class="category.icon" class="mr-2"></i>
                    {{ category.label }}
                </button>
            </div>
        </div>

        <!-- Component Selection -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Add {{ getComponentTypeLabel() }} </label>
                    <Dropdown v-model="selectedComponent" :options="availableComponents" optionLabel="title" placeholder="Select a component" class="w-full" :disabled="isLoading" />
                </div>
                <Button icon="pi pi-plus" label="Add" @click="addComponent" :disabled="!selectedComponent" severity="primary" />
            </div>
        </div>

        <!-- Components List -->
        <div class="space-y-4">
            <div v-if="currentComponents.length === 0" class="text-center py-8 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>No {{ activeTab }} configured for this employee</p>
            </div>

            <div v-else class="space-y-3">
                <div v-for="(component, index) in currentComponents" :key="index" class="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900">
                                {{ component.component?.title }}
                            </h4>
                            <div class="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span v-if="component.component?.mode"> Mode: {{ getModeLabel(component.component.mode) }} </span>
                                <span v-if="component.component?.statutory" class="text-red-600 font-medium"> Statutory </span>
                                <span v-if="component.component?.checkoff" class="text-blue-600"> Checkoff </span>
                            </div>
                        </div>
                        <Button icon="pi pi-trash" severity="danger" text @click="removeComponent(index)" size="small" />
                    </div>

                    <!-- Component Configuration -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <!-- Registration Number -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"> Reg. No </label>
                            <InputText v-model="component.wb_code" placeholder="Optional" class="w-full" @input="updateComponent(index, 'wb_code', $event.target.value)" />
                        </div>

                        <!-- Amount -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"> Amount (KES) </label>
                            <InputNumber v-model="component.amount" placeholder="0.00" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" @input="updateComponent(index, 'amount', $event)" />
                        </div>

                        <!-- Percentage -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"> % of Basic Pay </label>
                            <InputNumber v-model="component.percent_of_basic" placeholder="0" class="w-full" :minFractionDigits="0" :maxFractionDigits="2" suffix="%" @input="updateComponent(index, 'percent_of_basic', $event)" />
                        </div>

                        <!-- Quantity/Rate -->
                        <div v-if="component.component?.mode === 'perhour' || component.component?.mode === 'perday'">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                {{ component.component.mode === 'perhour' ? 'Hours' : 'Days' }}
                            </label>
                            <InputNumber v-model="component.quantity" placeholder="0" class="w-full" :minFractionDigits="0" :maxFractionDigits="2" @input="updateComponent(index, 'quantity', $event)" />
                        </div>

                        <!-- Employer Contribution -->
                        <div v-if="activeTab === 'deductions'">
                            <label class="block text-sm font-medium text-gray-700 mb-1"> Employer Amount (KES) </label>
                            <InputNumber
                                v-model="component.employer_contribution"
                                placeholder="0.00"
                                class="w-full"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                :disabled="component.component?.constant"
                                @input="updateComponent(index, 'employer_contribution', $event)"
                            />
                        </div>

                        <!-- Employer Percentage -->
                        <div v-if="activeTab === 'deductions'">
                            <label class="block text-sm font-medium text-gray-700 mb-1"> Employer % </label>
                            <InputNumber
                                v-model="component.employer_percent"
                                placeholder="0"
                                class="w-full"
                                :minFractionDigits="0"
                                :maxFractionDigits="2"
                                suffix="%"
                                :disabled="component.component?.constant"
                                @input="updateComponent(index, 'employer_percent', $event)"
                            />
                        </div>
                    </div>

                    <!-- Component Details -->
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">Paid to Date:</span>
                                <span class="ml-2 font-medium">
                                    {{ formatComponentAmount(component.paid_to_date || 0) }}
                                </span>
                            </div>
                            <div v-if="component.component?.non_cash">
                                <span class="text-gray-600">Non-Cash:</span>
                                <span class="ml-2 font-medium text-blue-600">Yes</span>
                            </div>
                            <div v-if="component.component?.deduct_after_taxing">
                                <span class="text-gray-600">After Tax:</span>
                                <span class="ml-2 font-medium text-orange-600">Yes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
            <p class="mt-2 text-gray-600">Loading components...</p>
        </div>

        <!-- Save Button -->
        <div class="mt-6 flex justify-end">
            <Button icon="pi pi-save" label="Save All Components" @click="saveComponents" :loading="isLoading" severity="success" />
        </div>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.payroll-components-selector {
    @apply space-y-6;
}
</style>
