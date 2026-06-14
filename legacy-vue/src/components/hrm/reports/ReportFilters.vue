<template>
    <div class="report-filters">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Year Filter -->
            <div v-if="showYear" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <Dropdown
                    v-model="localFilters.year"
                    :options="yearOptions"
                    placeholder="Select Year"
                    class="w-full"
                    @change="emitFilters"
                />
            </div>

            <!-- Month Filter -->
            <div v-if="showMonth" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <Dropdown
                    v-model="localFilters.month"
                    :options="monthOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Month"
                    class="w-full"
                    @change="emitFilters"
                />
            </div>

            <!-- Department Filter -->
            <div v-if="showDepartment" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <Dropdown
                    v-model="localFilters.department"
                    :options="departmentOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="All Departments"
                    class="w-full"
                    showClear
                    @change="emitFilters"
                />
            </div>

            <!-- Region Filter -->
            <div v-if="showRegion" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <Dropdown
                    v-model="localFilters.region"
                    :options="regionOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="All Regions"
                    class="w-full"
                    showClear
                    @change="emitFilters"
                />
            </div>

            <!-- Project Filter -->
            <div v-if="showProject" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <Dropdown
                    v-model="localFilters.project"
                    :options="projectOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="All Projects"
                    class="w-full"
                    showClear
                    @change="emitFilters"
                />
            </div>

            <!-- Employee Filter -->
            <div v-if="showEmployee" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <Dropdown
                    v-model="localFilters.employee"
                    :options="employeeOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="All Employees"
                    class="w-full"
                    filter
                    showClear
                    @change="emitFilters"
                />
            </div>

            <!-- Date Range Filter -->
            <div v-if="showDateRange" class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <Calendar
                    v-model="localFilters.dateRange"
                    selectionMode="range"
                    :manualInput="false"
                    dateFormat="yy-mm-dd"
                    placeholder="Select Date Range"
                    class="w-full"
                    @date-select="emitFilters"
                />
            </div>

            <!-- Custom Slot for Additional Filters -->
            <slot name="additional-filters"></slot>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center mt-6">
            <div class="flex gap-2">
                <slot name="filter-actions-start"></slot>
            </div>
            <div class="flex gap-2">
                <Button
                    label="Clear Filters"
                    icon="pi pi-filter-slash"
                    class="p-button-outlined p-button-sm"
                    @click="clearFilters"
                />
                <Button
                    label="Generate Report"
                    icon="pi pi-chart-bar"
                    class="p-button-sm"
                    :loading="loading"
                    @click="generateReport"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { computed, reactive, watch } from 'vue';

const props = defineProps({
    showYear: { type: Boolean, default: true },
    showMonth: { type: Boolean, default: true },
    showDepartment: { type: Boolean, default: true },
    showRegion: { type: Boolean, default: true },
    showProject: { type: Boolean, default: true },
    showEmployee: { type: Boolean, default: false },
    showDateRange: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    modelValue: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'generate', 'clear']);

// Use HRM filters composable
const { departments, regions, projects, employees, loadFilters } = useHrmFilters();

// Load filters on mount
loadFilters();

// Local filter state
const localFilters = reactive({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: null,
    region: null,
    project: null,
    employee: null,
    dateRange: null,
    ...props.modelValue
});

// Year options (last 5 years + next 2 years)
const currentYear = new Date().getFullYear();
const yearOptions = computed(() => {
    const years = [];
    for (let i = currentYear + 2; i >= currentYear - 5; i--) {
        years.push(i);
    }
    return years;
});

// Month options
const monthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
];

// Options with proper formatting
const departmentOptions = computed(() => departments.value || []);
const regionOptions = computed(() => regions.value || []);
const projectOptions = computed(() => projects.value || []);
const employeeOptions = computed(() => 
    (employees.value || []).map(emp => ({
        id: emp.id,
        name: `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim()
    }))
);

// Methods
const emitFilters = () => {
    emit('update:modelValue', { ...localFilters });
};

const generateReport = () => {
    emit('generate', { ...localFilters });
};

const clearFilters = () => {
    localFilters.year = new Date().getFullYear();
    localFilters.month = new Date().getMonth() + 1;
    localFilters.department = null;
    localFilters.region = null;
    localFilters.project = null;
    localFilters.employee = null;
    localFilters.dateRange = null;
    
    emitFilters();
    emit('clear');
};

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
    Object.assign(localFilters, newVal);
}, { deep: true });
</script>

