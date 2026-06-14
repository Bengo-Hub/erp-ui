<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

// List of goals
const goalnames = ref([]);
const loading = ref(false);

// Selected goals
const selectedGoals = ref([]);

// Pagination
const pagination = ref({
    page: 1,
    rows: 10,
    totalRecords: 0
});

// Fetch goals from API
const fetchGoals = async () => {
    loading.value = true;
    try {
        const params = {
            page: pagination.value.page,
            limit: pagination.value.rows
        };

        const response = await appraisalService.getGoals(params);
        goalnames.value = response.data?.results || response.data || [];
        pagination.value.totalRecords = response.data?.count || goalnames.value.length;
    } catch (error) {
        console.error('Error fetching goals:', error);
        showToast('error', 'Error', 'Failed to fetch goals library', 3000);
    } finally {
        loading.value = false;
    }
};

// Function to select all goals
const selectAll = () => {
    if (goalnames.value.length > 0) {
        selectedGoals.value = goalnames.value.map((goal) => goal.id);
        showToast('info', 'Info', `${goalnames.value.length} goals selected`, 2000);
    }
};

// Function to handle pagination
const onPageChange = (event) => {
    pagination.value.page = event.page + 1;
    pagination.value.rows = event.rows;
    fetchGoals();
};

// Function to apply selected goals
const applySelectedGoals = async () => {
    if (selectedGoals.value.length === 0) {
        showToast('warning', 'Warning', 'Please select goals to apply', 3000);
        return;
    }

    try {
        await appraisalService.applyGoals(selectedGoals.value);
        showToast('success', 'Success', `${selectedGoals.value.length} goals applied successfully`, 3000);
        selectedGoals.value = [];
    } catch (error) {
        console.error('Error applying goals:', error);
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to apply goals', 3000);
    }
};

// Function to clear selection
const clearSelection = () => {
    selectedGoals.value = [];
    showToast('info', 'Info', 'Selection cleared', 2000);
};

onMounted(() => {
    fetchGoals();
});
</script>

<template>
    <div>
        <h2 class="ml-4 font-bold text-black">GOALS LIBRARY</h2>
        <!-- Add margin-bottom for spacing -->
        <div class="flex flex-col items-center p-4 ml-0">
            <div class="w-full">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex gap-2">
                        <Button label="Apply Selected" icon="pi pi-check" @click="applySelectedGoals" :disabled="selectedGoals.length === 0" />
                        <Button label="Clear Selection" icon="pi pi-times" @click="clearSelection" :disabled="selectedGoals.length === 0" severity="secondary" />
                    </div>
                    <div class="text-sm text-gray-600">{{ selectedGoals.length }} goals selected</div>
                </div>
                <table class="min-w-full border border-gray-300">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="py-2 px-4 border-b text-left text-black font-bold">
                                <i class="pi pi-ellipsis-h mr-2 cursor-pointer" v-tooltip.top="'Select All'" @click="selectAll"></i>
                                Goal Name
                            </th>
                            <th class="py-2 px-4 border-b text-left text-black font-bold">Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="goal in goalnames" :key="goal.name" class="hover:bg-gray-50">
                            <td class="py-2 px-4 border-b flex items-center">
                                <Checkbox v-model="selectedGoals" :inputId="goal.name" :value="goal.name" class="mr-2" />
                                <label :for="goal.name" class="cursor-pointer">{{ goal.name }}</label>
                            </td>
                            <td class="py-2 px-4 border-b">{{ goal.level }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="flex justify-end">
            <Paginator :rows="pagination.rows" :totalRecords="pagination.totalRecords" :rowsPerPageOptions="[10, 20, 30]" @page="onPageChange"></Paginator>
        </div>
    </div>
</template>

<style scoped>
/* Add any specific styles you need, if necessary */
</style>
