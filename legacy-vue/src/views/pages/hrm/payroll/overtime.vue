<template>
    <div class="overtime-page">
        <!-- Page Header -->
        <div class="page-header mb-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0">Overtime Applications</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Submit and track overtime hours</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="Apply for Overtime" 
                        icon="pi pi-plus" 
                        @click="showApplyDialog = true"
                    />
                </div>
            </div>
        </div>

        <!-- Overtime Applications List -->
        <Card>
            <template #content>
                <DataTable 
                    :value="overtimeApplications" 
                    :loading="loading"
                    paginator 
                    :rows="10"
                    class="modern-table"
                    :rowsPerPageOptions="[10, 25, 50]"
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-stopwatch text-6xl text-surface-400 mb-4"></i>
                            <p class="text-surface-500">No overtime applications found</p>
                            <Button
                                label="Apply for Overtime"
                                icon="pi pi-plus"
                                class="mt-4"
                                @click="showApplyDialog = true"
                            />
                        </div>
                    </template>

                    <Column field="date" header="Date" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.date, 'long') }}
                        </template>
                    </Column>

                    <Column field="hours" header="Hours" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-primary"></i>
                                <span class="font-semibold">{{ slotProps.data.hours }}h</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="reason" header="Reason">
                        <template #body="slotProps">
                            <div class="max-w-xs truncate">{{ slotProps.data.reason }}</div>
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
                                    @click="viewOvertimeApplication(slotProps.data)"
                                />
                                <Button 
                                    v-if="slotProps.data.status === 'pending'"
                                    icon="pi pi-times" 
                                    class="p-button-text p-button-sm p-button-danger"
                                    @click="cancelApplication(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Apply for Overtime Dialog -->
        <Dialog 
            v-model:visible="showApplyDialog" 
            header="Apply for Overtime" 
            :style="{ width: '600px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="space-y-4">
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Date *</label>
                        <Calendar v-model="overtimeForm.date" dateFormat="yy-mm-dd" class="w-full" />
                    </div>
                    
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Number of Hours *</label>
                        <InputNumber 
                            v-model="overtimeForm.hours" 
                            :min="0" 
                            :max="12" 
                            suffix=" hours"
                            class="w-full"
                        />
                    </div>
                    
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Reason *</label>
                        <Textarea 
                            v-model="overtimeForm.reason" 
                            rows="4" 
                            placeholder="Explain why you worked overtime..."
                            class="w-full"
                        />
                    </div>

                    <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p class="text-sm text-primary-700 dark:text-primary-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            Overtime applications are subject to approval by your manager.
                        </p>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showApplyDialog = false"
                />
                <Button 
                    label="Submit Application" 
                    icon="pi pi-check" 
                    @click="submitOvertimeApplication"
                    :loading="submitting"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const { showToast } = useToast();

// State
const loading = ref(false);
const submitting = ref(false);
const overtimeApplications = ref([]);
const showApplyDialog = ref(false);

// Current user
const currentUser = computed(() => store.state.auth.user);

// Form
const overtimeForm = reactive({
    date: null,
    hours: 0,
    reason: ''
});

// Methods
const loadOvertimeApplications = async () => {
    loading.value = true;
    try {
        // TODO: Implement actual API call when overtime service is available
        // const response = await overtimeService.listOvertimeApplications();
        // overtimeApplications.value = response.results || response.data || [];
        
        overtimeApplications.value = [];
    } catch (error) {
        console.error('Error loading overtime applications:', error);
        showToast('error', 'Error', 'Failed to load overtime applications');
    } finally {
        loading.value = false;
    }
};

const submitOvertimeApplication = async () => {
    if (!overtimeForm.date || !overtimeForm.hours || !overtimeForm.reason) {
        showToast('error', 'Error', 'Please fill in all required fields');
        return;
    }
    
    try {
        submitting.value = true;
        
        // TODO: Implement actual API call when overtime service is available
        // await overtimeService.createOvertimeApplication({
        //     employee: currentUser.value?.employee_id || currentUser.value?.id,
        //     date: overtimeForm.date,
        //     hours: overtimeForm.hours,
        //     reason: overtimeForm.reason,
        //     status: 'pending'
        // });
        
        showToast('success', 'Success', 'Overtime application submitted successfully');
        showApplyDialog.value = false;
        
        // Reset form
        overtimeForm.date = null;
        overtimeForm.hours = 0;
        overtimeForm.reason = '';
        
        // Reload list
        await loadOvertimeApplications();
    } catch (error) {
        console.error('Error submitting overtime application:', error);
        showToast('error', 'Error', 'Failed to submit overtime application');
    } finally {
        submitting.value = false;
    }
};

const viewOvertimeApplication = (application) => {
    showToast('info', 'View Application', `Viewing overtime application for ${formatDate(application.date)}`);
};

const cancelApplication = (application) => {
    showToast('info', 'Cancel Application', 'Cancel functionality coming soon');
};

const getStatusSeverity = (status) => {
    const severityMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        cancelled: 'secondary'
    };
    return severityMap[status?.toLowerCase()] || 'info';
};

onMounted(() => {
    loadOvertimeApplications();
});
</script>

<style scoped>
.overtime-page {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 1.5rem;
}

.modern-table :deep(.p-datatable) {
    border-radius: 8px;
}

@media (max-width: 768px) {
    .overtime-page {
        padding: 1rem;
    }
}
</style>

