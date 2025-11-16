<script setup>
import { computed } from 'vue';

const props = defineProps({
    selectedMonth: {
        type: Date,
        required: true
    },
    selectedDepartment: {
        type: Array,
        default: () => []
    },
    selectedRegion: {
        type: [Number, null],
        default: null
    },
    selectedProject: {
        type: [Number, null],
        default: null
    },
    recoverAdvances: {
        type: Boolean,
        default: true
    },
    departments: {
        type: Array,
        default: () => []
    },
    regions: {
        type: Array,
        default: () => []
    },
    projects: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:selectedMonth', 'update:selectedDepartment', 'update:selectedRegion', 'update:selectedProject', 'update:recoverAdvances', 'next-step']);

const isValid = computed(() => {
    return !!props.selectedMonth;
});

const handleMonthChange = (event) => {
    emit('update:selectedMonth', event);
};

const handleDepartmentChange = (event) => {
    emit('update:selectedDepartment', event);
};

const handleRegionChange = (event) => {
    emit('update:selectedRegion', event);
};

const handleProjectChange = (event) => {
    emit('update:selectedProject', event);
};

const handleAdvancesChange = (event) => {
    emit('update:recoverAdvances', event);
};

const handleNextStep = () => {
    emit('next-step');
};
</script>

<template>
    <div class="step-card">
        <div class="step-header">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Configure Payroll Period</h2>
            <p class="text-gray-600 dark:text-gray-400">Select the payroll month and basic configuration</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="form-group">
                <label class="form-label">Payroll Month *</label>
                <Calendar :model-value="selectedMonth" view="month" dateFormat="mm/yy" placeholder="Select Month" class="w-full" :showIcon="true" @date-select="handleMonthChange" />
                <small class="text-gray-500 dark:text-gray-400">Select the month for payroll processing</small>
            </div>

            <div class="form-group">
                <label class="form-label">Department</label>
                <MultiSelect
                    :model-value="selectedDepartment"
                    :options="departments"
                    optionLabel="title"
                    optionValue="id"
                    placeholder="All Departments"
                    class="w-full"
                    :filter="true"
                    filterPlaceholder="Search departments"
                    @change="handleDepartmentChange"
                />
            </div>

            <div class="form-group">
                <label class="form-label">Region</label>
                <Dropdown :model-value="selectedRegion" :options="regions" optionLabel="title" optionValue="id" placeholder="All Regions" class="w-full" :filter="true" filterPlaceholder="Search regions" @change="handleRegionChange" />
            </div>

            <div class="form-group">
                <label class="form-label">Project</label>
                <Dropdown :model-value="selectedProject" :options="projects" optionLabel="name" optionValue="id" placeholder="All Projects" class="w-full" :filter="true" filterPlaceholder="Search projects" @change="handleProjectChange" />
            </div>

            <div class="form-group">
                <label class="form-label">Recover Advances</label>
                <div class="flex items-center space-x-3">
                    <InputSwitch :model-value="recoverAdvances" @change="handleAdvancesChange" />
                    <span class="text-sm text-gray-600 dark:text-gray-400"> Automatically recover employee advances </span>
                </div>
            </div>
        </div>

        <div class="step-actions">
            <Button label="Next Step" icon="pi pi-arrow-right" class="p-button-primary" :disabled="!isValid" @click="handleNextStep" />
        </div>
    </div>
</template>

<style scoped>
.step-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700;
}

.step-header {
    @apply mb-6 pb-4 border-b border-gray-200 dark:border-gray-600;
}

.step-header h2 {
    @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.step-header p {
    @apply text-gray-600 dark:text-gray-400;
}

.form-group {
    @apply space-y-2;
}

.form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.step-actions {
    @apply flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-600;
}
</style>
