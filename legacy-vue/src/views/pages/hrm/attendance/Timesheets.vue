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
                    <PermissionButton 
                        :permission="['add_timesheet', 'change_timesheet']"
                        mode="any"
                        label="New Timesheet" 
                        icon="pi pi-plus" 
                        @click="showCreateDialog = true"
                        class="p-button-primary"
                    />
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card class="summary-card">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Timesheets</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ timesheets.length }}</p>
                        </div>
                        <div class="icon-wrapper bg-blue-100 dark:bg-blue-900">
                            <i class="pi pi-clock text-2xl text-blue-600 dark:text-blue-300"></i>
                        </div>
                    </div>
                </template>
            </Card>
            
            <Card class="summary-card">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Draft</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ draftCount }}</p>
                        </div>
                        <div class="icon-wrapper bg-gray-100 dark:bg-gray-800">
                            <i class="pi pi-file-edit text-2xl text-gray-600 dark:text-gray-400"></i>
                        </div>
                    </div>
                </template>
            </Card>
            
            <Card class="summary-card">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Submitted</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ submittedCount }}</p>
                        </div>
                        <div class="icon-wrapper bg-yellow-100 dark:bg-yellow-900">
                            <i class="pi pi-send text-2xl text-yellow-600 dark:text-yellow-300"></i>
                        </div>
                    </div>
                </template>
            </Card>
            
            <Card class="summary-card">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Approved</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ approvedCount }}</p>
                        </div>
                        <div class="icon-wrapper bg-green-100 dark:bg-green-900">
                            <i class="pi pi-check-circle text-2xl text-green-600 dark:text-green-300"></i>
                        </div>
                    </div>
                </template>
            </Card>
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
                    :globalFilterFields="['employee_name', 'period_start', 'status']"
                    v-model:filters="filters"
                    filterDisplay="row"
                >
                    <template #header>
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <span class="text-xl font-semibold">All Timesheets</span>
                            <span class="p-input-icon-left w-full md:w-auto">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.global.value" placeholder="Search..." class="w-full" />
                            </span>
                        </div>
                    </template>

                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-clock text-6xl text-surface-400 mb-4"></i>
                            <p class="text-surface-500 mb-2">No timesheets found</p>
                            <Button
                                label="Create Your First Timesheet"
                                icon="pi pi-plus"
                                class="mt-4"
                                @click="showCreateDialog = true"
                            />
                        </div>
                    </template>

                    <Column field="period_start" header="Period" sortable>
                        <template #body="slotProps">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0">
                                    {{ formatDate(slotProps.data.period_start, 'short') }} - {{ formatDate(slotProps.data.period_end, 'short') }}
                                </p>
                                <p class="text-xs text-surface-500 dark:text-surface-400">
                                    {{ getPeriodDuration(slotProps.data.period_start, slotProps.data.period_end) }}
                                </p>
                            </div>
                        </template>
                    </Column>

                    <Column field="employee_name" header="Employee" sortable v-if="hasManagerialPerms">
                        <template #body="slotProps">
                            <span class="font-medium">{{ slotProps.data.employee_name || 'N/A' }}</span>
                        </template>
                    </Column>

                    <Column field="total_hours" header="Total Hours" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-primary"></i>
                                <span class="font-semibold">{{ formatHours(slotProps.data.total_hours) }}</span>
                                <span v-if="slotProps.data.total_overtime_hours > 0" class="text-xs text-orange-600 dark:text-orange-400">
                                    (+{{ formatHours(slotProps.data.total_overtime_hours) }} OT)
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column field="entries_count" header="Entries">
                        <template #body="slotProps">
                            <Badge :value="(slotProps.data.entries?.length || 0) + ' days'" severity="info" />
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag 
                                :value="slotProps.data.status?.toUpperCase()" 
                                :severity="getStatusSeverity(slotProps.data.status)"
                            />
                        </template>
                    </Column>

                    <Column field="submission_date" header="Submitted" sortable>
                        <template #body="slotProps">
                            <span v-if="slotProps.data.submission_date">
                                {{ formatDate(slotProps.data.submission_date, 'short') }}
                            </span>
                            <span v-else class="text-surface-400">-</span>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <PermissionButton 
                                    :permission="'view_timesheet'"
                                    icon="pi pi-eye" 
                                    class="p-button-text p-button-sm p-button-info"
                                    v-tooltip.top="'View Details'"
                                    @click="viewTimesheet(slotProps.data)"
                                />
                                <PermissionButton 
                                    v-if="slotProps.data.status === 'draft'"
                                    :permission="'change_timesheet'"
                                    icon="pi pi-pencil" 
                                    class="p-button-text p-button-sm p-button-warning"
                                    v-tooltip.top="'Edit'"
                                    @click="editTimesheet(slotProps.data)"
                                />
                                <PermissionButton 
                                    v-if="slotProps.data.status === 'draft'"
                                    :permission="'change_timesheet'"
                                    icon="pi pi-send" 
                                    class="p-button-text p-button-sm p-button-success"
                                    v-tooltip.top="'Submit for Approval'"
                                    @click="submitTimesheet(slotProps.data)"
                                />
                                <PermissionButton 
                                    v-if="slotProps.data.status === 'submitted'"
                                    :permission="['change_timesheet', 'approve_timesheet']"
                                    mode="any"
                                    icon="pi pi-check" 
                                    class="p-button-text p-button-sm p-button-success"
                                    v-tooltip.top="'Approve'"
                                    @click="approveTimesheet(slotProps.data)"
                                />
                                <PermissionButton 
                                    v-if="slotProps.data.status === 'submitted'"
                                    :permission="['change_timesheet', 'approve_timesheet']"
                                    mode="any"
                                    icon="pi pi-times" 
                                    class="p-button-text p-button-sm p-button-danger"
                                    v-tooltip.top="'Reject'"
                                    @click="openRejectDialog(slotProps.data)"
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
            header="Create New Timesheet" 
            :style="{ width: '600px' }"
            :modal="true"
            :closable="true"
        >
            <div class="p-4">
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Period Start Date *</label>
                            <Calendar 
                                v-model="timesheetForm.period_start" 
                                dateFormat="yy-mm-dd" 
                                class="w-full"
                                :maxDate="timesheetForm.period_end"
                                showIcon
                            />
                        </div>
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Period End Date *</label>
                            <Calendar 
                                v-model="timesheetForm.period_end" 
                                dateFormat="yy-mm-dd" 
                                class="w-full"
                                :minDate="timesheetForm.period_start"
                                showIcon
                            />
                        </div>
                    </div>
                    
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Notes</label>
                        <Textarea 
                            v-model="timesheetForm.notes" 
                            rows="3" 
                            class="w-full"
                            placeholder="Optional notes about this timesheet period..."
                        />
                    </div>

                    <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p class="text-sm text-primary-700 dark:text-primary-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            After creating the timesheet, you can add daily time entries for each day in the period.
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

        <!-- Timesheet Detail Dialog -->
        <Dialog 
            v-model:visible="showDetailDialog" 
            :header="`Timesheet Details - ${selectedTimesheet ? formatDate(selectedTimesheet.period_start, 'short') + ' to ' + formatDate(selectedTimesheet.period_end, 'short') : ''}`"
            :style="{ width: '90vw', maxWidth: '1200px' }"
            :modal="true"
            :closable="true"
        >
            <div v-if="selectedTimesheet" class="p-4">
                <!-- Timesheet Info -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <template #content>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Status</p>
                                <Tag 
                                    :value="selectedTimesheet.status?.toUpperCase()" 
                                    :severity="getStatusSeverity(selectedTimesheet.status)"
                                />
                            </div>
                        </template>
                    </Card>
                    <Card>
                        <template #content>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Hours</p>
                                <p class="text-xl font-bold">{{ formatHours(selectedTimesheet.total_hours) }}</p>
                            </div>
                        </template>
                    </Card>
                    <Card>
                        <template #content>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Overtime Hours</p>
                                <p class="text-xl font-bold text-orange-600 dark:text-orange-400">
                                    {{ formatHours(selectedTimesheet.total_overtime_hours) }}
                                </p>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Timesheet Entries -->
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Daily Entries</h3>
                        <Button 
                            v-if="selectedTimesheet.status === 'draft'"
                            label="Add Entry" 
                            icon="pi pi-plus" 
                            size="small"
                            @click="showEntryDialog = true; editingEntry = null"
                        />
                    </div>
                    
                    <DataTable 
                        :value="selectedTimesheet.entries || []" 
                        :loading="loadingEntries"
                        class="modern-table"
                        :paginator="(selectedTimesheet.entries?.length || 0) > 10"
                        :rows="10"
                    >
                        <template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-calendar-times text-4xl text-surface-400 mb-2"></i>
                                <p class="text-surface-500">No entries added yet</p>
                                <Button
                                    v-if="selectedTimesheet.status === 'draft'"
                                    label="Add First Entry"
                                    icon="pi pi-plus"
                                    size="small"
                                    class="mt-4"
                                    @click="showEntryDialog = true; editingEntry = null"
                                />
                            </div>
                        </template>

                        <Column field="date" header="Date" sortable>
                            <template #body="slotProps">
                                <span class="font-medium">{{ formatDate(slotProps.data.date, 'full') }}</span>
                            </template>
                        </Column>

                        <Column field="project" header="Project">
                            <template #body="slotProps">
                                <span>{{ slotProps.data.project?.name || 'General' }}</span>
                            </template>
                        </Column>

                        <Column field="task_description" header="Task Description">
                            <template #body="slotProps">
                                <span>{{ slotProps.data.task_description || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="regular_hours" header="Regular Hours" sortable>
                            <template #body="slotProps">
                                <span class="font-semibold">{{ formatHours(slotProps.data.regular_hours) }}</span>
                            </template>
                        </Column>

                        <Column field="overtime_hours" header="Overtime Hours" sortable>
                            <template #body="slotProps">
                                <span class="font-semibold text-orange-600 dark:text-orange-400">
                                    {{ formatHours(slotProps.data.overtime_hours) }}
                                </span>
                            </template>
                        </Column>

                        <Column field="break_hours" header="Break Hours" sortable>
                            <template #body="slotProps">
                                <span>{{ formatHours(slotProps.data.break_hours) }}</span>
                            </template>
                        </Column>

                        <Column field="total_hours" header="Total" sortable>
                            <template #body="slotProps">
                                <span class="font-bold text-primary">{{ formatHours(slotProps.data.total_hours) }}</span>
                            </template>
                        </Column>

                        <Column header="Actions" v-if="selectedTimesheet.status === 'draft'">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <Button 
                                        icon="pi pi-pencil" 
                                        class="p-button-text p-button-sm"
                                        @click="editEntry(slotProps.data)"
                                    />
                                    <Button 
                                        icon="pi pi-trash" 
                                        class="p-button-text p-button-sm p-button-danger"
                                        @click="deleteEntry(slotProps.data)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Notes -->
                <div v-if="selectedTimesheet.notes" class="mt-4">
                    <Card>
                        <template #title>Notes</template>
                        <template #content>
                            <p class="text-surface-700 dark:text-surface-300">{{ selectedTimesheet.notes }}</p>
                        </template>
                    </Card>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Close" 
                    icon="pi pi-times" 
                    @click="showDetailDialog = false"
                />
            </template>
        </Dialog>

        <!-- Entry Dialog -->
        <Dialog 
            v-model:visible="showEntryDialog" 
            :header="editingEntry ? 'Edit Entry' : 'Add Timesheet Entry'"
            :style="{ width: '700px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="space-y-4">
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Date *</label>
                        <Calendar 
                            v-model="entryForm.date" 
                            dateFormat="yy-mm-dd" 
                            class="w-full"
                            :minDate="selectedTimesheet?.period_start"
                            :maxDate="selectedTimesheet?.period_end"
                            showIcon
                        />
                    </div>

                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Project</label>
                        <Dropdown 
                            v-model="entryForm.project" 
                            :options="projects" 
                            optionLabel="name" 
                            optionValue="id"
                            placeholder="Select Project (Optional)"
                            class="w-full"
                            :filter="true"
                        />
                    </div>

                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Task Description *</label>
                        <Textarea 
                            v-model="entryForm.task_description" 
                            rows="3" 
                            class="w-full"
                            placeholder="Describe the work performed..."
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Regular Hours *</label>
                            <InputNumber 
                                v-model="entryForm.regular_hours" 
                                :min="0" 
                                :max="24" 
                                :step="0.25"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Overtime Hours</label>
                            <InputNumber 
                                v-model="entryForm.overtime_hours" 
                                :min="0" 
                                :max="24" 
                                :step="0.25"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>
                        <div class="field">
                            <label class="block text-sm font-medium mb-2">Break Hours</label>
                            <InputNumber 
                                v-model="entryForm.break_hours" 
                                :min="0" 
                                :max="8" 
                                :step="0.25"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Notes</label>
                        <Textarea 
                            v-model="entryForm.notes" 
                            rows="2" 
                            class="w-full"
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showEntryDialog = false"
                />
                <Button 
                    :label="editingEntry ? 'Update Entry' : 'Add Entry'" 
                    icon="pi pi-check" 
                    @click="saveEntry"
                    :loading="submitting"
                />
            </template>
        </Dialog>

        <!-- Reject Dialog -->
        <Dialog 
            v-model:visible="showRejectDialog" 
            header="Reject Timesheet"
            :style="{ width: '500px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Rejection Reason *</label>
                    <Textarea 
                        v-model="rejectReason" 
                        rows="4" 
                        class="w-full"
                        placeholder="Please provide a reason for rejection..."
                    />
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showRejectDialog = false; rejectReason = ''"
                />
                <Button 
                    label="Reject Timesheet" 
                    icon="pi pi-times" 
                    class="p-button-danger"
                    @click="rejectTimesheet"
                    :loading="submitting"
                    :disabled="!rejectReason.trim()"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { timesheetService } from '@/services/hrm/timesheetService';
import { formatDate, formatDateForAPI } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const { showToast } = useToast();
const { hasAnyPermission } = usePermissions();

// State
const loading = ref(false);
const loadingEntries = ref(false);
const submitting = ref(false);
const timesheets = ref([]);
const projects = ref([]);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const showEntryDialog = ref(false);
const showRejectDialog = ref(false);
const selectedTimesheet = ref(null);
const editingEntry = ref(null);
const rejectReason = ref('');
const timesheetToReject = ref(null);

// Filters
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Current user
const currentUser = computed(() => store.state.auth.user);
const hasManagerialPerms = computed(() => 
    hasAnyPermission(['change_timesheet', 'delete_timesheet', 'approve_timesheet'])
);

// Form
const timesheetForm = reactive({
    period_start: null,
    period_end: null,
    notes: ''
});

const entryForm = reactive({
    date: null,
    project: null,
    task_description: '',
    regular_hours: 0,
    overtime_hours: 0,
    break_hours: 0,
    notes: ''
});

// Computed
const draftCount = computed(() => 
    timesheets.value.filter(t => t.status === 'draft').length
);
const submittedCount = computed(() => 
    timesheets.value.filter(t => t.status === 'submitted').length
);
const approvedCount = computed(() => 
    timesheets.value.filter(t => t.status === 'approved').length
);

// Methods
const loadTimesheets = async () => {
    loading.value = true;
    try {
        const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
        
        const params = hasManagerialPerms.value
            ? { ordering: '-period_start' }
            : { employee: employeeId, ordering: '-period_start' };
        
        const response = await timesheetService.listTimesheets(params);
        
        // Handle different response structures
        let data = response.data || response;
        timesheets.value = data.results || data.data || data || [];
        
        // Load entries for each timesheet
        for (const timesheet of timesheets.value) {
            if (timesheet.id && !timesheet.entries) {
                await loadTimesheetEntries(timesheet);
            }
        }
    } catch (error) {
        console.error('Error loading timesheets:', error);
        showToast('error', 'Error', 'Failed to load timesheets');
    } finally {
        loading.value = false;
    }
};

const loadTimesheetEntries = async (timesheet) => {
    try {
        const response = await timesheetService.listTimesheetEntries({ timesheet: timesheet.id });
        let data = response.data || response;
        timesheet.entries = data.results || data.data || data || [];
    } catch (error) {
        console.error('Error loading entries:', error);
        timesheet.entries = [];
    }
};

const loadProjects = async () => {
    try {
        // Load projects from core service
        const { coreService } = await import('@/services/shared/coreService');
        const response = await coreService.getProjects();
        let data = response.data || response;
        projects.value = data.results || data.data || data || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        projects.value = [];
    }
};

const createTimesheet = async () => {
    if (!timesheetForm.period_start || !timesheetForm.period_end) {
        showToast('error', 'Validation Error', 'Please select start and end dates');
        return;
    }
    
    if (timesheetForm.period_end < timesheetForm.period_start) {
        showToast('error', 'Validation Error', 'End date must be after start date');
        return;
    }
    
    try {
        submitting.value = true;
        const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
        
        const response = await timesheetService.createTimesheet({
            employee: employeeId,
            period_start: formatDateForAPI(timesheetForm.period_start),
            period_end: formatDateForAPI(timesheetForm.period_end),
            notes: timesheetForm.notes,
            status: 'draft'
        });
        
        showToast('success', 'Success', 'Timesheet created successfully');
        showCreateDialog.value = false;
        
        // Reset form
        timesheetForm.period_start = null;
        timesheetForm.period_end = null;
        timesheetForm.notes = '';
        
        // Reload list
        await loadTimesheets();
    } catch (error) {
        console.error('Error creating timesheet:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create timesheet';
        showToast('error', 'Error', errorMsg);
    } finally {
        submitting.value = false;
    }
};

const viewTimesheet = async (timesheet) => {
    selectedTimesheet.value = timesheet;
    
    // Load full timesheet details if not already loaded
    if (!timesheet.entries) {
        loadingEntries.value = true;
        try {
            const response = await timesheetService.getTimesheet(timesheet.id);
            let data = response.data || response;
            selectedTimesheet.value = data;
            
            if (!selectedTimesheet.value.entries) {
                await loadTimesheetEntries(selectedTimesheet.value);
            }
        } catch (error) {
            console.error('Error loading timesheet details:', error);
            showToast('error', 'Error', 'Failed to load timesheet details');
        } finally {
            loadingEntries.value = false;
        }
    }
    
    showDetailDialog.value = true;
};

const editTimesheet = (timesheet) => {
    selectedTimesheet.value = timesheet;
    viewTimesheet(timesheet);
};

const submitTimesheet = async (timesheet) => {
    try {
        submitting.value = true;
        await timesheetService.submitTimesheet(timesheet.id);
        showToast('success', 'Success', 'Timesheet submitted for approval');
        await loadTimesheets();
    } catch (error) {
        console.error('Error submitting timesheet:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to submit timesheet';
        showToast('error', 'Error', errorMsg);
    } finally {
        submitting.value = false;
    }
};

const approveTimesheet = async (timesheet) => {
    try {
        submitting.value = true;
        await timesheetService.approveTimesheet(timesheet.id);
        showToast('success', 'Success', 'Timesheet approved successfully');
        await loadTimesheets();
        if (showDetailDialog.value) {
            showDetailDialog.value = false;
        }
    } catch (error) {
        console.error('Error approving timesheet:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to approve timesheet';
        showToast('error', 'Error', errorMsg);
    } finally {
        submitting.value = false;
    }
};

const openRejectDialog = (timesheet) => {
    timesheetToReject.value = timesheet;
    rejectReason.value = '';
    showRejectDialog.value = true;
};

const rejectTimesheet = async () => {
    if (!rejectReason.value.trim()) {
        showToast('error', 'Validation Error', 'Please provide a rejection reason');
        return;
    }
    
    try {
        submitting.value = true;
        await timesheetService.rejectTimesheet(timesheetToReject.value.id, rejectReason.value);
        showToast('success', 'Success', 'Timesheet rejected');
        rejectReason.value = '';
        showRejectDialog.value = false;
        await loadTimesheets();
    } catch (error) {
        console.error('Error rejecting timesheet:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to reject timesheet';
        showToast('error', 'Error', errorMsg);
    } finally {
        submitting.value = false;
    }
};

const editEntry = (entry) => {
    editingEntry.value = entry;
    entryForm.date = new Date(entry.date);
    entryForm.project = entry.project?.id || entry.project;
    entryForm.task_description = entry.task_description || '';
    entryForm.regular_hours = parseFloat(entry.regular_hours) || 0;
    entryForm.overtime_hours = parseFloat(entry.overtime_hours) || 0;
    entryForm.break_hours = parseFloat(entry.break_hours) || 0;
    entryForm.notes = entry.notes || '';
    showEntryDialog.value = true;
};

const saveEntry = async () => {
    if (!entryForm.date || !entryForm.task_description.trim()) {
        showToast('error', 'Validation Error', 'Please fill in required fields');
        return;
    }
    
    if (entryForm.regular_hours <= 0 && entryForm.overtime_hours <= 0) {
        showToast('error', 'Validation Error', 'Please enter at least regular or overtime hours');
        return;
    }
    
    try {
        submitting.value = true;
        
        const entryData = {
            timesheet: selectedTimesheet.value.id,
            date: formatDateForAPI(entryForm.date),
            project: entryForm.project || null,
            task_description: entryForm.task_description,
            regular_hours: entryForm.regular_hours,
            overtime_hours: entryForm.overtime_hours || 0,
            break_hours: entryForm.break_hours || 0,
            notes: entryForm.notes || ''
        };
        
        if (editingEntry.value) {
            await timesheetService.updateTimesheetEntry(editingEntry.value.id, entryData);
            showToast('success', 'Success', 'Entry updated successfully');
        } else {
            await timesheetService.createTimesheetEntry(entryData);
            showToast('success', 'Success', 'Entry added successfully');
        }
        
        // Reload timesheet entries
        await loadTimesheetEntries(selectedTimesheet.value);
        
        // Recalculate totals
        const response = await timesheetService.getTimesheet(selectedTimesheet.value.id);
        let data = response.data || response;
        selectedTimesheet.value = data;
        
        // Reset form
        entryForm.date = null;
        entryForm.project = null;
        entryForm.task_description = '';
        entryForm.regular_hours = 0;
        entryForm.overtime_hours = 0;
        entryForm.break_hours = 0;
        entryForm.notes = '';
        editingEntry.value = null;
        showEntryDialog.value = false;
        
        // Reload timesheets list
        await loadTimesheets();
    } catch (error) {
        console.error('Error saving entry:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save entry';
        showToast('error', 'Error', errorMsg);
    } finally {
        submitting.value = false;
    }
};

const deleteEntry = async (entry) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        await timesheetService.deleteTimesheetEntry(entry.id);
        showToast('success', 'Success', 'Entry deleted successfully');
        
        // Reload entries
        await loadTimesheetEntries(selectedTimesheet.value);
        
        // Recalculate totals
        const response = await timesheetService.getTimesheet(selectedTimesheet.value.id);
        let data = response.data || response;
        selectedTimesheet.value = data;
        
        // Reload timesheets list
        await loadTimesheets();
    } catch (error) {
        console.error('Error deleting entry:', error);
        showToast('error', 'Error', 'Failed to delete entry');
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

const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0.00h';
    const h = parseFloat(hours);
    return `${h.toFixed(2)}h`;
};

const getPeriodDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} days`;
};

onMounted(() => {
    loadTimesheets();
    loadProjects();
});
</script>

<style scoped>
.timesheets-page {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 1.5rem;
}

.summary-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
    padding: 0.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
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
