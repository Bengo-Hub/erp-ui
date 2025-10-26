<template>
    <div class="timesheets-page">
        <!-- Page Header -->
        <div class="page-header mb-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0">Timesheets</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Submit and track your working hours</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="New Timesheet" 
                        icon="pi pi-plus" 
                        @click="showCreateDialog = true"
                    />
                </div>
            </div>
        </div>

        <!-- Timesheets List -->
        <Card>
            <template #content>
                <DataTable 
                    :value="timesheets" 
                    :loading="loading"
                    paginator 
                    :rows="10"
                    class="modern-table"
                    :rowsPerPageOptions="[10, 25, 50]"
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-clock text-6xl text-surface-400 mb-4"></i>
                            <p class="text-surface-500">No timesheets found</p>
                            <Button
                                label="Create Your First Timesheet"
                                icon="pi pi-plus"
                                class="mt-4"
                                @click="showCreateDialog = true"
                            />
                        </div>
                    </template>

                    <Column field="period" header="Period" sortable>
                        <template #body="slotProps">
                            <div>
                                <p class="font-medium">{{ formatDate(slotProps.data.start_date, 'short') }} - {{ formatDate(slotProps.data.end_date, 'short') }}</p>
                                <p class="text-xs text-surface-500">Week {{ slotProps.data.week_number }}</p>
                            </div>
                        </template>
                    </Column>

                    <Column field="total_hours" header="Total Hours" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-primary"></i>
                                <span class="font-semibold">{{ slotProps.data.total_hours || 0 }}h</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag 
                                :value="slotProps.data.status" 
                                :severity="getStatusSeverity(slotProps.data.status)"
                            />
                        </template>
                    </Column>

                    <Column header="Actions">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <Button 
                                    icon="pi pi-eye" 
                                    class="p-button-text p-button-sm"
                                    @click="viewTimesheet(slotProps.data)"
                                />
                                <Button 
                                    v-if="slotProps.data.status === 'draft'"
                                    icon="pi pi-pencil" 
                                    class="p-button-text p-button-sm"
                                    @click="editTimesheet(slotProps.data)"
                                />
                                <Button 
                                    v-if="slotProps.data.status === 'draft'"
                                    icon="pi pi-send" 
                                    class="p-button-text p-button-sm p-button-success"
                                    @click="submitTimesheet(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create Timesheet Dialog -->
        <Dialog 
            v-model:visible="showCreateDialog" 
            header="Create Timesheet" 
            :style="{ width: '700px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Start Date *</label>
                            <Calendar v-model="timesheetForm.start_date" dateFormat="yy-mm-dd" class="w-full" />
                        </div>
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">End Date *</label>
                            <Calendar v-model="timesheetForm.end_date" dateFormat="yy-mm-dd" class="w-full" />
                        </div>
                    </div>
                    
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <Textarea v-model="timesheetForm.description" rows="3" class="w-full" />
                    </div>

                    <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p class="text-sm text-primary-700 dark:text-primary-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            After creating the timesheet, you can add daily time entries.
                        </p>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showCreateDialog = false"
                />
                <Button 
                    label="Create Timesheet" 
                    icon="pi pi-check" 
                    @click="createTimesheet"
                    :loading="submitting"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { timesheetService } from '@/services/hrm/timesheetService';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const { showToast } = useToast();
const { hasAnyPermission } = usePermissions();

// State
const loading = ref(false);
const submitting = ref(false);
const timesheets = ref([]);
const showCreateDialog = ref(false);

// Current user
const currentUser = computed(() => store.state.auth.user);

// Form
const timesheetForm = reactive({
    start_date: null,
    end_date: null,
    description: ''
});

// Methods
const loadTimesheets = async () => {
    loading.value = true;
    try {
        // Check if user has managerial permissions (can view all timesheets)
        const hasManagerialPerms = hasAnyPermission(['change_timesheet', 'delete_timesheet']);
        
        const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
        
        // Filter by employee ID unless user is manager/approver
        const params = hasManagerialPerms
            ? { ordering: '-start_date' }  // Managers can see all
            : { employee: employeeId, ordering: '-start_date' };  // Staff only see their own
        
        console.log('loadTimesheets: Params', params);
        const response = await timesheetService.listTimesheets(params);
        
        timesheets.value = response.results || response.data || [];
    } catch (error) {
        console.error('Error loading timesheets:', error);
        showToast('error', 'Error', 'Failed to load timesheets');
    } finally {
        loading.value = false;
    }
};

const createTimesheet = async () => {
    if (!timesheetForm.start_date || !timesheetForm.end_date) {
        showToast('error', 'Error', 'Please select start and end dates');
        return;
    }
    
    try {
        submitting.value = true;
        await timesheetService.createTimesheet({
            employee: currentUser.value?.employee_id || currentUser.value?.id,
            start_date: timesheetForm.start_date,
            end_date: timesheetForm.end_date,
            description: timesheetForm.description,
            status: 'draft'
        });
        
        showToast('success', 'Success', 'Timesheet created successfully');
        showCreateDialog.value = false;
        
        // Reset form
        timesheetForm.start_date = null;
        timesheetForm.end_date = null;
        timesheetForm.description = '';
        
        // Reload list
        await loadTimesheets();
    } catch (error) {
        console.error('Error creating timesheet:', error);
        showToast('error', 'Error', 'Failed to create timesheet');
    } finally {
        submitting.value = false;
    }
};

const viewTimesheet = (timesheet) => {
    showToast('info', 'View Timesheet', 'Timesheet detail view coming soon');
};

const editTimesheet = (timesheet) => {
    showToast('info', 'Edit Timesheet', 'Timesheet editing coming soon');
};

const submitTimesheet = async (timesheet) => {
    try {
        await timesheetService.submitTimesheet(timesheet.id);
        showToast('success', 'Success', 'Timesheet submitted for approval');
        await loadTimesheets();
    } catch (error) {
        console.error('Error submitting timesheet:', error);
        showToast('error', 'Error', 'Failed to submit timesheet');
    }
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'secondary',
        submitted: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return severityMap[status?.toLowerCase()] || 'info';
};

onMounted(() => {
    loadTimesheets();
});
</script>

<style scoped>
.timesheets-page {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 1.5rem;
}

.modern-table :deep(.p-datatable) {
    border-radius: 8px;
}

@media (max-width: 768px) {
    .timesheets-page {
        padding: 1rem;
    }
}
</style>

