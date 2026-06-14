<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';
const filteredPaymentData = ref([]); // For filtering purposes
const filters = ref({}); // Placeholder for filters
const { departments, regions, loadFilters } = useHrmFilters();
const selectedItem = ref(null); // Make this reactive

const items = ref([{ title: 'Bank Transfer' }, { title: 'Mobile money' }, { title: 'Cash' }, { title: 'Cheque' }]);
const selectedDepartment = ref([]);
const selectedRegion = ref([]);
const paymentDatas = ref([]); // Holds the payment data from the API

//const selectedDepartment = ref();
//const departments = ref([{ name: 'Finance' }, { name: 'HR' }, { name: 'ICT' }, { name: 'Transport' }]);
//const selectedRegion = ref();
//const regions = ref([{ name: 'Kisumu' }, { name: 'Nairobi' }, { name: 'Mombasa' }, { name: 'Nakuru' }]);
//isLoading = true;
onMounted(async () => {
    await loadFilters();
    fetchPaymentData();
});


// Function to fetch salary details from the API
function fetchPaymentData() {
    const params = {
        paymentType: selectedItem.value ? selectedItem.value : null,
        'department[]': selectedDepartment.value ? [selectedDepartment.value] : [],
        'region[]': selectedRegion.value ? [selectedRegion.value] : []
    };
    employeeService
        .listSalaryDetails(params)
        .then((response) => {
            const data = response.data?.results || response.data;
            paymentDatas.value = data;
        })
        .catch((error) => {
            console.error('Error fetching payment Data:', error);
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
                @change="fetchPaymentData"
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
                @change="fetchPaymentData"
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
        v-model:selection="filteredPaymentData"
        :value="paymentDatas"
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
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSlip($event)" class="w-full sm:w-auto" :disabled="filteredPaymentData.length === 0" />
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="paymentData.staffNo" header="Staff No" />
        <Column field="paymentData.AccountName" header="Account Name" />
        <Column field="paymentData.AccountNumber" header="Account Number" />
        <Column field="paymentData.Bank" header="Bank" />
        <Column field="paymentData.BranchName" header="Branch Name" />
        <Column field="paymentData.BranchSortCode" header="Branch(Sort)Code" />
    </DataTable>
</template>
