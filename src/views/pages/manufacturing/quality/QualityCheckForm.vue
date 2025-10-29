<script setup>
import { useToast } from '@/composables/useToast';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { onMounted, reactive, ref, watch } from 'vue';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    isEdit: {
        type: Boolean,
        default: false
    },
    checkData: {
        type: Object,
        default: () => ({
            id: null,
            batch: null,
            check_date: new Date(),
            result: null,
            notes: ''
        })
    }
});

// Emits
const emit = defineEmits(['close', 'saved']);

// Toast for notifications
const { showToast } = useToast();

// Data
const formData = reactive({
    id: null,
    batch: null,
    check_date: new Date(),
    result: null,
    notes: ''
});

const batches = ref([]);
const saving = ref(false);
const validationErrors = reactive({
    batch: '',
    check_date: '',
    result: ''
});

// Watch prop changes
watch(
    () => props.checkData,
    (newValue) => {
        if (newValue) {
            console.log('Received check data:', newValue);
            // Reset form data
            formData.id = newValue.id || null;
            formData.batch = newValue.batch || null;
            formData.check_date = newValue.check_date ? new Date(newValue.check_date) : new Date();
            formData.result = newValue.result || null;
            formData.notes = newValue.notes || '';
        }
    },
    { immediate: true, deep: true }
);

// Methods
const fetchActiveBatches = async () => {
    try {
        const response = await manufacturingService.getBatches();
        batches.value = response.data.results;
    } catch (error) {
        console.error('Error fetching active batches:', error);
        showToast('error', 'Error', 'Failed to load production batches', 3000);
        batches.value = [];
    }
};

const validateForm = () => {
    let isValid = true;

    // Reset validation errors
    validationErrors.batch = '';
    validationErrors.check_date = '';
    validationErrors.result = '';

    // Validate batch
    if (!formData.batch) {
        validationErrors.batch = 'Please select a production batch';
        isValid = false;
    } else if (!formData.batch.id) {
        validationErrors.batch = 'Selected batch has no valid ID';
        isValid = false;
        console.error('Batch missing ID:', formData.batch);
    }

    // Validate check date
    if (!formData.check_date) {
        validationErrors.check_date = 'Please select a check date';
        isValid = false;
    }

    // Validate result
    if (!formData.result) {
        validationErrors.result = 'Please select a result';
        isValid = false;
    }

    if (!isValid) {
        console.log('Form validation failed:', validationErrors);
    }

    return isValid;
};

const saveQualityCheck = async () => {
    if (!validateForm()) {
        return;
    }

    saving.value = true;

    try {
        // Make sure batch is available and has an id
        if (!formData.batch || !formData.batch.id) {
            showToast('error', 'Missing Data', 'Production batch is required and must have a valid ID', 3000);
            saving.value = false;
            return;
        }

        // Format data for API
        const qualityCheckData = {
            batch: formData.batch.id,
            check_date: formData.check_date ? formData.check_date.toISOString() : new Date().toISOString(),
            result: formData.result,
            notes: formData.notes || ''
        };

        console.log('Saving quality check data:', qualityCheckData);

        let response;

        if (props.isEdit && formData.id) {
            // Update existing check
            response = await manufacturingService.updateQualityCheck(formData.id, qualityCheckData);
            showToast('success', 'Success', 'Quality check updated successfully', 3000);
        } else {
            // Create new check
            response = await manufacturingService.createQualityCheck(qualityCheckData);
            showToast('success', 'Success', 'Quality check created successfully', 3000);
        }

        emit('saved', response.data);
        emit('close');
    } catch (error) {
        console.error('Error saving quality check:', error);
        let errorMessage = 'An error occurred while saving the quality check';

        // Extract error message from API if available
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.detail) {
                errorMessage = error.response.data.detail;
            } else if (typeof error.response.data === 'object') {
                // Try to extract field errors
                const fieldErrors = Object.entries(error.response.data)
                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                    .join('; ');
                if (fieldErrors) {
                    errorMessage = fieldErrors;
                }
            }
        }

        showToast('error', 'Error', errorMessage, 3000);
    } finally {
        saving.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    fetchActiveBatches();
});
</script>

<template>
    <div class="quality-check-form">
        <Dialog
            :visible="visible"
            :header="isEdit ? 'Edit Quality Check' : 'New Quality Check'"
            :style="{ width: '450px' }"
            :modal="true"
            :closable="true"
            :closeOnEscape="true"
            @hide="$emit('close')"
            @update:visible="$emit('update:visible', $event)"
        >
            <div class="p-fluid">
                <!-- Production Batch -->
                <div class="field mb-3">
                    <label for="batch" class="font-bold">Production Batch</label>
                    <Dropdown id="batch" v-model="formData.batch" :options="batches" optionLabel="batch_number" placeholder="Select Production Batch" class="w-full" :disabled="isEdit" />
                    <small v-if="validationErrors.batch" class="p-error">{{ validationErrors.batch }}</small>
                </div>

                <!-- Check Date -->
                <div class="field mb-3">
                    <label for="check_date" class="font-bold">Check Date</label>
                    <Calendar id="check_date" v-model="formData.check_date" showTime hourFormat="24" dateFormat="yy-mm-dd" class="w-full" :showButtonBar="true" :maxDate="new Date()" />
                    <small v-if="validationErrors.check_date" class="p-error">{{ validationErrors.check_date }}</small>
                </div>

                <!-- Result -->
                <div class="field mb-3">
                    <label for="result" class="font-bold">Result</label>
                    <div class="p-field-radiobutton">
                        <div class="flex gap-4">
                            <div class="field-radiobutton">
                                <RadioButton id="result_pass" name="result" value="pass" v-model="formData.result" />
                                <label for="result_pass" class="ml-1">Pass</label>
                            </div>
                            <div class="field-radiobutton">
                                <RadioButton id="result_fail" name="result" value="fail" v-model="formData.result" />
                                <label for="result_fail" class="ml-1">Fail</label>
                            </div>
                        </div>
                    </div>
                    <small v-if="validationErrors.result" class="p-error">{{ validationErrors.result }}</small>
                </div>

                <!-- Notes -->
                <div class="field mb-3">
                    <label for="notes" class="font-bold">Notes</label>
                    <Textarea id="notes" v-model="formData.notes" rows="3" autoResize placeholder="Enter notes or observations from this quality check" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="$emit('close')" class="p-button-text" />
                <Button label="Save" icon="pi pi-check" @click="saveQualityCheck" :loading="saving" :disabled="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.quality-check-form :deep(.p-dropdown-label) {
    text-transform: none;
}
</style>
