<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import { useDocumentFilters } from '@/composables/finance/useDocumentFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { creditNoteService } from '@/services/finance/billingDocumentsService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Use shared filter composable
const { filters, currentPage, perPage, totalRecords, onPage, onFilter, getFilterParams } = useDocumentFilters();

// Data
const creditNotes = ref([]);
const loading = ref(false);
const selectedCreditNotes = ref([]);

// Computed
const canCreate = computed(() => hasPermission('add_creditnote'));
const canEdit = computed(() => hasPermission('change_creditnote'));
const canDelete = computed(() => hasPermission('delete_creditnote'));

// Status options for filtering
const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Applied', value: 'applied' },
    { label: 'Void', value: 'void' }
];

// Methods
const fetchCreditNotes = async () => {
    loading.value = true;
    try {
        const params = getFilterParams();
        // Service already returns extracted paginated data: { results, count, next, previous, ... }
        const response = await creditNoteService.getCreditNotes(params);
        creditNotes.value = response.results || [];
        totalRecords.value = response.count || creditNotes.value.length;
    } catch (error) {
        console.error('Error fetching credit notes:', error);
        showToast('error', 'Error', 'Failed to load credit notes');
        creditNotes.value = [];
    } finally {
        loading.value = false;
    }
};

// Actions generator for each credit note row
const getCreditNoteActions = (note) => {
    const actions = [];

    if (!note) return actions;

    // Apply to invoice for issued notes
    if (note.status === 'issued') {
        actions.push({ label: 'Apply to Invoice', icon: 'pi pi-check', command: () => applyToInvoice(note) });
    }

    actions.push({ label: 'Download PDF', icon: 'pi pi-file-pdf', command: () => downloadPDF(note) });

    if (note.status === 'draft' && canEdit.value) {
        actions.push({ label: 'Edit', icon: 'pi pi-pencil', command: () => editCreditNote(note) });
    }

    if (note.status === 'draft' && canDelete.value) {
        actions.push({ separator: true });
        actions.push({ label: 'Delete', icon: 'pi pi-trash', class: 'text-red-600', command: () => deleteCreditNote(note) });
    }

    return actions;
};

const applyToInvoice = async (note) => {
    if (!confirm(`Apply credit note ${note.credit_note_number} to its related invoice?`)) return;

    try {
        await creditNoteService.applyToInvoice(note.id);
        showToast('success', 'Success', 'Credit note applied to invoice');
        await fetchCreditNotes();
    } catch (error) {
        console.error('Error applying credit note:', error);
        showToast('error', 'Error', 'Failed to apply credit note');
    }
};

const createCreditNote = () => {
    router.push({ name: 'finance-credit-note-create' });
};

const viewCreditNote = (note) => {
    router.push(`/finance/credit-notes/${note.id}`);
};

const editCreditNote = (note) => {
    router.push(`/finance/credit-notes/${note.id}/edit`);
};

const downloadPDF = async (note) => {
    try {
        const blob = await creditNoteService.getCreditNotePDF(note.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `credit-note-${note.credit_note_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const deleteCreditNote = async (note) => {
    if (!confirm(`Are you sure you want to delete credit note ${note.credit_note_number}?`)) return;

    try {
        await creditNoteService.deleteCreditNote(note.id);
        showToast('success', 'Success', 'Credit note deleted successfully');
        await fetchCreditNotes();
    } catch (error) {
        console.error('Error deleting credit note:', error);
        showToast('error', 'Error', 'Failed to delete credit note');
    }
};

const getCustomerName = (note) => {
    return note.customer_details?.name || note.customer_details?.business_name || 'N/A';
};

// Lifecycle
onMounted(() => {
    fetchCreditNotes();
});
</script>

<template>
    <div class="credit-notes-page">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Credit Notes</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Manage credit notes for refunds and adjustments</p>
                </div>
                <PermissionButton
                    :permission="'add_creditnote'"
                    icon="pi pi-plus"
                    label="New Credit Note"
                    @click="createCreditNote"
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
                            placeholder="Search credit notes..."
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
                    :value="creditNotes"
                    :loading="loading"
                    v-model:selection="selectedCreditNotes"
                    dataKey="id"
                    :paginator="true"
                    :rows="perPage"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPage"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} credit notes"
                    class="p-datatable-sm"
                    stripedRows
                >
                    <template #empty>
                        <div class="text-center py-8 text-surface-500">
                            <i class="pi pi-credit-card text-4xl mb-4"></i>
                            <p>No credit notes found</p>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                    <Column field="credit_note_number" header="Number" sortable>
                        <template #body="{ data }">
                            <a @click="viewCreditNote(data)" class="text-primary cursor-pointer hover:underline font-medium">
                                {{ data.credit_note_number }}
                            </a>
                        </template>
                    </Column>

                    <Column header="Customer">
                        <template #body="{ data }">
                            {{ getCustomerName(data) }}
                        </template>
                    </Column>

                    <Column header="Related Invoice">
                        <template #body="{ data }">
                            <span v-if="data.invoice_number" class="text-sm">
                                {{ data.invoice_number }}
                            </span>
                            <span v-else class="text-surface-400">N/A</span>
                        </template>
                    </Column>

                    <Column field="credit_note_date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.credit_note_date) }}
                        </template>
                    </Column>

                    <Column field="total" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold text-red-600">
                                -{{ formatCurrency(data.total || data.grand_total) }}
                            </span>
                        </template>
                    </Column>

                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <DocumentStatusBadge :status="data.status" documentType="credit_note" />
                        </template>
                    </Column>

                    <Column header="Actions" headerStyle="width: 10rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-text p-button-sm"
                                    @click="viewCreditNote(data)"
                                    v-tooltip.top="'View'"
                                />
                                <SplitButton
                                    icon="pi pi-ellipsis-v"
                                    class="p-button-text p-button-sm"
                                    :model="getCreditNoteActions(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.credit-notes-page {
    padding: 1rem;
}
</style>
