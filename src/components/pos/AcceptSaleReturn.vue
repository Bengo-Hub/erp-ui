<script setup>
import { formatCurrency } from '@/components/hrm/payroll/payslipGenerator';
import { posService } from '@/services/ecommerce/posService';
import { coreService } from '@/services/shared/coreService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import { useToast } from 'primevue/usetoast';
import { computed, defineEmits, defineProps, onMounted, ref } from 'vue';

const props = defineProps({
    sale: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['cancel', 'printReceipt', 'update-array']);
const toast = useToast();

// Data
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
const returncart = ref([]);
const paycode = ref('');
const beep_warning_sound = '@/assets/audio/beep-warning.mp3';
const beepConfirmSound = '@/assets/audio/confirm.mp3';
const processingRefund = ref(false);
const showReceipt = ref(false);

// Form validation
const isFormValid = computed(() => {
    const hasValidAmount = refundTotal.value > 0 && refundTotal.value <= props.sale.return_amount_due;
    const hasValidMethod = refund_method.value && refund_method.value.value;
    const hasValidAccount = refund_method.value.value !== 'bank' || (refund_method.value.value === 'bank' && pay_account.value && pay_account.value.value);
    const hasNote = pay_note.value.trim().length > 0;
    //console.log(`hasValidAmount: ${hasValidAmount}, hasValidMethod: ${hasValidMethod}, hasValidAccount: ${hasValidAccount}, hasNote: ${hasNote}`);

    return hasValidAmount && hasValidMethod && hasValidAccount && hasNote;
});

// Methods
const handleFileUpload = (event) => {
    pay_document.value = event.files[0];
    toast.add({
        severity: 'info',
        summary: 'File Selected',
        detail: `Selected file: ${pay_document.value.name}`,
        life: 3000
    });
};

const playBeepSound = (audio_url) => {
    const audio = new Audio(audio_url);
    audio.play();
};

const submitRefund = (data) => {
    posService.processSalesReturnRefund(data)
        .then((res) => {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Refund processed successfully',
                life: 3000
            });
            emit('printReceipt');
            emit('update-array');
            playBeepSound(beepConfirmSound);
            clearValues();
        })
        .catch((error) => {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Failed to process refund',
                life: 5000
            });
            playBeepSound(beep_warning_sound);
        });
};

const handleRefund = () => {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please complete all required fields correctly',
            life: 3000
        });
        return;
    }

    processingRefund.value = true;
    playBeepSound(beep_warning_sound);
    paycode.value = `REF-${Math.floor(Math.random() * 1000000)}`;

    // Prepare the returncart for the receipt
    returncart.value = [];
    if (props.sale && props.sale.return_items && props.sale.return_items.length > 0) {
        props.sale.return_items.forEach((item) => {
            returncart.value.push({
                title: item.title,
                unit_price: item.unit_price,
                quantity: item.quantity,
                return_subtotal: item.subtotal
            });
        });
    }

    // Show receipt which will call submitRefund
    showReceipt.value = true;
};

const clearValues = () => {
    refundTotal.value = 0;
    pay_note.value = 'Paid in full';
    returncart.value = [];
    paycode.value = '';
    pay_document.value = null;
};

// Lifecycle hooks
onMounted(() => {
    // Initialize values
    if (props.sale) {
        refundTotal.value = props.sale.return_amount_due;
    } else {
        refundTotal.value = 0;
    }

    // Get pay accounts from API or use default
    coreService
        .getBanks()
        .then((res) => {
            if (res.data && res.data.results.length > 0) {
                pay_accounts.value = res.data.results
                    .filter((account) => account.account_name.includes(props.sale.customer?.name))
                    .map((account) => ({
                        title: `${account.name} - ${account.account_number}`,
                        value: account.id
                    }));
            }
            console.log(pay_accounts.value);
        })
        .catch((err) => {
            console.error('Error fetching bank accounts:', err);
            pay_accounts.value = [{ title: 'Default Account', value: 1 }];
        });

    // Prepare return cart data
    if (props.sale && props.sale.return_items && props.sale.return_items.length > 0) {
        props.sale.return_items.forEach((item) => {
            returncart.value.push({
                title: item.title,
                unit_price: item.unit_price,
                quantity: item.quantity,
                return_subtotal: item.subtotal
            });
        });
    }
});
</script>
<template>
    <div class="container mx-auto p-4">
        <Card class="mb-6 border-2 border-yellow-500 rounded-lg shadow-md">
            <template #title>
                <div class="flex items-center text-xl font-bold text-blue-800">
                    <i class="pi pi-shopping-bag mr-2"></i>
                    Sale Return Details
                </div>
            </template>
            <template #subtitle>
                <div class="text-sm text-gray-600 italic">Process refund for return #{{ sale.invoice_no }}</div>
            </template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div class="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 transition-all hover:shadow-md">
                        <h4 class="mb-2 font-semibold text-gray-700">
                            <i class="pi pi-user mr-2 text-blue-500"></i>
                            Customer: <span class="font-bold text-blue-700">{{ sale.customer?.name || 'Walk-in Customer' }}</span>
                        </h4>
                        <h4 class="font-semibold text-gray-700">
                            <i class="pi pi-calendar mr-2 text-blue-500"></i>
                            Date: <span class="font-bold text-blue-700">{{ sale.date }}</span>
                        </h4>
                    </div>
                    <div class="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 transition-all hover:shadow-md">
                        <h4 class="mb-2 font-semibold text-gray-700">
                            <i class="pi pi-file-o mr-2 text-blue-500"></i>
                            Invoice No: <span class="font-bold text-blue-700">{{ sale.invoice_no }}</span>
                        </h4>
                        <h4 class="font-semibold text-gray-700">
                            <i class="pi pi-map-marker mr-2 text-blue-500"></i>
                            Location: <span class="font-bold text-blue-700">{{ sale.location?.name || 'Main Store' }} {{ sale.location?.id ? `(${sale.location.id})` : '' }}</span>
                        </h4>
                    </div>
                    <div class="bg-green-50 p-5 rounded-lg shadow-sm border border-green-200 transition-all hover:shadow-md">
                        <h4 class="mb-2 font-semibold text-gray-700">
                            <i class="pi pi-money-bill mr-2 text-green-500"></i>
                            Total Amount: <span class="font-bold text-green-700 text-lg">{{ formatCurrency(sale.return_amount_due) }}</span>
                        </h4>
                        <h4 class="font-semibold text-gray-700">
                            <i class="pi pi-info-circle mr-2 text-blue-500"></i>
                            Return Reason: <span class="text-gray-800">{{ sale.return_reason || '---' }}</span>
                        </h4>
                    </div>
                </div>

                <Card class="mb-4 shadow-md">
                    <template #title>
                        <div class="flex items-center text-xl font-bold text-blue-800">
                            <i class="pi pi-wallet mr-2"></i>
                            Refund Details
                        </div>
                    </template>
                    <template #subtitle>
                        <div class="flex justify-between items-center">
                            <div class="text-sm text-gray-600 italic">Process payment for returned items</div>
                            <div class="text-blue-700">Advance Amount: <span class="font-bold">KES 0.00</span></div>
                        </div>
                    </template>
                    <template #content>
                        <div class="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                            <div class="flex items-center text-blue-800">
                                <i class="pi pi-info-circle mr-2 text-lg"></i>
                                <p>
                                    The customer is eligible for a refund of <span class="font-bold text-green-700">{{ formatCurrency(sale.return_amount_due) }}</span> for this return.
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Refund Method:</label>
                                <Dropdown v-model="refund_method" :options="refund_methods" optionLabel="title" class="w-full" placeholder="Select Method" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Amount:</label>
                                <InputNumber v-model="refundTotal" mode="currency" currency="KES" locale="en-US" class="w-full" :min="0" :max="sale.return_amount_due" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Payment Account:</label>
                                <Dropdown v-model="pay_account" :options="pay_accounts" optionLabel="title" placeholder="Select Account" class="w-full" :disabled="refund_method.value !== 'bank'" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Attachment:</label>
                                <div class="flex items-center p-2 bg-white rounded border border-gray-300">
                                    <FileUpload mode="basic" :multiple="false" accept="image/*" :maxFileSize="1000000" @select="handleFileUpload" chooseLabel="Select Document" class="w-full" />
                                    <div v-if="pay_document" class="ml-2 text-sm text-green-600"><i class="pi pi-check"></i> {{ pay_document.name }}</div>
                                </div>
                            </div>
                            <div class="col-span-1 md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Payment Note:</label>
                                <Textarea v-model="pay_note" rows="3" class="w-full" placeholder="Enter details about this refund payment..." />
                            </div>

                            <div class="col-span-1 md:col-span-2 flex justify-between mt-4">
                                <Button label="Cancel" icon="pi pi-times" class="p-button-danger p-button-outlined" @click="$emit('cancel')" />

                                <Button label="Process Refund" icon="pi pi-check-circle" class="p-button-success p-button-raised" :disabled="!isFormValid" @click="handleRefund" />
                            </div>
                        </div>
                    </template>
                </Card>
            </template>
        </Card>

        <Receipt :items="returncart" :headers="receiptHeaders" :total="Number(refundTotal).toFixed(2)" :paymentMethod="refund_method.title" :receiptNo="paycode" @printReceipt="submitRefund" v-if="showReceipt" />

        <Dialog v-model:visible="processingRefund" modal header="Processing Refund" :closable="false">
            <div class="flex flex-col items-center justify-center p-6 text-center">
                <ProgressSpinner style="width: 50px; height: 50px" class="mb-4" />
                <h3 class="text-xl font-bold mb-2">Processing Refund</h3>
                <p class="text-gray-600">Please wait while we process your refund request...</p>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
/* Ensure responsive layout for mobile devices */
@media (max-width: 640px) {
    .container {
        padding: 0.5rem;
    }
}
</style>
