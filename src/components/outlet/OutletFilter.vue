<script setup>
/**
 * OutletFilter — header outlet selector / badge.
 *
 * Per shared-docs/sso-integration-guide.md (Outlet/Branch Context → Nav Bar
 * Filter Rules):
 *   - Tenant HQ/admin (is_hq_user || role admin/manager): dropdown with an
 *     "All Outlets" default.
 *   - Regular staff (outlet_id in JWT, is_hq_user=false): read-only badge of
 *     their assigned outlet (no dropdown).
 *   - Platform owners also get the dropdown; outlets follow the TenantFilter
 *     selection (via the `tenant-changed` event / props.tenantSlug).
 *
 * Selecting an outlet stores it as `erp-selected-outlet-id` and sets the
 * X-Outlet-ID header through the axios outlet setter (ssoService.setOutletId).
 */
import { fetchOutlets } from '@/services/auth/outletService';
import { getOutletId, setOutletId } from '@/services/auth/ssoService';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
    // Platform owners pass the TenantFilter-selected slug so the right outlets load.
    tenantSlug: { type: String, default: '' }
});

const store = useStore();
const user = computed(() => store.state.auth.user);

const ALL = { id: null, name: 'All Outlets', code: '' };

const outlets = ref([]);
const selected = ref(getOutletId() || null);
const loading = ref(false);

const isPlatformOwner = computed(() => user.value?.is_platform_owner === true);
const isHqUser = computed(() => {
    if (user.value?.is_hq_user === true) return true;
    const roles = Array.isArray(user.value?.roles) ? user.value.roles.map((r) => String(r).toLowerCase()) : [];
    return roles.includes('admin') || roles.includes('manager') || roles.includes('superuser');
});

// Regular staff: pinned to a single outlet → show a read-only badge.
const isPinnedStaff = computed(() => !isHqUser.value && !isPlatformOwner.value && !!getOutletId());

// Options include an "All Outlets" entry for HQ/platform users.
const options = computed(() => [ALL, ...outlets.value]);

const pinnedOutlet = computed(() => outlets.value.find((o) => o.id === selected.value) || null);

const effectiveSlug = computed(() => props.tenantSlug || user.value?.tenant_slug || localStorage.getItem('tenant_slug') || '');

async function loadList() {
    if (!effectiveSlug.value) return;
    loading.value = true;
    try {
        outlets.value = await fetchOutlets(effectiveSlug.value);
        // Keep current selection if still valid; otherwise default to "All".
        if (selected.value && !outlets.value.some((o) => o.id === selected.value)) {
            // Don't auto-clear a pinned staff outlet that just isn't in the list.
            if (!isPinnedStaff.value) selected.value = null;
        }
    } finally {
        loading.value = false;
    }
}

function onChange(val) {
    selected.value = val ?? null;
    setOutletId(val ?? null);
}

// React to selection coming from elsewhere (e.g. select-outlet page) and to
// platform-owner tenant switches.
function onOutletChanged(e) {
    selected.value = e?.detail?.outletId ?? getOutletId() ?? null;
}

onMounted(() => {
    loadList();
    window.addEventListener('outlet:changed', onOutletChanged);
});

onBeforeUnmount(() => {
    window.removeEventListener('outlet:changed', onOutletChanged);
});

// Reload when the platform owner changes tenant.
watch(effectiveSlug, () => loadList());
</script>

<template>
    <!-- Pinned staff: read-only badge -->
    <div v-if="isPinnedStaff" class="outlet-badge" :title="pinnedOutlet?.name || 'Your outlet'">
        <i class="pi pi-building" />
        <span class="outlet-badge__text">{{ pinnedOutlet?.name || pinnedOutlet?.code || 'My Outlet' }}</span>
    </div>

    <!-- HQ / admin / platform owner: dropdown -->
    <Select
        v-else-if="isHqUser || isPlatformOwner"
        :modelValue="selected"
        :options="options"
        optionLabel="name"
        optionValue="id"
        :loading="loading"
        placeholder="All Outlets"
        class="outlet-filter"
        @update:modelValue="onChange"
    >
        <template #value="slotProps">
            <span class="flex items-center gap-2">
                <i class="pi pi-building text-sm" />
                <span>{{ options.find((o) => o.id === slotProps.value)?.name || 'All Outlets' }}</span>
            </span>
        </template>
        <template #option="slotProps">
            <div class="flex items-center justify-between gap-3 w-full">
                <span>{{ slotProps.option.name }}</span>
                <Tag v-if="slotProps.option.is_hq" value="HQ" severity="info" />
            </div>
        </template>
    </Select>
</template>

<style scoped>
.outlet-filter {
    min-width: 11rem;
}
.outlet-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    border-radius: 0.5rem;
    background: var(--surface-100, #f1f5f9);
    color: var(--text-color, #1f2937);
    font-size: 0.8125rem;
    font-weight: 500;
}
.dark .outlet-badge {
    background: var(--surface-800, #1e293b);
}
.outlet-badge__text {
    white-space: nowrap;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
