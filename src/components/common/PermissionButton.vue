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
        default: 'any',
        validator: (value) => ['any', 'all'].includes(value)
    },
    disabled: {
        type: Boolean,
        default: false
    },
    buttonClass: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['click']);

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

const handleClick = (event) => {
    if (hasAccess.value && !props.disabled) {
        emit('click', event);
    }
};
</script>

<template>
    <Button v-if="hasAccess" v-bind="$attrs" :disabled="disabled" :class="buttonClass" @click="handleClick">
        <slot />
    </Button>
</template>

<style scoped>
.permission-disabled {
    @apply opacity-50 cursor-not-allowed;
}
</style>
