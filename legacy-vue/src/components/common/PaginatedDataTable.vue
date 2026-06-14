<template>
    <div class="paginated-datatable">
        <DataTable
            :value="data"
            :lazy="true"
            :paginator="true"
            :rows="pageSize"
            :totalRecords="totalRecords"
            :rowsPerPageOptions="rowsPerPageOptions"
            :loading="loading"
            :sortField="sortField"
            :sortOrder="sortOrder"
            v-model:selection="selection"
            :selectionMode="selectionMode"
            :dataKey="dataKey"
            :filters="filters"
            :filterDisplay="filterDisplay"
            :globalFilterFields="globalFilterFields"
            :responsiveLayout="responsiveLayout"
            :showGridlines="showGridlines"
            :stripedRows="stripedRows"
            @page="onPageChange"
            @sort="onSort"
            @filter="onFilter"
            @row-select="$emit('row-select', $event)"
            @row-unselect="$emit('row-unselect', $event)"
            @row-select-all="$emit('row-select-all', $event)"
            @row-unselect-all="$emit('row-unselect-all', $event)"
            class="p-datatable-sm"
        >
            <!-- Header Slot -->
            <template #header>
                <slot name="header">
                    <div class="flex justify-content-between align-items-center">
                        <h5 class="m-0">{{ title }}</h5>
                        <div class="flex gap-2">
                            <IconField iconPosition="left" v-if="showSearch">
                                <InputIcon class="pi pi-search" />
                                <InputText 
                                    v-model="searchQuery" 
                                    placeholder="Search..." 
                                    @input="onSearch"
                                    class="w-full md:w-20rem"
                                />
                            </IconField>
                            <slot name="header-actions"></slot>
                        </div>
                    </div>
                </slot>
            </template>

            <!-- Empty Slot -->
            <template #empty>
                <div class="text-center p-4">
                    <i class="pi pi-inbox text-4xl text-gray-400"></i>
                    <p class="text-gray-600 mt-2">{{ emptyMessage }}</p>
                </div>
            </template>

            <!-- Loading Slot -->
            <template #loading>
                <div class="flex align-items-center justify-content-center p-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                    <span class="ml-2">{{ loadingMessage }}</span>
                </div>
            </template>

            <!-- Pass through all column slots -->
            <slot></slot>

            <!-- Footer Slot -->
            <template #footer v-if="$slots.footer">
                <slot name="footer"></slot>
            </template>
        </DataTable>

        <!-- Pagination Info -->
        <div v-if="showPaginationInfo" class="mt-2 text-sm text-gray-600">
            Showing {{ paginationInfo.startRecord }} to {{ paginationInfo.endRecord }} of {{ totalRecords }} entries
        </div>
    </div>
</template>

<script setup>
import { useDebounce } from '@/composables/useDebounce';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    // Data props
    data: {
        type: Array,
        default: () => []
    },
    totalRecords: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    },

    // Pagination props
    pageSize: {
        type: Number,
        default: 100
    },
    rowsPerPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100, 250, 500]
    },

    // Table configuration
    dataKey: {
        type: String,
        default: 'id'
    },
    selectionMode: {
        type: String,
        default: null
    },
    selection: {
        type: [Object, Array],
        default: null
    },
    filters: {
        type: Object,
        default: () => ({})
    },
    filterDisplay: {
        type: String,
        default: 'menu'
    },
    globalFilterFields: {
        type: Array,
        default: () => []
    },
    responsiveLayout: {
        type: String,
        default: 'scroll'
    },
    showGridlines: {
        type: Boolean,
        default: false
    },
    stripedRows: {
        type: Boolean,
        default: true
    },

    // UI props
    title: {
        type: String,
        default: ''
    },
    showSearch: {
        type: Boolean,
        default: true
    },
    showPaginationInfo: {
        type: Boolean,
        default: true
    },
    emptyMessage: {
        type: String,
        default: 'No records found'
    },
    loadingMessage: {
        type: String,
        default: 'Loading data...'
    },

    // Sort props
    sortField: {
        type: String,
        default: null
    },
    sortOrder: {
        type: Number,
        default: null
    }
});

const emit = defineEmits([
    'page',
    'sort',
    'filter',
    'search',
    'row-select',
    'row-unselect',
    'row-select-all',
    'row-unselect-all',
    'update:selection'
]);

// Search
const searchQuery = ref('');
const { debounced: debouncedSearch } = useDebounce(searchQuery, 500);

// Pagination info
const paginationInfo = computed(() => {
    const start = (Math.floor((props.totalRecords > 0 ? 1 : 0) / props.pageSize) * props.pageSize) + 1;
    const end = Math.min(start + props.pageSize - 1, props.totalRecords);
    return {
        startRecord: props.totalRecords > 0 ? start : 0,
        endRecord: end
    };
});

// Event handlers
const onPageChange = (event) => {
    emit('page', event);
};

const onSort = (event) => {
    emit('sort', event);
};

const onFilter = (event) => {
    emit('filter', event);
};

const onSearch = () => {
    // Debounced search will trigger watcher
};

// Watch for search changes
watch(debouncedSearch, (newVal) => {
    emit('search', newVal);
});
</script>

<style scoped>
.paginated-datatable {
    width: 100%;
}

/* Dark mode support */
:deep(.p-datatable) {
    background: var(--surface-card);
    color: var(--text-color);
}

:deep(.p-datatable .p-datatable-header) {
    background: var(--surface-section);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-section);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    background: var(--surface-card);
    color: var(--text-color);
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
    background: var(--surface-ground);
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: var(--surface-hover);
}

:deep(.p-paginator) {
    background: var(--surface-section);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}
</style>

