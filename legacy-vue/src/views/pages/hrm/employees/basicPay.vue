<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';
const filteredSalaryDetails = ref([]); // For filtering purposes
const filters = ref({}); // Placeholder for filters
const salaryDetailsData = ref([]);

const { departments, regions, loadFilters } = useHrmFilters();

const selectedDepartment = ref([]);
const selectedRegion = ref([]);

const salaryDetails = ref([]);
const selectedSalaryDetail = ref();

const selectedItem = ref();
const items = ref([{ title: 'Monthly Salary' }, { title: 'Working hours' }]);

const selectedPayType = ref();
const payTypes = ref([{ title: 'basic Pay' }, { title: 'net Pay' }, { title: 'consolidated Pay' }, { title: 'gross Pay' }]);

//const selectedDepartment = ref();
//const departments = ref([{ name: 'Finance' }, { name: 'HR' }, { name: 'ICT' }, { name: 'Transport' }]);
//const selectedRegion = ref();
//const regions = ref([{ name: 'Kisumu' }, { name: 'Nairobi' }, { name: 'Mombasa' }, { name: 'Nakuru' }]);
//isLoading = true;
onMounted(async () => {
    await loadFilters();
    fetchSalaryDetails();
});


// Function to fetch salary details from the API
function fetchSalaryDetails() {
    const params = {
        salaryDetail: selectedSalaryDetail.value ? selectedSalaryDetail.value : null,
        'department[]': selectedDepartment.value ? [selectedDepartment.value] : [],
        'region[]': selectedRegion.value ? [selectedRegion.value] : []
    };
    employeeService
        .listSalaryDetails(params)
        .then((response) => {
            salaryDetailsData.value = response.data?.results || response.data;
        })
        .catch((error) => {
            console.error('Error fetching salary details:', error);
        });
}
</script>
<template>
    <Toolbar>
        <template #start>
            <Select :options="items" optionLabel="title" optionValue="id" display="chip" class="w-full md:w-64" placeholder="Select an item" v-model="selectedItem" />

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
                @change="fetchSalaryDetails"
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
                @change="fetchSalaryDetails"
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
        v-model:selection="filteredSalaryDetails"
        :value="salaryDetailsData"
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
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSlip($event)" class="w-full sm:w-auto" :disabled="filteredSalaryDetails.length === 0" />
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="salaryDetail.staffNo" header="Staff No" />
        <Column field="salaryDetail.name" header="Employee" />
        <Column field="" header="Adjust by (KES)" />
        <Column field="" header="By (%)" />
        <Column field="salaryDetail.currentPay" header="Current Pay" />
        <Column field="" header="New Pay" />
        <Column header="Treat as">
            <template #body="slotProps">
                <Select v-model="selectedPayType" :options="payTypes" optionLabel="title" placeholder="basic pay" class="w-full md:w-64" />
            </template>
        </Column>
    </DataTable>
</template>
