<script setup>
/**
 * TenantFilter — platform-owner-only tenant selector (header).
 *
 * Per shared-docs/sso-integration-guide.md (Nav Bar Filter Rules) and
 * TRINITY-AUTHORIZATION-PATTERN.md (Backend Tenant Override): only platform
 * owners see this. The selected tenant is appended to tenant-scoped API calls as
 * `?tenantId=<uuid>` (handled in axiosConfig). "All Tenants" → no param.
 *
 * Emits `tenant:changed` (via tenantService.setSelectedTenant) so OutletFilter
 * can reload that tenant's outlets.
 */
import { fetchTenants, getSelectedTenantId, setSelectedTenant } from '@/services/auth/tenantService';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const user = computed(() => store.state.auth.user);
const isPlatformOwner = computed(() => user.value?.is_platform_owner === true);

const ALL = { id: null, name: 'All Tenants', slug: null };

const tenants = ref([]);
const selected = ref(getSelectedTenantId() || null);
const loading = ref(false);

const options = computed(() => [ALL, ...tenants.value]);

async function loadList() {
    if (!isPlatformOwner.value) return;
    loading.value = true;
    try {
        tenants.value = await fetchTenants();
    } finally {
        loading.value = false;
    }
}

function onChange(val) {
    selected.value = val ?? null;
    const tenant = tenants.value.find((t) => t.id === val) || null;
    setSelectedTenant(tenant);
}

onMounted(() => {
    if (isPlatformOwner.value) loadList();
});
</script>

<template>
    <Select
        v-if="isPlatformOwner"
        :modelValue="selected"
        :options="options"
        optionLabel="name"
        optionValue="id"
        :loading="loading"
        placeholder="All Tenants"
        class="tenant-filter"
        @update:modelValue="onChange"
    >
        <template #value="slotProps">
            <span class="flex items-center gap-2">
                <i class="pi pi-globe text-sm" />
                <span>{{ options.find((o) => o.id === slotProps.value)?.name || 'All Tenants' }}</span>
            </span>
        </template>
    </Select>
</template>

<style scoped>
.tenant-filter {
    min-width: 11rem;
}
</style>
