<script setup>
import { useToast } from '@/composables/useToast';
import { leaveService } from '@/services/hrm/leaveService';
import { ref } from 'vue';

const { showToast } = useToast();
const loading = ref(false);
const date = ref();
const selectedGender = ref();
const selectedAccrualMode = ref();
const selectedAccrualTime = ref();
const selectedEmploymentType = ref();

const leaveCode = ref('');
const leaveTitle = ref('');
const maxDays = ref('');
const maxDaysCarriedForward = ref('');
const maxNegativeBalance = ref('');

const GenderTypes = ref([{ name: 'All' }, { name: 'Female' }, { name: 'Male' }]);
const AccrualMode = ref([{ name: 'None' }, { name: 'Yearly' }, { name: 'Monthly' }, { name: 'Weekly' }]);
const AccrualTime = ref([{ name: 'Start of the year' }]);
const EmploymentTypes = ref([{ name: 'Permanent' }, { name: 'Probationary' }, { name: 'Intern' }]);

// Handle form submission
const handleSubmit = async () => {
    if (!leaveCode.value?.trim() || !leaveTitle.value?.trim()) {
        showToast('warning', 'Warning', 'Please fill in all required fields', 3000);
        return;
    }

    loading.value = true;
    try {
        const formData = {
            code: leaveCode.value.trim(),
            name: leaveTitle.value.trim(),
            gender: selectedGender.value?.name,
            max_days: parseInt(maxDays.value) || 0,
            start_date: date.value,
            accrual_mode: selectedAccrualMode.value?.name,
            accrual_time: selectedAccrualTime.value?.name,
            max_days_carried_forward: parseInt(maxDaysCarriedForward.value) || 0,
            max_negative_balance: parseInt(maxNegativeBalance.value) || 0,
            employment_types: selectedEmploymentType.value?.map((type) => type.name) || []
        };

        await leaveService.createCategory(formData);
        showToast('success', 'Success', 'Leave category created successfully', 3000);

        // Reset form
        resetForm();
    } catch (error) {
        console.error('Error creating leave category:', error);
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create leave category', 3000);
    } finally {
        loading.value = false;
    }
};

// Reset form
const resetForm = () => {
    leaveCode.value = '';
    leaveTitle.value = '';
    selectedGender.value = null;
    maxDays.value = '';
    date.value = null;
    selectedAccrualMode.value = null;
    selectedAccrualTime.value = null;
    maxDaysCarriedForward.value = '';
    maxNegativeBalance.value = '';
    selectedEmploymentType.value = null;
};
</script>
<template>
    <div class="flex justify-center font-bold bg-primary text text-white h-10 mb-0">
        <h2 class="text-xl primary-text text-white pt-2">Add Leave Category</h2>
    </div>

    <Toolbar class="mt-2">
        <template #end>
            <div class="flex justify-end mt-1">
                <Button label="Update" class="mb-1" />
            </div>
        </template>
    </Toolbar>
    <div class="card w-full mt-2">
        <div class="flex justify-start mt-2">
            <div class="mr-6">
                <label for="leaveCode">Leave Code:</label>
            </div>
            <div>
                <InputText class="w-96" v-model="leaveCode" />
            </div>
        </div>
        <div class="flex justify-start mt-10">
            <div class="mr-6">
                <label for="leaveTitle">Leave Title:</label>
            </div>
            <div>
                <InputText class="w-96" v-model="leaveTitle" />
            </div>
        </div>
        <div class="flex justify-start mt-10">
            <div class="mr-11">
                <label for="leaveType:">Gender:</label>
            </div>
            <div class="">
                <Select v-model="selectedGender" :options="GenderTypes" placeholder="Select Gender" optionLabel="name" class="w-96" />
            </div>
        </div>
        <div class="flex justify-start mt-10 w-1/2">
            <div class="mr-11">
                <label for="maxDays">Max. days in a Year:</label>
            </div>
            <InputGroup>
                <InputText v-model="maxDays" />
                <Button label="Days" />
            </InputGroup>
        </div>
        <div class="flex justify-start mt-10 w-1/2">
            <div class="mr-2">
                <label for="leaveStart:">Leave Year Starts:</label>
            </div>
            <div class="flex justify-center">
                <DatePicker v-model="date" />
            </div>
        </div>
        <div class="flex justify-start mt-10">
            <div class="mr-11">
                <label for="leaveType:">Days are Accrued:</label>
            </div>
            <div class="">
                <Select v-model="selectedAccrualMode" :options="AccrualMode" placeholder="Select Leave Increment" optionLabel="name" class="w-96" />
            </div>
        </div>
        <div class="flex justify-start mt-10">
            <div class="mr-11">
                <label for="leaveType:">Accrual Registered at:</label>
            </div>
            <div class="">
                <Select v-model="selectedAccrualTime" :options="AccrualTime" placeholder="Start of the year" optionLabel="name" class="w-96" />
            </div>
        </div>
        <div class="flex justify-start mt-10 w-1/2">
            <div class="mr-11">
                <label for="maxDays">Max Days carried foward:</label>
            </div>
            <InputGroup>
                <InputText v-model="maxDaysCarriedForward" />
                <Button label="Days" />
            </InputGroup>
        </div>
        <div class="flex justify-start mt-10 w-1/2">
            <div class="mr-11">
                <label for="maxDays">Max -ve balance:</label>
            </div>
            <InputGroup>
                <InputText v-model="maxNegativeBalance" />
                <Button label="Days" />
            </InputGroup>
        </div>
        <div class="flex justify-start mt-10">
            <div class="mr-2">
                <label for="leaveType:">Qualified Employment Types:</label>
            </div>
            <div class="flex justify-center">
                <MultiSelect v-model="selectedEmploymentType" :options="EmploymentTypes" optionLabel="name" filter placeholder="Select Employee Types" :maxSelectedLabels="3" class="w-full md:w-80" />
            </div>
        </div>

        <div class="flex justify-end mt-6">
            <Button label="Cancel" class="mr-2" severity="secondary" @click="resetForm" />
            <Button label="Create Leave Category" @click="handleSubmit" :loading="loading" />
        </div>
    </div>
</template>
