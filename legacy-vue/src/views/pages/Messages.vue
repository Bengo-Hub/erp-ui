<template>
    <div class="messages-page">
        <div class="page-header">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Messages</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Communicate with your team</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="Mark All Read" 
                        icon="pi pi-check" 
                        class="p-button-outlined"
                        @click="markAllAsRead"
                    />
                    <Button 
                        label="New Message" 
                        icon="pi pi-plus" 
                        @click="showNewMessageDialog = true"
                    />
                </div>
            </div>
        </div>

        <div class="messages-container mt-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Messages List -->
                <div class="lg:col-span-1">
                    <Card>
                        <template #header>
                            <div class="flex items-center justify-between p-4">
                                <h3 class="text-lg font-semibold">Conversations</h3>
                                <Badge :value="unreadCount" severity="danger" v-if="unreadCount > 0" />
                            </div>
                        </template>
                        <template #content>
                            <div class="messages-list">
                                <div 
                                    v-for="message in messages" 
                                    :key="message.id"
                                    class="message-item p-3 border-b border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                    :class="{ 'bg-primary-50 dark:bg-primary-900/20': !message.isRead }"
                                    @click="selectMessage(message)"
                                >
                                    <div class="flex items-start gap-3">
                                        <Avatar 
                                            :image="getAvatarUrl(message.sender)" 
                                            shape="circle" 
                                            size="normal"
                                        />
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between mb-1">
                                                <h4 class="font-semibold text-sm truncate">{{ message.sender.name }}</h4>
                                                <span class="text-xs text-surface-500">{{ formatDate(message.timestamp, 'short') }}</span>
                                            </div>
                                            <p class="text-sm text-surface-600 dark:text-surface-400 truncate">{{ message.preview }}</p>
                                            <div v-if="!message.isRead" class="w-2 h-2 bg-primary-500 rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-if="messages.length === 0" class="text-center py-8">
                                    <i class="pi pi-inbox text-4xl text-surface-400 mb-3"></i>
                                    <p class="text-surface-500">No messages yet</p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Message Detail -->
                <div class="lg:col-span-2">
                    <Card v-if="selectedMessage">
                        <template #header>
                            <div class="flex items-center justify-between p-4">
                                <div class="flex items-center gap-3">
                                    <Avatar 
                                        :image="getAvatarUrl(selectedMessage.sender)" 
                                        shape="circle" 
                                        size="normal"
                                    />
                                    <div>
                                        <h3 class="font-semibold">{{ selectedMessage.sender.name }}</h3>
                                        <p class="text-sm text-surface-500">{{ selectedMessage.sender.role }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Button 
                                        icon="pi pi-reply" 
                                        class="p-button-text p-button-sm"
                                        @click="replyToMessage"
                                    />
                                    <Button 
                                        icon="pi pi-trash" 
                                        class="p-button-text p-button-sm p-button-danger"
                                        @click="deleteMessage"
                                    />
                                </div>
                            </div>
                        </template>
                        <template #content>
                            <div class="message-detail">
                                <div class="message-header mb-4">
                                    <h4 class="text-lg font-semibold mb-2">{{ selectedMessage.subject }}</h4>
                                    <div class="flex items-center gap-4 text-sm text-surface-500">
                                        <span>From: {{ selectedMessage.sender.email }}</span>
                                        <span>{{ formatDate(selectedMessage.timestamp, 'long') }}</span>
                                    </div>
                                </div>
                                
                                <div class="message-content">
                                    <div class="prose max-w-none" v-html="selectedMessage.content"></div>
                                </div>
                            </div>
                        </template>
                    </Card>
                    
                    <Card v-else>
                        <template #content>
                            <div class="text-center py-12">
                                <i class="pi pi-inbox text-6xl text-surface-400 mb-4"></i>
                                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Select a Message</h3>
                                <p class="text-surface-500 dark:text-surface-400">
                                    Choose a conversation from the list to view the message details.
                                </p>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- New Message Dialog -->
        <Dialog 
            v-model:visible="showNewMessageDialog" 
            header="Compose Message" 
            :style="{ width: '600px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="field mb-4">
                    <label for="message-to" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        To *
                    </label>
                    <MultiSelect 
                        id="message-to"
                        v-model="newMessage.recipients" 
                        :options="users"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select recipients"
                        class="w-full"
                    />
                </div>
                
                <div class="field mb-4">
                    <label for="message-subject" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Subject *
                    </label>
                    <InputText 
                        id="message-subject"
                        v-model="newMessage.subject" 
                        placeholder="Enter message subject"
                        class="w-full"
                    />
                </div>
                
                <div class="field mb-4">
                    <label for="message-content" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Message *
                    </label>
                    <Textarea 
                        id="message-content"
                        v-model="newMessage.content" 
                        placeholder="Enter your message"
                        rows="6"
                        class="w-full"
                    />
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showNewMessageDialog = false"
                />
                <Button 
                    label="Send Message" 
                    icon="pi pi-send" 
                    @click="sendMessage"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { generateAvatarUrl } from '@/utils/avatarHelper';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Helper to get avatar URL for message senders
const getAvatarUrl = (sender) => {
    return sender.avatar || generateAvatarUrl(sender.name, { size: 48 });
};

const messages = ref([]);
const selectedMessage = ref(null);
const showNewMessageDialog = ref(false);
const unreadCount = computed(() => messages.value.filter(m => !m.isRead).length);

const newMessage = ref({
    recipients: [],
    subject: '',
    content: ''
});

const users = ref([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com' }
]);

const selectMessage = (message) => {
    selectedMessage.value = message;
    if (!message.isRead) {
        message.isRead = true;
    }
};

const markAllAsRead = () => {
    messages.value.forEach(message => {
        message.isRead = true;
    });
    showToast('success', 'Success', 'All messages marked as read');
};

const replyToMessage = () => {
    if (selectedMessage.value) {
        newMessage.value.subject = `Re: ${selectedMessage.value.subject}`;
        showNewMessageDialog.value = true;
    }
};

const deleteMessage = () => {
    if (selectedMessage.value) {
        const index = messages.value.findIndex(m => m.id === selectedMessage.value.id);
        if (index > -1) {
            messages.value.splice(index, 1);
            selectedMessage.value = null;
            showToast('success', 'Success', 'Message deleted');
        }
    }
};

const sendMessage = () => {
    if (!newMessage.value.recipients.length || !newMessage.value.subject || !newMessage.value.content) {
        showToast('error', 'Error', 'Please fill in all required fields');
        return;
    }
    
    showToast('success', 'Success', 'Message sent successfully');
    showNewMessageDialog.value = false;
    
    // Reset form
    newMessage.value = {
        recipients: [],
        subject: '',
        content: ''
    };
};

onMounted(() => {
    // Initialize with sample data
    messages.value = [
        {
            id: 1,
            sender: {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'Manager',
                avatar: null
            },
            subject: 'Project Update',
            preview: 'The project is progressing well...',
            content: '<p>The project is progressing well. We have completed 75% of the tasks and are on track to meet the deadline.</p><p>Please review the attached documents and let me know if you have any questions.</p>',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false
        },
        {
            id: 2,
            sender: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'Developer',
                avatar: null
            },
            subject: 'Meeting Reminder',
            preview: 'Don\'t forget about our team meeting...',
            content: '<p>Don\'t forget about our team meeting tomorrow at 10 AM.</p><p>We\'ll be discussing the new features and planning the next sprint.</p>',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            isRead: true
        }
    ];
});
</script>

<style scoped>
.messages-page {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 1.5rem;
}

.messages-list {
    max-height: 600px;
    overflow-y: auto;
}

.message-item {
    transition: all 0.2s ease;
}

.message-item:hover {
    transform: translateY(-1px);
}

.message-detail {
    min-height: 400px;
}

@media (max-width: 1024px) {
    .messages-container .grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .messages-page {
        padding: 1rem;
    }
    
    .page-header .flex {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .page-header .flex > div:last-child {
        width: 100%;
    }
    
    .page-header .flex > div:last-child .flex {
        flex-wrap: wrap;
    }
}
</style>
