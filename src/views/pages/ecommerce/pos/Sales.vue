<script setup>
import AddSaleReturn from '@/components/pos/AddSaleReturn.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { posService } from '@/services/ecommerce/posService';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';
import Receipt from './printReceipt.vue';

const { showToast } = useToast();
const { hasPermission, hasAnyPermission } = usePermissions();
const confirm = useConfirm();
const menu = ref();
const selectedSale = ref(null);
const returnDialogVisible = ref(false);
const receiptVisible = ref(false);
const showPaymentModal = ref(false);
const selectedSaleId = ref(null);

// Reactive state
const saleslist = ref([]);
const totalRows = ref(1);
const currentPage = ref(1);
const perPage = ref(25);
const pageOptions = ref([1, 5, 10, 25, 50, 100, 500, 1000, 1500, 2000]);
const filter = ref(null);
const filterOn = ref([]);
const sortBy = ref('sale_id');
const sortDesc = ref(false);
const paymentMethod = ref('');
const status = ref('');
const fromdate = ref('');
const todate = ref('');
const limit = ref(12);
const offset = ref(0);
const isLoading = ref(false);
const spinner_title = ref('Loading data...');
const receiptData = ref(null);
const sale = ref(null);

// Fields for the table
const fields = ref([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'sale_id', label: 'Invoice No.', sortable: true },
    { key: 'customer.name', label: 'Customer Name', sortable: true },
    { key: 'customer.phone', label: 'Contact Number', sortable: false },
    { key: 'sales_items[0].location.name', label: 'Location', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'paymethod', label: 'Payment Method', sortable: true },
    { key: 'payment_status', label: 'Payment Status', sortable: true },
    { key: 'grand_total', label: 'Total Amount', sortable: true },
    { key: 'amount_paid', label: 'Total Paid', sortable: true },
    { key: 'balance_due', label: 'Sale Due', sortable: true },
    { key: 'returns_due', label: 'Sale Return Due', sortable: true },
    { key: 'shipping.status', label: 'Shipping Status', sortable: true },
    { key: 'total_items', label: 'Total Items', sortable: true },
    { key: 'added_by.name', label: 'Attendant', sortable: true },
    { key: 'sell_note', label: 'Sale Note', sortable: true },
    { key: 'staff_note', label: 'Staff Note', sortable: true },
    { key: 'shipping.details.name', label: 'Shipping Detail', sortable: true }
]);

// Computed rows
const rows = computed(() => saleslist.value.length);

// Fetch sales data
const updatearrays = async () => {
    isLoading.value = true;
    try {
        const response = await posService.getSalesList({
            limit: limit.value,
            offset: offset.value,
            status: status.value,
            fromdate: fromdate.value,
            todate: todate.value
        });
        saleslist.value = response.data.map((sale) => ({
            ...sale,
            date: moment(sale.date).format('YYYY-MM-DD HH:mm:ss')
        }));
    } catch (error) {
        console.error('Error fetching sales data:', error);
        showToast('error', 'Error', error.message, 3000);
    } finally {
        isLoading.value = false;
    }
};

// Handle page change
const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    limit.value = perPage.value;
    offset.value = (currentPage.value - 1) * perPage.value;
    updatearrays();
};

// Export to CSV
const getrpt = () => {
    const d = new Date();
    const filename = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
    const data = saleslist.value.map((row) => ({
        ID: row.id,
        'Sale ID': row.code,
        'Transaction Date': row.date,
        QTY: row.sales_items.length,
        'Total(KES)': row.grand_total,
        'Payment Method': row.paymethod,
        status: row.status
    }));
    const csvRows = [Object.keys(data[0]).join(',')];
    data.forEach((row) => {
        const values = Object.values(row).map((val) => `"${('' + val).replace(/"/g, '\\"')}"`);
        csvRows.push(values.join(','));
    });
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SalesList_${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Delete record
const deleterec = async (index, id, code) => {
    try {
        await posService.deleteSale(id);
        saleslist.value.splice(index, 1);
        showToast('success', 'Deleted', `${code} has been deleted.`, 3000);
    } catch (error) {
        showToast('error', 'Error', error.message, 3000);
    }
};

// Sale return
const saleReturn = (sale) => {
    selectedSale.value = sale;
    returnDialogVisible.value = true;
};

// ActionItems for the dropdown menu
const getActionItems = (saleData) => {
    const items = [];
    
    if (hasPermission('view_sales')) {
        items.push({
            label: 'View',
            icon: 'pi pi-eye',
            command: () => viewSale(saleData)
        });
    }
    
    if (hasPermission('change_sales')) {
        items.push({
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => editSale(saleData)
        });
    }
    
    if (hasPermission('delete_sales')) {
        items.push({
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => confirmDeleteSale(saleData.index, saleData.id, saleData.sale_id),
            className: 'text-red-500'
        });
    }
    
    if (hasPermission('change_sales')) {
        items.push({
            label: 'Edit Shipping',
            icon: 'pi pi-truck',
            command: () => editShipping(saleData)
        });
    }
    
    if (hasPermission('view_sales')) {
        items.push({
            label: 'Print Invoice',
            icon: 'pi pi-print',
            command: () => fetchReceiptData(saleData.id)
        });
        
        items.push({
            label: 'Packing Slip',
            icon: 'pi pi-file',
            command: () => generatePackingSlip(saleData)
        });
        
        items.push({
            label: 'Delivery Note',
            icon: 'pi pi-file-pdf',
            command: () => generateDeliveryNote(saleData)
        });
    }
    
    if (items.length > 0) {
        items.push({ separator: true });
    }
    
    if (hasPermission('view_sales')) {
        items.push({
            label: 'View Payments',
            icon: 'pi pi-money-bill',
            command: () => viewPayments(saleData)
        });
        
        items.push({
            label: 'Sale Return',
            icon: 'pi pi-history',
            command: () => saleReturn(saleData)
        });
        
        items.push({
            label: 'Add Payment',
            icon: 'pi pi-money-bill',
            command: () => openPaymentModal(saleData)
        });
    }
    
    return items;
};

// Fetch receipt data
const fetchReceiptData = async (id) => {
    try {
        const response = await posService.getSaleReceiptData({ id });
        receiptData.value = response.data;
        showReceiptDialog();
    } catch (error) {
        showToast('error', 'Error', error.message, 3000);
    }
};

// Confirm delete dialog
const confirmDeleteSale = (index, id, code) => {
    confirm.require({
        message: `Are you sure you want to delete sale #${code}?`,
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleterec(index, id, code),
        reject: () => {}
    });
};

// View sale details
const viewSale = (sale) => {
    showToast('info', 'Info', `Viewing sale ${sale.sale_id}`, 3000);
    // Implement view sale logic
};

// Edit sale
const editSale = (sale) => {
    showToast('info', 'Info', `Editing sale ${sale.sale_id}`, 3000);
    // Implement edit sale logic
};

// Edit shipping
const editShipping = (sale) => {
    showToast('info', 'Info', `Editing shipping for ${sale.sale_id}`, 3000);
    // Implement edit shipping logic
};

// Generate packing slip
const generatePackingSlip = (sale) => {
    showToast('info', 'Info', `Generating packing slip for ${sale.sale_id}`, 3000);
    // Implement packing slip generation
};

// Generate delivery note
const generateDeliveryNote = (sale) => {
    showToast('info', 'Info', `Generating delivery note for ${sale.sale_id}`, 3000);
    // Implement delivery note generation
};

// View payments
const viewPayments = (sale) => {
    showToast('info', 'Info', `Viewing payments for ${sale.sale_id}`, 3000);
    // Implement view payments logic
};

// Open payment modal
const openPaymentModal = (saleData) => {
    selectedSaleId.value = saleData.id;
    showPaymentModal.value = true;
};

// Show receipt dialog
const showReceiptDialog = () => {
    receiptVisible.value = true;
};

// Mounted lifecycle hook
onMounted(() => {
    updatearrays();
});
</script>

<template>
    <div v-if="hasPermission('view_sales')" class="p-4">
        <Spinner :isLoading="isLoading" :title="spinner_title" />
        <div class="flex justify-between mb-4">
            <div class="flex gap-4">
                <Button 
                    v-if="hasPermission('add_sales')" 
                    label="Add Sale" 
                    icon="pi pi-plus" 
                    class="p-button-warning" 
                />
                <Button 
                    v-if="hasPermission('view_sales')" 
                    label="Export to CSV" 
                    icon="pi pi-file-export" 
                    class="p-button-secondary" 
                    @click="getrpt" 
                />
                <Button 
                    v-if="hasPermission('view_sales')" 
                    label="Print PDF" 
                    icon="pi pi-print" 
                    class="p-button-secondary" 
                />
            </div>
            <div class="flex gap-4">
                <Dropdown v-model="status" :options="['Pending', 'Paid', 'Due', 'Draft', 'Final', 'Overdue', 'Partial']" placeholder="Status" class="w-32" />
                <Calendar v-model="fromdate" placeholder="From Date" class="w-32" />
                <Calendar v-model="todate" placeholder="To Date" class="w-32" />
                <Button icon="pi pi-filter" class="p-button-primary" @click="updatearrays" />
            </div>
        </div>
        <DataTable :value="saleslist" :paginator="true" :rows="perPage" :totalRecords="totalRows" :sortField="sortBy" :sortOrder="sortDesc ? -1 : 1" :filters="filter" :filterFields="filterOn" @page="handlePageChange" class="p-datatable-responsive">
            <Column header="Actions" class="w-10">
                <template #body="slotProps">
                    <div class="flex">
                        <Button
                            icon="pi pi-ellipsis-v"
                            class="p-button-text p-button-rounded"
                            @click="
                                menu.toggle($event);
                                selectedSale = slotProps.data;
                            "
                            aria-haspopup="true"
                            aria-controls="sale_menu"
                        />
                    </div>
                    <Menu id="sale_menu" ref="menu" :model="getActionItems(slotProps.data)" :popup="true" />
                </template>
            </Column>
            <Column v-for="field in fields" :key="field.key" :field="field.key" :header="field.label" :sortable="field.sortable" />
        </DataTable>
        <Dialog v-model:visible="receiptVisible" header="Print Receipt" :style="{ width: '50vw' }" :modal="true">
            <div class="flex justify-center">
                <Receipt v-if="receiptData" :items="receiptData && receiptData.sales_items" :total="receiptData && receiptData.total" :receiptNo="receiptData && receiptData.sale_id" :paymentMethod="receiptData && receiptData.payment_method" />
            </div>
        </Dialog>

        <Dialog v-model:visible="returnDialogVisible" header="Sale Return" :style="{ width: '80vw' }" :modal="true">
            <AddSaleReturn :sale="selectedSale" @cancel="returnDialogVisible = false" @update-array="updatearrays" v-if="selectedSale" />
        </Dialog>
    </div>
    <div v-else class="p-4 text-center">
        <div class="text-red-500 text-xl font-semibold mb-4">Access Denied</div>
        <p class="text-gray-600">You don't have permission to view sales.</p>
    </div>
</template>
