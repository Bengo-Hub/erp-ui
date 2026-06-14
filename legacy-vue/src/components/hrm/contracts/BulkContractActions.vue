<script setup>
import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    selectedContracts: {
        type: Array,
        default: () => []
    },
    actionType: {
        type: String,
        default: 'renew'
    }
});

const emit = defineEmits(['close', 'completed', 'update:visible']);

const toast = useToast();
const isLoading = ref(false);
const submitted = ref(false);

// Computed property for dialog visibility
const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Form data for bulk actions
const form = reactive({
    // Renew action
    renewal_duration: 12, // months
    salary_adjustment: 0, // percentage
    status: 'active',
    
    // Link action
    link_type: 'related',
    link_notes: '',
    
    // Status update
    new_status: 'active',
    status_reason: '',
    
    // Terminate action
    termination_date: null,
    termination_reason: '',
    termination_type: 'voluntary'
});

// Options
const renewalDurations = ref([
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 },
    { label: '18 Months', value: 18 },
    { label: '24 Months', value: 24 },
    { label: '36 Months', value: 36 }
]);

const linkTypes = ref([
    { label: 'Related Contract', value: 'related' },
    { label: 'Extension', value: 'extension' },
    { label: 'Amendment', value: 'amendment' },
    { label: 'Replacement', value: 'replacement' }
]);

const terminationTypes = ref([
    { label: 'Voluntary', value: 'voluntary' },
    { label: 'Involuntary', value: 'involuntary' },
    { label: 'End of Contract', value: 'end_of_contract' },
    { label: 'Mutual Agreement', value: 'mutual_agreement' }
]);

const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'Expired', value: 'expired' }
]);

// Validation
const errors = reactive({});

// Clear validation errors
const clearErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key]);
};

// Validate form based on action type
const validateForm = () => {
    clearErrors();
    let isValid = true;

    switch (props.actionType) {
        case 'renew':
            if (!form.renewal_duration || form.renewal_duration <= 0) {
                errors.renewal_duration = 'Valid renewal duration is required';
                isValid = false;
            }
            if (form.salary_adjustment < -100 || form.salary_adjustment > 1000) {
                errors.salary_adjustment = 'Salary adjustment must be between -100% and 1000%';
                isValid = false;
            }
            break;
            
        case 'link':
            if (!form.link_type) {
                errors.link_type = 'Link type is required';
                isValid = false;
            }
            break;
            
        case 'status':
            if (!form.new_status) {
                errors.new_status = 'New status is required';
                isValid = false;
            }
            if (form.new_status === 'terminated' && !form.status_reason) {
                errors.status_reason = 'Reason is required for termination';
                isValid = false;
            }
            break;
            
        case 'terminate':
            if (!form.termination_date) {
                errors.termination_date = 'Termination date is required';
                isValid = false;
            }
            if (!form.termination_reason) {
                errors.termination_reason = 'Termination reason is required';
                isValid = false;
            }
            if (!form.termination_type) {
                errors.termination_type = 'Termination type is required';
                isValid = false;
            }
            break;
    }

    return isValid;
};

// Execute bulk action
const executeBulkAction = async () => {
    submitted.value = true;
    
    if (!validateForm()) {
        return;
    }

    if (props.selectedContracts.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No contracts selected',
            life: 3000
        });
        return;
    }

    isLoading.value = true;
    try {
        switch (props.actionType) {
            case 'renew':
                // Batch renew contracts
                await employeeService.renewContractsBatch({
                    ids: props.selectedContracts.map(c => c.id),
                    renewal_duration: form.renewal_duration,
                    salary_adjustment: form.salary_adjustment,
                    status: form.status
                });
                break;
                
            case 'link':
                // Link contracts
                const promises = [];
                for (const contract of props.selectedContracts) {
                    const linkData = {
                        link_type: form.link_type,
                        link_notes: form.link_notes,
                        linked_contract_id: contract.id
                    };
                    promises.push(employeeService.linkContract(contract.id, linkData));
                }
                await Promise.all(promises);
                break;
                
            case 'status':
                // Update status
                const statusPromises = [];
                for (const contract of props.selectedContracts) {
                    const statusData = {
                        status: form.new_status,
                        status_reason: form.status_reason
                    };
                    statusPromises.push(employeeService.updateContractStatus(contract.id, statusData));
                }
                await Promise.all(statusPromises);
                break;
                
            case 'terminate':
                // Terminate contracts
                const termPromises = [];
                for (const contract of props.selectedContracts) {
                    const terminationData = {
                        termination_date: form.termination_date.toISOString().split('T')[0],
                        termination_reason: form.termination_reason,
                        termination_type: form.termination_type
                    };
                    termPromises.push(employeeService.terminateEmployeeContract(
                        contract.employee?.id || contract.employee, 
                        contract.id, 
                        terminationData
                    ));
                }
                await Promise.all(termPromises);
                break;
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Bulk ${props.actionType} action completed for ${props.selectedContracts.length} contracts`,
            life: 3000
        });

        emit('completed', props.actionType);
        closeDialog();
    } catch (error) {
        console.error('Error executing bulk action:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.detail || error.message || 'Failed to execute bulk action',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

// Close dialog
const closeDialog = () => {
    submitted.value = false;
    clearErrors();
    emit('close');
};

// Get action title
const getActionTitle = () => {
    switch (props.actionType) {
        case 'renew': return 'Renew Contracts';
        case 'link': return 'Link Contracts';
        case 'status': return 'Update Status';
        case 'terminate': return 'Terminate Contracts';
        default: return 'Bulk Action';
    }
};

// Get action description
const getActionDescription = () => {
    switch (props.actionType) {
        case 'renew': return 'Renew selected contracts with new terms';
        case 'link': return 'Link selected contracts together';
        case 'status': return 'Update status of selected contracts';
        case 'terminate': return 'Terminate selected contracts';
        default: return 'Perform bulk action on selected contracts';
    }
};
</script>

<template>
    <Dialog 
        v-model:visible="isVisible" 
        :style="{ width: '90vw', maxWidth: '600px' }" 
        :header="getActionTitle()" 
        :modal="true"
        :closable="!isLoading"
        @hide="closeDialog"
    >
        <div class="p-4">
            <div class="mb-4">
                <p class="text-gray-600">{{ getActionDescription() }}</p>
                <p class="text-sm text-gray-500 mt-1">
                    Selected contracts: <strong>{{ selectedContracts.length }}</strong>
                </p>
            </div>

            <form @submit.prevent="executeBulkAction" class="space-y-6">
                <!-- Renew Action -->
                <div v-if="actionType === 'renew'" class="space-y-4">
                    <div class="field">
                        <label for="renewal_duration" class="block text-sm font-medium text-gray-700 mb-2">
                            Renewal Duration (Months) *
                        </label>
                        <Dropdown
                            id="renewal_duration"
                            v-model="form.renewal_duration"
                            :options="renewalDurations"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Duration"
                            :class="{ 'p-invalid': submitted && errors.renewal_duration }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.renewal_duration" class="p-error">
                            {{ errors.renewal_duration }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="salary_adjustment" class="block text-sm font-medium text-gray-700 mb-2">
                            Salary Adjustment (%)
                        </label>
                        <InputNumber
                            id="salary_adjustment"
                            v-model="form.salary_adjustment"
                            placeholder="0"
                            :min="-100"
                            :max="1000"
                            suffix="%"
                            :class="{ 'p-invalid': submitted && errors.salary_adjustment }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.salary_adjustment" class="p-error">
                            {{ errors.salary_adjustment }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="renewal_status" class="block text-sm font-medium text-gray-700 mb-2">
                            New Status
                        </label>
                        <Dropdown
                            id="renewal_status"
                            v-model="form.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Status"
                            :disabled="isLoading"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Link Action -->
                <div v-if="actionType === 'link'" class="space-y-4">
                    <div class="field">
                        <label for="link_type" class="block text-sm font-medium text-gray-700 mb-2">
                            Link Type *
                        </label>
                        <Dropdown
                            id="link_type"
                            v-model="form.link_type"
                            :options="linkTypes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Link Type"
                            :class="{ 'p-invalid': submitted && errors.link_type }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.link_type" class="p-error">
                            {{ errors.link_type }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="link_notes" class="block text-sm font-medium text-gray-700 mb-2">
                            Link Notes
                        </label>
                        <Textarea
                            id="link_notes"
                            v-model="form.link_notes"
                            rows="3"
                            placeholder="Enter link notes..."
                            :disabled="isLoading"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Status Update Action -->
                <div v-if="actionType === 'status'" class="space-y-4">
                    <div class="field">
                        <label for="new_status" class="block text-sm font-medium text-gray-700 mb-2">
                            New Status *
                        </label>
                        <Dropdown
                            id="new_status"
                            v-model="form.new_status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select New Status"
                            :class="{ 'p-invalid': submitted && errors.new_status }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.new_status" class="p-error">
                            {{ errors.new_status }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="status_reason" class="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>
                        <Textarea
                            id="status_reason"
                            v-model="form.status_reason"
                            rows="3"
                            placeholder="Enter status change reason..."
                            :class="{ 'p-invalid': submitted && errors.status_reason }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.status_reason" class="p-error">
                            {{ errors.status_reason }}
                        </small>
                    </div>
                </div>

                <!-- Terminate Action -->
                <div v-if="actionType === 'terminate'" class="space-y-4">
                    <div class="field">
                        <label for="termination_date" class="block text-sm font-medium text-gray-700 mb-2">
                            Termination Date *
                        </label>
                        <Calendar
                            id="termination_date"
                            v-model="form.termination_date"
                            dateFormat="mm/dd/yy"
                            placeholder="mm/dd/yyyy"
                            :class="{ 'p-invalid': submitted && errors.termination_date }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.termination_date" class="p-error">
                            {{ errors.termination_date }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="termination_type" class="block text-sm font-medium text-gray-700 mb-2">
                            Termination Type *
                        </label>
                        <Dropdown
                            id="termination_type"
                            v-model="form.termination_type"
                            :options="terminationTypes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Termination Type"
                            :class="{ 'p-invalid': submitted && errors.termination_type }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.termination_type" class="p-error">
                            {{ errors.termination_type }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="termination_reason" class="block text-sm font-medium text-gray-700 mb-2">
                            Termination Reason *
                        </label>
                        <Textarea
                            id="termination_reason"
                            v-model="form.termination_reason"
                            rows="3"
                            placeholder="Enter termination reason..."
                            :class="{ 'p-invalid': submitted && errors.termination_reason }"
                            :disabled="isLoading"
                            class="w-full"
                        />
                        <small v-if="submitted && errors.termination_reason" class="p-error">
                            {{ errors.termination_reason }}
                        </small>
                    </div>
                </div>
            </form>
        </div>

        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                text 
                @click="closeDialog" 
                :disabled="isLoading"
            />
            <Button 
                :label="getActionTitle()" 
                icon="pi pi-check" 
                @click="executeBulkAction" 
                :loading="isLoading"
                :disabled="isLoading"
            />
        </template>
    </Dialog>
</template>
