<script setup>
import { useLayout } from '@/layout/composables/layout';
import { orgPath, resolveOrgSlug } from '@/utils/tenantContext';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const { layoutState, setActiveMenuItem, onMenuToggle } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

// Tenant-scope the menu target so links point directly at /{orgSlug}/… instead
// of the unprefixed path (which would otherwise force a guard redirect hop).
// String paths are prefixed via orgPath; named/location objects get the orgSlug
// merged into params; absolute external urls are left untouched.
const resolvedTo = computed(() => {
    const to = props.item.to;
    if (!to) return to;
    if (typeof to === 'string') {
        return to.startsWith('/') ? orgPath(resolveOrgSlug(route.params?.orgSlug), to) : to;
    }
    if (typeof to === 'object') {
        // Named routes resolve against the org-scoped route table (names are
        // prefixed with `org-`); ensure the orgSlug param is present.
        const slug = resolveOrgSlug(route.params?.orgSlug);
        const params = { ...(to.params || {}) };
        if (!params.orgSlug) params.orgSlug = slug;
        const next = { ...to, params };
        if (to.name && !String(to.name).startsWith('org-')) next.name = `org-${to.name}`;
        return next;
    }
    return to;
});

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
});

watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);

function itemClick(event, item) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        onMenuToggle();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
}

function checkActiveRoute(item) {
    if (typeof item.to !== 'string') return false;
    // Compare against both the scoped and unscoped forms so the active state is
    // correct regardless of how the route was reached.
    const scoped = item.to.startsWith('/') ? orgPath(resolveOrgSlug(route.params?.orgSlug), item.to) : item.to;
    return route.path === item.to || route.path === scoped;
}
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">
            {{ item.label }}
        </div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="resolvedTo">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss" scoped></style>
