<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AddGoal from './addGoal.vue';

const { showToast } = useToast();
const router = useRouter();

const showAddGoalModal = ref(false);
const loading = ref(false);
const goalsList = ref([]);
const selectedGoals = ref([]);
const selectedRowCount = ref(0);

// Status options
const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Achieved', value: 'achieved' },
    { label: 'Not Achieved', value: 'not_achieved' },
    { label: 'On Hold', value: 'on_hold' }
];

// Filter items with counts
const items = ref([
    { label: 'All', badge: '0', value: 'all' },
    { label: 'Pending', badge: '0', value: 'pending' },
    { label: 'In Progress', badge: '0', value: 'in_progress' },
    { label: 'Achieved', badge: '0', value: 'achieved' },
    { label: 'Not Achieved', badge: '0', value: 'not_achieved' },
    { label: 'On Hold', badge: '0', value: 'on_hold' }
]);

// Fetch goals
const fetchGoals = async () => {
    loading.value = true;
    try {
        const response = await appraisalService.getMyGoals();
        goalsList.value = response.data?.results || response.data || [];

        // Update badge counts
        updateBadgeCounts();

        if (goalsList.value.length === 0) {
            showToast('info', 'Info', 'No goals found', 3000);
        }
    } catch (error) {
        console.error('Error fetching goals:', error);
        showToast('error', 'Error', 'Failed to fetch goals', 3000);
    } finally {
        loading.value = false;
    }
};

// Update badge counts based on current goals
const updateBadgeCounts = () => {
    const counts = {
        all: goalsList.value.length,
        pending: goalsList.value.filter((goal) => goal.status === 'pending').length,
        in_progress: goalsList.value.filter((goal) => goal.status === 'in_progress').length,
        achieved: goalsList.value.filter((goal) => goal.status === 'achieved').length,
        not_achieved: goalsList.value.filter((goal) => goal.status === 'not_achieved').length,
        on_hold: goalsList.value.filter((goal) => goal.status === 'on_hold').length
    };

    items.value.forEach((item) => {
        item.badge = counts[item.value]?.toString() || '0';
    });
};

// Open modal
const openModal = () => {
    showAddGoalModal.value = true;
};

// Logic for goal weight
const incrementWeight = async (goal) => {
    try {
        await appraisalService.updateGoal(goal.id, { weight: goal.weight + 1 });
        goal.weight += 1;
        showToast('success', 'Success', 'Goal weight updated', 2000);
    } catch (error) {
        console.error('Error updating goal weight:', error);
        showToast('error', 'Error', 'Failed to update goal weight', 3000);
    }
};

const decrementWeight = async (goal) => {
    if (goal.weight > 0) {
        try {
            await appraisalService.updateGoal(goal.id, { weight: goal.weight - 1 });
            goal.weight -= 1;
            showToast('success', 'Success', 'Goal weight updated', 2000);
        } catch (error) {
            console.error('Error updating goal weight:', error);
            showToast('error', 'Error', 'Failed to update goal weight', 3000);
        }
    }
};

// Update goal status
const updateGoalStatus = async (goal, newStatus) => {
    try {
        await appraisalService.updateGoal(goal.id, { status: newStatus });
        goal.status = newStatus;
        updateBadgeCounts();
        showToast('success', 'Success', 'Goal status updated', 2000);
    } catch (error) {
        console.error('Error updating goal status:', error);
        showToast('error', 'Error', 'Failed to update goal status', 3000);
    }
};

// Delete goal
const deleteGoal = async (goal) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await appraisalService.deleteGoal(goal.id);
        goalsList.value = goalsList.value.filter((g) => g.id !== goal.id);
        updateBadgeCounts();
        showToast('success', 'Success', 'Goal deleted successfully', 3000);
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('error', 'Error', 'Failed to delete goal', 3000);
    }
};

// Export goals
const exportGoals = (format) => {
    try {
        // Implementation for export functionality
        showToast('info', 'Info', `${format.toUpperCase()} export functionality coming soon`, 3000);
    } catch (error) {
        showToast('error', 'Error', `Failed to export ${format}`, 3000);
    }
};

// Apply filter
const applyFilter = (status) => {
    // Filter logic would go here
    showToast('info', 'Info', `Filtering by ${status}`, 2000);
};

// Navigate to route
const navigateTo = (route) => {
    if (route) {
        router.push(route);
    }
};

onMounted(() => {
    fetchGoals();
});
</script>

<template>
    <div>
        <div class="bg-white">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-flag" label="Goals" class="mr-1 text-black font-bold" severity="primary" text />
                </template>
                <template #end>
                    <Button class="panel-btn-text text-xl px-4 py-2" label="PDF" icon="pi pi-file-pdf text-2xl" severity="primary" text />
                    <Button class="panel-btn-text text-xl px-4 py-2" label="CSV" icon="pi pi-file-excel text-2xl" severity="primary" text />
                </template>
            </Toolbar>
        </div>
        <div class="flex mt-2">
            <div class="vertical-menu bg-white h-screen w-1/5 p-0 shadow-md">
                <div>
                    <Button label="Create Goal" class="mr-1" @click="openModal" />
                </div>
                <div class="flex flex-col space-y-2 mt-2">
                    <div v-for="item in items" :key="item.label" class="flex items-center p-2 bg-white shadow-md rounded-md">
                        <Badge :value="item.badge" class="mr-2" />
                        <Button :label="item.label" class="p-button-text" @click="navigateTo(item.route)" severity="secondary" text />
                    </div>
                </div>
            </div>
            <div class="w-4/5 ml-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <Badge v-if="selectedRowCount === 0" :value="count" class="mr-2" />
                        <span v-if="selectedRowCount === 0">Goals Found</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="value1" placeholder="Search" />
                        </IconField>
                        <Button icon="pi pi-filter" @click="applyFilter" class="bg-gray-400 text-white px-4 py-2" />
                    </div>
                </div>

                <div class="bg-white mt-2">
                    <div class="mt-2">
                        <table class="table-auto w-full border-collapse">
                            <thead>
                                <tr>
                                    <th class="border px-4 py-2">
                                        Goal Name
                                        <span class="ml-2 inline-flex items-center">
                                            <i class="pi pi-arrow-up -mr-1"></i>
                                            <i class="pi pi-arrow-down"></i>
                                        </span>
                                    </th>
                                    <th class="border px-4 py-2">Weight</th>
                                    <th class="border px-4 py-2">Level</th>
                                    <th class="border px-4 py-2">Owner</th>
                                    <th class="border px-4 py-2">Due Date</th>
                                    <th class="border px-4 py-2">Status</th>
                                    <th class="border px-4 py-2">Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(goal, index) in goalsList" :key="index">
                                    <td class="border px-4 py-2">{{ goal.goalName }}</td>
                                    <td class="border px-4 py-2">
                                        <div class="flex items-center justify-center">
                                            <Button icon="pi pi-minus" @click="decrementWeight(goal)" class="p-button-rounded p-button-text" />
                                            <span class="mx-2">{{ goal.weight }}</span>
                                            <Button icon="pi pi-plus" @click="incrementWeight(goal)" class="p-button-rounded p-button-text" />
                                        </div>
                                    </td>
                                    <td class="border px-4 py-2">
                                        <div class="flex items-center">
                                            <Button v-if="goal.level === 'Individual'" icon="pi pi-user" v-tooltip="{ value: 'Individual', position: 'bottom' }" severity="secondary" class="cell-icon" />
                                            <Button v-else-if="goal.level === 'Organizational'" icon="pi pi-sitemap" v-tooltip="{ value: 'Organizational', position: 'bottom' }" severity="secondary" class="cell-icon text-2xl" />
                                        </div>
                                    </td>
                                    <td class="border px-4 py-2">{{ goal.owner }}</td>
                                    <td class="border px-4 py-2">{{ goal.dueDate }}</td>
                                    <td class="border px-4 py-2">
                                        <Dropdown v-model="goal.status" :options="statusOptions" optionLabel="label" class="w-full" />
                                    </td>
                                    <td class="border px-4 py-2">
                                        <Button :label="goal.priority" class="bg-blue-500 text-white" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <Dialog v-model:visible="showAddGoalModal" header="Add Goal" :modal="true" :closable="true">
            <AddGoal @close="showAddGoalModal = false" />
        </Dialog>
    </div>
</template>
