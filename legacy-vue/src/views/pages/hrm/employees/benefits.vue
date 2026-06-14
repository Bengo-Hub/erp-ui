<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const { departments, regions, loading: filterLoading, loadFilters } = useHrmFilters();
const benefits = ref([]);
const benefitsData = ref([]);
const filteredBenefits = ref([]); // For filtering purposes
const filters = ref({}); // Placeholder for filters
const selectedBenefit = ref(null);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const isLoading = ref(false);

onMounted(() => {
    loadFilters();
    fetchBenefits();
    fetchBenefitsData();
});

const fetchBenefits = () => {
    isLoading.value = true;
    employeeService
        .listPayrollComponents({ category: 'Benefits', is_active: true })
        .then((response) => {
            const data = response.data?.results || response.data || [];
            benefits.value = data.map((item) => ({ id: item.id, name: item.title || item.name }));
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error?.response?.data?.detail || error.message, life: 5000 });
        })
        .finally(() => {
            isLoading.value = false; // Always hide the loading spinner
        });
};

function fetchBenefitsData() {
    isLoading.value = true;
    employeeService
        .listEmployeeBenefits({
            benefit: selectedBenefit.value ? selectedBenefit.value : null,
            'department[]': selectedDepartment.value || [],
            'region[]': selectedRegion.value || []
        })
        .then((response) => {
            benefitsData.value = response.data?.results || response.data || [];
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error?.response?.data?.detail || error.message, life: 5000 });
        })
        .finally(() => {
            isLoading.value = false;
        });
}
</script>
<template>
    <Toolbar>
        <template #start>
            <Select v-model="selectedBenefit" :options="benefits" optionLabel="name" placeholder="-Benefits-" class="w-full md:w-56 mr-1" />
            <Select v-model="selectedDepartment" :options="departments" optionLabel="title" placeholder="-No Department Set-" class="w-full md:w-56 mr-1" />
            <Select v-model="selectedRegion" :options="regions" optionLabel="name" placeholder="-All Regions-" class="w-full md:w-56 mr-1" />
            <InputText placeholder="Search employee..." />
        </template>
    </Toolbar>
    <Toolbar>
        <template #end>
            <Button icon="pi pi-refresh" class="mr-1" @click="fetchBenefitsData" />
            <Button icon="pi pi-file-import" label="Import" @click="importData" class="p-button-small mr-1" />

            <Button icon="pi pi-file-excel" label="excel" class="mr-1" />
            <Button icon="pi pi-file" label="copy" />
        </template>
    </Toolbar>
    <!--Data Table-->
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredBenefits"
        :value="benefitsData"
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
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSlip($event)" class="w-full sm:w-auto" :disabled="filteredBenefits.length === 0" />
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="employee.staffNo" header="Staff No" />
        <Column field="employee.name" header="Employee" />
        <Column field="amount" header="Fixed Amount(KES)" />
        <Column field="basicPay" header="or % of Basic Pay" />
    </DataTable>
    <Toast />
</template>
