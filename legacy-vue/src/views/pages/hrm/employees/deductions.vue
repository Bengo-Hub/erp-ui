<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const { departments, regions, loading: filterLoading, loadFilters } = useHrmFilters();
const selectedComponent = ref(null);
const components = ref([]);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const filteredDeductions = ref([]); // For selection purposes
const deductionsData = ref([]); // To store fetched loan data
const filters = ref({}); // Placeholder for filters
const isLoading = ref(false);

onMounted(() => {
    fetchPayrollComponents();
    loadFilters();
    fetchDeductions();
});

const fetchPayrollComponents = () => {
    const params = {
        category: 'Deductions'
    };
    isLoading.value = true;
    employeeService
        .listPayrollComponents(params)
        .then((response) => {
            components.value = response.data;
        })
        .catch((error) => {
            console.error('Error fetching payroll components:', error);
            showToast('error', 'Error', error.toString(), 3000);
        })
        .finally(() => {
            isLoading.value = false; // Always hide the loading spinner
        });
};

// Function to fetch deductions from the API
function fetchDeductions() {
    isLoading.value = true;
    employeeService
        .listEmployeeDeductions({
            deduction: selectedComponent.value ? selectedComponent.value : null,
            'department[]': selectedDepartment.value || [],
            'region[]': selectedRegion.value || []
        })
        .then((response) => {
            deductionsData.value = response.data; // Assign the results
        })
        .catch((error) => {
            console.error('Error fetching deductions:', error);
            showToast('error', 'Error', error?.response?.data?.detail || error.message, 5000);
        })
        .finally(() => {
            isLoading.value = false;
        });
}

function deleteDeductions() {
    // Logic to delete selected deductions (not implemented yet)
}

function calculateDeduction(row) {
    // Recalculate per-row if needed (client-side view only)
}
</script>

<template>
    <!-- First Toolbar for Filters -->
    <Toolbar class="mb-4 bg-gray-100 p-4 rounded-lg">
        <template #start>
            <div class="flex flex-wrap gap-3 items-center justify-start">
                <!-- Responsive Filters with Full Width on Mobile -->
                <Select :options="components" optionLabel="title" optionValue="id" display="chip" class="w-full md:w-64" placeholder="Select Item" v-model="selectedComponent" :filter="true" filterPlaceholder="Search Item" @change="fetchDeductions" />
                <MultiSelect
                    :options="departments"
                    optionLabel="title"
                    optionValue="id"
                    display="chip"
                    :maxSelectedLabels="3"
                    class="w-full md:w-64"
                    placeholder="All Departments"
                    v-model="selectedDepartment"
                    :filter="true"
                    filterPlaceholder="Search Department"
                    @change="fetchDeductions"
                />
                <MultiSelect
                    :options="regions"
                    optionLabel="name"
                    optionValue="id"
                    class="w-full md:w-64"
                    display="chip"
                    :maxSelectedLabels="3"
                    placeholder="All Regions"
                    v-model="selectedRegion"
                    :filter="true"
                    filterPlaceholder="Search Region"
                    @change="fetchDeductions"
                />
                <MultiSelect
                    :options="projects"
                    optionLabel="name"
                    optionValue="id"
                    class="w-full md:w-64"
                    display="chip"
                    :maxSelectedLabels="3"
                    placeholder="All Projects"
                    v-model="selectedProject"
                    :filter="true"
                    filterPlaceholder="Search Project"
                    @change="fetchDeductions"
                />

                <!-- Refresh Button -->
                <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchDeductions" />
            </div>
        </template>
    </Toolbar>
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredDeductions"
        :value="deductionsData"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25, 50, 100]"
        class="p-datatable-sm mt-4"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} deductions"
        :loading="isLoading || filterLoading"
    >
        <template #header>
            <div class="flex justify-between">
                <div class="flex justify-start">
                    <Button label="Active" class="mr-2" severity="success" />
                    <Button label="Inactive" severity="warning" />
                </div>
                <div class="flex justify-end flex-wrap gap-2">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteDeductions" class="w-full sm:w-auto" :disabled="filteredDeductions.length === 0" />
                </div>
            </div>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="deduction.staffNo" header="staffNo" />
        <Column field="deduction.name" header="Employee" />
        <Column field="deduction.quantity" header="Quantity">
            <template #body="slotProps">
                <input type="number" v-model="slotProps.data.deduction.quantity" @input="calculateDeduction(slotProps.data)" class="p-inputtext p-component" />
            </template>
        </Column>
        <Column field="deduction.amount" header="Amount" />
        <Column field="deduction" header="Deduction">
            <template #body="slotProps">
                {{ slotProps.data.deduction.amount * slotProps.data.deduction.quantity || 0 }}
            </template>
        </Column>
        <Column field="deduction.Paid_to_Date" header="Paid to Date" />
    </DataTable>
    <Toast />
</template>

<style>
/* Optional: Add styles here if needed */
</style>
