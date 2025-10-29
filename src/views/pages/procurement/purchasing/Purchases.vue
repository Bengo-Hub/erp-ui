<script setup>
import AddPurchase from '@/components/purchase/AddPurchase.vue';
import reportdet from '@/components/report/header.vue';
import ApprovalWorkflow from '@/components/shared/ApprovalWorkflow.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { procurementService } from '@/services/procurement/procurementService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Reactive state
const title = ref('Purchase List');
const purchases = ref([]);
const totalRows = ref(1);
const currentPage = ref(1);
const perPage = ref(25);
const pageOptions = ref([1, 5, 10, 25, 50, 100, 500, 1000, 1500, 2000]);
const filter = ref(null);
const filterOn = ref([]);
const sortBy = ref('purchase_id');
const sortDesc = ref(false);
const total = ref(0);
const purchaseItem = ref(null);
const purchaseID = ref(0);
const purchaseitems = ref([]);
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
    { key: 'id', label: '#', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'purchase_id', label: 'Ref No.', sortable: true },
    { key: 'supplier.name', label: 'Supplier', sortable: true },
    { key: 'purchase_status', label: 'Purchase Status', sortable: true },
    { key: 'payment_status', label: 'Payment Status', sortable: true },
    { key: 'purchase_items[0].branch.name', label: 'Branch', sortable: true },
    { key: 'grand_total', label: 'Total Amount', sortable: true },
    { key: 'payment_due', label: 'Payment Due', sortable: true },
    { key: 'added_by', label: 'Added By', sortable: true },
    { key: 'action', label: 'Action', sortable: false }
]);
const isLoading = ref(false);
const spinner_title = ref('Loading data...');
const isAddPurchaseModalVisible = ref(false);
const isPrintModalVisible = ref(false);
const isReceiptModalVisible = ref(false);
const approvalSteps = ref([]);
const currentStage = ref('');
const userRole = ref('');

// Computed properties
const rows = computed(() => purchases.value.length);

// Methods
const updatearrays = async () => {
    isLoading.value = true;
    try {
        const params = {
            limit: limit.value,
            offset: offset.value,
            status: status.value,
            fromdate: fromdate.value,
            todate: todate.value
        };
        const response = await procurementService.getPurchases(params);
        totalRows.value = response.data.count;
        purchases.value = response.data.results.map((item) => ({
            ...item,
            date: moment(item.date).format('YYYY-MM-DD HH:mm:ss')
        }));
    } catch (error) {
        showToast('error', 'Error', error.message, 3000);
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
const openModal = (modal) => {
    if (modal === 'purchase') {
        isAddPurchaseModalVisible.value = true;
    } else if (modal === 'purchase') {
        isPrintModalVisible.value = true;
    } else if (modal === 'receipt') {
        isReceiptModalVisible.value = true;
    }
};
const printpdf = (pl) => {};

const getrpt = () => {
    // Implementation for exporting to CSV
};

const deletePurchase = async (id) => {
    try {
        await procurementService.deletePurchase(id);
        showToast('success', 'Success', 'Purchase deleted successfully!', 3000);
        updatearrays();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete purchase', 3000);
    }
};

const viewReceipt = (saleitem) => {
    isReceiptModalVisible.value = true;
    total.value = saleitem.grand_total;
    receiptNo.value = saleitem.code;
    paymentMethod.value = saleitem.paymethod;
    salesitems.value = saleitem.sales_items.map((i) => ({
        product_title: i.product_title,
        retail_price: i.retail_price,
        quantity: i.qty
    }));
};

function fetchApprovalSteps(purchaseId) {
    // Fetch approval steps for the given purchase
    approvalSteps.value = [
        { stage: 'Draft', date: '2025-05-01', status: 'completed', approver: { name: 'John Smith' }, notes: 'Purchase initiated.' },
        { stage: 'Quality Check', date: '2025-05-15', status: 'pending', approver: null, notes: '' }
    ];
}

// Lifecycle hooks
onMounted(() => {
    updatearrays();
});
</script>

<template>
    <div class="p-4">
        <Spinner :isLoading="isLoading" :title="spinner_title" />
        <div class="flex justify-between mb-4">
            <div class="flex gap-2">
                <Button label="Add New" icon="pi pi-plus" class="p-button-warning" @click="openModal('purchase')" />
                <Button label="Export to CSV" icon="pi pi-download" class="p-button-secondary" @click="getrpt" />
                <Button label="Print PDF" icon="pi pi-print" class="p-button-secondary" @click="printpdf('p')" />
            </div>
            <div class="flex gap-2">
                <Dropdown v-model="status" :options="['pending', 'paid', 'due', 'draft', 'final', 'overdue', 'partial']" placeholder="Status" class="w-32" />
                <Calendar v-model="fromdate" placeholder="From Date" class="w-32" />
                <Calendar v-model="todate" placeholder="To Date" class="w-32" />
                <Button label="Filter" icon="pi pi-filter" class="p-button-primary" @click="updatearrays" />
            </div>
        </div>
        <div class="flex justify-between mb-4">
            <div class="flex gap-2">
                <label class="flex items-center">
                    Show
                    <Dropdown v-model="perPage" :options="pageOptions" class="w-20 ml-2" @change="handlePageChange(currentPage)" />
                    entries
                </label>
            </div>
            <div class="flex gap-2">
                <label class="flex items-center">
                    Search:
                    <InputText v-model="filter" class="ml-2" />
                </label>
            </div>
        </div>
        <DataTable :value="purchases" :paginator="true" :rows="perPage" :totalRecords="totalRows" :sortField="sortBy" :sortOrder="sortDesc ? -1 : 1" :filters="filter" @page="handlePageChange">
            <Column v-for="field in fields" :key="field.key" :field="field.key" :header="field.label" :sortable="field.sortable" />
            <Column header="Action">
                <template #body="data">
                    <Button icon="pi pi-eye" class="p-button-text" @click="viewReceipt(data.data)" />
                    <Button icon="pi pi-pencil" class="p-button-text" @click="edit(data.data)" />
                    <Button icon="pi pi-trash" class="p-button-text" @click="deletePurchase(data.data.id)" />
                </template>
            </Column>
        </DataTable>
        <Dialog v-model:visible="isAddPurchaseModalVisible" header="Add Purchase" :modal="true">
            <AddPurchase @confirmReturn="handleOk" />
        </Dialog>
        <Dialog v-model:visible="isReceiptModalVisible" header="Print Receipt" :modal="true">
            <Receipt :items="salesitems" :headers="receiptHeaders" :total="total" :paymentMethod="paymentMethod" :receiptNo="paycode" />
        </Dialog>
        <Dialog v-model:visible="isPrintModalVisible" header="Print PDF" :modal="true">
            <reportdet :title="title" :orderData="orderData" :pl="pl" :headers="headers" :uniqueCars="uniqueCars" :shome="showme" />
        </Dialog>

        <!-- Approval Workflow Section -->
        <ApprovalWorkflow :approvalSteps="approvalSteps" :currentStage="currentStage" :userRole="userRole" @approve="handleApproval" />
    </div>
</template>

<style scoped>
/* Add Tailwind CSS classes as needed */
</style>
