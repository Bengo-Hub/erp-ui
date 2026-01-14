<template>
    <div class="dual-list-selector" :class="{ 'is-mobile': isMobile }">
        <!-- Header with search and filters -->
        <div class="selector-header">
            <div class="search-filters">
                <IconField iconPosition="left" class="flex-1">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="searchQuery"
                        placeholder="Search permissions..."
                        class="w-full"
                        @input="debouncedFilter"
                    />
                </IconField>
                <Dropdown
                    v-model="selectedModule"
                    :options="moduleOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by module"
                    class="module-filter"
                    showClear
                    @change="applyFilters"
                />
                <Dropdown
                    v-model="selectedAction"
                    :options="actionOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by action"
                    class="action-filter"
                    showClear
                    @change="applyFilters"
                />
            </div>
        </div>

        <!-- Stats bar -->
        <div class="stats-bar">
            <div class="stat-item">
                <i class="pi pi-list"></i>
                <span>{{ filteredAvailable.length }} available</span>
            </div>
            <div class="stat-item selected">
                <i class="pi pi-check-circle"></i>
                <span>{{ selectedPermissions.length }} selected</span>
            </div>
        </div>

        <!-- Dual Panel Container -->
        <div class="dual-panel-container">
            <!-- Left Panel: Available Permissions -->
            <div class="panel available-panel">
                <div class="panel-header">
                    <h4>
                        <i class="pi pi-list"></i>
                        Available Permissions
                    </h4>
                    <Button
                        icon="pi pi-angle-double-right"
                        label="Add All"
                        size="small"
                        severity="secondary"
                        text
                        @click="addAllVisible"
                        :disabled="filteredAvailable.length === 0"
                    />
                </div>
                <div class="panel-content" ref="availableListRef">
                    <div v-if="loading" class="loading-state">
                        <i class="pi pi-spin pi-spinner"></i>
                        <span>Loading permissions...</span>
                    </div>
                    <div v-else-if="filteredAvailable.length === 0" class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <span>No available permissions</span>
                    </div>
                    <TransitionGroup v-else name="list" tag="div" class="permission-list">
                        <div
                            v-for="permission in filteredAvailable"
                            :key="permission.id"
                            class="permission-item"
                            :class="{ 'is-highlighted': highlightedIds.has(permission.id) }"
                            @click="addPermission(permission)"
                            @dblclick="addPermission(permission)"
                        >
                            <div class="permission-info">
                                <i :class="getActionIcon(permission.codename)" class="action-icon"></i>
                                <div class="permission-details">
                                    <span class="permission-name">{{ permission.name }}</span>
                                    <span class="permission-code">{{ permission.codename }}</span>
                                </div>
                            </div>
                            <div class="permission-meta">
                                <Tag
                                    :value="getModule(permission)"
                                    :severity="getModuleSeverity(permission)"
                                    class="module-tag"
                                />
                                <Button
                                    icon="pi pi-plus"
                                    size="small"
                                    rounded
                                    text
                                    severity="success"
                                    @click.stop="addPermission(permission)"
                                    v-tooltip.top="'Add permission'"
                                />
                            </div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>

            <!-- Center Controls (Desktop) -->
            <div class="center-controls" v-if="!isMobile">
                <Button
                    icon="pi pi-angle-right"
                    rounded
                    severity="success"
                    @click="addAllVisible"
                    :disabled="filteredAvailable.length === 0"
                    v-tooltip.top="'Add all visible'"
                />
                <Button
                    icon="pi pi-angle-left"
                    rounded
                    severity="danger"
                    @click="removeAllSelected"
                    :disabled="selectedPermissions.length === 0"
                    v-tooltip.top="'Remove all'"
                />
            </div>

            <!-- Right Panel: Selected Permissions -->
            <div class="panel selected-panel">
                <div class="panel-header">
                    <h4>
                        <i class="pi pi-check-circle"></i>
                        Assigned Permissions
                        <Badge :value="selectedPermissions.length" severity="success" />
                    </h4>
                    <Button
                        icon="pi pi-angle-double-left"
                        label="Remove All"
                        size="small"
                        severity="danger"
                        text
                        @click="removeAllSelected"
                        :disabled="selectedPermissions.length === 0"
                    />
                </div>

                <!-- Selected permissions search -->
                <div class="selected-search">
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText
                            v-model="selectedSearchQuery"
                            placeholder="Search selected..."
                            class="w-full"
                        />
                    </IconField>
                </div>

                <div class="panel-content">
                    <div v-if="filteredSelected.length === 0" class="empty-state">
                        <i class="pi pi-shield"></i>
                        <span>No permissions assigned</span>
                        <p class="hint">Click or double-click items on the left to add them</p>
                    </div>
                    <TransitionGroup v-else name="list" tag="div" class="permission-list">
                        <div
                            v-for="permission in filteredSelected"
                            :key="permission.id"
                            class="permission-item selected"
                            @click="removePermission(permission)"
                            @dblclick="removePermission(permission)"
                        >
                            <div class="permission-info">
                                <i :class="getActionIcon(permission.codename)" class="action-icon"></i>
                                <div class="permission-details">
                                    <span class="permission-name">{{ permission.name }}</span>
                                    <span class="permission-code">{{ permission.codename }}</span>
                                </div>
                            </div>
                            <div class="permission-meta">
                                <Tag
                                    :value="getModule(permission)"
                                    :severity="getModuleSeverity(permission)"
                                    class="module-tag"
                                />
                                <Button
                                    icon="pi pi-minus"
                                    size="small"
                                    rounded
                                    text
                                    severity="danger"
                                    @click.stop="removePermission(permission)"
                                    v-tooltip.top="'Remove permission'"
                                />
                            </div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>
        </div>

        <!-- Mobile Controls -->
        <div class="mobile-controls" v-if="isMobile">
            <Button
                icon="pi pi-arrow-up"
                label="Add Selected"
                severity="success"
                @click="addAllVisible"
                :disabled="filteredAvailable.length === 0"
            />
            <Button
                icon="pi pi-arrow-down"
                label="Remove All"
                severity="danger"
                outlined
                @click="removeAllSelected"
                :disabled="selectedPermissions.length === 0"
            />
        </div>

        <!-- Quick Selection by Module -->
        <div class="quick-actions">
            <span class="quick-label">Quick select by module:</span>
            <div class="quick-buttons">
                <Button
                    v-for="mod in topModules"
                    :key="mod"
                    :label="formatModuleName(mod)"
                    size="small"
                    severity="secondary"
                    outlined
                    @click="selectByModule(mod)"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    permissions: {
        type: Array,
        default: () => []
    },
    modelValue: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

// Responsive state
const isMobile = ref(false);

const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
});

// Search and filter state
const searchQuery = ref('');
const selectedSearchQuery = ref('');
const selectedModule = ref(null);
const selectedAction = ref(null);
const highlightedIds = ref(new Set());
let filterDebounce = null;

// Selected permissions as full objects
const selectedPermissions = computed({
    get() {
        return props.permissions.filter(p => props.modelValue.includes(p.id));
    },
    set(newValue) {
        emit('update:modelValue', newValue.map(p => p.id));
    }
});

// Available permissions (not selected)
const availablePermissions = computed(() => {
    return props.permissions.filter(p => !props.modelValue.includes(p.id));
});

// Filtered available permissions
const filteredAvailable = computed(() => {
    let result = availablePermissions.value;

    // Apply search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(p =>
            p.name?.toLowerCase().includes(query) ||
            p.codename?.toLowerCase().includes(query)
        );
    }

    // Apply module filter
    if (selectedModule.value) {
        result = result.filter(p => getModule(p) === selectedModule.value);
    }

    // Apply action filter
    if (selectedAction.value) {
        result = result.filter(p => p.codename?.startsWith(selectedAction.value));
    }

    return result;
});

// Filtered selected permissions
const filteredSelected = computed(() => {
    if (!selectedSearchQuery.value) return selectedPermissions.value;

    const query = selectedSearchQuery.value.toLowerCase();
    return selectedPermissions.value.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.codename?.toLowerCase().includes(query)
    );
});

// Module options derived from permissions
const moduleOptions = computed(() => {
    const modules = new Set();
    props.permissions.forEach(p => {
        const mod = getModule(p);
        if (mod) modules.add(mod);
    });
    return Array.from(modules).sort().map(m => ({
        label: formatModuleName(m),
        value: m
    }));
});

// Top modules for quick selection
const topModules = computed(() => {
    const moduleCounts = {};
    props.permissions.forEach(p => {
        const mod = getModule(p);
        if (mod) {
            moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
        }
    });
    return Object.entries(moduleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([mod]) => mod);
});

// Action options
const actionOptions = [
    { label: 'View', value: 'view_' },
    { label: 'Add', value: 'add_' },
    { label: 'Change', value: 'change_' },
    { label: 'Delete', value: 'delete_' }
];

// Helper functions
const getModule = (permission) => {
    return permission.content_type?.app_label ||
           permission.codename?.split('_').slice(1).join('_') ||
           'other';
};

const formatModuleName = (module) => {
    return module
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

const getActionIcon = (codename) => {
    if (codename?.startsWith('view_')) return 'pi pi-eye text-blue-500';
    if (codename?.startsWith('add_')) return 'pi pi-plus text-green-500';
    if (codename?.startsWith('change_')) return 'pi pi-pencil text-orange-500';
    if (codename?.startsWith('delete_')) return 'pi pi-trash text-red-500';
    return 'pi pi-check text-gray-500';
};

const getModuleSeverity = (permission) => {
    const mod = getModule(permission);
    const severities = {
        'authmanagement': 'danger',
        'hrm': 'info',
        'finance': 'success',
        'inventory': 'warning',
        'procurement': 'secondary'
    };
    return severities[mod] || 'secondary';
};

// Actions
const addPermission = (permission) => {
    if (!props.modelValue.includes(permission.id)) {
        emit('update:modelValue', [...props.modelValue, permission.id]);
        highlightPermission(permission.id);
    }
};

const removePermission = (permission) => {
    emit('update:modelValue', props.modelValue.filter(id => id !== permission.id));
};

const addAllVisible = () => {
    const newIds = filteredAvailable.value.map(p => p.id);
    const combined = [...new Set([...props.modelValue, ...newIds])];
    emit('update:modelValue', combined);
    newIds.forEach(id => highlightPermission(id));
};

const removeAllSelected = () => {
    emit('update:modelValue', []);
};

const selectByModule = (module) => {
    const modulePermissions = props.permissions.filter(p => getModule(p) === module);
    const newIds = modulePermissions.map(p => p.id);
    const combined = [...new Set([...props.modelValue, ...newIds])];
    emit('update:modelValue', combined);
    newIds.forEach(id => highlightPermission(id));
};

const highlightPermission = (id) => {
    highlightedIds.value.add(id);
    setTimeout(() => {
        highlightedIds.value.delete(id);
    }, 1000);
};

const debouncedFilter = () => {
    clearTimeout(filterDebounce);
    filterDebounce = setTimeout(() => {
        // Filters are reactive, no action needed
    }, 200);
};

const applyFilters = () => {
    // Filters are reactive via computed properties
};
</script>

<style scoped>
.dual-list-selector {
    @apply flex flex-col gap-4;
}

.selector-header {
    @apply bg-surface-50 dark:bg-surface-800 p-4 rounded-lg;
}

.search-filters {
    @apply flex flex-wrap gap-3 items-center;
}

.module-filter,
.action-filter {
    @apply w-40;
}

.stats-bar {
    @apply flex gap-4 text-sm;
}

.stat-item {
    @apply flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300;
}

.stat-item.selected {
    @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300;
}

.dual-panel-container {
    @apply flex gap-4 min-h-[400px];
}

.panel {
    @apply flex-1 flex flex-col border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden bg-surface-0 dark:bg-surface-900;
}

.panel-header {
    @apply flex items-center justify-between px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700;
}

.panel-header h4 {
    @apply flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200 m-0;
}

.selected-search {
    @apply p-2 border-b border-surface-200 dark:border-surface-700;
}

.panel-content {
    @apply flex-1 overflow-y-auto p-2;
}

.loading-state,
.empty-state {
    @apply flex flex-col items-center justify-center h-full gap-2 text-surface-400 dark:text-surface-500;
}

.empty-state i {
    @apply text-4xl;
}

.empty-state .hint {
    @apply text-xs text-surface-400 mt-2;
}

.permission-list {
    @apply flex flex-col gap-1;
}

.permission-item {
    @apply flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200;
    @apply bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700;
    @apply border border-transparent hover:border-primary-300 dark:hover:border-primary-700;
}

.permission-item.selected {
    @apply bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800;
}

.permission-item.is-highlighted {
    @apply bg-green-100 dark:bg-green-800 border-green-400 dark:border-green-600;
    animation: highlight-pulse 0.5s ease-out;
}

@keyframes highlight-pulse {
    0% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.permission-info {
    @apply flex items-center gap-3 flex-1 min-w-0;
}

.action-icon {
    @apply text-lg;
}

.permission-details {
    @apply flex flex-col min-w-0;
}

.permission-name {
    @apply text-sm font-medium text-surface-800 dark:text-surface-100 truncate;
}

.permission-code {
    @apply text-xs text-surface-500 dark:text-surface-400 truncate;
}

.permission-meta {
    @apply flex items-center gap-2;
}

.module-tag {
    @apply text-xs;
}

.center-controls {
    @apply flex flex-col justify-center gap-2;
}

.mobile-controls {
    @apply flex gap-2 justify-center;
}

.quick-actions {
    @apply flex flex-wrap items-center gap-2 pt-4 border-t border-surface-200 dark:border-surface-700;
}

.quick-label {
    @apply text-sm text-surface-500 dark:text-surface-400;
}

.quick-buttons {
    @apply flex flex-wrap gap-2;
}

/* Responsive */
@media (max-width: 768px) {
    .dual-panel-container {
        @apply flex-col;
    }

    .panel {
        @apply min-h-[200px];
    }

    .search-filters {
        @apply flex-col;
    }

    .module-filter,
    .action-filter {
        @apply w-full;
    }
}

/* List animations */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>
