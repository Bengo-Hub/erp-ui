<script setup>
import { ref, onMounted, computed } from 'vue';
import { notificationService } from '@/services/notifications/notificationService';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();

const notifications = ref([]);
const loading = ref(false);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const fetchNotifications = async () => {
    loading.value = true;
    try {
        const response = await notificationService.getUserNotifications({ limit: 50 });
        notifications.value = response.notifications || response.results || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
    } finally {
        loading.value = false;
    }
};

const markAsRead = async (notification) => {
    if (notification.is_read) return;
    
    try {
        await notificationService.markAsRead(notification.id);
        notification.is_read = true;
        
        // Navigate to action URL if provided
        if (notification.action_url) {
            router.push(notification.action_url);
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

const markAllAsRead = async () => {
    try {
        await notificationService.markAllAsRead();
        notifications.value.forEach(n => n.is_read = true);
        showToast('success', 'Success', 'All notifications marked as read');
    } catch (error) {
        showToast('error', 'Error', 'Failed to mark notifications as read');
    }
};

const deleteNotification = async (notificationId) => {
    try {
        await notificationService.deleteNotification(notificationId);
        notifications.value = notifications.value.filter(n => n.id !== notificationId);
        showToast('success', 'Success', 'Notification deleted');
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete notification');
    }
};

const getNotificationIcon = (type) => {
    const icons = {
        SYSTEM: 'pi-info-circle',
        ORDER: 'pi-shopping-cart',
        PAYMENT: 'pi-money-bill',
        PAYROLL: 'pi-wallet',
        APPROVAL: 'pi-check-circle',
        SECURITY: 'pi-shield',
        MARKETING: 'pi-megaphone',
        REMINDER: 'pi-bell'
    };
    return icons[type] || 'pi-bell';
};

const getNotificationColor = (type) => {
    const colors = {
        SYSTEM: 'text-blue-500',
        ORDER: 'text-green-500',
        PAYMENT: 'text-purple-500',
        PAYROLL: 'text-indigo-500',
        APPROVAL: 'text-orange-500',
        SECURITY: 'text-red-500',
        MARKETING: 'text-pink-500',
        REMINDER: 'text-yellow-500'
    };
    return colors[type] || 'text-gray-500';
};

const getPriorityBadge = (priority) => {
    const badges = {
        1: { label: 'Low', severity: 'info' },
        2: { label: 'Normal', severity: 'success' },
        3: { label: 'High', severity: 'warning' },
        4: { label: 'Urgent', severity: 'danger' }
    };
    return badges[priority] || badges[2];
};

onMounted(() => {
    fetchNotifications();
});

defineExpose({ fetchNotifications, unreadCount });
</script>

<template>
    <div class="notification-panel hidden absolute top-[3.25rem] right-0 w-96 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border shadow-lg z-50">
        <!-- Header -->
        <div class="p-4 border-b border-surface">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                    Notifications
                    <Badge v-if="unreadCount > 0" :value="unreadCount" severity="danger" class="ml-2" />
                </h3>
                <Button 
                    v-if="unreadCount > 0" 
                    label="Mark all as read" 
                    text 
                    size="small" 
                    @click="markAllAsRead"
                    class="text-xs"
                />
            </div>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
            <div v-if="loading" class="p-8 text-center">
                <ProgressSpinner style="width: 50px; height: 50px" />
            </div>

            <div v-else-if="notifications.length === 0" class="p-8 text-center text-surface-500">
                <i class="pi pi-bell text-4xl mb-3 block"></i>
                <p>No notifications yet</p>
            </div>

            <div v-else class="divide-y divide-surface">
                <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    :class="[
                        'p-4 cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-800',
                        !notification.is_read && 'bg-primary-50 dark:bg-primary-900/20'
                    ]"
                    @click="markAsRead(notification)"
                >
                    <div class="flex gap-3">
                        <!-- Icon -->
                        <div :class="['flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', !notification.is_read ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-surface-100 dark:bg-surface-800']">
                            <i :class="['pi', getNotificationIcon(notification.notification_type), getNotificationColor(notification.notification_type)]"></i>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1">
                                <h4 :class="['text-sm font-semibold', !notification.is_read ? 'text-surface-900 dark:text-surface-0' : 'text-surface-700 dark:text-surface-300']">
                                    {{ notification.title }}
                                </h4>
                                <Badge 
                                    v-if="notification.priority > 2" 
                                    :value="getPriorityBadge(notification.priority).label" 
                                    :severity="getPriorityBadge(notification.priority).severity" 
                                    size="small"
                                />
                            </div>
                            
                            <p :class="['text-sm mb-2', !notification.is_read ? 'text-surface-700 dark:text-surface-300' : 'text-surface-500 dark:text-surface-400']">
                                {{ notification.message }}
                            </p>

                            <div class="flex items-center justify-between">
                                <span class="text-xs text-surface-500 dark:text-surface-400">
                                    {{ formatDate(notification.created_at, 'relative') }}
                                </span>

                                <Button
                                    v-if="notification.action_text && notification.action_url"
                                    :label="notification.action_text"
                                    text
                                    size="small"
                                    class="text-xs"
                                />
                            </div>
                        </div>

                        <!-- Delete Button -->
                        <Button
                            icon="pi pi-times"
                            text
                            rounded
                            size="small"
                            @click.stop="deleteNotification(notification.id)"
                            class="flex-shrink-0"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-surface text-center">
            <Button
                label="View All Notifications"
                text
                size="small"
                @click="router.push('/notifications')"
                class="w-full"
            />
        </div>
    </div>
</template>

<style scoped>
.notification-panel {
    animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
}
</style>

