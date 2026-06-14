<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();
const filteredLoans = ref([]); // For selection purposes
const loansData = ref([]); // To store fetched loan data
const loading = ref(false);

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();

// State Management
const selectedLoan = ref(null);
const loans = ref([]);
const selectedDepartment = ref(null);
const selectedRegion = ref(null);
const selectedProject = ref(null);

onMounted(async () => {
    await loadFilters();
    fetchLoans();
});

// Function to fetch loans from the API
const fetchLoans = async () => {
    loading.value = true;
    try {
        const params = {
            loan: selectedLoan.value || null,
            department: selectedDepartment.value || null,
            region: selectedRegion.value || null,
            project: selectedProject.value || null
        };

        const response = await employeeService.listLoans(params);
        loans.value = response.data?.results || response.data || [];
        loansData.value = [...loans.value];
    } catch (error) {
        console.error('Error fetching loans:', error);
        showToast('error', 'Error', 'Failed to fetch loans', 3000);
    } finally {
        loading.value = false;
    }
};

// Delete selected loans
async function deleteLoans() {
    if (!filteredLoans.value || filteredLoans.value.length === 0) {
        return;
    }
    try {
        const ids = filteredLoans.value.map((row) => row.id).filter(Boolean);
        if (ids.length === 0) {
            showToast('warning', 'Warning', 'Selected rows have no IDs', 3000);
            return;
        }
        await Promise.all(ids.map((id) => employeeService.removeEmployeeLoan(undefined, id)));
        showToast('success', 'Success', 'Selected loans deleted successfully', 3000);
        filteredLoans.value = [];
        await fetchLoans();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to delete loans', 5000);
    }
}

function confirmDelete() {
    if (!filteredLoans.value || filteredLoans.value.length === 0) {
        showToast('warning', 'Warning', 'Select one or more loans to delete', 3000);
        return;
    }
    confirm.require({
        message: 'Are you sure you want to delete the selected loans?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => deleteLoans()
    });
}

const importData = () => {
    // Handle import functionality
    showToast('info', 'Info', 'Import functionality coming soon', 3000);
};
</script>

<template>
    <div class="flex justify-center font-bold bg-primary text text-white h-10 mb-2">
        <h2 class="text-xl primary-text text-white pt-2">Loans</h2>
    </div>
    <Toolbar class="mb-2">
        <template #start>
            <Select v-model="selectedLoan" :options="loans" optionLabel="name" placeholder="All loans" class="w-full md:w-56 mr-1" />
            <Select v-model="selectedDepartment" :options="departments" optionLabel="title" placeholder="All Departments" class="w-full md:w-56 mr-1" />
            <Select v-model="selectedRegion" :options="regions" optionLabel="name" placeholder="All Regions" class="w-full md:w-56 mr-1" />
            <Select v-model="selectedProject" :options="projects" optionLabel="name" placeholder="All Projects" class="w-full md:w-56 mr-1" />
            <InputText placeholder="Search employee..." />
            <Button icon="pi pi-refresh" @click="fetchLoans" class="mr-1" />
        </template>
    </Toolbar>
    <Toolbar>
        <template #end>
            <Button icon="pi pi-file-import" label="Import" @click="importData" class="p-button-small mr-1" />

            <Button icon="pi pi-file-excel" label="excel" class="mr-1" />
            <Button icon="pi pi-file" label="copy" />
        </template>
    </Toolbar>
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredLoans"
        :value="loansData"
        :paginator="true"
        :loading="loading"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25, 50, 100]"
        class="p-datatable-sm mt-4"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} loans"
    >
        <template #header>
            <div class="flex justify-between">
                <div class="flex justify-start">
                    <Button label="Active" class="mr-2" severity="success" />
                    <Button label="Inactive" severity="warning" />
                </div>
                <div class="flex justify-end flex-wrap gap-2">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDelete" class="w-full sm:w-auto" :disabled="filteredLoans.length === 0" />
                </div>
            </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="loan_details.staffNo" header="staffNo" />
        <Column field="loan_details.name" header="Employee" />
        <Column field="loan_details.principal_amount" header="Principal Amount" />
        <Column field="loan_details.installments" header="Installments" />
        <Column field="loan_details.interest" header="Interest" />
    </DataTable>
</template>

<Toast />
<ConfirmDialog />

<style>
/* Optional: Add styles here if needed */
</style>
