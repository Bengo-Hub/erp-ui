<script setup>
import VoucherForm from '@/components/finance/vouchers/VoucherForm.vue';
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref } from 'vue';

const { showToast } = useToast();

// State
const loading = ref(false);
const vouchers = ref([]);
const totalRecords = ref(0);
const showCreateForm = ref(false);
const showDetailsDialog = ref(false);
const selectedVoucher = ref(null);

// Filters
const filters = reactive({
    voucher_type: null,
    status: null,
    date_from: null,
    date_to: null,
    page: 1,
    page_size: 10,
    ordering: '-date'
});

// Options
const voucherTypeOptions = [
    { label: 'All Types', value: null },
    { label: 'Payment Voucher', value: 'payment' },
    { label: 'Receipt Voucher', value: 'receipt' },
    { label: 'Journal Voucher', value: 'journal' },
    { label: 'Contra Voucher', value: 'contra' }
];

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Posted', value: 'posted' }
];

// Load vouchers
const loadVouchers = async () => {
    loading.value = true;
    try {
        const params = { ...filters };
        if (filters.date_from) params.date_from = filters.date_from.toISOString().split('T')[0];
        if (filters.date_to) params.date_to = filters.date_to.toISOString().split('T')[0];

        const response = await financeService.getVouchers(params);
        vouchers.value = response.data.results || response.data || [];
        totalRecords.value = response.data.count || vouchers.value.length;
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showToast('error', 'Failed to load vouchers');
    } finally {
        loading.value = false;
    }
};

// Pagination
const onPageChange = (event) => {
    filters.page = event.page + 1;
    filters.page_size = event.rows;
    loadVouchers();
};

// Sorting
const onSort = (event) => {
    filters.ordering = event.sortField === 'date' ? 'date' : `-${event.sortField}`;
    if (event.sortOrder === -1) {
        filters.ordering = filters.ordering.startsWith('-') ? filters.ordering.slice(1) : `-${filters.ordering}`;
    }
    loadVouchers();
};

// View voucher details
const viewVoucher = (voucher) => {
    selectedVoucher.value = voucher;
    showDetailsDialog.value = true;
};

// Edit voucher
const editVoucher = (voucher) => {
    selectedVoucher.value = voucher;
    showCreateForm.value = true;
};

// Update voucher status
const updateStatus = async (voucher, status) => {
    try {
        await financeService.updateVoucherStatus(voucher.id, status);
        showToast('success', `Voucher ${status} successfully`);
        loadVouchers();
    } catch (error) {
        console.error('Error updating voucher status:', error);
        showToast('error', 'Failed to update voucher status');
    }
};

// Delete voucher
const deleteVoucher = async (voucher) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
        await financeService.deleteVoucher(voucher.id);
        showToast('success', 'Voucher deleted successfully');
        loadVouchers();
    } catch (error) {
        console.error('Error deleting voucher:', error);
        showToast('error', 'Failed to delete voucher');
    }
};

// Voucher saved callback
const onVoucherSaved = () => {
    selectedVoucher.value = null;
    loadVouchers();
};

// Utility functions
const getVoucherTypeLabel = (type) => {
    const option = voucherTypeOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
};

const getVoucherTypeSeverity = (type) => {
    const severityMap = {
        payment: 'danger',
        receipt: 'success',
        journal: 'info',
        contra: 'warning'
    };
    return severityMap[type] || 'info';
};

const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'secondary',
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        posted: 'info'
    };
    return severityMap[status] || 'info';
};

const getAccountName = (accountId) => {
    // This would need to be implemented with account lookup
    return accountId || 'N/A';
};

const calculateTotalDebits = () => {
    if (!selectedVoucher.value?.items) return 0;
    return selectedVoucher.value.items.reduce((sum, item) => sum + (item.debit || 0), 0);
};

const calculateTotalCredits = () => {
    if (!selectedVoucher.value?.items) return 0;
    return selectedVoucher.value.items.reduce((sum, item) => sum + (item.credit || 0), 0);
};

const calculateBalance = () => {
    return calculateTotalDebits() - calculateTotalCredits();
};

// Load vouchers on mount
onMounted(() => {
    loadVouchers();
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Voucher Management</h1>
                <p class="text-gray-600">Manage accounting vouchers and journal entries</p>
            </div>
            <Button icon="pi pi-plus" label="Create Voucher" @click="showCreateForm = true" class="p-button-primary" />
        </div>

        <!-- Filters -->
        <Card>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                        <Dropdown v-model="filters.voucher_type" :options="voucherTypeOptions" optionLabel="label" optionValue="value" placeholder="All Types" class="w-full" @change="loadVouchers" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-full" @change="loadVouchers" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                        <Calendar v-model="filters.date_from" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" @date-select="loadVouchers" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                        <Calendar v-model="filters.date_to" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" @date-select="loadVouchers" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Vouchers Table -->
        <Card>
            <template #content>
                <DataTable :value="vouchers" :loading="loading" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50]" :totalRecords="totalRecords" :lazy="true" @page="onPageChange" @sort="onSort" sortMode="single" class="p-datatable-sm">
                    <Column field="voucher_number" header="Voucher #" sortable>
                        <template #body="{ data }">
                            <span class="font-mono font-medium">{{ data.voucher_number }}</span>
                        </template>
                    </Column>

                    <Column field="voucher_type" header="Type" sortable>
                        <template #body="{ data }">
                            <Tag :value="getVoucherTypeLabel(data.voucher_type)" :severity="getVoucherTypeSeverity(data.voucher_type)" />
                        </template>
                    </Column>

                    <Column field="date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.date) }}
                        </template>
                    </Column>

                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-medium">{{ formatCurrency(data.amount) }}</span>
                        </template>
                    </Column>

                    <Column field="description" header="Description">
                        <template #body="{ data }">
                            <div class="max-w-xs truncate" :title="data.description">
                                {{ data.description }}
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="flex space-x-2">
                                <Button icon="pi pi-eye" severity="info" size="small" @click="viewVoucher(data)" v-tooltip.top="'View Details'" />
                                <Button icon="pi pi-pencil" severity="secondary" size="small" @click="editVoucher(data)" v-tooltip.top="'Edit Voucher'" v-if="data.status === 'draft'" />
                                <Button icon="pi pi-check" severity="success" size="small" @click="updateStatus(data, 'approved')" v-tooltip.top="'Approve'" v-if="data.status === 'pending'" />
                                <Button icon="pi pi-times" severity="danger" size="small" @click="updateStatus(data, 'rejected')" v-tooltip.top="'Reject'" v-if="data.status === 'pending'" />
                                <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteVoucher(data)" v-tooltip.top="'Delete Voucher'" v-if="data.status === 'draft'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Voucher Form Dialog -->
        <VoucherForm v-model:visible="showCreateForm" :voucher="selectedVoucher" @saved="onVoucherSaved" />

        <!-- Voucher Details Dialog -->
        <Dialog v-model:visible="showDetailsDialog" :modal="true" header="Voucher Details" :style="{ width: '80vw' }">
            <div v-if="selectedVoucher" class="space-y-6">
                <!-- Voucher Header -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Voucher Number</label>
                        <p class="text-lg font-mono font-bold">{{ selectedVoucher.voucher_number }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Type</label>
                        <Tag :value="getVoucherTypeLabel(selectedVoucher.voucher_type)" :severity="getVoucherTypeSeverity(selectedVoucher.voucher_type)" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <Tag :value="getStatusLabel(selectedVoucher.status)" :severity="getStatusSeverity(selectedVoucher.status)" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Date</label>
                        <p>{{ formatDate(selectedVoucher.date) }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Amount</label>
                        <p class="text-lg font-bold">{{ formatCurrency(selectedVoucher.amount) }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <p>{{ selectedVoucher.description }}</p>
                    </div>
                </div>

                <!-- Voucher Items -->
                <div>
                    <h3 class="text-lg font-medium mb-3">Voucher Items</h3>
                    <DataTable :value="selectedVoucher.items || []" class="p-datatable-sm">
                        <Column field="account" header="Account">
                            <template #body="{ data }">
                                {{ getAccountName(data.account) }}
                            </template>
                        </Column>
                        <Column field="debit" header="Debit">
                            <template #body="{ data }">
                                <span class="text-red-600 font-medium">{{ formatCurrency(data.debit) }}</span>
                            </template>
                        </Column>
                        <Column field="credit" header="Credit">
                            <template #body="{ data }">
                                <span class="text-green-600 font-medium">{{ formatCurrency(data.credit) }}</span>
                            </template>
                        </Column>
                        <Column field="description" header="Description">
                            <template #body="{ data }">
                                {{ data.description }}
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Totals -->
                <div class="flex justify-end">
                    <div class="w-64 space-y-2">
                        <div class="flex justify-between">
                            <span class="font-medium">Total Debits:</span>
                            <span class="text-red-600 font-bold">{{ formatCurrency(calculateTotalDebits()) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Total Credits:</span>
                            <span class="text-green-600 font-bold">{{ formatCurrency(calculateTotalCredits()) }}</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Balance:</span>
                            <span :class="calculateBalance() === 0 ? 'text-green-600' : 'text-red-600'">
                                {{ formatCurrency(calculateBalance()) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>
