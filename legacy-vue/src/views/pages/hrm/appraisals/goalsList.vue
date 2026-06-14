<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AddGoal from './addGoal.vue';

const { showToast } = useToast();
const router = useRouter();
const route = useRoute();
const confirm = useConfirm();
const loading = ref(false);

const showAddGoalModal = ref(false);
const openModal = () => {
    showAddGoalModal.value = true;
};

const selectedRowCount = ref(0);
const count = ref(7);
const items = [
    { label: 'All', badge: '7' },
    { label: 'Pending', badge: '2' },
    { label: 'In Progress', badge: '3' },
    { label: 'Achieved', badge: '1' },
    { label: 'Not Achieved', badge: '5' },
    { label: 'On Hold', badge: '4' }
];

const statusOptions = ref([
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Achieved', value: 'Achieved' },
    { label: 'Not Achieved', value: 'Not Achieved' },
    { label: 'On Hold', value: 'On Hold' }
]);

const goalsList = ref([]);
const appraisalId = ref(route.params.id || route.query.appraisal || null);

const fetchGoals = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getGoals(appraisalId.value);
        goalsList.value = response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching goals:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to fetch goals. Please try again later.', 3000);
    } finally {
        loading.value = false;
    }
};

const updateGoalStatus = async (goal, newStatus) => {
    try {
        loading.value = true;
        await appraisalService.updateGoal(goal.id, { ...goal, status: newStatus });
        showToast('success', 'Success', 'Goal status updated successfully', 3000);
        await fetchGoals();
    } catch (error) {
        console.error('Error updating goal status:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to update goal status. Please try again later.', 3000);
    } finally {
        loading.value = false;
    }
};

const updateGoalWeight = async (goal, newWeight) => {
    try {
        loading.value = true;
        await appraisalService.updateGoal(goal.id, { ...goal, weight: newWeight });
        showToast('success', 'Success', 'Goal weight updated successfully', 3000);
        await fetchGoals();
    } catch (error) {
        console.error('Error updating goal weight:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to update goal weight. Please try again later.', 3000);
    } finally {
        loading.value = false;
    }
};

const incrementWeight = async (index) => {
    const goal = goalsList.value[index];
    const newWeight = goal.goalWeight + 1;
    await updateGoalWeight(goal, newWeight);
};

const decrementWeight = async (index) => {
    const goal = goalsList.value[index];
    if (goal.goalWeight > 0) {
        const newWeight = goal.goalWeight - 1;
        await updateGoalWeight(goal, newWeight);
    }
};

const navigateTo = (route) => {
    router.push(route);
};

const applyFilter = () => {
    // Filtering logic goes here
};

onMounted(async () => {
    await fetchGoals();
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
                                            <Button icon="pi pi-minus" @click="decrementWeight(index)" class="p-button-rounded p-button-text" />
                                            <span class="mx-2">{{ goal.goalWeight }}</span>
                                            <Button icon="pi pi-plus" @click="incrementWeight(index)" class="p-button-rounded p-button-text" />
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
