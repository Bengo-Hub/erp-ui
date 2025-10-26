<template>
    <Card class="user-card hover:shadow-lg transition-shadow">
        <template #header>
            <div class="relative">
                <div class="bg-gradient-to-r from-primary-500 to-primary-700 h-24"></div>
                <div class="absolute -bottom-8 left-6">
                    <Avatar
                        :image="user.pic || defaultAvatar"
                        :label="!user.pic ? getUserInitials(user) : undefined"
                        size="xlarge"
                        shape="circle"
                        class="border-4 border-white shadow-lg"
                    />
                </div>
            </div>
        </template>
        
        <template #content>
            <div class="pt-6">
                <!-- User Info -->
                <div class="mb-4">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {{ user.first_name }} {{ user.middle_name }} {{ user.last_name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                </div>

                <!-- Status Badge -->
                <div class="flex items-center gap-2 mb-4">
                    <Badge
                        :value="user.is_active ? 'Active' : 'Inactive'"
                        :severity="user.is_active ? 'success' : 'danger'"
                    />
                    <Badge
                        v-if="user.is_staff"
                        value="Staff"
                        severity="info"
                    />
                    <Badge
                        v-if="user.is_superuser"
                        value="Admin"
                        severity="warning"
                    />
                </div>

                <!-- Roles -->
                <div v-if="user.groups && user.groups.length > 0" class="mb-4">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</p>
                    <div class="flex flex-wrap gap-2">
                        <Chip
                            v-for="role in user.groups"
                            :key="role.id"
                            :label="role.name"
                            class="text-xs"
                        />
                    </div>
                </div>

                <!-- Contact Info -->
                <div class="space-y-2 text-sm">
                    <div v-if="user.phone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <i class="pi pi-phone text-primary-500"></i>
                        <span>{{ user.phone }}</span>
                    </div>
                    <div v-if="user.timezone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <i class="pi pi-clock text-primary-500"></i>
                        <span>{{ user.timezone }}</span>
                    </div>
                    <div v-if="showDates" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <i class="pi pi-calendar text-primary-500"></i>
                        <span>Joined {{ formatDate(user.created_at) }}</span>
                    </div>
                </div>

                <!-- Actions -->
                <div v-if="showActions" class="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <PermissionButton
                        permission="change_customuser"
                        icon="pi pi-pencil"
                        label="Edit"
                        severity="secondary"
                        size="small"
                        @click="emit('edit', user)"
                    />
                    <PermissionButton
                        permission="delete_customuser"
                        icon="pi pi-trash"
                        label="Delete"
                        severity="danger"
                        size="small"
                        outlined
                        @click="emit('delete', user)"
                    />
                    <Button
                        icon="pi pi-eye"
                        label="View"
                        severity="info"
                        size="small"
                        outlined
                        @click="emit('view', user)"
                    />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import { formatDate } from '@/utils/formatters';
const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    showActions: {
        type: Boolean,
        default: true
    },
    showDates: {
        type: Boolean,
        default: true
    },
    defaultAvatar: {
        type: String,
        default: '/images/default-avatar.png'
    }
});

const emit = defineEmits(['edit', 'delete', 'view']);

const getUserInitials = (user) => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
};
</script>

<style scoped>
.user-card {
    @apply h-full;
}

.user-card :deep(.p-card-body) {
    @apply p-0;
}

.user-card :deep(.p-card-content) {
    @apply px-6 pb-6;
}

/* Dark mode support */
:global(.dark) .user-card {
    @apply bg-gray-800;
}

:global(.dark) .user-card :deep(.p-card) {
    @apply bg-gray-800 border-gray-700;
}
</style>

