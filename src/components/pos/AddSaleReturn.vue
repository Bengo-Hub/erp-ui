<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import moment from 'moment';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import { POSService } from '@/services/ecommerce/posService';
const toast = useToast();

// Props
const props = defineProps({
    sale: {
        type: Object,
        required: true
    }
});

// Emits
const emit = defineEmits(['update-array', 'cancel', 'printReceipt']);

// Reactive state
const sale = reactive({ ...props.sale });
const discount_type = ref('Fixed');
const discount_types = ref(['Percentage', 'Fixed']);
const discount_ammount = ref(0);
const return_reason = ref('Shipped the wrong brand');
const returncart = ref([]);
const sale_over_due = ref(0);
const customer_due = ref(0);
const returnTax = ref(0);
const returnDiscount = ref(0);
const processingReturn = ref(false);
const showReceipt = ref(false);

// Headers for DataTable
const headers = ref([
    { field: 'product_title', header: 'Product Name' },
    { field: 'unit_price', header: 'Unit Price' },
    { field: 'quantity', header: 'Sale Quantity' },
    { field: 'return_quantity', header: 'Return Quantity' },
    { field: 'return_subtotal', header: 'Return Subtotal' },
    { field: 'actions', header: 'Actions' }
]);

const receiptHeaders = ref([
    { field: 'title', header: 'Product Name' },
    { field: 'unit_price', header: 'Unit Price' },
    { field: 'quantity', header: 'Sale Quantity' },
    { field: 'return_subtotal', header: 'Return Subtotal' }
]);

// Computed properties
const total = computed(() => returncart.value.reduce((acc, item) => acc + item.unit_price * item.return_quantity, 0));

const discountPayable = computed(() => {
    if (!discount_type.value || discount_ammount.value <= 0) return 0;
    return discount_type.value === 'Percentage' ? total.value * (discount_ammount.value / 100) : discount_ammount.value;
});

const returnTotalPayable = computed(() => Math.abs(total.value - discountPayable.value - customer_due.value + returnTax.value + sale_over_due.value));

const isFormValid = computed(() => {
    const hasReturnItems = returncart.value.some((item) => item.return_quantity > 0);
    const hasReason = return_reason.value.trim().length > 0;
    return hasReturnItems && hasReason;
});

// Methods
const formatNumber = (value) => new Intl.NumberFormat().format(value?.toFixed(2) || 0);

const addToReturnCart = () => {
    sale.date = moment(sale.date).format('DD-MM-YYYY HH:mm:ss');
    customer_due.value = sale.balance_due;

    sale.sales_items.forEach((item) => {
        const product = item.stock_item.product;
        const variation = item.stock_item.variation;
        const sku = variation?.sku || product.sku;

        returncart.value.push({
            sku,
            product_title: `${product.title} ${variation?.title || ''}`.trim(),
            variation: item.variation,
            quantity: item.qty,
            return_quantity: 0,
            unit_price: item.unit_price,
            return_subtotal: 0
        });

        returnDiscount.value += item.discount_amount;
        returnTax.value += item.tax_amount;
        discount_ammount.value += item.discount_amount;
    });
};

const removeFromReturnCart = (index) => {
    returncart.value.splice(index, 1);
};

const handleReturn = async () => {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cannot Process',
            detail: 'Please select items to return and provide a reason',
            life: 3000
        });
        return;
    }

    processingReturn.value = true;

    try {
        const formData = new FormData();
        returncart.value.forEach((item) => {
            if (item.return_quantity > 0) {
                formData.append(
                    'items[]',
                    JSON.stringify({
                        sku: item.sku,
                        qty: item.return_quantity
                    })
                );
            }
        });

        formData.append('sale_id', sale.sale_id);
        formData.append('return_total', returnTotalPayable.value.toFixed(2));
        formData.append('return_reason', return_reason.value);
        formData.append('discount_amount', discountPayable.value.toFixed(2));
        formData.append('discount_type', discount_type.value);
        formData.append('attendant', JSON.parse(sessionStorage.user).id);
        console.log(formData);

        const response = await posService.createSalesReturn(formData);

        toast.add({
            severity: 'success',
            summary: 'Return Processed',
            detail: 'Sales return has been successfully processed!',
            life: 3000
        });

        // Show receipt after successful return
        showReceipt.value = true;
        processingReturn.value = false;

        // Notify parent component to update the returns list
        emit('update-array');
    } catch (error) {
        console.log(error);
        processingReturn.value = false;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'An error occurred while processing the return',
            life: 5000
        });
    }
};

const finishReturn = () => {
    showReceipt.value = false;
    emit('cancel');
};

// Lifecycle hooks
onMounted(addToReturnCart);
</script>

<template>
    <div class="container mx-auto p-4">
        <Card class="border-2 border-yellow-500 rounded-lg mb-6 shadow-md">
            <template #title>
                <div class="flex items-center text-xl font-bold text-blue-800">
                    <i class="pi pi-receipt mr-2"></i>
                    Parent Sale Information
                </div>
            </template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div class="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 transition-all hover:shadow-md">
                        <h4 class="font-semibold text-gray-700 mb-2">
                            Invoice No: <span class="text-blue-700 font-bold">{{ sale.sale_id }}</span>
                        </h4>
                        <h4 class="font-semibold text-gray-700">
                            Date: <span class="text-blue-700">{{ sale.date }}</span>
                        </h4>
                    </div>
                    <div class="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 transition-all hover:shadow-md">
                        <h4 class="font-semibold text-gray-700 mb-2">
                            Customer: <span class="text-blue-700">{{ sale.customer?.name || 'Walk-in Customer' }}</span>
                        </h4>
                        <h4 class="font-semibold text-gray-700">
                            Branch: <span class="text-blue-700"> {{ sale.sales_items[0]?.branch?.name || 'Main Branch' }} {{ sale.sales_items[0]?.branch?.branch_code ? `(${sale.sales_items[0].branch.branch_code})` : '' }} </span>
                        </h4>
                    </div>
                </div>
            </template>
        </Card>

        <Card class="shadow-md mb-6">
            <template #title>
                <div class="flex items-center text-xl font-bold text-blue-800">
                    <i class="pi pi-shopping-cart mr-2"></i>
                    Return Items
                </div>
            </template>
            <template #subtitle>
                <div class="text-sm text-gray-600 italic">Select quantities for items to return</div>
            </template>
            <template #content>
                <DataTable :value="returncart" showGridlines class="p-datatable-sm mb-4" responsiveLayout="scroll" stripedRows>
                    <Column field="product_title" header="Product Name" headerClass="bg-blue-50">
                        <template #body="{ data }">
                            <div class="font-medium">{{ data.product_title }}</div>
                            <div class="text-xs text-gray-500">SKU: {{ data.sku }}</div>
                        </template>
                    </Column>
                    <Column header="Unit Price" headerClass="bg-blue-50" class="text-right">
                        <template #body="{ data }">
                            <div class="font-medium text-blue-700">KES {{ formatNumber(data.unit_price) }}</div>
                        </template>
                    </Column>
                    <Column field="quantity" header="Sale Qty" headerClass="bg-blue-50" class="text-center"></Column>
                    <Column header="Return Qty" headerClass="bg-blue-50">
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.return_quantity"
                                :min="0"
                                :max="data.quantity"
                                showButtons
                                buttonLayout="horizontal"
                                decrementButtonClass="p-button-danger"
                                incrementButtonClass="p-button-success"
                                incrementButtonIcon="pi pi-plus"
                                decrementButtonIcon="pi pi-minus"
                                class="w-full"
                            />
                        </template>
                    </Column>
                    <Column header="Return Subtotal" headerClass="bg-blue-50" class="text-right">
                        <template #body="{ data }">
                            <div class="font-bold text-green-600">KES {{ formatNumber(data.unit_price * data.return_quantity) }}</div>
                        </template>
                    </Column>
                    <Column header="Actions" headerClass="bg-blue-50" class="text-center">
                        <template #body="{ index }">
                            <Button icon="pi pi-trash" class="p-button-danger p-button-rounded p-button-sm" @click="removeFromReturnCart(index)" />
                        </template>
                    </Column>
                </DataTable>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    <div class="lg:col-span-6 order-2 lg:order-1">
                        <div class="bg-white p-6 rounded-lg shadow-md border border-blue-200 h-full">
                            <h4 class="text-xl font-bold mb-4 text-blue-800 border-b pb-2">Sale Payment Details</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <p class="font-medium text-gray-700 mb-2">Payment Type:</p>
                                    <p class="text-blue-700 font-bold text-lg">
                                        <i class="pi {{ sale.status === 'due' ? 'pi-credit-card' : 'pi-money-bill' }} mr-2"></i>
                                        {{ sale.status === 'due' ? 'Credit Sale' : 'Cash Sale' }}
                                    </p>
                                </div>
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <p class="font-medium text-gray-700 mb-2">Sale Over Due:</p>
                                    <p class="text-blue-700 font-bold text-lg">KES {{ formatNumber(sale_over_due) }}</p>
                                </div>
                                <div class="bg-red-50 p-4 rounded-lg">
                                    <p class="font-medium text-gray-700 mb-2">Customer Due:</p>
                                    <p class="text-red-600 font-bold text-lg">KES {{ formatNumber(customer_due) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-6 order-1 lg:order-2">
                        <div class="bg-white p-6 rounded-lg shadow-md border border-blue-200 h-full">
                            <h4 class="text-xl font-bold mb-4 text-blue-800 border-b pb-2">Return Options</h4>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="mb-4">
                                    <label class="block font-medium mb-2 text-gray-700">Discount Type</label>
                                    <Dropdown v-model="discount_type" :options="discount_types" placeholder="Select Discount Type" class="w-full" />
                                </div>

                                <div class="mb-4">
                                    <label class="block font-medium mb-2 text-gray-700">
                                        Discount Amount: <span class="text-blue-700">KES {{ formatNumber(discountPayable) }}</span>
                                    </label>
                                    <InputNumber
                                        v-model="discount_ammount"
                                        class="w-full"
                                        :min="0"
                                        :max="discount_type === 'Percentage' ? 100 : total"
                                        showButtons
                                        buttonLayout="horizontal"
                                        decrementButtonClass="p-button-secondary"
                                        incrementButtonClass="p-button-secondary"
                                    />
                                </div>
                            </div>

                            <div class="mb-4">
                                <label class="block font-medium mb-2 text-gray-700">Return Reason</label>
                                <Textarea v-model="return_reason" rows="3" class="w-full" placeholder="Please provide a detailed reason for this return..." />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row justify-between items-start mt-8">
                    <div class="mb-4 md:mb-0">
                        <Button label="Cancel Return" icon="pi pi-times" class="p-button-danger p-button-raised" @click="$emit('cancel')" />
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow-lg border-2 border-green-500 w-full md:w-auto">
                        <div class="space-y-3">
                            <p class="font-medium flex justify-between gap-4">
                                <span>Total Return Amount:</span>
                                <span class="text-blue-700">KES {{ formatNumber(total) }}</span>
                            </p>
                            <p class="font-medium flex justify-between gap-4">
                                <span>Return Discount:</span>
                                <span class="text-red-500">(-) KES {{ formatNumber(discountPayable) }}</span>
                            </p>
                            <p class="font-medium flex justify-between gap-4">
                                <span>Sale Over Due:</span>
                                <span class="text-green-500">(+) KES {{ formatNumber(sale_over_due) }}</span>
                            </p>
                            <p class="font-medium flex justify-between gap-4">
                                <span>Customer Due:</span>
                                <span class="text-red-500">(-) KES {{ formatNumber(customer_due) }}</span>
                            </p>
                            <p class="font-medium flex justify-between gap-4">
                                <span>Return Tax:</span>
                                <span class="text-green-500">(+) KES {{ formatNumber(returnTax) }}</span>
                            </p>
                            <hr class="my-3 border-t-2" />
                            <p class="text-xl font-bold flex justify-between items-center">
                                <span>Return Total:</span>
                                <span class="text-2xl text-green-700">KES {{ formatNumber(returnTotalPayable) }}</span>
                            </p>

                            <Button label="Submit Return" icon="pi pi-check-circle" class="p-button-success p-button-raised w-full mt-4" :disabled="!isFormValid" @click="handleReturn" />
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <Receipt :items="returncart" :headers="receiptHeaders" :total="returnTotalPayable" v-if="showReceipt" @printReceipt="finishReturn" />

        <Dialog v-model:visible="processingReturn" modal header="Processing Return" :closable="false">
            <div class="flex flex-col items-center justify-center p-6 text-center">
                <ProgressSpinner style="width: 50px; height: 50px" class="mb-4" />
                <h3 class="text-xl font-bold mb-2">Processing Return</h3>
                <p class="text-gray-600">Please wait while we process your return request...</p>
            </div>
        </Dialog>
    </div>
</template>
