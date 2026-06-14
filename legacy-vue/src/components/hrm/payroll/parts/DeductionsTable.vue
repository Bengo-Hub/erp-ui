<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Import Vue Router

const toast = useToast();
const router = useRouter();
const route = useRoute();
const routeParams = ref(null);
const deductions = ref([]);
const isLoading = ref(false);
const allActive = ref(false);
const allcheckOff = ref(false);
const deleteItemDialog = ref(false);
const selectedDeduction = ref(null);
const selectedDeductionId = ref(null);
const spinner_title = ref('Please wait...! Fetching data...!');
const dt = ref();
const filteredPayrollData = ref([]);

const props = defineProps({
    payrollData: Array,
    totalRecords: Number,
    empid: Number
});
// Pagination and filters
const pagination = reactive({
    page: 0,
    rows: 10
});
const globalfilters = reactive({
    global: { value: '' },
    national_id: { value: '' },
    'deduction.staffNo': { value: '' },
    'deduction.nane': { value: '' },
    'deduction.deduction.wb_code': { value: '' }
});

// Sorting
const sortField = ref('');
const sortOrder = ref('');

const checkDisabled = (item) => {
    return item.deduction.mode === 'monthly' && item.deduction.constant;
};

onMounted(() => {
    filteredPayrollData.value = props.payrollData;
    fetchPayrollComponents();
});

const addDeduction = () => {
    console.log(selectedDeduction.value);
    if (!selectedDeduction.value || !selectedDeduction.value.deduction) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select a deduction first!',
            life: 3000
        });
        return;
    }
    
    if (!filteredPayrollData.value.find((item) => item.deduction.title === selectedDeduction.value.deduction.title)) {
        const newDeduction = {
            ...selectedDeduction.value,
            employee: { id: props.empid }
        };
        filteredPayrollData.value = [...filteredPayrollData.value, newDeduction];
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `${selectedDeduction.value.deduction.title} added!`,
            life: 3000
        });
        // Reset selection after adding
        selectedDeduction.value = null;
    } else {
        toast.add({
            severity: 'info',
            summary: 'Duplicate detected',
            detail: `${selectedDeduction.value.deduction.title} already exists!`,
            life: 3000
        });
    }
};
const updateDeductions = async () => {
    try {
        const data = filteredPayrollData.value
            .filter((item) => !item.deduction.statutory)
            .map((item) => ({
                ...item,
                employee: item.employee.id || { id: props.empid }
            }));
        console.log(data);
        if (data.length > 0) {
            const response = await employeeService.bulkUpsertDeductions(data);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Employee deductions updated successfully!',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'info',
                summary: 'No changes',
                detail: 'No new records added yet!',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.toString(),
            life: 3000
        });
    } finally {
        deleteItemDialog.value = false;
        selectedDeductionId.value = null;
        selectedDeduction.value = null;
    }
};
const fetchPayrollComponents = async () => {
    const params = {
        category: 'Deductions',
        is_active: true
    };
    await payrollService.listPayrollComponents(params).then((response) => {
        let data = response.data;
        deductions.value = data;
    });
};
const showItemDeleteDialog = (dataid) => {
    selectedDeductionId.value = dataid;
    deleteItemDialog.value = true;
};
// Handle filter change
const removeItem = async () => {
    try {
        const data = {
            deduction_id: selectedDeductionId.value,
            employee_id: props.empid
        };
        console.log(typeof selectedDeduction.value);
        if (selectedDeductionId.value) {
            await employeeService.removeDeductionByPayload(data);
            filteredPayrollData.value = filteredPayrollData.value.filter((item) => item.id !== selectedDeductionId.value);
        }
        if (selectedDeduction.value) {
            filteredPayrollData.value = filteredPayrollData.value.filter((item) => item.deduction.title !== selectedDeduction.value.deduction.title);
        }
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Item removed!',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.toString(),
            life: 3000
        });
    } finally {
        deleteItemDialog.value = false;
        selectedDeductionId.value = null;
        selectedDeduction.value = null;
    }
};
</script>

<template>
    <div class="container-fluid">
        <!-- Table  -->
        <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 border border-gray-300" colspan="3"></th>
                        <th class="px-4 py-2 border border-gray-300 bg-blue-50" colspan="2">Employee's Deduction</th>
                        <th class="px-4 py-2 border border-gray-300 bg-red-50" colspan="2">Employer's Contribution</th>
                        <th class="px-4 py-2 border border-gray-300" colspan="2"></th>
                    </tr>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-2 border border-gray-300">#</th>
                        <th class="px-4 py-2 border border-gray-300">Title</th>
                        <th class="px-4 py-2 border border-gray-300">Reg. No(optional)</th>
                        <th class="px-4 py-2 border border-gray-300">Fixed Amount(KES)</th>
                        <th class="px-4 py-2 border border-gray-300">or % of Basic Pay</th>
                        <th class="px-4 py-2 border border-gray-300">Fixed Amount(KES)</th>
                        <th class="px-4 py-2 border border-gray-300">or % of Basic Pay</th>
                        <th class="px-1 py-2 border border-gray-300 w-full md:w-36">
                            Checkoff<br /><small>(<em>Deduct on-behalf of employee</em>)</small>
                        </th>
                        <th class="px-1 py-2 border border-gray-300">Paid to Date(KES)</th>
                    </tr>
                </thead>
                <tbody v-if="filteredPayrollData">
                    <tr v-for="(item, index) in filteredPayrollData" :key="index" class="hover:bg-gray-50">
                        <td class="px-4 py-2 border border-gray-300">
                            <IconField class="w-full md:w-6">
                                <InputIcon>
                                    <i class="pi pi-times text-red" @click="showItemDeleteDialog(item.id)" />
                                </InputIcon>
                            </IconField>
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                            <label class="w-full md:w-48">{{ item.deduction.title }}</label>
                        </td>
                        <td class="px-2 py-2 border border-gray-300">
                            <InputText v-model="item.deduction.wb_code" id="wb_code" class="w-full md:w-36" />
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                            <InputText v-model="item.amount" id="amount" placeholder="0" class="w-full" v-if="parseInt(item.quantity) === 0" />
                            <div v-if="parseInt(item.quantity) > 0" class="flex items-center space-x-4">
                                <label for="quantity">Quantity:</label>
                                <InputText v-model="item.quantity" id="quantity" placeholder="0" class="w-full md:w-34" />
                            </div>
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                            <InputText v-model="item.percent_of_basic" mode="number" min="0" placeholder="0" id="percent_of_basic" class="w-full" v-if="parseInt(item.rate) === 0" />
                            <div v-if="parseInt(item.rate) > 0" class="flex items-center space-x-4">
                                <label for="rate">Rate:</label>
                                <InputText v-model="item.rate" mode="number" min="0" placeholder="0" id="rate" class="w-full md:w-34" :disabled="true" />
                            </div>
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                            <InputText v-model="item.employer_contribution" id="fixed_amount" placeholder="0" class="w-full md:w-36" :disabled="checkDisabled(item)" />
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                            <InputText v-model="item.percent_of_basic" mode="number" min="0" placeholder="0" id="percent_of_basic" class="w-full md:w-24" :disabled="checkDisabled(item)" />
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                            <Checkbox v-model="item.deduction.checkoff" binary class="w-full md:w-24" :disabled="checkDisabled(item)" v-if="parseInt(item.rate) === 0" />
                            <div v-if="parseInt(item.rate) > 0" class="flex items-center space-x-4">
                                <label for="rate">Amount:</label>
                                <h5>{{ item.amount }}</h5>
                            </div>
                        </td>
                        <td class="px-1 py-2 border border-gray-300 flex items-center">
                            <label class="w-full md:w-32">{{ item.paid_to_date }}</label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <Toolbar class="mb-2 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <div class="flex flex-wrap gap-2 items-center">
                    <Dropdown v-model="selectedDeduction" :options="deductions" @change="addDeduction" optionLabel="component.title" placeholder="Add Deduction" class="w-full md:w-56" />
                    <Button label="Update Deductions" icon="pi pi-sync" severity="primary" @click="updateDeductions" class="m-1" />
                </div>
            </template>
        </Toolbar>
        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Are you sure you want to delete this item?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteItemDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="removeItem" />
            </template>
        </Dialog>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
.payroll-container {
    background-color: #f9fafb;
}

.shadow-lg {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
