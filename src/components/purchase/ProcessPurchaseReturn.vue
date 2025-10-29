<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { procurementService } from '@/services/procurement/procurementService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const sale = defineProps(['sale']);

const receiptHeaders = ref([
    { text: 'Product Name', value: 'title', sortable: true },
    { text: 'Unit Price', value: 'unit_price', sortable: true },
    { text: 'Sale Quantity', value: 'quantity', sortable: true },
    { text: 'Return Subtotal', value: 'return_subtotal', sortable: true }
]);

const refund_method = ref({ title: 'Credit Customer Account', value: 'credit' });
const refund_methods = ref([
    { title: 'Cash', value: 'cash' },
    { title: 'Bank Transfer', value: 'bank' },
    { title: 'Debit Customer Account', value: 'debit' },
    { title: 'Credit Customer Account', value: 'credit' },
    { title: 'Credit Customer Advance Account', value: 'pay_cash_to_customer_account' }
]);

const pay_accounts = ref([{ title: 'None', value: null }]);

const pay_account = ref(null);
const pay_document = ref(null);
const refundTotal = ref(0);
const pay_note = ref('Paid in full');
const isLoading = ref(false);
const spinner_title = ref('Processing...');

onMounted(() => {
    refundTotal.value = parseFloat(sale.sale.return_amount_due);
});

const handleFileUpload = (event) => {
    pay_document.value = event.files[0];
};

const processRefund = async (data) => {
    try {
        await procurementService.processPurchaseReturnRefund(data);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Refund processed successfully!',
            life: 3000
        });
        emit('refund-processed');
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to process refund',
            life: 3000
        });
    }
};

const handleRefund = () => {
    const formdata = new FormData();
    formdata.append('return_id', sale.sale.invoice_no);
    formdata.append('pay_document', pay_document.value);
    formdata.append('pay_note', pay_note.value);
    formdata.append('refund_method', refund_method.value.value);
    formdata.append('invoice_no', sale.sale.invoice_no);
    formdata.append('refund_total', Number(refundTotal.value).toFixed(2));
    formdata.append('attendant_id', JSON.parse(sessionStorage.user).user.id);
    processRefund(formdata);
};

const clearValues = () => {
    refundTotal.value = 0;
    pay_note.value = 'Paid in full';
    pay_document.value = null;
};
</script>

<template>
    <div class="container mx-auto p-4">
        <Card class="border-2 border-warning rounded-lg">
            <template #title>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-gray-100 p-4 rounded-lg">
                        <h4 class="font-semibold">
                            Customer: <span class="font-bold">{{ sale.customer.name }}</span>
                        </h4>
                        <h4 class="font-semibold">
                            Business: <span class="font-bold">{{ sale.date }}</span>
                        </h4>
                    </div>
                    <div class="bg-gray-100 p-4 rounded-lg">
                        <h4 class="font-semibold">
                            Invoice No: <span class="font-bold">{{ sale.invoice_no }}</span>
                        </h4>
                        <h4 class="font-semibold">
                            Location: <span class="font-bold">{{ sale.location.name }}({{ sale.location.id }})</span>
                        </h4>
                    </div>
                    <div class="bg-gray-100 p-4 rounded-lg">
                        <h4 class="font-semibold">
                            Total Amount: <span class="font-bold">{{ new Intl.NumberFormat().format(sale.return_amount_due) }}</span>
                        </h4>
                        <h4 class="font-semibold">Note: <span>---</span></h4>
                    </div>
                </div>
            </template>
            <template #content>
                <div class="card">
                    <div class="card-title">
                        <h4 class="font-semibold">Advance Amount: <span class="font-bold">0.00</span></h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-1">
                            <label class="block font-semibold mb-2">Refund Method:</label>
                            <Dropdown v-model="refund_method" :options="refund_methods" optionLabel="title" optionValue="value" placeholder="Select Method" class="w-full" />
                        </div>
                        <div class="p-1">
                            <label class="block font-semibold mb-2">Amount: {{ refundTotal }}</label>
                            <InputNumber v-model="refundTotal" class="w-full" />
                        </div>
                        <div class="p-1">
                            <label class="block font-semibold mb-2">Payment Account:</label>
                            <Dropdown v-model="pay_account" :options="pay_accounts" optionLabel="title" optionValue="value" placeholder="Select..." class="w-full" disabled />
                        </div>
                        <div class="p-1">
                            <label class="block font-semibold mb-2">Attachment:</label>
                            <FileUpload mode="basic" name="file" :customUpload="true" @uploader="handleFileUpload" chooseLabel="Upload" class="w-full" />
                        </div>
                        <div class="p-1">
                            <label class="block font-semibold mb-2">Payment Note:</label>
                            <Textarea v-model="pay_note" rows="3" placeholder="Enter your text here..." class="w-full" />
                        </div>
                    </div>
                </div>
            </template>
        </Card>
        <Receipt :items="returncart" :headers="receiptHeaders" :total="Number(refundTotal).toFixed(2)" :paymentMethod="refund_method.title" :receiptNo="paycode" @printReceipt="submitRefund" v-show="false" />
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
}
</style>
