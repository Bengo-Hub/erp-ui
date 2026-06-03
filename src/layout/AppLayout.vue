<script setup>
import '@/assets/styles/mobile-responsive.css';
import OfflineIndicator from '@/components/common/OfflineIndicator.vue';
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner.vue';
import { useLayout } from '@/layout/composables/layout';
import { useSubscriptionToast } from '@/composables/useSubscriptionToast';
import { rehydrateOutlet } from '@/services/auth/outletService';
import { loadTenantBranding } from '@/services/auth/tenantBrandingService';
import mobileService from '@/services/utils/mobileService';
import { computed, onMounted, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout();

// Global subscription-inactive toast (subscription-gating-guide). Opens billing.
const { openBilling } = useSubscriptionToast();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                resetMenu();
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
}

// Initialize mobile service
onMounted(() => {
    // Mobile service is already initialized in the service file
    console.log('Mobile service initialized:', mobileService.getDeviceInfo());

    // Rehydrate the selected outlet → X-Outlet-ID header (sso-integration-guide
    // → Outlet/Branch Context, "On page reload").
    rehydrateOutlet();

    // Apply tenant branding from auth-api (cached ~6h). Fire-and-forget; no-op
    // when SSO/tenant context is absent (legacy mode keeps businessBranding).
    loadTenantBranding().catch(() => {});
});
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <OfflineIndicator />
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <!-- Subscription status banner (top of authenticated layout) -->
            <SubscriptionBanner />
            <div class="layout-main">
                <!-- Global Breadcrumb -->
                <div class="breadcrumb-container">
                    <PageBreadcrumb />
                </div>
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
    <!-- Subscription-inactive toast with an Upgrade action (links to subscriptions-ui) -->
    <Toast group="subscription">
        <template #message="slotProps">
            <div class="flex flex-column gap-2 w-full">
                <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-triangle" />
                    <span class="font-semibold">{{ slotProps.message.summary }}</span>
                </div>
                <p class="m-0 text-sm">{{ slotProps.message.detail }}</p>
                <Button label="Upgrade" icon="pi pi-arrow-up-right" size="small" class="align-self-start mt-1" @click="openBilling" />
            </div>
        </template>
    </Toast>
</template>
