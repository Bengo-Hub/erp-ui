<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import AppMenu from './AppMenu.vue';
import ESSAppMenu from './ESSAppMenu.vue';

const store = useStore();
const route = useRoute();
const currentUser = computed(() => store.state.auth.user || {});
const roles = computed(() => Array.isArray(currentUser.value.roles) ? currentUser.value.roles.map((r) => String(r).toLowerCase()) : []);

// Consider staff-only if role includes 'staff' and none of the elevated roles exist
const isStaffOnly = computed(() => {
    const r = roles.value;
    if (!r || r.length === 0) return false;
    const elevated = ['admin', 'superusers', 'hr', 'finance', 'procurement', 'inventory', 'cto', 'ceo', 'manager', 'system'];
    const hasElevated = elevated.some((er) => r.includes(er));
    return r.includes('staff') && !hasElevated;
});
const hasEmployeeMapping = computed(() => !!(currentUser.value.employee_id));
// Show ESS menu on ESS routes for any mapped employee, regardless of role
const isOnESSRoute = computed(() => String(route?.path || '').startsWith('/ess'));
const showESS = computed(() => hasEmployeeMapping.value && isOnESSRoute.value);
</script>

<template>
    <div class="layout-sidebar">
        <component :is="showESS ? ESSAppMenu : AppMenu" />
    </div>
</template>

<style lang="scss" scoped></style>
