<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    document: {
        type: Object,
        default: null
    },
    documentType: {
        type: String,
        default: 'expense' // 'expense', 'purchase_order', etc.
    },
    action: {
        type: String,
        default: 'approve', // 'approve' or 'reject'
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'approve', 'reject']);

const { showToast } = useToast();

const approvalData = ref({
    comments: '',
    notify_user: true
});

// Computed
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const dialogTitle = computed(() => {
    return props.action === 'approve' 
        ? `Approve ${props.documentType === 'expense' ? 'Expense' : 'Document'}`
        : `Reject ${props.documentType === 'expense' ? 'Expense' : 'Document'}`;
});

const actionButtonLabel = computed(() => {
    return props.action === 'approve' ? 'Approve' : 'Reject';
});

const actionButtonClass = computed(() => {
    return props.action === 'approve' ? 'p-button-success' : 'p-button-danger';
});

const documentNumber = computed(() => {
    if (!props.document) return 'N/A';
    return props.document.reference_no || 
           props.document.invoice_number || 
           props.document.order_number || 
           'N/A';
});

// Methods
const handleAction = () => {
    if (props.action === 'approve') {
        handleApprove();
    } else {
        handleReject();
    }
};

const handleApprove = () => {
    if (!props.document) {
        showToast('warn', 'Validation', 'No document selected');
        return;
    }
    
    emit('approve', {
        comments: approvalData.value.comments,
        notify_user: approvalData.value.notify_user
    });
};

const handleReject = () => {
    if (!props.document) {
        showToast('warn', 'Validation', 'No document selected');
        return;
    }
    
    if (!approvalData.value.comments && props.action === 'reject') {
        showToast('warn', 'Validation', 'Please provide a reason for rejection');
        return;
    }
    
    emit('reject', {
        comments: approvalData.value.comments,
        notify_user: approvalData.value.notify_user
    });
};

const cancel = () => {
    dialogVisible.value = false;
    approvalData.value = {
        comments: '',
        notify_user: true
    };
};
</script>

<template>
    <Dialog 
        v-model:visible="dialogVisible" 
        modal 
        :header="dialogTitle" 
        :style="{ width: '600px' }"
        :dismissableMask="true"
    >
        <div v-if="document" class="space-y-4">
            <!-- Document Summary -->
            <div :class="[
                'p-4 rounded',
                action === 'approve' ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'
            ]">
                <div class="flex items-center gap-3 mb-3">
                    <i :class="[
                        'text-3xl',
                        action === 'approve' ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'
                    ]"></i>
                    <div>
                        <p class="font-semibold">
                            {{ action === 'approve' ? 'Approve' : 'Reject' }} 
                            {{ documentType === 'expense' ? 'Expense' : 'Document' }}
                        </p>
                        <p class="text-sm text-surface-600">{{ documentNumber }}</p>
                    </div>
                </div>
                
                <Divider />
                
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div v-if="document.total_amount || document.total">
                        <span class="text-surface-600">Amount:</span>
                        <span class="font-semibold ml-2">
                            {{ document.total_amount || document.total | currency }}
                        </span>
                    </div>
                    <div v-if="document.category_name || document.category">
                        <span class="text-surface-600">Category:</span>
                        <span class="font-semibold ml-2">
                            {{ document.category_name || document.category }}
                        </span>
                    </div>
                    <div v-if="document.date_added || document.created_at">
                        <span class="text-surface-600">Date:</span>
                        <span class="font-semibold ml-2">
                            {{ document.date_added || document.created_at | date }}
                        </span>
                    </div>
                    <div v-if="document.expense_for_user || document.created_by">
                        <span class="text-surface-600">Submitted By:</span>
                        <span class="font-semibold ml-2">
                            {{ document.expense_for_user || document.created_by }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Comments -->
            <div>
                <label class="block text-sm font-medium mb-2">
                    {{ action === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection *' }}
                </label>
                <Textarea 
                    v-model="approvalData.comments"
                    rows="4"
                    class="w-full"
                    :placeholder="action === 'approve' 
                        ? 'Add any comments about this approval...' 
                        : 'Please provide a reason for rejection...'"
                />
            </div>

            <!-- Notification Option -->
            <div class="flex items-center gap-2">
                <Checkbox 
                    v-model="approvalData.notify_user" 
                    inputId="notify_user"
                    binary
                />
                <label for="notify_user" class="text-sm">
                    Notify user via email
                </label>
            </div>

            <!-- Warning for Rejection -->
            <Message v-if="action === 'reject'" severity="warn" :closable="false">
                <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>This action will reject the {{ documentType }} and notify the submitter.</span>
                </div>
            </Message>

            <!-- Info for Approval -->
            <Message v-else severity="info" :closable="false">
                <div class="flex items-center gap-2">
                    <i class="pi pi-info-circle"></i>
                    <span>This action will approve the {{ documentType }} for payment processing.</span>
                </div>
            </Message>
        </div>

        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                @click="cancel" 
                class="p-button-text" 
                :disabled="loading"
            />
            <Button 
                :label="actionButtonLabel" 
                :icon="action === 'approve' ? 'pi pi-check' : 'pi pi-times'" 
                @click="handleAction" 
                :class="actionButtonClass"
                :loading="loading"
            />
        </template>
    </Dialog>
</template>

<style scoped>
/* Additional styling if needed */
</style>

