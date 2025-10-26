<script setup>
import { POSService } from '@/services/ecommerce/posService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

// Props
const props = defineProps({
    close_register: {
        type: Boolean,
        default: false
    }
});

// Data
const register = ref(null);
const soldItems = ref([]);
const paymentMethods = ref({});
const salesByBrand = ref([]);
const sale_data = ref({});
const user = ref(JSON.parse(sessionStorage.user));
const business = ref(JSON.parse(sessionStorage.getItem('business')));
const now = ref(new Date());
const isProcessing = ref(false);
const spinner_title = ref('Loading...');

// Close register modal state
const showCloseModal = ref(false);
const closingBalance = ref(0);
const closingNotes = ref('');

// Methods
const updatearrays = async () => {
    isProcessing.value = true;
    try {
        const params = {
            user_id: user.value.id,
            branch_id: business.value.branch_code // Using branch_code as branch_id for now
        };
        const response = await posService.getRegisterSummary(params);
        const data = response.data;

        register.value = data.registerDetails;
        soldItems.value = data.sold_products || [];
        sale_data.value = data.sales_data || [];
        salesByBrand.value = data.sold_products_by_brand || [];
        paymentMethods.value = data.payment_methods || {};
    } catch (error) {
        console.error('Register summary error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.detail || 'Failed to fetch register details.',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};

const closeRegister = async () => {
    if (!closingBalance.value || closingBalance.value < 0) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please provide a valid closing balance.',
            life: 3000
        });
        return;
    }

    isProcessing.value = true;
    try {
        const closeData = {
            closing_balance: closingBalance.value,
            notes: closingNotes.value || `Register closed by ${user.value.fullname || user.value.username}`
        };

        const response = await posService.closeRegister(register.value.id, closeData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Register closed successfully!',
            life: 3000
        });

        // Refresh register data
        await updatearrays();
        showCloseModal.value = false;

        // Reset form
        closingBalance.value = 0;
        closingNotes.value = '';
    } catch (error) {
        console.error('Close register error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.detail || error.response?.data?.message || 'Failed to close register.',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};

const generatePDF = () => {
    const doc = new jsPDF();
    let y = 15;

    // Title
    doc.setFontSize(18);
    doc.text(`Register Details(${moment(register.value.opened_at).format('DD/MM/YYYY HH:mm')} - ${moment(now.value).format('DD/MM/YYYY HH:mm')})`, 15, y);
    y += 10;

    // Payment Method
    doc.setFontSize(14);
    doc.text('Payment Method                                    Sale                                        Expense', 15, y);
    y += 10;

    // Loop through payment methods
    Object.entries(paymentMethods.value).forEach(([methodName, amount]) => {
        doc.setFontSize(12);
        doc.text(`${methodName}:`, 15, y);
        doc.text(`${formatCurrency(amount)}`, 100, y);
        doc.text(`${formatCurrency(0)}`, 160, y); // Expense placeholder
        y += 10;
    });

    // Summary
    y += 10;
    const totalSales = soldItems.value.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    doc.text(`Total Sales:                                              ${formatCurrency(totalSales)}`, 15, y);
    y += 10;
    doc.text(`Total Refund:                                           ${formatCurrency(0)}`, 15, y); // Placeholder
    y += 10;
    doc.text(`Total Payment:                                        ${formatCurrency(totalSales)}`, 15, y);
    y += 10;
    doc.text(`Credit Sales:                                            ${formatCurrency(0)}`, 15, y); // Placeholder
    y += 10;

    // Details of products sold
    y += 10;
    doc.text('Details of products sold', 15, y);
    y += 5;

    // Loop through sold products
    const h1 = ['#', 'SKU', 'Product', 'Quantity', 'Amount'];
    const b1 = soldItems.value.map((row, index) => [index + 1, row.stock_item__product__sku || 'N/A', row.stock_item__product__title || 'N/A', row.total_quantity || 0, formatCurrency(row.total_amount || 0)]);

    if (b1.length > 0) {
        doc.autoTable({
            head: [h1],
            body: b1,
            startY: y,
            theme: 'striped'
        });
    }

    // Sold by brand
    if (salesByBrand.value.length > 0) {
        y = doc.autoTable.previous.finalY + 10;
        doc.text('Details of products sold (By Brand)', 15, y);
        const h2 = ['#', 'Brand', 'Quantity', 'Amount'];
        const b2 = salesByBrand.value.map((row, index) => [index + 1, row.stock_item__product__brand__title || 'N/A', row.total_quantity || 0, formatCurrency(row.total_amount || 0)]);
        doc.autoTable({
            head: [h2],
            body: b2,
            startY: y + 5,
            theme: 'striped'
        });
    }

    // User details
    y = doc.autoTable.previous.finalY + 10;
    doc.text(`User: ${user.value.fullname || user.value.username}`, 15, y);
    doc.text(`Email: ${user.value.email}`, 15, y + 10);
    doc.text(`Business Branch: ${business.value.branch_name}`, 15, y + 20);

    // Open PDF in new window
    const previewLink = doc.output('bloburl');
    const openedDoc = window.open(previewLink, 'Receipt', 'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes,top=000,left=500,width=1000,height=1500');
    openedDoc.focus();
};

// Lifecycle Hooks
onMounted(() => {
    updatearrays();
});
</script>

<template>
    <div class="container-fluid overflow-auto p-4">
        <Card class="mb-4" v-if="register">
            <template #title> Register Details ({{ formatDate(register.opened_at) }} - {{ formatDate(now) }}) </template>
            <template #content>
                <div class="mb-6">
                    <h6 class="text-lg font-semibold mb-2">Payment Methods</h6>
                    <DataTable :value="Object.entries(paymentMethods).map(([method, amount]) => ({ method, amount }))" class="p-datatable-striped">
                        <Column field="method" header="Payment Method"></Column>
                        <Column field="amount" header="Amount">
                            <template #body="{ data }">
                                {{ formatCurrency(data.amount) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <div class="mb-6">
                    <h6 class="text-lg font-semibold">Summary</h6>
                    <div class="grid grid-cols-2 gap-4">
                        <div>Total Sales:</div>
                        <div class="text-right">{{ formatCurrency(soldItems.reduce((sum, item) => sum + (item.total_amount || 0), 0)) }}</div>
                        <div>Total Refund:</div>
                        <div class="text-right">{{ formatCurrency(0) }}</div>
                        <div>Total Payment:</div>
                        <div class="text-right">{{ formatCurrency(soldItems.reduce((sum, item) => sum + (item.total_amount || 0), 0)) }}</div>
                        <div>Credit Sales:</div>
                        <div class="text-right">{{ formatCurrency(0) }}</div>
                        <div>Total Expense:</div>
                        <div class="text-right">{{ formatCurrency(0) }}</div>
                    </div>
                </div>

                <Divider class="my-4" />

                <div class="mb-6">
                    <h6 class="text-lg font-semibold mb-2">Products Sold</h6>
                    <DataTable :value="soldItems" class="p-datatable-striped">
                        <Column field="index" header="#">
                            <template #body="{ index }">
                                {{ index + 1 }}
                            </template>
                        </Column>
                        <Column field="stock_item__product__sku" header="SKU"></Column>
                        <Column field="stock_item__product__title" header="Product"></Column>
                        <Column field="total_quantity" header="Quantity"></Column>
                        <Column field="total_amount" header="Total Amount">
                            <template #body="{ data }">
                                {{ formatCurrency(data.total_amount) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <div class="mb-6" v-if="salesByBrand.length > 0">
                    <h6 class="text-lg font-semibold mb-2">Products Sold (By Brand)</h6>
                    <DataTable :value="salesByBrand" class="p-datatable-striped">
                        <Column field="index" header="#">
                            <template #body="{ index }">
                                {{ index + 1 }}
                            </template>
                        </Column>
                        <Column field="stock_item__product__brand__title" header="Brand"></Column>
                        <Column field="total_quantity" header="Quantity"></Column>
                        <Column field="total_amount" header="Total Amount">
                            <template #body="{ data }">
                                {{ formatCurrency(data.total_amount) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <Divider class="my-4" />

                <div class="mb-6">
                    <h6 class="text-lg font-semibold">User Details</h6>
                    <div>
                        User: <strong>{{ user.fullname || user.username }}</strong>
                    </div>
                    <div>
                        Email: <strong>{{ user.email }}</strong>
                    </div>
                    <div>
                        Business Branch: <strong>{{ business.branch_name }}</strong>
                    </div>
                </div>
            </template>
        </Card>

        <div class="flex justify-end gap-4 mt-4">
            <Button v-if="close_register && register?.is_open" label="Close Register" class="p-button-secondary" @click="showCloseModal = true" />
            <Button label="Print" icon="pi pi-print" class="p-button-primary" @click="generatePDF" />
        </div>

        <!-- Close Register Modal -->
        <Dialog v-model:visible="showCloseModal" modal header="Close Register" :style="{ width: '450px' }">
            <div class="flex flex-col space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Closing Balance:</label>
                    <InputNumber v-model="closingBalance" class="w-full" placeholder="Enter closing balance" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional):</label>
                    <Textarea v-model="closingNotes" class="w-full" placeholder="Enter any notes about closing the register" rows="3" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showCloseModal = false" />
                <Button label="Close Register" class="p-button-danger" @click="closeRegister" :loading="isProcessing" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.container-fluid {
    max-width: 100%;
    margin: 0 auto;
}
</style>
