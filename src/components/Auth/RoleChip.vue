<template>
    <Chip
        :label="role.name"
        :icon="roleIcon"
        :class="chipClass"
        :removable="removable"
        @remove="emit('remove', role)"
    >
        <template v-if="showPermissionCount" #default>
            <div class="flex items-center gap-2">
                <span>{{ role.name }}</span>
                <Badge
                    v-if="role.permissions && role.permissions.length > 0"
                    :value="role.permissions.length"
                    severity="secondary"
                    class="text-xs"
                />
            </div>
        </template>
    </Chip>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    role: {
        type: Object,
        required: true
    },
    removable: {
        type: Boolean,
        default: false
    },
    showPermissionCount: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'success', 'info', 'warning', 'danger'].includes(value)
    }
});

const emit = defineEmits(['remove']);

const roleIcon = computed(() => {
    // Map common role names to icons
    const iconMap = {
        admin: 'pi pi-shield',
        manager: 'pi pi-briefcase',
        employee: 'pi pi-user',
        hr: 'pi pi-users',
        finance: 'pi pi-dollar',
        sales: 'pi pi-chart-line',
        default: 'pi pi-tag'
    };

    const roleName = props.role.name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(iconMap)) {
        if (roleName.includes(key)) return icon;
    }
    return iconMap.default;
});

const chipClass = computed(() => {
    const severityClasses = {
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
        secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
        warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
    };
    
    return severityClasses[props.severity] || severityClasses.primary;
});
</script>

<style scoped>
:deep(.p-chip) {
    @apply transition-all duration-200;
}

:deep(.p-chip):hover {
    @apply shadow-md;
}
</style>

