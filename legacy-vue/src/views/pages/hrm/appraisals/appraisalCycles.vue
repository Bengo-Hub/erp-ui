<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppraisalCycle from './appraisalCycle.vue';

const { showToast } = useToast();
const router = useRouter();

const showAppraisalCycleModal = ref(false);
const loading = ref(false);
const appraisalCycles = ref([]);
const { cycles, loadBasics } = useAppraisalData();
const selectedCycle = ref(null);
const branches = ref([]);
const evaluators = ref([]);

// Fetch data on component mount
onMounted(async () => {
    await loadBasics();
    appraisalCycles.value = cycles.value;
    await fetchBranches();
    await fetchEvaluators();
});

// Fetch appraisal cycles
// cycles are now loaded via useAppraisalData

// Fetch branches
const fetchBranches = async () => {
    try {
        const response = await appraisalService.getBranches();
        branches.value = response.data;
    } catch (error) {
        console.error('Error fetching branches:', error);
        showToast('error', 'Error', 'Failed to fetch branches', 3000);
    }
};

// Fetch evaluators
const fetchEvaluators = async () => {
    try {
        const response = await appraisalService.getEvaluators();
        evaluators.value = response.data;
    } catch (error) {
        console.error('Error fetching evaluators:', error);
        showToast('error', 'Error', 'Failed to fetch evaluators', 3000);
    }
};

const openModal = () => {
    showAppraisalCycleModal.value = true;
};

// Define your options
const goalsOptions = [
    { label: 'Goals List', value: 'goalsList' },
    { label: 'My Goals', value: 'myGoals' },
    { label: 'Goals Library', value: 'goalsLibrary' }
];

const dropdownOptions = [
    { label: 'Appraisal Configuration', value: 'appraisalConfiguration' } // Add other options here if needed
];

//method to handle navigation to appraisal configuration page
const handleNavigation = (event) => {
    if (event.value === 'appraisalConfiguration') {
        router.push('/hrm/appraisals/appraisalConfiguration'); // Navigate to Appraisal Configuration page
    }
    // Add other navigation cases if needed
};

// Create a ref for the selected goal
const selectedGoal = ref(null);

const selectedRowCount = ref(0);
// const count = ref(7);
const items = [
    { label: 'All', badge: '7' },
    { label: 'Created', badge: '2' },
    { label: 'Appraisals Created', badge: '3' },
    { label: 'Activated', badge: '1' },
    { label: 'Closed', badge: '5' },
    { label: 'Reopened', badge: '4' }
];

const performSearch = () => {
    console.log('Searching...');
};

const applyFilter = () => {
    console.log('Applying filter...');
};

const reopen = async (cycle) => {
    try {
        await appraisalService.reopenCycle(cycle.id);
        showToast('success', 'Success', 'Appraisal cycle reopened successfully', 3000);
        appraisalCycles.value = cycles.value;
    } catch (error) {
        showToast('error', 'Error', 'Failed to reopen appraisal cycle', 3000);
    }
};

const close = async (cycle) => {
    try {
        await appraisalService.closeCycle(cycle.id);
        showToast('success', 'Success', 'Appraisal cycle closed successfully', 3000);
        appraisalCycles.value = cycles.value;
    } catch (error) {
        showToast('error', 'Error', 'Failed to close appraisal cycle', 3000);
    }
};

const update = (cycle) => {
    selectedCycle.value = cycle;
    showAppraisalCycleModal.value = true;
};

const deleteCycle = async (cycle) => {
    try {
        await appraisalService.deleteCycle(cycle.id);
        showToast('success', 'Success', 'Appraisal cycle deleted successfully', 3000);
        appraisalCycles.value = cycles.value;
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete appraisal cycle', 3000);
    }
};

const handleCycleSaved = async () => {
    showAppraisalCycleModal.value = false;
    selectedCycle.value = null;
    appraisalCycles.value = cycles.value;
};

// Define the options for the dropdown
</script>

<template>
    <div>
        <div class="bg-white">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-1 text-black font-bold" />
                    <Button label="Appraisal List" class="mr-1" severity="primary" text />
                    <Button label="Appraisal Cycles" class="mr-1" severity="primary" text />
                    <Button label="My Appraisals" class="mr-1" severity="primary" text />
                    <Dropdown v-model="selectedGoal" :options="goalsOptions" optionLabel="label" placeholder="Goals" class="w-40" severity="primary" />
                </template>
                <template #end>
                    <Dropdown v-model="selectedOption" :options="dropdownOptions" optionLabel="label" placeholder="More" icon="pi pi-ellipsis-v" iconPos="right" text severity="primary" @change="handleNavigation" class="w-40" />
                </template>
            </Toolbar>
        </div>
        <div class="flex mt-2">
            <div class="vertical-menu bg-white h-screen w-1/5 p-0 shadow-md">
                <div>
                    <Button label="Create Appraisal Cycle" class="mr-1" @click="openModal" :loading="loading" />
                </div>
                <div class="flex flex-col space-y-2 mt-2">
                    <div v-for="item in items" :key="item.label" class="flex items-center p-2 bg-white shadow-md rounded-md">
                        <!-- Badge before label -->
                        <Badge :value="item.badge" class="mr-2" />
                        <!-- Button for navigation -->
                        <Button :label="item.label" class="p-button-text" @click="navigateTo(item.route)" severity="secondary" text />
                    </div>
                </div>
            </div>
            <div class="w-4/5 ml-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <Badge v-if="selectedRowCount === 0" :value="appraisalCycles.length" class="mr-2" />
                        <span v-if="selectedRowCount === 0">Appraisal Cycles Found</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <!-- Added spacing between buttons -->
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Search" @input="performSearch" />
                        </IconField>
                        <Button icon="pi pi-filter" @click="applyFilter" class="bg-gray-400 text-white px-4 py-2" />
                    </div>
                </div>

                <div class="bg-white mt-2">
                    <div class="mt-2">
                        <DataTable :value="appraisalCycles" :loading="loading" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm">
                            <Column field="name" header="Appraisal Cycle Name" sortable>
                                <template #body="{ data }">
                                    {{ data.name }}
                                </template>
                            </Column>
                            <Column field="due_date" header="Due Date" sortable>
                                <template #body="{ data }">
                                    {{ formatDate(data.due_date) }}
                                </template>
                            </Column>
                            <Column field="status" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>
                            <Column header="Action">
                                <template #body="{ data }">
                                    <Button v-if="data.status === 'closed'" label="Reopen" @click="reopen(data)" class="mr-1" severity="secondary" text />
                                    <Button v-if="data.status === 'active'" label="Close" @click="close(data)" severity="secondary" text />
                                </template>
                            </Column>
                            <Column header="Actions">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" @click="update(data)" class="mr-1" severity="secondary" text />
                                    <Button icon="pi pi-trash" @click="deleteCycle(data)" severity="danger" text />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
        <Dialog v-model:visible="showAppraisalCycleModal" :header="selectedCycle ? 'Edit Appraisal Cycle' : 'Add Appraisal Cycle'" :modal="true" :closable="true" :style="{ width: '50vw' }">
            <AppraisalCycle :cycle="selectedCycle" :branches="branches" :evaluators="evaluators" @saved="handleCycleSaved" @cancel="showAppraisalCycleModal = false" />
        </Dialog>
    </div>
</template>

<style scoped>
.vertical-menu {
    min-height: calc(100vh - 4rem);
}
</style>
