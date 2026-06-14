<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { ref } from 'vue';

// Reactive variables
const goalName = ref('');
const selectedEmployee = ref(null);
const filteredEmployees = ref([]);
const goalWeight = ref(0); // Assuming weight is a reactive value

// Sample employees for type-ahead suggestions
const employees = ref([]);

// Function to filter employees based on the input query
const filterEmployees = (event) => {
    const query = event.query.toLowerCase();
    filteredEmployees.value = employees.value.filter((employee) => employee.toLowerCase().startsWith(query));
};

// Levels, priorities, and status options
const selectedLevel = ref();
const levels = ref([{ name: 'Individual' }, { name: 'Organisation' }]);

const selectedPriority = ref();
const priorities = ref([{ name: 'Low' }, { name: 'Medium' }, { name: 'High' }, { name: 'Critical' }]);

const selectedStatus = ref();
const status = ref([{ name: 'In Progress' }, { name: 'Completed' }]);

// Functions to increment and decrement weight
const incrementWeight = () => goalWeight.value++;
const decrementWeight = () => {
    if (goalWeight.value > 0) goalWeight.value--;
};

const { showToast } = useToast();
const { loadFilters } = useHrmFilters();
</script>

<template>
    <div>
        <h2 class="text-black font-bold text-2xl mb-2">Add Goal</h2>

        <label for="goalName">
            Goal Name <span>*</span><br />
            <Textarea id="goalName" v-model="goalName" placeholder="Enter goal name" class="ml-0 w-3/4" />
        </label>

        <div class="mt-2">
            <label for="employee">
                Assigned to <span>*</span>
                <AutoComplete id="employee" v-model="employeeName" :suggestions="filteredEmployees" @complete="filterEmployees" placeholder="Hint an employee name" class="ml-2" />
            </label>
        </div>

        <div class="flex justify-start mt-2">
            <div>
                <label for="level">Level</label><br />
                <Select v-model="selectedLevel" :options="levels" optionLabel="name" placeholder="Select level" class="w-full md:w-56 mr-2" />
            </div>

            <div>
                <label for="priority">Priority</label><br />
                <Select v-model="selectedPriority" :options="priorities" optionLabel="name" placeholder="Select Priority" class="w-full md:w-56 mr-2" />
            </div>

            <div>
                <label for="status">Status</label><br />
                <Select v-model="selectedStatus" :options="status" optionLabel="name" class="w-full md:w-56 mr-2" />
            </div>

            <div>
                <label for="weight">Weight</label><br />
                <div class="flex items-center justify-center border border-gray-300 rounded p-2">
                    <Button icon="pi pi-minus" @click="decrementWeight" class="p-button-rounded p-button-text" />
                    <span class="mx-2">{{ goalWeight }}</span>
                    <Button icon="pi pi-plus" @click="incrementWeight" class="p-button-rounded p-button-text" />
                </div>
            </div>
            <div class="flex-auto ml-2">
                <label for="icondisplay" class="font-bold block mb-2"> Due Date </label>
                <DatePicker v-model="dueDate" showIcon fluid iconDisplay="input" inputId="icondisplay" />
            </div>
        </div>
        <div class="flex justify-end">
            <Button label="Cancel" class="mr-2" @click="cancel" />
            <Button label="Save" @click="saveGoal" :loading="saving" />
        </div>
    </div>
</template>

<style scoped>
/* Add any specific styles you need here */
</style>
