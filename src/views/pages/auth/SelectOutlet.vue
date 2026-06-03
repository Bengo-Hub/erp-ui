<script setup>
/**
 * Service-level outlet selector.
 *
 * Route: /:orgSlug/auth/select-outlet  (see authRoutes.js)
 *
 * Implements the select-outlet page from
 * shared-docs/sso-integration-guide.md (Outlet/Branch Context → Outlet Selector
 * Flow): fetch outlets from auth-api (public), auto-select when there is a single
 * outlet, move the last-used outlet to the top, store the chosen outlet as
 * `erp-selected-outlet-id`, set the X-Outlet-ID header via the axios outlet
 * setter, then continue to the intended destination.
 */
import { fetchOutlets } from '@/services/auth/outletService';
import { setOutletId, getOutletId } from '@/services/auth/ssoService';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const outlets = ref([]);
const selectedId = ref(getOutletId() || null);

const orgSlug = computed(() => route.params.orgSlug || localStorage.getItem('tenant_slug') || '');

function continueAfterSelect() {
    const dest = sessionStorage.getItem('post_outlet_redirect') || '/';
    sessionStorage.removeItem('post_outlet_redirect');
    router.replace(dest);
}

function choose(outlet) {
    if (!outlet?.id) return;
    selectedId.value = outlet.id;
    setOutletId(outlet.id);
    continueAfterSelect();
}

onMounted(async () => {
    loading.value = true;
    error.value = '';
    try {
        const list = await fetchOutlets(orgSlug.value);

        // Move the last-used outlet to the top of the list (TruLoad pattern).
        const lastUsed = getOutletId();
        if (lastUsed) {
            list.sort((a, b) => (a.id === lastUsed ? -1 : b.id === lastUsed ? 1 : 0));
        }
        outlets.value = list;

        // Auto-select when there is exactly one outlet — no UI shown.
        if (list.length === 1) {
            choose(list[0]);
            return;
        }
        // Nothing to choose from: continue (backend returns all tenant data).
        if (list.length === 0) {
            continueAfterSelect();
            return;
        }
    } catch (e) {
        error.value = e?.message || 'Could not load outlets.';
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen p-4">
        <Card class="w-full" style="max-width: 32rem">
            <template #title>
                <div class="flex items-center gap-2">
                    <i class="pi pi-building text-primary" />
                    <span>Select an outlet</span>
                </div>
            </template>
            <template #subtitle>
                <span class="text-color-secondary">Choose the outlet you want to work in. You can switch later from the header.</span>
            </template>
            <template #content>
                <div v-if="loading" class="text-center py-6">
                    <i class="pi pi-spin pi-spinner text-3xl text-primary" />
                    <p class="mt-3 text-color-secondary">Loading outlets…</p>
                </div>

                <Message v-else-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>

                <div v-else class="flex flex-column gap-2">
                    <button
                        v-for="outlet in outlets"
                        :key="outlet.id"
                        type="button"
                        class="outlet-option"
                        :class="{ 'outlet-option--active': outlet.id === selectedId }"
                        @click="choose(outlet)"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex flex-column text-left">
                                <span class="font-semibold">{{ outlet.name || outlet.code }}</span>
                                <span class="text-xs text-color-secondary">
                                    {{ outlet.code }}<span v-if="outlet.use_case"> · {{ outlet.use_case }}</span>
                                </span>
                            </div>
                            <Tag v-if="outlet.is_hq" value="HQ" severity="info" />
                        </div>
                    </button>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.outlet-option {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid var(--surface-border, #e5e7eb);
    border-radius: 0.5rem;
    background: var(--surface-0);
    cursor: pointer;
    transition: all 0.15s ease;
}
.outlet-option:hover {
    border-color: var(--primary-color, #3b82f6);
    background: var(--surface-50);
}
.outlet-option--active {
    border-color: var(--primary-color, #3b82f6);
    box-shadow: 0 0 0 1px var(--primary-color, #3b82f6);
}
</style>
