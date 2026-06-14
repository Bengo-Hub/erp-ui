<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const filteredEarnings = ref([]); // For filtering purposes
const filters = ref({}); // Placeholder for filters
const earningsData = ref([]);
const components = ref([]);

// HRM filters composable
const { departments, regions, loading: filterLoading, loadFilters } = useHrmFilters();

const selectedEarning = ref();
const selectedDepartment = ref();
const selectedRegion = ref();
const isLoading = ref(false);

onMounted(() => {
    fetchPayrollComponents();
    loadFilters();
    fetchEarnings();
});

const fetchPayrollComponents = () => {
    const params = {
        category: 'Earnings'
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
            isLoading.value = false;
        });
};

// Function to fetch earnings from the API
function fetchEarnings() {
    isLoading.value = true;
    employeeService
        .listEmployeeEarnings({
            earning: selectedEarning.value ? selectedEarning.value : null,
            'department[]': selectedDepartment.value || [],
            'region[]': selectedRegion.value || []
        })
        .then((response) => {
            earningsData.value = response.data; // Assign the results
        })
        .catch((error) => {
            console.error('Error fetching earnings:', error);
            showToast('error', 'Error', error?.response?.data?.detail || error.message, 5000);
        })
        .finally(() => {
            isLoading.value = false;
        });
}
</script>
<template>
    <Toolbar>
        <template #start>
            <Select :options="components" optionLabel="title" optionValue="id" display="chip" class="w-full md:w-64" placeholder="-Earnings-" v-model="selectedEarning" :filter="true" filterPlaceholder="Search Item" @change="fetchEarnings" />
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
                @change="fetchEarnings"
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
                @change="fetchEarnings"
            />
            <InputText placeholder="Search employee..." />
        </template>
    </Toolbar>
    <Toolbar>
        <template #end>
            <Button icon="pi pi-refresh" class="mr-1" @click="fetchEarnings" />
            <Button icon="pi pi-file-import" label="Import" @click="importData" class="p-button-small mr-1" />

            <Button icon="pi pi-file-excel" label="excel" class="mr-1" />
            <Button icon="pi pi-file" label="copy" />
        </template>
    </Toolbar>
    <!--Data Table-->
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredEarnings"
        :value="earningsData"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25, 50, 100]"
        class="p-datatable-sm mt-4"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        :loading="isLoading || filterLoading"
    >
        <template #header>
            <div class="flex flex-wrap gap-2">
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSlip($event)" class="w-full sm:w-auto" :disabled="filteredEarnings.length === 0" />
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="earning.staffNo" header="Staff No" />
        <Column field="earning.name" header="Employee" />
        <Column field="earning.amount" header="Fixed Amount(KES)" />
        <Column field="earning.basicPay" header="or % of Basic Pay" />
    </DataTable>
    <Toast />
</template>
