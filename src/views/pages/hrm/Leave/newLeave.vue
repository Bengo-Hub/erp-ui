<script setup>
import { useToast } from '@/composables/useToast';
import { leaveService } from '@/services/hrm/leaveService';
import { computed, ref, watch } from 'vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const emit = defineEmits(['submitted', 'cancel']);

// Form data
const loading = ref(false);
const validating = ref(false);
const selectedEmployee = ref(null);
const selectedLeaveType = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const comment = ref('');
const attachment = ref(null);
const leaveBalance = ref(0);
const days = ref(0);
const businessDays = ref(0);
const validationResult = ref(null);

const props = defineProps({
    categories: Array,
    employees: Array
});

// Computed properties
const canValidate = computed(() => {
    return selectedEmployee.value && selectedLeaveType.value && startDate.value && endDate.value;
});

const canSubmit = computed(() => {
    return validationResult.value?.valid;
});

const uploadUrl = computed(() => {
    return '/api/upload?employee_id=' + (selectedEmployee.value?.id || '');
});

// Watch for changes
watch([selectedEmployee, selectedLeaveType], () => {
    if (selectedEmployee.value && selectedLeaveType.value) {
        fetchLeaveBalance();
    } else {
        leaveBalance.value = 0;
    }
});

watch([startDate, endDate], () => {
    if (startDate.value && endDate.value) {
        validateLeaveRequest();
    } else {
        days.value = 0;
        businessDays.value = 0;
        validationResult.value = null;
    }
});

// Methods
const fetchLeaveBalance = async () => {
    if (!selectedEmployee.value || !selectedLeaveType.value) {
        leaveBalance.value = 0;
        return;
    }

    try {
        const response = await leaveService.getBalances({
            employee_id: selectedEmployee.value.id,
            category_id: selectedLeaveType.value.id,
            year: new Date().getFullYear()
        });

        // Check if we have results and extract the first item
        if (response.data?.results?.length > 0) {
            leaveBalance.value = parseFloat(response.data.results[0].days_remaining);
        } else {
            leaveBalance.value = 0;
            showToast('warning', 'Warning', 'No leave balance record found for this employee/category/year', 3000);
        }
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        leaveBalance.value = 0;
        showToast('error', 'Error', 'Failed to fetch leave balance', 3000);
    }
};

const validateLeaveRequest = async () => {
    if (!canValidate.value) return;

    validating.value = true;
    try {
        const response = await leaveService.validateLeave({
            employee_id: selectedEmployee.value.id,
            category_id: selectedLeaveType.value.id,
            start_date: formatDate(startDate.value),
            end_date: formatDate(endDate.value)
        });

        validationResult.value = response.data;
        days.value = response.data.days || 0;
        businessDays.value = response.data.business_days || 0;
    } catch (error) {
        console.error('Error validating leave request:', error);
        showToast('error', 'Error', 'Failed to validate leave request', 3000);
        validationResult.value = null;
    } finally {
        validating.value = false;
    }
};

const handleSubmit = async () => {
    if (!canSubmit.value) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('employee_id', selectedEmployee.value.id);
        formData.append('category_id', selectedLeaveType.value.id);
        formData.append('start_date', formatDate(startDate.value));
        formData.append('end_date', formatDate(endDate.value));
        formData.append('days_requested', businessDays.value);
        formData.append('reason', comment.value);

        if (attachment.value) {
            formData.append('attachment', attachment.value);
        }

        await leaveService.createRequest(formData);
        showToast('success', 'Success', 'Leave request submitted successfully', 3000);
        resetForm();
        emit('submitted');
    } catch (error) {
        showToast('error', 'Error', error.response?.data?.message || 'Failed to submit leave request', 3000);
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    selectedEmployee.value = null;
    selectedLeaveType.value = null;
    startDate.value = null;
    endDate.value = null;
    comment.value = '';
    attachment.value = null;
    days.value = 0;
    businessDays.value = 0;
    leaveBalance.value = 0;
    validationResult.value = null;
};

const onFileSelect = (event) => {
    if (event.files && event.files.length > 0) {
        attachment.value = event.files[0];
        showToast('success', 'Success', 'File selected for upload', 3000);
    }
};

</script>

<template>
    <div class="flex justify-center font-bold bg-primary text text-white h-10">
        <h2 class="text-xl primary-text text-white pt-2">New Leave Application</h2>
    </div>
    <div class="card bg-white p-4">
        <!-- Employee Selection -->
        <div class="flex justify-start mt-4">
            <div class="mr-2 w-32">
                <label for="employee" class="font-semibold">Employee:</label>
            </div>
            <div class="flex-1">
                <Dropdown
                    v-model="selectedEmployee"
                    :options="props.employees"
                    optionLabel="name"
                    placeholder="Select Employee"
                    class="w-full"
                    filter
                    showClear
                    :filterFields="['user.first_name', 'user.last_name', 'employee_number']"
                    :loading="loadingEmployees"
                >
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex items-center">
                            <span>{{ slotProps.value.name }}</span>
                        </div>
                        <span v-else>{{ slotProps.placeholder }}</span>
                    </template>
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>
        </div>

        <!-- Leave Type -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label for="leaveType" class="font-semibold">Leave Type:</label>
            </div>
            <div class="flex-1">
                <Dropdown v-model="selectedLeaveType" :options="props.categories" optionLabel="name" placeholder="Select Leave Category" class="w-full" :disabled="!selectedEmployee" :loading="loadingCategories" />
            </div>
        </div>

        <!-- Leave Balance -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label for="leaveBalance" class="font-semibold" disabled>Available:</label>
            </div>
            <div class="flex-1">
                <InputText v-model="leaveBalance" class="w-full" readonly>
                    <template #suffix>
                        <span class="text-sm text-gray-500">days</span>
                    </template>
                </InputText>
                <small v-if="validationResult && !validationResult.valid" class="text-red-500">
                    {{ validationResult.error }}
                </small>
            </div>
        </div>

        <!-- Date Range -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label class="font-semibold">Date Range:</label>
            </div>
            <div class="flex-1 flex items-center gap-2">
                <Calendar v-model="startDate" placeholder="Start Date" dateFormat="dd/mm/yy" class="flex-1" :disabled="!selectedLeaveType" showIcon :maxDate="endDate || null" />
                <span class="mx-2 text-gray-500">to</span>
                <Calendar v-model="endDate" placeholder="End Date" dateFormat="dd/mm/yy" class="flex-1" :disabled="!startDate" showIcon :minDate="startDate || null" />
            </div>
        </div>

        <!-- Duration -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label class="font-semibold">Duration:</label>
            </div>
            <div class="flex-1 min-w-0">
                <!-- Added min-w-0 to prevent overflow -->
                <div class="flex items-center gap-4 flex-wrap">
                    <!-- Added flex-wrap -->
                    <div class="flex-shrink-0">
                        <!-- Wrapped InputNumber -->
                        <InputText v-model="businessDays" class="w-full md:w-24" readonly mode="number" />
                    </div>
                    <span class="text-sm text-gray-500 whitespace-normal break-words">
                        <!-- Added whitespace-normal and break-words -->
                        business days ({{ days }} calendar days)
                    </span>
                </div>
            </div>
        </div>

        <!-- Comment -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label for="comment" class="font-semibold">Comment:</label>
            </div>
            <div class="flex-1">
                <Textarea v-model="comment" rows="3" class="w-full" placeholder="Optional reason for leave" />
            </div>
        </div>

        <!-- Attachment -->
        <div class="flex justify-start mt-6">
            <div class="mr-2 w-32">
                <label class="font-semibold">Attachment:</label>
            </div>
            <div class="flex-1">
                <FileUpload mode="basic" name="attachment" :url="uploadUrl" accept="image/*,.pdf,.doc,.docx" :maxFileSize="5 * 1024 * 1024" chooseLabel="Attach File" class="w-full" @select="onFileSelect" @remove="attachment = null" />
                <small class="text-gray-500">Max 5MB (PDF, DOC, Images)</small>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 mt-8">
            <Button label="Cancel" severity="secondary" @click="emit('cancel')" />
            <Button label="Validate" severity="info" :loading="validating" :disabled="!canValidate" @click="validateLeaveRequest" />
            <Button label="Submit" severity="primary" :loading="loading" :disabled="!canSubmit" @click="handleSubmit" />
        </div>
    </div>
</template>

<style scoped>
/* Add any custom styles here */
.w-32 {
    width: 8rem;
}
</style>
