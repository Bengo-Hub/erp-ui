<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
const toast = useToast();
const filteredHrData = ref([]); // For filtering purposes
const filters = ref({}); // Placeholder for filters
const { departments, regions, loadFilters } = useHrmFilters();
const selectedItem = ref(null); // Make this reactive

const items = ref([{ title: 'Org structure' }, { title: 'Off Days' }]);
// const selectedHrData = ref([]);
const selectedDepartment = ref([]);
const selectedRegion = ref([]);
const hrDatas = ref([]); // Holds the HR data from the API

onMounted(() => {
    loadFilters();
    fetchHrData();
});

// Function to fetch salary details from the API
function fetchHrData() {
    const params = {
        // category and title handled by backend EmployeePayrollDataViewSet; here we fetch HR details list instead
        'department[]': selectedDepartment.value || [],
        'region[]': selectedRegion.value || []
    };
    employeeService
        .listHRDetails(params)
        .then((response) => {
            const data = response?.data?.results || response?.data || [];
            hrDatas.value = data;
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error?.response?.data?.detail || error.message, life: 5000 });
        });
}
</script>
<template>
    <Toolbar>
        <template #start>
            <Select :options="items" optionLabel="title" class="w-full md:w-64" placeholder="Select an item" v-model="selectedItem" filterPlaceholder="Search Item" />
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
                @change="fetchHrData"
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
                @change="fetchHrData"
            />
            <InputText placeholder="Search employee..." />
        </template>
    </Toolbar>
    <Toolbar>
        <template #end>
            <Button icon="pi pi-refresh" class="mr-1" />
            <Button icon="pi pi-file-import" label="Import" @click="importData" class="p-button-small mr-1" />

            <Button icon="pi pi-file-excel" label="excel" class="mr-1" />
            <Button icon="pi pi-file" label="copy" />
        </template>
    </Toolbar>
    <!--Data Table-->
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredHrData"
        :value="hrDatas"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25, 50, 100]"
        class="p-datatable-sm mt-4"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
    >
        <template #header>
            <div class="flex flex-wrap gap-2">
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSlip($event)" class="w-full sm:w-auto" :disabled="filteredHrData.length === 0" />
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="hrData.staffNo" header="Staff No" sortable />
        <Column field="hrData.name" header="Employee" sortable />
        <Column field="hrData.JobTitle" header="Job Title" sortable />
        <Column header="Reports To">
            <template #body="{ data }">
                {{ data.hrData?.['Reports to']?.name || '—' }}
            </template>
        </Column>
        <Column field="hrData.Department" header="Department" sortable />
        <Column field="hrData.Region" header="Region" sortable />
    </DataTable>
</template>
