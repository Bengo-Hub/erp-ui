<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';
const { departments, regions, loadFilters } = useHrmFilters();
const selectedEmployee = ref(null);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const filteredEmployees = ref([]); // For selection purposes
const employeesData = ref([]); // To store fetched loan data
const filters = ref({}); // Placeholder for filters
const selectedItem = ref(null);
const items = ref([{ title: 'Bio Data' }, { title: 'Registrations' }, { title: 'Contact Details' }, { title: 'Next of Kin' }]);

onMounted(async () => {
    await loadFilters();
    fetchEmployees();
});

// Function to fetch loans from the API
function fetchEmployees() {
    const params = {
        emp_id: selectedEmployee.value ? selectedEmployee.value : null,
        'department[]': selectedDepartment.value ? [selectedDepartment.value] : [],
        'region[]': selectedRegion.value ? [selectedRegion.value] : []
    };
    employeeService
        .getEmployeeHRDetails(params.emp_id)
        .then((data) => {
            employeesData.value = Array.isArray(data) ? data : [data];
        })
        .catch((error) => {
            console.error('Error fetching employees data:', error);
        });
}

// Optional: Function to delete loans (implement as needed)
function deleteEmployees() {
    // Logic to delete selected loans
}
</script>

<template>
    <!-- First Toolbar for Filters -->
    <Toolbar class="mb-4 bg-gray-100 p-4 rounded-lg">
        <template #start>
            <div class="flex flex-wrap gap-3 items-center justify-start">
                <!-- Responsive Filters with Full Width on Mobile -->
                <Select :options="items" optionLabel="title" class="w-full md:w-64" placeholder="Select an Item" v-model="selectedItem" />
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
                    @change="fetchEmployees"
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
                    @change="fetchEmployees"
                />

                <!-- Refresh Button -->
                <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchEmployees" />
            </div>
        </template>
    </Toolbar>
    <DataTable
        ref="dt"
        dataKey="id"
        v-model:selection="filteredEmployees"
        :value="employeesData"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25, 50, 100]"
        class="p-datatable-sm mt-4"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
    >
        <template #header>
            <div class="flex justify-between">
                <div class="flex justify-start">
                    <Button label="Active" class="mr-2" severity="success" />
                    <Button label="Inactive" severity="warning" />
                </div>
                <div class="flex justify-end flex-wrap gap-2">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteEmployees" class="w-full sm:w-auto" :disabled="filteredEmployees.length === 0" />
                </div>
            </div>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3em" />
        <Column field="personalData.staffNo" header="Staff No" />
        <Column field="personalData.name" header="Employee Name" />
        <Column field="personalData.Dob" header="Date of Birth" />
        <Column field="" header="Age" />
        <!--not yet defined in Employees model-->
        <!--<Column field="date_of_birth" header="Date of Birth" />-->
        <Column field="personalData.gender" header="Gender" />
    </DataTable>
</template>

<style>
/* Optional: Add styles here if needed */
</style>
