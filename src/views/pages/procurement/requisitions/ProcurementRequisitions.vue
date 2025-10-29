<script setup>
import RequisitionDetail from '@/components/procurement/RequisitionDetail.vue';
import RequisitionForm from '@/components/procurement/RequisitionForm.vue';
import ApprovalWorkflow from '@/components/shared/ApprovalWorkflow.vue';
import { useToast } from '@/composables/useToast';
import { procurementService } from '@/services/procurement/procurementService';
import { computed, onMounted, ref, watch } from 'vue';

const { showToast } = useToast();
const requisitions = ref([]);
const filteredRequisitions = computed(() => {
    return requisitions.value.filter((req) => {
        const matchesType = !filters.value.type || req.request_type === filters.value.type;
        const matchesStatus = !filters.value.status || req.status === filters.value.status;
        const matchesSearch =
            !filters.value.search || req.purpose.toLowerCase().includes(filters.value.search.toLowerCase()) || req.id.toString().includes(filters.value.search) || req.requestedBy.name.toLowerCase().includes(filters.value.search.toLowerCase());

        // Date range filtering
        let matchesDate = true;
        if (filters.value.dateRange && filters.value.dateRange[0] && filters.value.dateRange[1]) {
            const reqDate = new Date(req.dateRequested);
            const startDate = new Date(filters.value.dateRange[0]);
            const endDate = new Date(filters.value.dateRange[1]);
            matchesDate = reqDate >= startDate && reqDate <= endDate;
        }

        return matchesType && matchesStatus && matchesSearch && matchesDate;
    });
});
const isLoading = ref(false);

// Filters
const filters = ref({
    type: null,
    status: null,
    search: '',
    dateRange: null
});

const typeOptions = [
    { label: 'Inventory', value: 'inventory' },
    { label: 'External Item', value: 'external_item' },
    { label: 'Service', value: 'service' }
];

const typeDescriptions = {
    inventory: 'Request items from existing inventory stock',
    external_item: 'Purchase new items not currently in inventory',
    service: 'Request external services or consultancy'
};

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' }
];

// Modal management
const createDialog = ref({
    visible: false
});

const modal = ref({
    visible: false,
    type: '', // 'create', 'edit', 'view'
    title: '',
    data: null
});

const deleteDialog = ref({
    visible: false,
    data: null
});

const approvalSteps = ref([]);
const currentStage = ref('');
const userRole = ref('');

const typeSeverity = (type) => {
    const map = {
        inventory: 'info',
        external_item: 'warning',
        service: 'success'
    };
    return map[type] || 'info';
};

const statusSeverity = (status) => {
    const map = {
        draft: 'info',
        submitted: 'warning',
        approved: 'success',
        rejected: 'danger',
        processing: 'help',
        completed: null
    };
    return map[status] || 'info';
};

const formatType = (type) => {
    const map = {
        inventory: 'Inventory',
        external_item: 'External Item',
        service: 'Service'
    };
    return map[type] || type;
};

const openCreateDialog = () => {
    createDialog.value.visible = true;
};

const openModal = (type, data = null) => {
    createDialog.value.visible = false;
    modal.value.type = type;
    modal.value.data = data;

    switch (type) {
        case 'create':
            modal.value.title = `Create New ${formatType(data.type)} Requisition`;
            break;
        case 'edit':
            modal.value.title = `Edit Requisition #${data.id}`;
            break;
        case 'view':
            modal.value.title = `Requisition Details #${data.id}`;
            break;
    }

    modal.value.visible = true;
};

const closeModal = () => {
    modal.value.visible = false;
};

const handleSubmit = async (formData) => {
    try {
        if (modal.value.type === 'create') {
            await procurementService.createRequisition(formData);
            showToast('success', `${formatType(formData.type)} requisition created`);
        } else {
            await procurementService.updateRequisition(formData);
            showToast('success', 'Requisition updated');
        }
        loadRequisitions();
        closeModal();
    } catch (error) {
        handleError(error);
    }
};

const updateStatus = async (data) => {
    try {
        if (data.status === 'submitted') {
            await procurementService.publishRequisition(data.id, data);
        } else if (data.status === 'approved') {
            await procurementService.approveRequisition(data.id, data);
        } else if (data.status === 'rejected') {
            await procurementService.rejectRequisition(data.id, data);
        }
        showToast('success', 'Requisition status updated to ' + data.status);
        modal.value.visible = false;
        loadRequisitions();
    } catch (error) {
        handleError(error);
    }
};

const confirmDelete = (data) => {
    deleteDialog.value.data = data;
    deleteDialog.value.visible = true;
};

const deleteRequisition = async () => {
    try {
        await procurementService.deleteRequisition(deleteDialog.value.data.id);
        showToast('success', 'Requisition deleted');
        loadRequisitions();
        deleteDialog.value.visible = false;
    } catch (error) {
        handleError(error);
    }
};

const processInventoryRequest = async (requisition) => {
    try {
        await procurementService.processRequisition(requisition.id);
        showToast('success', 'Inventory items processed');
        loadRequisitions();
    } catch (error) {
        handleError(error);
    }
};

const clearFilters = () => {
    filters.value = {
        type: null,
        status: null,
        search: '',
        dateRange: null
    };
};

const exportToCSV = () => {
    // Implement CSV export functionality
    showToast('info', 'Export to CSV functionality will be implemented');
};

const loadRequisitions = async () => {
    try {
        isLoading.value = true;
        const params = {};
        if (filters.value.type) {
            params.request_type = filters.value.type;
        }
        if (filters.value.status) {
            params.status = filters.value.status;
        }
        if (filters.value.search) {
            params.search = filters.value.search;
        }
        if (filters.value.dateRange && filters.value.dateRange[0] && filters.value.dateRange[1]) {
            params.start_date = filters.value.dateRange[0];
            params.end_date = filters.value.dateRange[1];
        }
        const response = await procurementService.getRequisitions(params);
        requisitions.value = response.data.results;
    } catch (error) {
        handleError(error);
    } finally {
        isLoading.value = false;
    }
};

// Reload when filters change
watch(
    () => ({ ...filters.value }),
    () => {
        loadRequisitions();
    },
    { deep: true }
);

const handleError = (error) => {
    showToast('error', error.message || 'An error occurred');
};

// Placeholder for future approval steps fetch, intentionally unused for now to avoid linter errors

onMounted(() => {
    loadRequisitions();
});
</script>

<template>
    <div class="p-4">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Procurement Requisitions</h1>
            <Button label="New Requisition" icon="pi pi-plus" @click="openCreateDialog" class="p-button-raised" />
        </div>

        <!-- Toolbar with filters and actions -->
        <Toolbar class="mb-4">
            <template #start>
                <div class="flex flex-wrap gap-2">
                    <Dropdown v-model="filters.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Type" class="w-40" showClear />
                    <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" class="w-32" showClear />
                    <Calendar v-model="filters.dateRange" selectionMode="range" dateFormat="yy-mm-dd" placeholder="Date Range" class="w-64" showIcon />
                    <InputText v-model="filters.search" placeholder="Search..." class="w-64" />
                </div>
            </template>
            <template #end>
                <Button icon="pi pi-filter-slash" label="Clear" class="p-button-text" @click="clearFilters" />
                <Button icon="pi pi-download" label="Export" class="p-button-text" @click="exportToCSV" />
            </template>
        </Toolbar>

        <!-- Requisitions Table -->
        <DataTable
            :value="filteredRequisitions"
            :loading="isLoading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            class="p-datatable-responsive p-datatable-striped"
            stripedRows
            removableSort
        >
            <Column field="id" header="ID" :sortable="true"></Column>
            <Column field="request_type" header="Type" :sortable="true">
                <template #body="{ data }">
                    <Tag :value="formatType(data.request_type)" :severity="typeSeverity(data.request_type)" />
                </template>
            </Column>
            <Column field="purpose" header="Purpose" :sortable="true"></Column>
            <Column field="requester" header="Requested By" :sortable="true"></Column>
            <Column field="required_by_date" header="Date Required" :sortable="true">
                <template #body="{ data }">
                    {{ data.required_by_date }}
                </template>
            </Column>
            <Column field="status" header="Status" :sortable="true">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="statusSeverity(data.status)" />
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 120px">
                <template #body="{ data }">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" class="p-button-text p-button-rounded" @click="openModal('view', data)" v-tooltip.top="'View Details'" />
                        <Button v-if="data.status === 'draft'" icon="pi pi-pencil" class="p-button-text p-button-rounded text-blue-500" @click="openModal('edit', data)" v-tooltip.top="'Edit'" />
                        <Button v-if="data.status === 'draft'" icon="pi pi-trash" class="p-button-text p-button-rounded text-red-500" @click="confirmDelete(data)" v-tooltip.top="'Delete'" />
                        <Button
                            v-if="data.status === 'approved' && data.type === 'inventory'"
                            icon="pi pi-shopping-cart"
                            class="p-button-text p-button-rounded text-green-500"
                            @click="processInventoryRequest(data)"
                            v-tooltip.top="'Process Inventory'"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Create Requisition Dialog -->
        <Dialog v-model:visible="createDialog.visible" header="Select Requisition Type" :style="{ width: '40vw' }" :modal="true">
            <div class="grid gap-4">
                <Card v-for="type in typeOptions" :key="type.value" class="cursor-pointer hover:shadow-lg transition-shadow" @click="openModal('create', { type: type.value })">
                    <template #title>{{ type.label }}</template>
                    <template #content>
                        <p class="text-gray-600">
                            {{ typeDescriptions[type.value] }}
                        </p>
                    </template>
                </Card>
            </div>
        </Dialog>

        <!-- Modal Dialog for Create/Edit/View -->
        <Dialog v-model:visible="modal.visible" :header="modal.title" :style="{ width: '60vw' }" :modal="true" :closable="false">
            <RequisitionForm
                v-if="modal.type !== 'view'"
                :requisition="modal.data"
                @submitted="handleSubmit"
                @close-modal="closeModal"
                @cancel="cancel"
                :modal="true"
                :draggable="true"
                :resizable="true"
                :closeOnEscape="true"
                :expandable="true"
                :maximizable="true"
            />
            <RequisitionDetail
                v-else
                :requisition="modal.data"
                @close="closeModal"
                @publish="updateStatus"
                @approve="updateStatus"
                @reject="updateStatus"
                :modal="true"
                :draggable="true"
                :resizable="true"
                :closeOnEscape="true"
                :expandable="true"
                :maximizable="true"
            />
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog.visible" header="Confirm Deletion" :style="{ width: '30vw' }" :modal="true">
            <p>Are you sure you want to delete this requisition?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="deleteDialog.visible = false" class="p-button-text" />
                <Button label="Yes" icon="pi pi-check" @click="deleteRequisition" class="p-button-danger" />
            </template>
        </Dialog>

        <!-- Approval Workflow Section -->
        <ApprovalWorkflow :approvalSteps="approvalSteps" :currentStage="currentStage" :userRole="userRole" @approve="handleApproval" />
    </div>
</template>

<style scoped>
.p-button-rounded {
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
}

.p-tag {
    text-transform: capitalize;
}
</style>
