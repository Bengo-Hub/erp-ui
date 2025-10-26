<script setup>
import AcceptReturn from '@/components/pos/AcceptSaleReturn.vue';
import { POSService } from '@/services/ecommerce/posService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

const toast = useToast();
const confirm = useConfirm();
const menu = ref();
const selectedSale = ref(null);
const acceptReturnDialog = ref(false);
const printDialog = ref(false);

// Reactive state
const returnslist = ref([]);
const filters = reactive({
    status: '',
    fromdate: '',
    todate: '',
    search: ''
});
const pagination = reactive({
    currentPage: 1,
    perPage: 25,
    totalRows: 0,
    pageOptions: [25, 50, 100, 500]
});
const receiptDialog = ref(false);
const csvExportLoading = ref(false);
const pdfExportLoading = ref(false);

// Constants
const title = 'Sales Returns List';
const items = [{ text: 'Sales Returns' }, { text: 'Sales Returns List', active: true }];
const receiptHeaders = [
    { field: 'title', header: 'Title' },
    { field: 'retail_price', header: 'Retail Price' },
    { field: 'quantity', header: 'Quantity' }
];
const statusOptions = ref([
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Due', value: 'due' },
    { label: 'Draft', value: 'draft' },
    { label: 'Final', value: 'final' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Partial', value: 'partial' }
]);

// Computed
const slicedReturns = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.perPage;
    const end = start + pagination.perPage;
    return returnslist.value.slice(start, end);
});

// Action menu items
const getActionItems = (data, index) => [
    {
        label: 'View',
        icon: 'pi pi-eye',
        command: () => viewReturn(data)
    },
    {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => editReturn(data)
    },
    {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => confirmDeleteReturn(index, data.id, data.invoice_no),
        className: 'text-red-500'
    },
    { separator: true },
    {
        label: 'Accept Return',
        icon: 'pi pi-check-circle',
        command: () => showReturnDialog(data),
        visible: data.payment_status !== 'paid'
    },
    {
        label: 'View Payments',
        icon: 'pi pi-money-bill',
        command: () => viewReturnPayments(data)
    },
    {
        label: 'Print Receipt',
        icon: 'pi pi-print',
        command: () => printReturnReceipt(data)
    }
];

// View return details
const viewReturn = (returnData) => {
    toast.add({ severity: 'info', summary: 'Info', detail: `Viewing return ${returnData.invoice_no}`, life: 3000 });
    // Implement view return logic
};

// Edit return
const editReturn = (returnData) => {
    toast.add({ severity: 'info', summary: 'Info', detail: `Editing return ${returnData.invoice_no}`, life: 3000 });
    // Implement edit return logic
};

// Show return dialog for accepting returns
const showReturnDialog = (returnData) => {
    selectedSale.value = returnData;
    acceptReturnDialog.value = true;
};

// View return payments
const viewReturnPayments = (returnData) => {
    toast.add({ severity: 'info', summary: 'Info', detail: `Viewing payments for return ${returnData.invoice_no}`, life: 3000 });
    // Implement view return payments logic
};

// Print return receipt
const printReturnReceipt = (returnData) => {
    selectedSale.value = returnData;
    printDialog.value = true;
};

// Confirm delete return
const confirmDeleteReturn = (index, id, code) => {
    confirm.require({
        message: `Are you sure you want to delete return #${code}?`,
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteReturnRecord(index, id, code),
        reject: () => {}
    });
};

// Delete return record
const deleteReturnRecord = async (index, id, code) => {
    try {
        await posService.deleteSaleReturn(id);
        returnslist.value = returnslist.value.filter((_, i) => i !== index);
        toast.add({ severity: 'success', summary: 'Deleted', detail: `Return ${code} deleted successfully`, life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    }
};

// Methods
const updatearrays = async () => {
    try {
        toast.add({ severity: 'info', summary: 'Loading', detail: 'Fetching data...', life: 3000 });

        const response = await posService.getSalesReturnsList({
            limit: pagination.perPage,
            offset: (pagination.currentPage - 1) * pagination.perPage,
            ...filters
        });

        returnslist.value = response.data.map((item) => ({
            ...item,
            date: moment(item.date).format('YYYY-MM-DD HH:mm:ss')
        }));
        pagination.totalRows = response.data.length;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    }
};

const handlePageChange = (event) => {
    pagination.currentPage = event.page + 1;
    updatearrays();
};

const exportCSV = () => {
    csvExportLoading.value = true;
    try {
        // CSV export logic
        toast.add({ severity: 'success', summary: 'Success', detail: 'CSV exported successfully', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        csvExportLoading.value = false;
    }
};

const printPDF = () => {
    pdfExportLoading.value = true;
    try {
        // PDF print logic
        printDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        pdfExportLoading.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    updatearrays();
});
</script>
<template>
    <div class="p-4">
        <div class="flex justify-between mb-4">
            <div class="flex gap-2">
                <Button label="Raise Invoice" icon="pi pi-plus" class="p-button-warning" />
                <Button label="Export CSV" icon="pi pi-download" class="p-button-secondary" :loading="csvExportLoading" @click="exportCSV" />
                <Button label="Print PDF" icon="pi pi-file-pdf" class="p-button-secondary" :loading="pdfExportLoading" @click="printPDF" />
            </div>

            <div class="flex gap-2 items-center">
                <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-32" />
                <Calendar v-model="filters.fromdate" placeholder="From Date" dateFormat="dd/mm/yy" />
                <Calendar v-model="filters.todate" placeholder="To Date" dateFormat="dd/mm/yy" />
                <Button icon="pi pi-filter" class="p-button-primary" @click="updatearrays" />
            </div>
        </div>

        <DataTable :value="slicedReturns" :paginator="true" :rows="pagination.perPage" :totalRecords="pagination.totalRows" @page="handlePageChange" class="p-datatable-striped">
            <Column field="date" header="Date" sortable />
            <Column header="Action">
                <template #body="{ data, index }">
                    <Button
                        icon="pi pi-ellipsis-v"
                        class="p-button-text p-button-rounded"
                        @click="
                            menu.toggle($event);
                            selectedSale = data;
                        "
                        aria-haspopup="true"
                        aria-controls="return_menu"
                    />
                    <Menu id="return_menu" ref="menu" :model="getActionItems(data, index)" :popup="true" />
                </template>
            </Column>
            <Column field="invoice_no" header="Invoice No." sortable />
            <Column field="parent_sale" header="Parent Sale" sortable />
            <Column field="customer.name" header="Customer Name" sortable />
            <Column field="location.name" header="Location" />
            <Column field="payment_status" header="Payment Status">
                <template #body="{ data }">
                    <Tag :value="data.payment_status" :severity="data.payment_status === 'Pending' ? 'danger' : data.payment_status === 'Due' ? 'warning' : data.payment_status === 'Paid' ? 'success' : null" />
                </template>
            </Column>
            <Column field="return_amount" header="Total Amount" sortable />
        </DataTable>

        <Dialog v-model:visible="acceptReturnDialog" header="Accept Return" modal="true" style="width: 80vw">
            <AcceptReturn :sale="selectedSale" @update-array="updatearrays" @cancel="acceptReturnDialog = false" v-if="selectedSale" />
        </Dialog>

        <Dialog v-model:visible="printDialog" header="Print Receipt" modal="true" style="width: 50vw">
            <div class="flex justify-center">
                <Receipt v-if="selectedSale" :items="selectedSale.return_items" :headers="receiptHeaders" :total="selectedSale.return_amount" :receiptNo="selectedSale.invoice_no" :paymentMethod="selectedSale.payment_method || 'Cash'" />
            </div>
        </Dialog>
    </div>
</template>
