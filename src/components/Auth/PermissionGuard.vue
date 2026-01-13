<script setup>
import { hasAllPermissions, hasAnyPermission, hasPermission } from '@/services/auth/permissionService';
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const props = defineProps({
    // Single permission required
    permission: {
        type: String,
        default: null
    },
    // Array of permissions - user needs any of these
    anyPermission: {
        type: Array,
        default: null
    },
    // Array of permissions - user needs all of these
    allPermissions: {
        type: Array,
        default: null
    },
    // Show fallback content when access is denied
    showFallback: {
        type: Boolean,
        default: true
    },
    // Redirect to this route when access is denied
    redirectTo: {
        type: String,
        default: null
    }
});

const router = useRouter();
const store = useStore();

const hasAccess = computed(() => {
    const user = store.state.auth.user;
    if (!user) {
        return false;
    }

    // Pass the full user object so superuser checks work correctly
    // Check single permission
    if (props.permission) {
        return hasPermission(user, props.permission);
    }

    // Check any permission
    if (props.anyPermission) {
        return hasAnyPermission(user, props.anyPermission);
    }

    // Check all permissions
    if (props.allPermissions) {
        return hasAllPermissions(user, props.allPermissions);
    }

    // No permissions specified, allow access
    return true;
});

const goBack = () => {
    if (props.redirectTo) {
        router.push(props.redirectTo);
    } else {
        router.go(-1);
    }
};

// Watch for access changes and redirect if needed
watch(
    hasAccess,
    (newValue) => {
        if (!newValue && props.redirectTo) {
            router.push(props.redirectTo);
        }
    },
    { immediate: true }
);
</script>

<template>
    <div v-if="hasAccess">
        <slot />
    </div>
    <div v-else-if="showFallback">
        <slot name="fallback">
            <div class="permission-denied">
                <i class="pi pi-lock text-6xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">Access Denied</h3>
                <p class="text-gray-600 mb-4">You don't have permission to access this resource.</p>
                <Button label="Go Back" icon="pi pi-arrow-left" @click="goBack" class="p-button-secondary" />
            </div>
        </slot>
    </div>
</template>

<style scoped>
.permission-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 300px;
}
</style>
