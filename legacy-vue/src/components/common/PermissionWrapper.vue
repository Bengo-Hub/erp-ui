<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { computed } from 'vue';

const props = defineProps({
    permission: {
        type: [String, Array, Object],
        required: true
    },
    mode: {
        type: String,
        default: 'any', // 'any' or 'all'
        validator: (value) => ['any', 'all'].includes(value)
    },
    showFallback: {
        type: Boolean,
        default: false
    },
    fallbackMessage: {
        type: String,
        default: 'You do not have permission to view this content'
    },
    wrapperClass: {
        type: String,
        default: ''
    },
    fallbackClass: {
        type: String,
        default: 'flex items-center justify-center p-8 bg-gray-50 rounded-lg'
    }
});

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

const hasAccess = computed(() => {
    const { permission, mode } = props;

    if (typeof permission === 'string') {
        return hasPermission(permission);
    } else if (Array.isArray(permission)) {
        return mode === 'all' ? hasAllPermissions(permission) : hasAnyPermission(permission);
    } else if (typeof permission === 'object' && permission !== null) {
        if (permission.permissions) {
            const checkMode = permission.mode || mode;
            return checkMode === 'all' ? hasAllPermissions(permission.permissions) : hasAnyPermission(permission.permissions);
        }
    }

    return false;
});
</script>

<template>
    <div v-if="hasAccess" :class="wrapperClass">
        <slot />
    </div>
    <div v-else-if="showFallback" :class="fallbackClass">
        <slot name="fallback">
            <div class="permission-denied">
                <i class="pi pi-lock text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-500 text-sm">{{ fallbackMessage }}</p>
            </div>
        </slot>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.permission-denied {
    @apply flex flex-col items-center justify-center text-center;
}
</style>
