<script setup>
import { ref, computed, watch } from 'vue';
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
        default: 'invoice', // 'invoice' or 'quotation'
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'send', 'send-via-whatsapp', 'schedule']);

const { showToast } = useToast();

const sendMethod = ref('email'); // 'email', 'whatsapp', 'schedule'
const emailData = ref({
    email_to: '',
    send_copy_to: [],
    message: ''
});
const scheduleData = ref({
    scheduled_date: null,
    message: ''
});

const ccEmails = ref('');

// Computed
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const dialogTitle = computed(() => {
    return sendMethod.value === 'schedule' 
        ? `Schedule ${props.documentType === 'invoice' ? 'Invoice' : 'Quotation'}`
        : `Send ${props.documentType === 'invoice' ? 'Invoice' : 'Quotation'}`;
});

const sendButtonLabel = computed(() => {
    const docType = props.documentType === 'invoice' ? 'Invoice' : 'Quotation';
    if (sendMethod.value === 'email') return `Send ${docType}`;
    if (sendMethod.value === 'whatsapp') return 'Send via WhatsApp';
    return 'Schedule';
});

// Methods
const handleSend = () => {
    if (sendMethod.value === 'email') {
        sendViaEmail();
    } else if (sendMethod.value === 'whatsapp') {
        sendViaWhatsApp();
    } else if (sendMethod.value === 'schedule') {
        scheduleDocument();
    }
};

const sendViaEmail = () => {
    if (!emailData.value.email_to && !props.document?.customer?.user?.email) {
        showToast('warn', 'Validation', 'Recipient email is required');
        return;
    }
    
    // Parse CC emails
    const ccList = ccEmails.value ? ccEmails.value.split(',').map(e => e.trim()).filter(Boolean) : [];
    
    emit('send', {
        email_to: emailData.value.email_to || props.document.customer.user.email,
        send_copy_to: ccList,
        message: emailData.value.message
    });
};

const sendViaWhatsApp = () => {
    if (!props.document?.customer?.user?.phone) {
        showToast('warn', 'Validation', 'Customer phone number is required');
        return;
    }
    
    emit('send-via-whatsapp', {
        phone: props.document.customer.user.phone,
        message: emailData.value.message
    });
};

const scheduleDocument = () => {
    if (!scheduleData.value.scheduled_date) {
        showToast('warn', 'Validation', 'Please select a date and time');
        return;
    }
    
    emit('schedule', scheduleData.value);
};

const cancel = () => {
    dialogVisible.value = false;
};

// Watch document changes
watch(() => props.document, (newDoc) => {
    if (newDoc) {
        emailData.value.email_to = newDoc.customer?.user?.email || '';
    }
}, { immediate: true });
</script>

<template>
    <Dialog 
        v-model:visible="dialogVisible" 
        modal 
        :header="dialogTitle" 
        :style="{ width: '600px' }"
        :dismissableMask="true"
    >
        <div class="space-y-4">
            <!-- Send Method Selection -->
            <div>
                <label class="block text-sm font-medium mb-3">Send via:</label>
                <div class="flex gap-3">
                    <div 
                        class="send-method-option" 
                        :class="{ 'active': sendMethod === 'email' }"
                        @click="sendMethod = 'email'"
                    >
                        <i class="pi pi-envelope text-2xl"></i>
                        <span>Email</span>
                    </div>
                    <div 
                        class="send-method-option"
                        :class="{ 'active': sendMethod === 'whatsapp' }"
                        @click="sendMethod = 'whatsapp'"
                    >
                        <i class="pi pi-whatsapp text-2xl"></i>
                        <span>WhatsApp</span>
                    </div>
                    <div 
                        class="send-method-option"
                        :class="{ 'active': sendMethod === 'schedule' }"
                        @click="sendMethod = 'schedule'"
                    >
                        <i class="pi pi-calendar text-2xl"></i>
                        <span>Schedule</span>
                    </div>
                </div>
            </div>

            <Divider />

            <!-- Email Method -->
            <div v-if="sendMethod === 'email'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">To: *</label>
                    <InputText 
                        v-model="emailData.email_to"
                        placeholder="customer@example.com"
                        class="w-full"
                    />
                    <small class="text-surface-500">Customer email from profile will be used if empty</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">CC: (Optional)</label>
                    <InputText 
                        v-model="ccEmails"
                        placeholder="email1@example.com, email2@example.com"
                        class="w-full"
                    />
                    <small class="text-surface-500">Separate multiple emails with commas</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                    <Textarea 
                        v-model="emailData.message"
                        rows="4"
                        class="w-full"
                        placeholder="Add a personal message..."
                    />
                </div>

                <Message severity="info" :closable="false">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-paperclip"></i>
                        <span>PDF will be automatically attached</span>
                    </div>
                </Message>
            </div>

            <!-- WhatsApp Method -->
            <div v-else-if="sendMethod === 'whatsapp'" class="space-y-4">
                <div class="bg-green-50 dark:bg-green-900 p-4 rounded">
                    <div class="flex items-center gap-3 mb-3">
                        <i class="pi pi-whatsapp text-3xl text-green-600"></i>
                        <div>
                            <p class="font-semibold">Send via WhatsApp</p>
                            <p class="text-sm text-surface-600">{{ document?.customer?.user?.phone || 'No phone number' }}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Message</label>
                    <Textarea 
                        v-model="emailData.message"
                        rows="4"
                        class="w-full"
                        :placeholder="`Hello, here is your ${documentType} from ${document?.branch?.business?.name || 'us'}. Click the link to view.`"
                    />
                </div>

                <Message severity="warn" :closable="false">
                    This will open WhatsApp Web with the message pre-filled. The PDF link will be included.
                </Message>
            </div>

            <!-- Schedule Method -->
            <div v-else-if="sendMethod === 'schedule'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">When would you like to send?</label>
                    <Calendar 
                        v-model="scheduleData.scheduled_date"
                        :showTime="true"
                        hourFormat="24"
                        dateFormat="dd/mm/yy"
                        class="w-full"
                        :minDate="new Date()"
                    />
                    <small class="text-surface-500">The {{documentType}} will be sent automatically at the scheduled time</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                    <Textarea 
                        v-model="scheduleData.message"
                        rows="3"
                        class="w-full"
                        placeholder="Add a personal message..."
                    />
                </div>

                <Message severity="info" :closable="false">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-clock"></i>
                        <span>Scheduled emails are processed every 5 minutes</span>
                    </div>
                </Message>
            </div>
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
                :label="sendButtonLabel" 
                :icon="sendMethod === 'email' ? 'pi pi-send' : sendMethod === 'whatsapp' ? 'pi pi-whatsapp' : 'pi pi-calendar'" 
                @click="handleSend" 
                :loading="loading"
            />
        </template>
    </Dialog>
</template>

<style scoped>
.send-method-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.send-method-option:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.send-method-option.active {
    border-color: #2563eb;
    background-color: #dbeafe;
    font-weight: 600;
}

.send-method-option i {
    color: #6b7280;
}

.send-method-option.active i {
    color: #2563eb;
}

.send-method-option span {
    font-size: 0.875rem;
}
</style>

