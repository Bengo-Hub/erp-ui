<script setup>
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import { useToast } from '@/composables/useToast';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import QualityCheckForm from './QualityCheckForm.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const router = useRouter();
const confirm = useConfirm();
const user = JSON.parse(sessionStorage.getItem('user'));

const qualityChecks = ref([]);
const selectedChecks = ref([]);
const activeBatches = ref([]);
const inspectors = ref([]);
const loading = ref(true);
const dateRange = ref(null);

// Filter options
const resultOptions = [
    { name: 'All Results', value: null },
    { name: 'Pass', value: 'pass' },
    { name: 'Fail', value: 'fail' },
    { name: 'Pending', value: 'pending' }
];

const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    result: { value: null, matchMode: FilterMatchMode.EQUALS }
});

// Dialog state
const checkDialog = reactive({
    visible: false,
    isEdit: false,
    data: {
        id: null,
        batch: null,
        check_date: new Date(),
        result: null,
        notes: ''
    }
});

// View dialog state
const viewDialog = reactive({
    visible: false,
    data: null
});

// Access Vuex store for authentication and permissions
const store = useStore();

// Computed property to check if user has quality check permissions
const hasQualityCheckPermission = computed(() => {
    if (!user || !user.permissions) return false;

    // Check if user has the specific permission
    return user.permissions.includes('add_qualitycheck') || user.permissions.includes('change_qualitycheck') || user.permissions.includes('delete_qualitycheck') || user.permissions.includes('view_qualitycheck');
});

const canAddQualityCheck = computed(() => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('add_qualitycheck');
});

const canEditQualityCheck = computed(() => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('change_qualitycheck');
});

const canDeleteQualityCheck = computed(() => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('delete_qualitycheck');
});

// Filter handling
const onFilterChange = () => {
    fetchQualityChecks();
};

const onDateSelect = () => {
    if (dateRange.value && dateRange.value[1]) {
        fetchQualityChecks();
    }
};

// Dialog actions
const openNewCheckDialog = () => {
    if (!canAddQualityCheck.value) {
        showToast('error', 'Permission Denied', 'You do not have permission to add quality checks', 3000);
        return;
    }
    
    checkDialog.isEdit = false;
    checkDialog.data = {
        id: null,
        batch: null,
        check_date: new Date(),
        result: null,
        notes: ''
    };
    checkDialog.visible = true;
};

const editQualityCheck = (check) => {
    // Check permission first
    if (!canEditQualityCheck.value) {
        showToast('error', 'Permission Denied', 'You do not have permission to edit quality checks', 3000);
        return;
    }

    // Prevent editing completed batch quality checks
    if (check.batch_details?.status === 'completed') {
        showToast('warning', 'Warning', 'Cannot edit quality checks for completed batches', 3000);
        return;
    }

    checkDialog.isEdit = true;
    checkDialog.data = {
        id: check.id,
        batch: check.batch_details,
        inspector: check.inspector
            ? {
                  id: check.inspector,
                  username: check.inspector_name
              }
            : null,
        check_date: new Date(check.check_date),
        result: check.result,
        notes: check.notes
    };
    checkDialog.visible = true;
};

const closeCheckDialog = () => {
    checkDialog.visible = false;
};

const onQualityCheckSaved = () => {
    // Refresh the quality checks list after save
    fetchQualityChecks();
};

const viewCheckDetails = (check) => {
    viewDialog.data = check;
    viewDialog.visible = true;
};

const confirmDeleteCheck = (check) => {
    // Check permission first
    if (!canDeleteQualityCheck.value) {
        showToast('error', 'Permission Denied', 'You do not have permission to delete quality checks', 3000);
        return;
    }

    confirm.require({
        message: 'Are you sure you want to delete this quality check?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                // Call the delete API endpoint
                await manufacturingService.deleteQualityCheck(check.id);

                showToast('success', 'Success', 'Quality check deleted successfully', 3000);

                fetchQualityChecks();
            } catch (error) {
                console.error('Error deleting quality check:', error);
                let errorMessage = 'Failed to delete quality check';

                // Extract error message from API if available
                if (error.response && error.response.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.detail) {
                        errorMessage = error.response.data.detail;
                    }
                }

                showToast('error', 'Error', errorMessage, 3000);
            }
        }
    });
};

// Fetch data from API
const fetchQualityChecks = async () => {
    loading.value = true;
    try {
        // Build filter parameters
        const filterParams = {};

        if (filters.result.value) {
            filterParams.result = filters.result.value;
        }

        if (dateRange.value && dateRange.value[0]) {
            filterParams.date_from = dateRange.value[0].toISOString().split('T')[0];

            if (dateRange.value[1]) {
                filterParams.date_to = dateRange.value[1].toISOString().split('T')[0];
            }
        }

        console.log('Fetching quality checks with params:', filterParams);

        // Call the real API endpoint
        const response = await manufacturingService.getQualityChecks(filterParams);
        console.log('Quality checks API response:', response);

        // Handle different response formats
        if (response.data && Array.isArray(response.data.results)) {
            // Paginated response
            qualityChecks.value = response.data.results;
        } else if (Array.isArray(response.data)) {
            // Direct array response
            qualityChecks.value = response.data;
        } else if (response.data && typeof response.data === 'object') {
            // Single object response (convert to array)
            qualityChecks.value = [response.data];
        } else {
            // Unexpected format
            console.error('Unexpected API response format:', response.data);
            qualityChecks.value = [];
            showToast('warn', 'Data Format Issue', 'Received unexpected data format from server', 3000);
        }

        console.log('Processed quality checks:', qualityChecks.value);

        // Show message if no data found
        if (qualityChecks.value.length === 0) {
            showToast('info', 'No Data', 'No quality checks found with current filters', 3000);
        }
    } catch (error) {
        console.error('Error fetching quality checks:', error);
        showToast('error', 'Error', 'Failed to load quality checks', 3000);
        qualityChecks.value = []; // Set to empty array on error
    } finally {
        loading.value = false;
    }
};

// Formatting helpers
const formatResult = (result) => {
    if (!result) return '';
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const getResultSeverity = (result) => {
    switch (result) {
        case 'pass':
            return 'success';
        case 'fail':
            return 'danger';
        case 'pending':
            return 'warning';
        default:
            return 'info';
    }
};

const formatStatus = (status) => {
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'planned':
            return 'info';
        case 'in_progress':
            return 'warning';
        case 'completed':
            return 'success';
        case 'cancelled':
            return 'secondary';
        case 'failed':
            return 'danger';
        default:
            return 'info';
    }
};

onMounted(() => {
    if (hasQualityCheckPermission.value) {
        fetchQualityChecks();
    } else {
        showToast('warn', 'Permission Required', 'You do not have permission to view quality checks', 5000);
    }
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <!-- Breadcrumb -->
            <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Quality Checks' }]" />

            <!-- Toolbar -->
            <ManufacturingToolbar title="Quality Checks" icon="pi pi-check-square">
                <template #actions>
                    <span class="p-input-icon-left w-auto mr-2">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.global.value" placeholder="Search checks" />
                    </span>
                    <Dropdown v-model="filters.result.value" :options="resultOptions" optionLabel="name" optionValue="value" placeholder="Filter by Result" class="mr-2" @change="onFilterChange" />
                    <Calendar v-model="dateRange" selectionMode="range" placeholder="Date Range" class="mr-2" @date-select="onDateSelect" />
                    <Button v-if="canAddQualityCheck" label="New Quality Check" icon="pi pi-plus" class="p-button-raised" @click="openNewCheckDialog" />
                </template>
            </ManufacturingToolbar>

            <div class="card shadow-2 border-round-xl p-4">
                <DataTable
                    :value="qualityChecks"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} quality checks"
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                    v-model:selection="selectedChecks"
                    :loading="loading"
                    stripedRows
                >
                    <Column selectionMode="multiple" headerStyle="width: 3rem" />

                    <Column field="batch_details.batch_number" header="Batch #" sortable>
                        <template #body="slotProps">
                            <template v-if="slotProps.data.batch">
                                <router-link :to="'/manufacturing/batches/' + slotProps.data.batch.id">
                                    {{ slotProps.data.batch_details.batch_number }}
                                </router-link>
                            </template>
                            <template v-else>
                                {{ slotProps.data.batch || 'N/A' }}
                            </template>
                        </template>
                    </Column>

                    <Column field="check_date" header="Check Date" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.check_date) }}
                        </template>
                    </Column>

                    <Column field="inspector_details.username" header="Inspector" sortable>
                        <template #body="slotProps">
                            {{ slotProps.data.inspector_details?.username || slotProps.data.inspector_name || 'N/A' }}
                        </template>
                    </Column>

                    <Column field="result" header="Result" sortable style="width: 120px">
                        <template #body="slotProps">
                            <Tag :value="formatResult(slotProps.data.result)" :severity="getResultSeverity(slotProps.data.result)" />
                        </template>
                    </Column>

                    <Column header="Formula" sortable>
                        <template #body="slotProps">
                            <span>{{ slotProps.data.batch_details?.formula || 'N/A' }}</span>
                            <span v-if="slotProps.data.batch?.formula_version" class="text-sm text-500 ml-2"> v{{ slotProps.data.batch?.formula_version }} </span>
                        </template>
                    </Column>

                    <Column header="Batch Status" sortable style="width: 120px">
                        <template #body="slotProps">
                            <Tag v-if="slotProps.data.batch_details?.status" :value="formatStatus(slotProps.data.batch_details.status)" :severity="getStatusSeverity(slotProps.data.batch_details.status)" />
                            <span v-else>N/A</span>
                        </template>
                    </Column>

                    <Column header="Actions" style="width: 8rem">
                        <template #body="slotProps">
                            <div class="flex">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm mr-2" @click="viewCheckDetails(slotProps.data)" />
                                <Button
                                    v-if="canEditQualityCheck"
                                    icon="pi pi-pencil"
                                    class="p-button-rounded p-button-text p-button-sm mr-2"
                                    @click="editQualityCheck(slotProps.data)"
                                    :disabled="!canEditQualityCheck || (slotProps.data.batch && slotProps.data.batch_details.status === 'completed')"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                    @click="confirmDeleteCheck(slotProps.data)"
                                    :disabled="slotProps.data.batch && slotProps.data.batch_details.status === 'completed'"
                                />
                            </div>
                            <!-- Quality Check Form Component -->
                            <QualityCheckForm :visible="checkDialog.visible" @update:visible="checkDialog.visible = $event" :isEdit="checkDialog.isEdit" :checkData="checkDialog.data" @close="closeCheckDialog" @saved="onQualityCheckSaved" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- View Check Details Dialog -->
        <Dialog v-model:visible="viewDialog.visible" header="Quality Check Details" modal style="width: 40vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <div v-if="viewDialog.data">
                <div class="flex mb-3">
                    <div class="flex-1">
                        <h5 class="mt-0 mb-2">Batch Information</h5>
                        <div><span class="font-bold">Batch Number:</span> {{ viewDialog.data.batch_details.batch_number }}</div>
                        <div><span class="font-bold">Formula:</span> {{ viewDialog.data.batch_details.formula }} (v{{ viewDialog.data.batch_details.formula_version }})</div>
                        <div><span class="font-bold">Status:</span> {{ formatStatus(viewDialog.data.batch_details.status) }}</div>
                    </div>
                    <div class="flex-1">
                        <h5 class="mt-0 mb-2">Check Information</h5>
                        <div><span class="font-bold">Check Date:</span> {{ formatDate(viewDialog.data.check_date) }}</div>
                        <div><span class="font-bold">Inspector:</span> {{ viewDialog.data.inspector_details?.username }}</div>
                        <div>
                            <span class="font-bold">Result:</span>
                            <Tag :value="formatResult(viewDialog.data.result)" :severity="getResultSeverity(viewDialog.data.result)" class="ml-2" />
                        </div>
                    </div>
                </div>
                <h5 class="mt-4 mb-2">Notes</h5>
                <div class="p-3 surface-ground border-round">
                    {{ viewDialog.data.notes || 'No notes available' }}
                </div>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" @click="viewDialog.visible = false" />
            </template>
        </Dialog>
    </div>
</template>
