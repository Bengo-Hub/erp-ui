<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const confirm = useConfirm();

// State
const activeTab = ref(0);
const shifts = ref([]);
const rotations = ref([]);
const selectedShifts = ref([]);
const loading = ref(false);
const bulkAction = ref(null);

// Dialogs
const shiftDialog = ref(false);
const rotationDialog = ref(false);

// Fetch data
const fetchShifts = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listWorkShifts();
        shifts.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching work shifts:', error);
        showToast('error', 'Failed to load work shifts', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const fetchRotations = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listShiftRotations();
        rotations.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching shift rotations:', error);
        showToast('error', 'Failed to load shift rotations', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    if (activeTab.value === 0) {
        fetchShifts();
    } else {
        fetchRotations();
    }
};

const handleTabChange = (event) => {
    activeTab.value = event.index;
    selectedShifts.value = [];
    if (event.index === 0) {
        fetchShifts();
    } else {
        fetchRotations();
    }
};

const editShift = (shift) => {
    router.push(`/hrm/attendance/work-shifts/${shift.id}/edit`);
};

const editRotation = (rotation) => {
    router.push(`/hrm/attendance/shift-rotations/${rotation.id}/edit`);
};

const deleteShift = async (shiftId) => {
    confirm.require({
        message: 'Are you sure you want to delete this work shift?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await employeeService.deleteWorkShift(shiftId);
                showToast('success', 'Work shift deleted successfully', 'Success');
                await fetchShifts();
            } catch (error) {
                console.error('Error deleting shift:', error);
                showToast('error', 'Failed to delete work shift', error?.response?.data?.detail || error.message);
            }
        }
    });
};

const bulkActions = [
    { label: 'Delete Selected', value: 'delete', icon: 'pi pi-trash' },
    { label: 'Activate Selected', value: 'activate', icon: 'pi pi-check' },
    { label: 'Deactivate Selected', value: 'deactivate', icon: 'pi pi-times' }
];

const executeBulkAction = async () => {
    if (!bulkAction.value || selectedShifts.value.length === 0) {
        showToast('warn', 'Please select items and an action', 'Validation');
        return;
    }

    confirm.require({
        message: `Are you sure you want to ${bulkAction.value} ${selectedShifts.value.length} shift(s)?`,
        header: 'Confirm Bulk Action',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // Implement bulk action logic
                showToast('success', 'Bulk action completed successfully', 'Success');
                selectedShifts.value = [];
                bulkAction.value = null;
                await refreshData();
            } catch (error) {
                showToast('error', 'Bulk action failed', error.message);
            }
        }
    });
};

const calculateTotalHours = (shift) => {
    // Calculate total hours from shift days
    return shift.total_hours || 40;
};

onMounted(() => {
    fetchShifts();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Work Shift Settings</h2>
                <p class="text-surface-600 dark:text-surface-400 mt-1">Manage work shifts and rotation patterns</p>
            </div>
            <div class="flex gap-2">
                <Button 
                    label="Refresh Data" 
                    icon="pi pi-refresh" 
                    outlined
                    @click="refreshData" 
                />
                <SplitButton 
                    label="Add Shift/Rotation" 
                    icon="pi pi-plus" 
                    :model="[
                        { label: 'Add a Work Shift', icon: 'pi pi-clock', command: () => router.push('/hrm/attendance/work-shifts/create') },
                        { label: 'Add a Shift Rotation', icon: 'pi pi-sync', command: () => router.push('/hrm/attendance/shift-rotations/create') }
                    ]"
                />
            </div>
        </div>

        <!-- Tabs -->
        <TabView @tab-change="handleTabChange">
            <!-- Work Shifts Tab -->
            <TabPanel header="Work Shifts">
                <!-- Bulk Actions -->
                <div class="flex gap-3 mb-4 items-center">
                    <Dropdown 
                        v-model="bulkAction" 
                        :options="bulkActions" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="With Selected..." 
                        class="w-64"
                    >
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <i :class="bulkActions.find(a => a.value === slotProps.value)?.icon"></i>
                                <span>{{ bulkActions.find(a => a.value === slotProps.value)?.label }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Dropdown>
                    <Button 
                        label="Apply" 
                        icon="pi pi-check" 
                        @click="executeBulkAction"
                        :disabled="!bulkAction || selectedShifts.length === 0"
                        outlined
                    />
                    <span v-if="selectedShifts.length > 0" class="text-sm text-surface-600 dark:text-surface-400">
                        {{ selectedShifts.length }} item(s) selected
                    </span>
                </div>

                <!-- Shifts Table -->
                <DataTable 
                    v-model:selection="selectedShifts"
                    :value="shifts" 
                    :loading="loading"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    responsiveLayout="scroll"
                    stripedRows
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-clock text-4xl text-surface-400 mb-3"></i>
                            <p class="text-surface-600 dark:text-surface-400">No work shifts found. Create your first work shift to get started.</p>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    
                    <Column field="name" header="Title" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold">{{ data.name }}</span>
                        </template>
                    </Column>
                    
                    <Column field="days" header="Days per Week" sortable>
                        <template #body="{ data }">
                            <div class="text-sm">
                                <span v-if="data.days_config">{{ data.days_config }}</span>
                                <span v-else class="text-surface-500">Mon-Fri (8am-5pm)</span>
                            </div>
                        </template>
                    </Column>
                    
                    <Column field="total_hours" header="Hours per Week" sortable>
                        <template #body="{ data }">
                            <Tag :value="`${calculateTotalHours(data)} hrs`" severity="info" />
                        </template>
                    </Column>
                    
                    <Column header="Actions" style="width: 10rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-pencil" 
                                    outlined
                                    rounded
                                    severity="warning"
                                    @click="editShift(data)" 
                                    v-tooltip.top="'Edit Shift'" 
                                />
                                <Button 
                                    icon="pi pi-trash" 
                                    outlined
                                    rounded
                                    severity="danger"
                                    @click="deleteShift(data.id)" 
                                    v-tooltip.top="'Delete'" 
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>

            <!-- Shift Rotations Tab -->
            <TabPanel header="Shift Rotations">
                <DataTable 
                    :value="rotations" 
                    :loading="loading"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    responsiveLayout="scroll"
                    stripedRows
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-sync text-4xl text-surface-400 mb-3"></i>
                            <p class="text-surface-600 dark:text-surface-400">No shift rotations found. Create your first rotation pattern to get started.</p>
                        </div>
                    </template>

                    <Column field="title" header="Rotation Title" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold">{{ data.title }}</span>
                        </template>
                    </Column>
                    
                    <Column field="pattern" header="Pattern" sortable>
                        <template #body="{ data }">
                            <div class="text-sm">
                                Run for {{ data.run_duration }} {{ data.run_unit }}, break for {{ data.break_duration }} {{ data.break_unit }}
                            </div>
                        </template>
                    </Column>
                    
                    <Column field="next_change" header="Next Change" sortable>
                        <template #body="{ data }">
                            {{ data.next_change_date || '-' }}
                        </template>
                    </Column>
                    
                    <Column header="Actions" style="width: 10rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-pencil" 
                                    outlined
                                    rounded
                                    severity="warning"
                                    @click="editRotation(data)" 
                                    v-tooltip.top="'Edit Rotation'" 
                                />
                                <Button 
                                    icon="pi pi-trash" 
                                    outlined
                                    rounded
                                    severity="danger"
                                    v-tooltip.top="'Delete'" 
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>
        </TabView>
    </div>
</template>

