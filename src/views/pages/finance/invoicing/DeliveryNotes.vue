<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import { useDocumentFilters } from '@/composables/finance/useDocumentFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { deliveryNoteService } from '@/services/finance/billingDocumentsService';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Use shared filter composable
const { filters, currentPage, perPage, totalRecords, onPage, onFilter, getFilterParams } = useDocumentFilters();

// Data
const deliveryNotes = ref([]);
const loading = ref(false);
const selectedDeliveryNotes = ref([]);

// Dialogs
const showDeliveryDialog = ref(false);
const selectedDeliveryNote = ref(null);
const deliveryData = ref({
    received_by: '',
    notes: ''
});

// Computed
const canCreate = computed(() => hasPermission('add_deliverynote'));
const canEdit = computed(() => hasPermission('change_deliverynote'));
const canDelete = computed(() => hasPermission('delete_deliverynote'));

// Status options for filtering
const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Partially Delivered', value: 'partially_delivered' },
    { label: 'Cancelled', value: 'cancelled' }
];

// Methods
const fetchDeliveryNotes = async () => {
    loading.value = true;
    try {
        const params = getFilterParams();
        const response = await deliveryNoteService.getDeliveryNotes(params);
        const data = response.data || response;
        deliveryNotes.value = data.results || data || [];
        totalRecords.value = data.count || deliveryNotes.value.length;
    } catch (error) {
        console.error('Error fetching delivery notes:', error);
        showToast('error', 'Error', 'Failed to load delivery notes');
        deliveryNotes.value = [];
    } finally {
        loading.value = false;
    }
};

// Actions generator for each delivery note row
const getDeliveryNoteActions = (note) => {
    const actions = [];

    if (!note) return actions;

    // Mark as delivered for pending/in_transit notes
    if (['pending', 'in_transit'].includes(note.status)) {
        actions.push({ label: 'Mark Delivered', icon: 'pi pi-check', command: () => openDeliveryDialog(note) });
    }

    actions.push({ label: 'Download PDF', icon: 'pi pi-file-pdf', command: () => downloadPDF(note) });

    if (note.status === 'draft' && canEdit.value) {
        actions.push({ label: 'Edit', icon: 'pi pi-pencil', command: () => editDeliveryNote(note) });
    }

    if (note.status === 'draft' && canDelete.value) {
        actions.push({ separator: true });
        actions.push({ label: 'Delete', icon: 'pi pi-trash', class: 'text-red-600', command: () => deleteDeliveryNote(note) });
    }

    return actions;
};

const openDeliveryDialog = (note) => {
    selectedDeliveryNote.value = note;
    deliveryData.value = { received_by: '', notes: '' };
    showDeliveryDialog.value = true;
};

const markAsDelivered = async () => {
    if (!selectedDeliveryNote.value) return;

    try {
        await deliveryNoteService.markDelivered(selectedDeliveryNote.value.id, deliveryData.value);
        showToast('success', 'Success', 'Delivery note marked as delivered');
        showDeliveryDialog.value = false;
        await fetchDeliveryNotes();
    } catch (error) {
        console.error('Error marking as delivered:', error);
        showToast('error', 'Error', 'Failed to mark as delivered');
    }
};

const createDeliveryNote = () => {
    router.push({ name: 'finance-delivery-note-create' });
};

const viewDeliveryNote = (note) => {
    router.push(`/finance/delivery-notes/${note.id}`);
};

const editDeliveryNote = (note) => {
    router.push(`/finance/delivery-notes/${note.id}/edit`);
};

const downloadPDF = async (note) => {
    try {
        const blob = await deliveryNoteService.getDeliveryNotePDF(note.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `delivery-note-${note.delivery_note_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const deleteDeliveryNote = async (note) => {
    if (!confirm(`Are you sure you want to delete delivery note ${note.delivery_note_number}?`)) return;

    try {
        await deliveryNoteService.deleteDeliveryNote(note.id);
        showToast('success', 'Success', 'Delivery note deleted successfully');
        await fetchDeliveryNotes();
    } catch (error) {
        console.error('Error deleting delivery note:', error);
        showToast('error', 'Error', 'Failed to delete delivery note');
    }
};

const getCustomerName = (note) => {
    return note.customer_details?.name || note.customer_details?.business_name || 'N/A';
};

const getSourceDocument = (note) => {
    if (note.source_invoice_number) return `INV: ${note.source_invoice_number}`;
    if (note.source_purchase_order_number) return `PO: ${note.source_purchase_order_number}`;
    return 'N/A';
};

// Lifecycle
onMounted(() => {
    fetchDeliveryNotes();
});
</script>

<template>
    <div class="delivery-notes-page">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Delivery Notes</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Manage delivery notes for invoices and purchase orders</p>
                </div>
                <PermissionButton
                    :permission="'add_deliverynote'"
                    icon="pi pi-plus"
                    label="New Delivery Note"
                    @click="createDeliveryNote"
                    class="p-button-primary"
                />
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-4">
            <template #content>
                <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-[200px]">
                        <InputText
                            v-model="filters.search"
                            placeholder="Search delivery notes..."
                            class="w-full"
                            @input="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <Select
                            v-model="filters.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Status"
                            class="w-full"
                            @change="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <DatePicker
                            v-model="filters.date_from"
                            placeholder="From Date"
                            class="w-full"
                            @date-select="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <DatePicker
                            v-model="filters.date_to"
                            placeholder="To Date"
                            class="w-full"
                            @date-select="onFilter"
                        />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Data Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="deliveryNotes"
                    :loading="loading"
                    v-model:selection="selectedDeliveryNotes"
                    dataKey="id"
                    :paginator="true"
                    :rows="perPage"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPage"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} delivery notes"
                    class="p-datatable-sm"
                    stripedRows
                >
                    <template #empty>
                        <div class="text-center py-8 text-surface-500">
                            <i class="pi pi-truck text-4xl mb-4"></i>
                            <p>No delivery notes found</p>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                    <Column field="delivery_note_number" header="Number" sortable>
                        <template #body="{ data }">
                            <a @click="viewDeliveryNote(data)" class="text-primary cursor-pointer hover:underline font-medium">
                                {{ data.delivery_note_number }}
                            </a>
                        </template>
                    </Column>

                    <Column header="Customer/Supplier">
                        <template #body="{ data }">
                            {{ getCustomerName(data) }}
                        </template>
                    </Column>

                    <Column header="Source">
                        <template #body="{ data }">
                            <span class="text-sm text-surface-600">{{ getSourceDocument(data) }}</span>
                        </template>
                    </Column>

                    <Column field="delivery_date" header="Delivery Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.delivery_date) }}
                        </template>
                    </Column>

                    <Column field="driver_name" header="Driver">
                        <template #body="{ data }">
                            {{ data.driver_name || 'N/A' }}
                        </template>
                    </Column>

                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <DocumentStatusBadge :status="data.status" documentType="delivery_note" />
                        </template>
                    </Column>

                    <Column header="Actions" headerStyle="width: 10rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-text p-button-sm"
                                    @click="viewDeliveryNote(data)"
                                    v-tooltip.top="'View'"
                                />
                                <SplitButton
                                    icon="pi pi-ellipsis-v"
                                    class="p-button-text p-button-sm"
                                    :model="getDeliveryNoteActions(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Mark as Delivered Dialog -->
        <Dialog
            v-model:visible="showDeliveryDialog"
            header="Mark as Delivered"
            :style="{ width: '450px' }"
            modal
        >
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Received By</label>
                    <InputText v-model="deliveryData.received_by" class="w-full" placeholder="Name of person who received" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <Textarea v-model="deliveryData.notes" rows="3" class="w-full" placeholder="Delivery notes..." />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDeliveryDialog = false" />
                <Button label="Confirm Delivery" icon="pi pi-check" @click="markAsDelivered" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.delivery-notes-page {
    padding: 1rem;
}
</style>
