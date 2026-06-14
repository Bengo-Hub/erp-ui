<script setup>
import { useTaskManager } from '@/composables/useTaskManager';
import { computed, ref } from 'vue';

const { isConnected, connectionStatus, activeTasks, taskHistory, runningTasksCount, hasActiveTasks } = useTaskManager();

const showTaskDetails = ref(false);

// Computed properties
const connectionStatusText = computed(() => {
    switch (connectionStatus.value) {
        case 'connected':
            return 'Connected to real-time updates';
        case 'connecting':
            return 'Connecting...';
        case 'error':
            return 'Connection error';
        default:
            return 'Disconnected';
    }
});

// Methods
const getTaskTypeLabel = (type) => {
    const labels = {
        single_payslip: 'Single Payslip',
        batch_payroll: 'Batch Payroll',
        payslip_rerun: 'Payslip Rerun',
        voucher_generation: 'Voucher Generation',
        email_distribution: 'Email Distribution'
    };
    return labels[type] || type;
};

const getTaskStatusSeverity = (status) => {
    const severities = {
        running: 'info',
        completed: 'success',
        failed: 'danger'
    };
    return severities[status] || 'info';
};

const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleString();
};
</script>

<template>
    <div class="task-status-indicator">
        <!-- Task Status Badge -->
        <div
            v-if="hasActiveTasks"
            class="task-badge"
            :class="{
                'task-badge--running': runningTasksCount > 0,
                'task-badge--completed': runningTasksCount === 0 && activeTasks.length > 0
            }"
            @click="showTaskDetails = true"
        >
            <i class="pi pi-spinner pi-spin" v-if="runningTasksCount > 0"></i>
            <i class="pi pi-check-circle" v-else-if="activeTasks.length > 0"></i>
            <i class="pi pi-clock" v-else></i>

            <span class="task-count">{{ runningTasksCount || activeTasks.length }}</span>

            <div class="task-tooltip">
                <div v-if="runningTasksCount > 0">{{ runningTasksCount }} task{{ runningTasksCount > 1 ? 's' : '' }} running</div>
                <div v-else-if="activeTasks.length > 0">{{ activeTasks.length }} task{{ activeTasks.length > 1 ? 's' : '' }} completed</div>
                <div v-else>No active tasks</div>
            </div>
        </div>

        <!-- Connection Status Indicator -->
        <div
            class="connection-indicator"
            :class="{
                'connection-indicator--connected': isConnected,
                'connection-indicator--connecting': connectionStatus === 'connecting',
                'connection-indicator--error': connectionStatus === 'error'
            }"
            :title="connectionStatusText"
        >
            <i class="pi pi-circle-fill"></i>
        </div>

        <!-- Task Details Dialog -->
        <Dialog v-model:visible="showTaskDetails" header="Task Status" :style="{ width: '600px' }" :modal="true" :closable="true">
            <div class="task-details">
                <!-- Connection Status -->
                <div class="connection-status mb-4">
                    <div class="flex items-center space-x-2">
                        <i
                            class="pi pi-circle-fill text-sm"
                            :class="{
                                'text-green-500': isConnected,
                                'text-yellow-500': connectionStatus === 'connecting',
                                'text-red-500': connectionStatus === 'error',
                                'text-gray-400': !isConnected
                            }"
                        ></i>
                        <span class="text-sm font-medium">{{ connectionStatusText }}</span>
                    </div>
                </div>

                <!-- Active Tasks -->
                <div v-if="activeTasks.length > 0" class="active-tasks">
                    <h4 class="text-lg font-semibold mb-3">Active Tasks</h4>
                    <div class="space-y-3">
                        <div
                            v-for="task in activeTasks"
                            :key="task.id"
                            class="task-item"
                            :class="{
                                'task-item--running': task.status === 'running',
                                'task-item--completed': task.status === 'completed',
                                'task-item--failed': task.status === 'failed'
                            }"
                        >
                            <div class="task-header">
                                <div class="flex items-center space-x-2">
                                    <i
                                        class="pi text-sm"
                                        :class="{
                                            'pi-spinner pi-spin text-blue-500': task.status === 'running',
                                            'pi-check-circle text-green-500': task.status === 'completed',
                                            'pi-times-circle text-red-500': task.status === 'failed'
                                        }"
                                    ></i>
                                    <span class="font-medium">{{ getTaskTypeLabel(task.type) }}</span>
                                    <Tag :value="task.status" :severity="getTaskStatusSeverity(task.status)" class="text-xs" />
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ formatTime(task.startTime) }}
                                </div>
                            </div>

                            <div class="task-message text-sm text-gray-600 mb-2">
                                {{ task.message }}
                            </div>

                            <!-- Progress Bar -->
                            <div v-if="task.status === 'running'" class="task-progress">
                                <ProgressBar :value="task.progress || 0" :showValue="false" class="h-2" />
                                <div class="text-xs text-gray-500 mt-1">{{ task.progress || 0 }}% complete</div>
                            </div>

                            <!-- Task Details -->
                            <div v-if="task.employeeCount" class="task-details text-xs text-gray-500">Processing {{ task.processedCount || 0 }} of {{ task.employeeCount }} employees</div>

                            <div v-if="task.employee_id" class="task-details text-xs text-gray-500">Employee ID: {{ task.employee_id }}</div>

                            <div v-if="task.payslip_id" class="task-details text-xs text-gray-500">Payslip ID: {{ task.payslip_id }}</div>
                        </div>
                    </div>
                </div>

                <!-- No Active Tasks -->
                <div v-else class="no-tasks text-center py-8">
                    <i class="pi pi-check-circle text-4xl text-green-500 mb-3"></i>
                    <p class="text-gray-500">No active tasks</p>
                </div>

                <!-- Task History -->
                <div v-if="taskHistory.length > 0" class="task-history mt-6">
                    <h4 class="text-lg font-semibold mb-3">Recent Activity</h4>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        <div v-for="(event, index) in taskHistory.slice(0, 10)" :key="index" class="history-item text-sm">
                            <div class="flex items-center space-x-2">
                                <i
                                    class="pi text-xs"
                                    :class="{
                                        'pi-play text-blue-500': event.type === 'task_started',
                                        'pi-check text-green-500': event.type === 'task_completed',
                                        'pi-times text-red-500': event.type === 'task_failed',
                                        'pi-info-circle text-gray-500': !['task_started', 'task_completed', 'task_failed'].includes(event.type)
                                    }"
                                ></i>
                                <span class="text-gray-600">{{ event.message }}</span>
                                <span class="text-xs text-gray-400 ml-auto">
                                    {{ formatTime(event.timestamp) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.task-status-indicator {
    @apply flex items-center space-x-2;
}

.task-badge {
    @apply relative flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-200;
    @apply bg-blue-100 text-blue-700 border border-blue-200;
}

.task-badge--running {
    @apply bg-blue-100 text-blue-700 border-blue-200;
}

.task-badge--completed {
    @apply bg-green-100 text-green-700 border-green-200;
}

.task-badge:hover {
    @apply shadow-md transform scale-105;
}

.task-count {
    @apply text-xs font-bold;
}

.task-tooltip {
    @apply absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity duration-200;
    white-space: nowrap;
}

.task-badge:hover .task-tooltip {
    @apply opacity-100;
}

.connection-indicator {
    @apply w-2 h-2 rounded-full;
}

.connection-indicator--connected {
    @apply bg-green-500;
}

.connection-indicator--connecting {
    @apply bg-yellow-500 animate-pulse;
}

.connection-indicator--error {
    @apply bg-red-500;
}

.task-details {
    @apply space-y-4;
}

.task-item {
    @apply p-3 rounded-lg border;
    @apply bg-gray-50 border-gray-200;
}

.task-item--running {
    @apply bg-blue-50 border-blue-200;
}

.task-item--completed {
    @apply bg-green-50 border-green-200;
}

.task-item--failed {
    @apply bg-red-50 border-red-200;
}

.task-header {
    @apply flex items-center justify-between mb-2;
}

.task-message {
    @apply text-sm text-gray-600 mb-2;
}

.task-progress {
    @apply mb-2;
}

.task-details {
    @apply text-xs text-gray-500;
}

.history-item {
    @apply py-1 border-b border-gray-100 last:border-b-0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .task-badge {
        @apply dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }

    .task-badge--running {
        @apply dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700;
    }

    .task-badge--completed {
        @apply dark:bg-green-900 dark:text-green-200 dark:border-green-700;
    }

    .task-item {
        @apply dark:bg-gray-800 dark:border-gray-600;
    }

    .task-item--running {
        @apply dark:bg-blue-900 dark:border-blue-700;
    }

    .task-item--completed {
        @apply dark:bg-green-900 dark:border-green-700;
    }

    .task-item--failed {
        @apply dark:bg-red-900 dark:border-red-700;
    }
}
</style>
