<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref, watch } from 'vue';

const toast = useToast();
// removed unused router/route
const earnings = ref([]);
const isLoading = ref(false);
const allActive = ref(false);
const allcheckOff = ref(false);
const deleteItemDialog = ref(false);
const selectedEarning = ref(null);
const selectedEarningId = ref(null);
const spinner_title = ref('Please wait...! Fetching data...!');
// removed unused dt
const filteredPayrollData = ref([]);

const props = defineProps({
    payrollData: Array,
    totalRecords: Number,
    empid: Number
});
// Pagination and filters
// removed unused pagination/filters/sorting
// Watch for changes in quantity or rate and update amount accordingly
watch(
    filteredPayrollData,
    (newData) => {
        newData.forEach((item) => {
            if (parseInt(item.quantity) > 0) {
                item.amount = parseInt(item.quantity) * parseFloat(item.rate);
            }
        });
    },
    { deep: true }
);

onMounted(() => {
    filteredPayrollData.value = props.payrollData;
    fetchPayrollComponents();
});

const addEarning = async () => {
    if (!filteredPayrollData.value.find((item) => item.earning.title === selectedEarning.value.component.title)) {
        if (selectedEarning.value.component.mode === 'perday' || selectedEarning.value.component.mode === 'perhour') {
            const response = await payrollService.getEmployeePayrollData(selectedEarning.value.component.id, props.empid);
            selectedEarning.value = { ...response.data, quantity: 1 };
        }
        selectedEarning.value = {
            ...selectedEarning.value,
            employee: { id: props.empid },
            earning: selectedEarning.value.component
        };
        // Remove 'component' safely
        delete selectedEarning.value.component;
        console.log(selectedEarning.value);
        filteredPayrollData.value = [...filteredPayrollData.value, selectedEarning.value];
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `${selectedEarning.value.earning.title} added!`,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'info',
            summary: 'Duplicate detected',
            detail: `${selectedEarning.value.component.title} already exists!`,
            life: 3000
        });
    }
};
const updateEarnings = async () => {
    try {
        const data = filteredPayrollData.value.map((item) => ({
            ...item,
            employee: item.employee.id || { id: props.empid }
        }));
        console.log(data);
        if (data.length > 0) {
            const response = await employeeService.bulkUpsertEarnings(data);
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
        selectedEarningId.value = null;
        selectedEarning.value = null;
    }
};

const fetchPayrollComponents = async () => {
    const params = {
        category: 'Earnings',
        is_active: true
    };
    await payrollService.listPayrollComponents(params).then((response) => {
        let data = response.data;
        earnings.value = data;
    });
};

const showItemDeleteDialog = (dataid) => {
    selectedEarningId.value = dataid;
    deleteItemDialog.value = true;
};

// Handle filter change
const removeItem = async () => {
    try {
        const data = {
            earning_id: selectedEarningId.value,
            employee_id: props.empid
        };
        if (selectedEarningId.value !== 0) {
            const response = await employeeService.removeEarningByPayload(data);
            filteredPayrollData.value = filteredPayrollData.value.filter((item) => item.id !== selectedEarningId.value);
        } else {
            filteredPayrollData.value = filteredPayrollData.value.filter((item) => item.earning.title !== selectedEarning.value.earning.title);
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
        selectedEarningId.value = null;
        selectedEarning.value = null;
    }
};
</script>

<template>
    <div class="container-fluid">
        <!-- Table  -->
        <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-gray-200">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-2 border border-gray-300">#</th>
                        <th class="px-4 py-2 border border-gray-300">Title</th>
                        <th class="px-4 py-2 border border-gray-300">Fixed Amount(KES)</th>
                        <th class="px-4 py-2 border border-gray-300">
                            or % of Basic Pay<br /><small>(<em>Overrides fixed amount</em>)</small>
                        </th>
                        <th class="px-1 py-2 border border-gray-300 w-full md:w-36">Taxable</th>
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
                            <label class="w-full">{{ item.earning.title }}</label>
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                            <InputNumber v-model="item.amount" id="amount" showButtons :min="1" placeholder="0" class="w-full" v-if="parseInt(item.quantity) === 0" fluid />
                            <div v-if="parseInt(item.quantity) > 0" class="flex items-center space-x-4">
                                <label for="quantity">Quantity:</label>
                                <InputNumber v-model="item.quantity" id="quantity" showButtons :min="1" mode="decimal" placeholder="0" class="w-full md:w-34" fluid />
                            </div>
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                            <InputNumber v-model="item.percent_of_basic" showButtons mode="decimal" :min="1" placeholder="0" id="percent_of_basic" class="w-full" v-if="parseInt(item.rate) === 0" fluid />
                            <div v-if="parseInt(item.rate) > 0" class="flex items-center space-x-4">
                                <label for="rate">Rate:</label>
                                <InputNumber v-model="item.rate" mode="decimal" showButtons :min="1" placeholder="0" id="rate" class="w-full md:w-34" :disabled="true" fluid />
                            </div>
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                            <Checkbox v-model="item.earning.taxable_status" binary class="w-full md:w-24" v-if="parseInt(item.rate) === 0" />
                            <div v-if="parseInt(item.rate) > 0" class="flex items-center space-x-4">
                                <label for="rate">Amount:</label>
                                <h5>{{ item.amount }}</h5>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <Toolbar class="mb-2 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <div class="flex flex-wrap gap-2 items-center">
                    <Dropdown v-model="selectedEarning" :options="earnings" @change="addEarning" optionLabel="component.title" placeholder="Add Earning" class="w-full md:w-56" />
                    <Button label="Update Earnings" icon="pi pi-sync" severity="primary" @click="updateEarnings" class="m-1" />
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
