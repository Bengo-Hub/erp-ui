<script setup>
import AppraisalForm from '@/components/hrm/appraisals/AppraisalForm.vue';
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { formatDate, formatDateForAPI } from '@/utils/formatters';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();
const confirm = useConfirm();

// Appraisal data composable
const { cycles, employees, statusOptions, getStatusDisplay, loadBasics } = useAppraisalData();

// HRM filters composable
const { loadFilters, getFilterParams } = useHrmFilters();

const loading = ref(false);
const appraisals = ref([]);
const showNewAppraisalModal = ref(false);

const pagination = ref({ first: 0, rows: 10, total: 0 });

// Local filters specific to appraisals
const filters = ref({
    cycle: null,
    status: null,
    employee: null,
    evaluator: null,
    template: null,
    startDate: null,
    endDate: null,
    search: ''
});

// Computed properties for statistics
const totalAppraisals = computed(() => appraisals.value.length);
const draftCount = computed(() => appraisals.value.filter((a) => a.status === 'draft').length);
const inProgressCount = computed(() => appraisals.value.filter((a) => a.status === 'in_progress').length);
const completedCount = computed(() => appraisals.value.filter((a) => a.status === 'completed').length);
const approvedCount = computed(() => appraisals.value.filter((a) => a.status === 'approved').length);

// Filtered appraisals based on search
const filteredAppraisals = computed(() => {
    if (!filters.value.search) return appraisals.value;

    const searchTerm = filters.value.search.toLowerCase();
    return appraisals.value.filter(
        (appraisal) =>
            appraisal.employee?.name?.toLowerCase().includes(searchTerm) ||
            appraisal.cycle?.name?.toLowerCase().includes(searchTerm) ||
            appraisal.template?.name?.toLowerCase().includes(searchTerm) ||
            getStatusDisplay(appraisal.status).toLowerCase().includes(searchTerm)
    );
});

const fetchAppraisals = async () => {
    try {
        loading.value = true;
        const params = buildQueryParams();
        const response = await appraisalService.getAppraisals(params);
        appraisals.value = response.data.results || response.data;
        pagination.value.total = response.data.count || appraisals.value.length;
    } catch (error) {
        console.error('Error fetching appraisals:', error);
        showToast('error', 'Error', 'Failed to fetch appraisals');
    } finally {
        loading.value = false;
    }
};

const onPage = async (e) => {
    pagination.value.first = e.first;
    pagination.value.rows = e.rows;
    await fetchAppraisals();
};

const buildQueryParams = () => {
    const params = {
        limit: pagination.value.rows,
        offset: pagination.value.first
    };

    // Add local filters
    if (filters.value.cycle) params.cycle = filters.value.cycle.id;
    if (filters.value.status) params.status = filters.value.status.value;
    if (filters.value.employee) params.employee = filters.value.employee.id;
    if (filters.value.evaluator) params.evaluator = filters.value.evaluator.id;
    if (filters.value.template) params.template = filters.value.template.id;
    if (filters.value.startDate) params.start_date = formatDateForAPI(filters.value.startDate);
    if (filters.value.endDate) params.end_date = formatDateForAPI(filters.value.endDate);
    if (filters.value.search) params.search = filters.value.search;

    // Add HRM filters
    const hrmParams = getFilterParams();
    Object.assign(params, hrmParams);

    return params;
};

const applyFilters = async () => {
    pagination.value.first = 0;
    await fetchAppraisals();
};

const resetFilters = async () => {
    filters.value = {
        cycle: null,
        status: null,
        employee: null,
        evaluator: null,
        template: null,
        startDate: null,
        endDate: null,
        search: ''
    };
    pagination.value.first = 0;
    await fetchAppraisals();
};

const exportData = async () => {
    try {
        const params = buildQueryParams();
        const response = await appraisalService.exportAppraisals(params);

        // Create download link
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appraisals_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        showToast('success', 'Success', 'Appraisal data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('error', 'Error', 'Failed to export data');
    }
};

const openNewAppraisalModal = () => {
    showNewAppraisalModal.value = true;
};

const viewAppraisal = (appraisal) => {
    router.push(`/hrm/appraisals/${appraisal.id}`);
};

const editAppraisal = (appraisal) => {
    router.push(`/hrm/appraisals/${appraisal.id}/edit`);
};

const canEdit = (appraisal) => ['draft', 'in_progress'].includes(appraisal.status);
const canDelete = (appraisal) => ['draft'].includes(appraisal.status);

const confirmDelete = (appraisal) => {
    confirm.require({
        message: 'Are you sure you want to delete this appraisal?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteAppraisal(appraisal.id);
                showToast('success', 'Success', 'Appraisal deleted successfully');
                await fetchAppraisals();
            } catch (error) {
                console.error('Error deleting appraisal:', error);
                showToast('error', 'Error', error.response?.data?.detail || 'Operation failed');
            } finally {
                loading.value = false;
            }
        }
    });
};

const handleAppraisalSaved = async () => {
    showNewAppraisalModal.value = false;
    await fetchAppraisals();
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'secondary',
        in_progress: 'info',
        completed: 'success',
        approved: 'success',
        rejected: 'danger'
    };
    return severityMap[status] || 'info';
};

const getStatusIcon = (status) => {
    const iconMap = {
        draft: 'pi pi-file',
        in_progress: 'pi pi-clock',
        completed: 'pi pi-check',
        approved: 'pi pi-check-circle',
        rejected: 'pi pi-times-circle'
    };
    return iconMap[status] || 'pi pi-info-circle';
};

// Watch for filter changes
watch(
    filters,
    () => {
        applyFilters();
    },
    { deep: true }
);

onMounted(async () => {
    await Promise.all([loadBasics(), loadFilters(), fetchAppraisals()]);
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4">
                    <div class="flex items-center space-x-3 mb-4 sm:mb-0">
                        <Button icon="pi pi-home" class="p-button-text" @click="$router.push('/')" />
                        <h1 class="text-2xl font-bold text-gray-900">Appraisals</h1>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button label="New Appraisal" icon="pi pi-plus" @click="openNewAppraisalModal" severity="primary" class="w-full sm:w-auto" />
                        <Button label="Templates" icon="pi pi-file" @click="$router.push('/hrm/appraisals/templates')" severity="secondary" class="w-full sm:w-auto" />
                        <Button label="Cycles" icon="pi pi-calendar" @click="$router.push('/hrm/appraisals/cycles')" severity="secondary" class="w-full sm:w-auto" />
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card class="text-center">
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ totalAppraisals }}</div>
                        <div class="text-sm text-gray-600 mt-1">Total</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-3xl font-bold text-gray-500">{{ draftCount }}</div>
                        <div class="text-sm text-gray-600 mt-1">Draft</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-3xl font-bold text-blue-500">{{ inProgressCount }}</div>
                        <div class="text-sm text-gray-600 mt-1">In Progress</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-3xl font-bold text-green-500">{{ completedCount }}</div>
                        <div class="text-sm text-gray-600 mt-1">Completed</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-3xl font-bold text-green-600">{{ approvedCount }}</div>
                        <div class="text-sm text-gray-600 mt-1">Approved</div>
                    </template>
                </Card>
            </div>

            <!-- Filters and Search -->
            <Card class="mb-6">
                <template #content>
                    <div class="space-y-4">
                        <!-- Search -->
                        <div class="flex flex-col sm:flex-row gap-4">
                            <div class="flex-1">
                                <span class="p-input-icon-left w-full">
                                    <i class="pi pi-search" />
                                    <InputText v-model="filters.search" placeholder="Search appraisals..." class="w-full" />
                                </span>
                            </div>
                            <div class="flex gap-2">
                                <Button icon="pi pi-refresh" @click="resetFilters" severity="secondary" text v-tooltip.top="'Reset Filters'" />
                                <Button icon="pi pi-download" @click="exportData" severity="secondary" text v-tooltip.top="'Export Data'" />
                            </div>
                        </div>

                        <!-- Filter Row 1 -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Dropdown v-model="filters.cycle" :options="cycles" optionLabel="name" placeholder="Select Cycle" class="w-full" showClear />
                            <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" placeholder="Select Status" class="w-full" showClear />
                            <Dropdown v-model="filters.employee" :options="employees" optionLabel="name" placeholder="Select Employee" class="w-full" showClear />
                            <Dropdown v-model="filters.evaluator" :options="employees" optionLabel="name" placeholder="Select Evaluator" class="w-full" showClear />
                        </div>

                        <!-- Filter Row 2 -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Calendar v-model="filters.startDate" placeholder="Start Date" dateFormat="yy-mm-dd" class="w-full" showClear />
                            <Calendar v-model="filters.endDate" placeholder="End Date" dateFormat="yy-mm-dd" class="w-full" showClear />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Data Table -->
            <Card>
                <template #content>
                    <DataTable
                        :value="filteredAppraisals"
                        :loading="loading"
                        :paginator="true"
                        :rows="pagination.rows"
                        :first="pagination.first"
                        :totalRecords="pagination.total"
                        :rowsPerPageOptions="[10, 20, 50]"
                        class="p-datatable-sm"
                        responsiveLayout="scroll"
                        @page="onPage"
                        stripedRows
                        showGridlines
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    >
                        <Column field="employee.name" header="Employee" sortable>
                            <template #body="{ data }">
                                <div class="flex items-center space-x-3">
                                    <Avatar :image="data.employee?.avatar" :label="data.employee?.name?.charAt(0)" shape="circle" size="normal" />
                                    <div>
                                        <div class="font-medium">{{ data.employee?.name }}</div>
                                        <div class="text-sm text-gray-500">
                                            {{ data.employee?.department?.name }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="cycle.name" header="Cycle" sortable>
                            <template #body="{ data }">
                                <div>
                                    <div class="font-medium">{{ data.cycle?.name }}</div>
                                    <div class="text-sm text-gray-500">
                                        {{ formatDate(data.cycle?.start_date) }} -
                                        {{ formatDate(data.cycle?.end_date) }}
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="evaluator.name" header="Evaluator" sortable>
                            <template #body="{ data }">
                                <div class="flex items-center space-x-2">
                                    <Avatar :image="data.evaluator?.avatar" :label="data.evaluator?.name?.charAt(0)" shape="circle" size="small" />
                                    <span>{{ data.evaluator?.name }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="template.name" header="Template" sortable>
                            <template #body="{ data }">
                                <div>
                                    <div class="font-medium">{{ data.template?.name }}</div>
                                    <div class="text-sm text-gray-500">{{ data.responses_count }} responses</div>
                                </div>
                            </template>
                        </Column>

                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <Tag :value="getStatusDisplay(data.status)" :severity="getStatusSeverity(data.status)" :icon="getStatusIcon(data.status)" />
                            </template>
                        </Column>

                        <Column field="overall_rating" header="Rating" sortable>
                            <template #body="{ data }">
                                <div v-if="data.overall_rating" class="flex items-center space-x-1">
                                    <Rating :modelValue="data.overall_rating" readonly :cancel="false" />
                                    <span class="text-sm text-gray-500">({{ data.overall_rating }})</span>
                                </div>
                                <span v-else class="text-gray-400">-</span>
                            </template>
                        </Column>

                        <Column field="created_at" header="Created" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.created_at) }}
                            </template>
                        </Column>

                        <Column header="Actions" :exportable="false" style="min-width: 8rem">
                            <template #body="{ data }">
                                <div class="flex flex-col sm:flex-row gap-1">
                                    <Button icon="pi pi-eye" @click="viewAppraisal(data)" severity="secondary" text size="small" v-tooltip.top="'View Details'" />
                                    <Button icon="pi pi-pencil" @click="editAppraisal(data)" severity="secondary" text size="small" :disabled="!canEdit(data)" v-tooltip.top="'Edit'" />
                                    <Button icon="pi pi-trash" @click="confirmDelete(data)" severity="danger" text size="small" :disabled="!canDelete(data)" v-tooltip.top="'Delete'" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- New Appraisal Modal -->
        <Dialog v-model:visible="showNewAppraisalModal" header="New Appraisal" :modal="true" :style="{ width: '90vw', maxWidth: '600px' }" :closable="true" :closeOnEscape="true">
            <AppraisalForm @saved="handleAppraisalSaved" @cancel="showNewAppraisalModal = false" />
        </Dialog>
    </div>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 640px) {
    .p-datatable .p-datatable-thead > tr > th {
        padding: 0.5rem;
        font-size: 0.875rem;
    }

    .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.5rem;
        font-size: 0.875rem;
    }
}

/* Custom card styling */
.p-card {
    box-shadow:
        0 1px 3px 0 rgba(0, 0, 0, 0.1),
        0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

/* Status tag styling */
.p-tag {
    font-size: 0.75rem;
    font-weight: 500;
}

/* Avatar styling */
.p-avatar {
    border: 2px solid #e5e7eb;
}

/* Button group styling */
.p-button.p-button-text {
    border-radius: 0.375rem;
}

.p-button.p-button-text:hover {
    background-color: #f3f4f6;
}
</style>
