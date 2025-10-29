<script setup>
import ProcessPurchaseReturn from '@/components/purchase/ProcessPurchaseReturn.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { procurementService } from '@/services/procurement/procurementService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

// Reactive state
const title = ref('Sales Returns List');
const returnslist = ref([]);
const totalRows = ref(1);
const currentPage = ref(1);
const perPage = ref(25);
const pageOptions = ref([1, 5, 10, 25, 50, 100, 500, 1000, 1500, 2000]);
const filter = ref('');
const sortBy = ref('return_id');
const sortDesc = ref(false);
const total = ref(0);
const sale = ref(0);
const paymentMethod = ref('');
const status = ref('');
const fromdate = ref('');
const todate = ref('');
const limit = ref(12);
const offset = ref(0);
const receiptHeaders = ref([
    { text: 'Title', value: 'title', sortable: true },
    { text: 'retail_price', value: 'retail_price', sortable: true },
    { text: 'Quantity', value: 'quantity', sortable: true }
]);
const paycode = ref('');
const fields = ref([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'action', label: 'Action', sortable: false },
    { key: 'invoice_no', label: 'Invoice No.', sortable: true },
    { key: 'return', label: 'Parent Sale.', sortable: true },
    { key: 'supplier.name', label: 'Customer Name', sortable: true },
    { key: 'branch.name', label: 'Branch', sortable: false },
    { key: 'payment_status', label: 'Payment Status', sortable: true },
    { key: 'reason', label: 'Return Reason', sortable: true },
    { key: 'return_amount', label: 'Total Amount', sortable: true },
    { key: 'return_amount_due', label: 'Payment Due', sortable: true }
]);
const isLoading = ref(false);
const spinner_title = ref('Loading data...');

const rows = computed(() => returnslist.value.length);

onMounted(() => {
    updatearrays();
    totalRows.value = returnslist.value.length;
});

const onFiltered = (filteredItems) => {
    totalRows.value = filteredItems.length;
    currentPage.value = 1;
};

const updatearrays = async () => {
    isLoading.value = true;
    try {
        const response = await procurementService.getPurchaseReturns({
            limit: limit.value,
            offset: offset.value,
            status: status.value,
            fromdate: fromdate.value,
            todate: todate.value
        });
        returnslist.value = response.data.results.map((item) => ({
            ...item,
            date: moment(item.date).format('YYYY-MM-DD HH:mm:ss')
        }));
        totalRows.value = response.data.count;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    limit.value = perPage.value;
    offset.value = (currentPage.value - 1) * perPage.value;
    updatearrays();
};

const printpdf = (pl) => {
    const data = returnslist.value.map((row) => ({
        ID: row.id,
        'Invoice ID': row.return_id,
        'Return Date': row.date,
        'Total Amount': row.return_amount,
        status: row.payment_status
    }));

    const headers = Object.keys(data[0]);
    const cars = [];
    Object.entries(data).forEach(([key, value]) => {
        cars.push(Object.values(data[key]));
    });

    const uniqueCars = Array.from(new Set(cars));
    headers.value = headers;
    uniqueCars.value = uniqueCars;
};

const getrpt = () => {
    const d = new Date();
    const filename = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
    const data = returnslist.value.map((row) => ({
        ID: row.id,
        'Invoice ID': row.return_id,
        'Return Date': row.date,
        'Total Amount': row.return_amount,
        status: row.payment_status
    }));

    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map((header) => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'textcsv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${title.value}${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const deleterec = async (index, id, code) => {
    try {
        await procurementService.deletePurchaseReturn(id);
        returnslist.value.splice(index, 1);
        toast.add({ severity: 'success', summary: 'Deleted', detail: `${code} has been deleted.`, life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
};

const viewReceipt = (saleitem) => {
    total.value = saleitem.return_amount;
    receiptNo.value = saleitem.return_id;
    paymentMethod.value = 'cash';
    salesitems.value = saleitem.return_items.map((i) => ({
        product_title: i.product_title,
        quantity: i.quantity
    }));
};

const saleRefund = (saleItem) => {
    sale.value = saleItem;
};

const handleOk = async () => {
    await updatearrays();
};
</script>

<template>
    <div class="p-4">
        <h1 class="text-2xl font-bold mb-4">{{ title }}</h1>
        <div class="flex justify-between mb-4">
            <div class="flex space-x-4">
                <Dropdown v-model="status" :options="['pending', 'paid', 'due', 'draft', 'final', 'overdue', 'partial']" placeholder="Status" class="w-32" />
                <Calendar v-model="fromdate" placeholder="From Date" class="w-32" />
                <Calendar v-model="todate" placeholder="To Date" class="w-32" />
                <Button label="Filter" icon="pi pi-filter" @click="updatearrays" />
            </div>
        </div>
        <div class="flex justify-between mb-4">
            <div class="flex items-center space-x-2">
                <span>Show</span>
                <Dropdown v-model="perPage" :options="pageOptions" @change="handlePageChange(currentPage)" class="w-20" />
                <span>entries</span>
            </div>
            <div class="flex items-center space-x-2">
                <span>Search:</span>
                <InputText v-model="filter" type="search" class="w-48" />
            </div>
        </div>
        <DataTable :value="returnslist" :paginator="true" :rows="perPage" :totalRecords="totalRows" :filters="filter" :sortField="sortBy" :sortOrder="sortDesc ? -1 : 1" @filter="onFiltered" class="w-full">
            <Column v-for="field in fields" :key="field.key" :field="field.key" :header="field.label" :sortable="field.sortable" />
            <Column header="Action">
                <template #body="data">
                    <Dropdown
                        :model="[
                            { label: 'View', icon: 'pi pi-eye', command: () => {} },
                            { label: 'Edit', icon: 'pi pi-pencil', command: () => {} },
                            { label: 'Delete', icon: 'pi pi-trash', command: () => deleterec(data.index, data.item.id, data.item.invoice_no) },
                            { label: 'Accept Return', icon: 'pi pi-check-circle', command: () => saleRefund(data.item), visible: data.item.payment_status !== 'paid' },
                            { label: 'View Payments', icon: 'pi pi-eye', command: () => {} }
                        ]"
                    />
                </template>
            </Column>
        </DataTable>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
        <Dialog v-model:visible="showRefundModal" header="Accept Return" :style="{ width: '90vw' }" :modal="true">
            <ProcessPurchaseReturn :sale="sale" @confirmRefund="handleOk" @update-array="updatearrays" />
        </Dialog>
        <Dialog v-model:visible="showReceiptModal" header="Print Receipt" :style="{ width: '50vw' }" :modal="true">
            <Receipt :items="salesitems" :headers="receiptHeaders" :total="total" :paymentMethod="paymentMethod" :receiptNo="paycode" @printReceipt="viewReceipt" />
        </Dialog>
    </div>
</template>
