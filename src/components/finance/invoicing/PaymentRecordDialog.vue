<script setup>
import { ref, computed, watch } from 'vue';
import { formatCurrency } from '@/utils/formatters';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    document: {
        type: Object,
        default: null
    },
    documentType: {
        type: String,
        default: 'invoice'
    },
    loading: {
        type: Boolean,
        default: false
    },
    paymentAccounts: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:visible', 'record-payment']);

const paymentData = ref({
    amount: 0,
    payment_method: 'bank',
    payment_account: null,
    reference: '',
    payment_date: new Date(),
    notes: ''
});

const paymentMethods = [
    { label: 'Bank Transfer', value: 'bank', icon: 'pi-building' },
    { label: 'M-Pesa', value: 'mpesa', icon: 'pi-mobile' },
    { label: 'Cash', value: 'cash', icon: 'pi-money-bill' },
    { label: 'Card', value: 'card', icon: 'pi-credit-card' },
    { label: 'Cheque', value: 'cheque', icon: 'pi-file' },
];

// Computed
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const balanceDue = computed(() => {
    return props.document?.balance_due || props.document?.total || 0;
});

const documentNumber = computed(() => {
    return props.document?.invoice_number || props.document?.quotation_number || 'N/A';
});

const isValid = computed(() => {
    return paymentData.value.amount > 0 && 
           paymentData.value.payment_method &&
           paymentData.value.payment_account &&
           paymentData.value.amount <= balanceDue.value;
});

// Methods
const recordPayment = () => {
    if (!isValid.value) {
        return;
    }
    
    emit('record-payment', {
        ...paymentData.value,
        payment_date: paymentData.value.payment_date instanceof Date 
            ? paymentData.value.payment_date.toISOString().split('T')[0]
            : paymentData.value.payment_date
    });
};

const cancel = () => {
    dialogVisible.value = false;
};

const setFullAmount = () => {
    paymentData.value.amount = parseFloat(balanceDue.value);
};

// Watch document changes
watch(() => props.document, (newDoc) => {
    if (newDoc) {
        paymentData.value.amount = parseFloat(newDoc.balance_due || newDoc.total || 0);
        paymentData.value.payment_date = new Date();
    }
}, { immediate: true });
</script>

<template>
    <Dialog 
        v-model:visible="dialogVisible" 
        modal 
        header="Record Payment" 
        :style="{ width: '600px' }"
        :dismissableMask="true"
    >
        <div v-if="document" class="space-y-4">
            <!-- Document Summary -->
            <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-surface-600 dark:text-surface-400">{{documentType === 'invoice' ? 'Invoice' : 'Quotation'}} #:</span>
                    <span class="font-semibold font-mono">{{ documentNumber }}</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-surface-600 dark:text-surface-400">Customer:</span>
                    <span class="font-medium">{{ document.customer?.business_name || `${document.customer?.user?.first_name} ${document.customer?.user?.last_name}` }}</span>
                </div>
                <Divider />
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold">Balance Due:</span>
                    <span class="text-2xl font-bold text-primary">{{ formatCurrency(balanceDue) }}</span>
                </div>
            </div>

            <!-- Payment Amount -->
            <div>
                <label class="block text-sm font-medium mb-2">Payment Amount *</label>
                <div class="p-inputgroup">
                    <InputNumber 
                        v-model="paymentData.amount"
                        mode="currency"
                        currency="KES"
                        locale="en-KE"
                        class="w-full"
                        :max="balanceDue"
                        :min="0.01"
                    />
                    <Button 
                        label="Full Amount" 
                        @click="setFullAmount"
                        class="p-button-outlined"
                    />
                </div>
                <small v-if="paymentData.amount > balanceDue" class="p-error">
                    Amount exceeds balance due
                </small>
            </div>

            <!-- Payment Method -->
            <div>
                <label class="block text-sm font-medium mb-2">Payment Method *</label>
                <div class="grid grid-cols-3 gap-2">
                    <div 
                        v-for="method in paymentMethods" 
                        :key="method.value"
                        class="payment-method-card"
                        :class="{ 'active': paymentData.payment_method === method.value }"
                        @click="paymentData.payment_method = method.value"
                    >
                        <i :class="['pi', method.icon, 'text-xl']"></i>
                        <span class="text-sm">{{ method.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Payment Account -->
            <div>
                <label class="block text-sm font-medium mb-2">Payment Account *</label>
                <Dropdown 
                    v-model="paymentData.payment_account"
                    :options="paymentAccounts"
                    optionLabel="account_name"
                    optionValue="id"
                    placeholder="Select payment account"
                    class="w-full"
                    :class="{ 'p-invalid': !paymentData.payment_account }"
                >
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-wallet text-surface-500"></i>
                            <div>
                                <div class="font-medium">{{ slotProps.option.account_name }}</div>
                                <div class="text-sm text-surface-500">{{ slotProps.option.account_number }}</div>
                            </div>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Payment Date -->
            <div>
                <label class="block text-sm font-medium mb-2">Payment Date</label>
                <Calendar 
                    v-model="paymentData.payment_date"
                    dateFormat="dd/mm/yy"
                    :showIcon="true"
                    class="w-full"
                    :maxDate="new Date()"
                />
            </div>

            <!-- Reference Number -->
            <div>
                <label class="block text-sm font-medium mb-2">Reference Number</label>
                <InputText 
                    v-model="paymentData.reference"
                    placeholder="e.g., CHQ#12345, M-Pesa Ref: ABC123"
                    class="w-full"
                />
                <small class="text-surface-500">Enter transaction reference for tracking</small>
            </div>

            <!-- Notes -->
            <div>
                <label class="block text-sm font-medium mb-2">Notes (Optional)</label>
                <Textarea 
                    v-model="paymentData.notes"
                    rows="3"
                    class="w-full"
                    placeholder="Additional payment notes..."
                />
            </div>
        </div>

        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                @click="cancel" 
                class="p-button-text" 
                :disabled="loading"
            />
            <Button 
                label="Record Payment" 
                icon="pi pi-check" 
                @click="recordPayment" 
                :loading="loading"
                :disabled="!isValid"
            />
        </template>
    </Dialog>
</template>

<style scoped>
.payment-method-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.payment-method-card:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.payment-method-card.active {
    border-color: #2563eb;
    background-color: #dbeafe;
    font-weight: 600;
}

.payment-method-card i {
    color: #6b7280;
}

.payment-method-card.active i {
    color: #2563eb;
}
</style>

