<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@/utils/formatters';
import axios from 'axios';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    invoice: {
        type: Object,
        required: true
    },
    balanceDue: {
        type: Number,
        required: true
    }
});

const emit = defineEmits(['update:visible', 'payment-initiated']);

const route = useRoute();
const { showToast } = useToast();

// Reactive state
const paymentMethod = ref('paystack'); // 'mpesa', 'card', 'paystack', 'manual'
const loading = ref(false);
const availablePaymentMethods = ref([]);
const loadingMethods = ref(false);

// M-Pesa fields
const mpesaPhone = ref('');
const mpesaAmount = ref(props.balanceDue);

// Card/Paystack fields
const cardHolderName = ref('');
const cardEmail = ref('');
const cardAmount = ref(props.balanceDue);

// Paystack specific
const paystackChannels = ref(['card', 'bank', 'mobile_money']);

// Manual payment reference
const manualReference = ref('');

// Computed
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const customerPhone = computed(() => {
    return props.invoice?.customer?.user?.phone || '';
});

const customerEmail = computed(() => {
    return props.invoice?.customer?.user?.email || '';
});

const customerName = computed(() => {
    return props.invoice?.customer?.user?.first_name 
        ? `${props.invoice.customer.user.first_name} ${props.invoice.customer.user.last_name || ''}`.trim()
        : props.invoice?.customer?.name || '';
});

const paymentMethodLabel = computed(() => {
    if (paymentMethod.value === 'mpesa') return 'M-Pesa STK Push';
    if (paymentMethod.value === 'card') return 'Card Payment';
    if (paymentMethod.value === 'paystack') return 'Paystack';
    return 'Manual Payment';
});

const shareToken = computed(() => route.params.token || props.invoice?.share_token);

const isPaystackAvailable = computed(() => {
    return availablePaymentMethods.value.some(m => m.method === 'paystack' && m.enabled);
});

const isMpesaAvailable = computed(() => {
    return availablePaymentMethods.value.some(m => m.method === 'mpesa' && m.enabled);
});

const isCardAvailable = computed(() => {
    return availablePaymentMethods.value.some(m => m.method === 'card' && m.enabled);
});

// Methods
const fetchAvailablePaymentMethods = async () => {
    if (!props.invoice?.id || !shareToken.value) return;

    loadingMethods.value = true;
    try {
        const response = await axios.get(`/api/v1/finance/payment/public/invoice/${props.invoice.id}/${shareToken.value}/methods/`);
        availablePaymentMethods.value = response.data?.methods || [];

        // Set default payment method based on available methods
        if (isPaystackAvailable.value) {
            paymentMethod.value = 'paystack';
        } else if (isMpesaAvailable.value) {
            paymentMethod.value = 'mpesa';
        } else if (isCardAvailable.value) {
            paymentMethod.value = 'card';
        } else {
            paymentMethod.value = 'manual';
        }
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Fallback to manual if we can't fetch methods
        paymentMethod.value = 'manual';
    } finally {
        loadingMethods.value = false;
    }
};

const handlePayment = async () => {
    if (paymentMethod.value === 'mpesa') {
        await processMpesaPayment();
    } else if (paymentMethod.value === 'card') {
        await processCardPayment();
    } else if (paymentMethod.value === 'paystack') {
        await processPaystackPayment();
    } else {
        await confirmManualPayment();
    }
};

const processMpesaPayment = async () => {
    if (!mpesaPhone.value) {
        showToast('warn', 'Validation', 'Please enter your M-Pesa phone number');
        return;
    }

    if (mpesaAmount.value <= 0) {
        showToast('warn', 'Validation', 'Please enter a valid amount');
        return;
    }

    loading.value = true;
    try {
        // Call public payment API to initiate M-Pesa STK push
        const response = await axios.post(`/api/v1/finance/payment/public/invoice/${props.invoice.id}/${shareToken.value}/pay/`, {
            payment_method: 'mpesa',
            phone: mpesaPhone.value,
            amount: mpesaAmount.value
        });

        showToast('success', 'Success', 'M-Pesa prompt sent. Please enter your PIN to complete payment.');
        emit('payment-initiated', {
            method: 'mpesa',
            reference: response.data?.checkout_request_id
        });
        dialogVisible.value = false;
    } catch (error) {
        console.error('M-Pesa payment error:', error);
        showToast('error', 'Error', error.response?.data?.error || 'Failed to initiate M-Pesa payment');
    } finally {
        loading.value = false;
    }
};

const processPaystackPayment = async () => {
    if (!cardEmail.value) {
        showToast('warn', 'Validation', 'Please enter your email address');
        return;
    }

    if (cardAmount.value <= 0) {
        showToast('warn', 'Validation', 'Please enter a valid amount');
        return;
    }

    loading.value = true;
    try {
        // Call public payment API to initiate Paystack payment
        const response = await axios.post(`/api/v1/finance/payment/public/invoice/${props.invoice.id}/${shareToken.value}/pay/`, {
            payment_method: 'paystack',
            email: cardEmail.value,
            amount: cardAmount.value,
            name: cardHolderName.value || customerName.value,
            channels: paystackChannels.value
        });

        if (response.data?.success && response.data?.authorization_url) {
            // Redirect to Paystack checkout page
            showToast('info', 'Redirecting', 'Redirecting to secure payment page...');
            window.location.href = response.data.authorization_url;
        } else {
            showToast('error', 'Error', response.data?.error || 'Failed to initialize payment');
        }
    } catch (error) {
        console.error('Paystack payment error:', error);
        showToast('error', 'Error', error.response?.data?.error || 'Failed to initiate Paystack payment');
    } finally {
        loading.value = false;
    }
};

const processCardPayment = async () => {
    if (!cardHolderName.value) {
        showToast('warn', 'Validation', 'Please enter cardholder name');
        return;
    }

    if (!cardEmail.value) {
        showToast('warn', 'Validation', 'Please enter email address');
        return;
    }

    if (cardAmount.value <= 0) {
        showToast('warn', 'Validation', 'Please enter a valid amount');
        return;
    }

    loading.value = true;
    try {
        // Call public payment API to initiate card payment
        const response = await axios.post(`/api/v1/finance/payment/public/invoice/${props.invoice.id}/${shareToken.value}/pay/`, {
            payment_method: 'card',
            amount: cardAmount.value,
            cardholder_name: cardHolderName.value,
            email: cardEmail.value
        });

        // Redirect to payment gateway
        if (response.data?.payment_url) {
            window.location.href = response.data.payment_url;
        } else {
            showToast('success', 'Success', 'Payment initiated. Please follow the payment instructions.');
            emit('payment-initiated', { method: 'card', reference: response.data?.reference_id });
            dialogVisible.value = false;
        }
    } catch (error) {
        console.error('Card payment error:', error);
        showToast('error', 'Error', error.response?.data?.error || 'Failed to initiate card payment');
    } finally {
        loading.value = false;
    }
};

const confirmManualPayment = async () => {
    showToast('info', 'Info', 'Manual payment instructions have been sent to your email. Please complete the payment and reference transaction ID.');
    emit('payment-initiated', { method: 'manual' });
    dialogVisible.value = false;
};

const cancel = () => {
    dialogVisible.value = false;
};

// Watch invoice changes
watch(() => props.invoice, (newInvoice) => {
    if (newInvoice) {
        mpesaPhone.value = newInvoice.customer?.user?.phone || '';
        cardEmail.value = newInvoice.customer?.user?.email || '';
        // Fetch available payment methods when invoice changes
        fetchAvailablePaymentMethods();
    }
}, { deep: true });

watch(() => props.balanceDue, (newAmount) => {
    mpesaAmount.value = newAmount;
    cardAmount.value = newAmount;
});

watch(() => props.visible, (newVisible) => {
    if (newVisible && props.invoice?.id) {
        // Fetch payment methods when dialog becomes visible
        fetchAvailablePaymentMethods();
    }
});

// Lifecycle
onMounted(() => {
    if (props.invoice) {
        mpesaPhone.value = props.invoice.customer?.user?.phone || '';
        cardEmail.value = props.invoice.customer?.user?.email || '';
        fetchAvailablePaymentMethods();
    }
});
</script>

<template>
    <Dialog 
        v-model:visible="dialogVisible"
        modal
        :header="`Payment for Invoice ${invoice?.invoice_number}`"
        :style="{ width: '600px' }"
        :dismissableMask="true"
    >
        <div class="space-y-6">
            <!-- Amount Summary -->
            <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="text-gray-700 dark:text-gray-300">Amount to Pay:</span>
                    <span class="text-2xl font-bold text-blue-600 dark:text-blue-300">{{ formatCurrency(balanceDue) }}</span>
                </div>
            </div>

            <!-- Payment Method Selection -->
            <div>
                <label class="block text-sm font-medium mb-3">Select Payment Method:</label>

                <!-- Loading state for payment methods -->
                <div v-if="loadingMethods" class="flex justify-center py-4">
                    <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
                </div>

                <div v-else class="space-y-3">
                    <!-- Paystack Option (Recommended) -->
                    <div v-if="isPaystackAvailable"
                         class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                         @click="paymentMethod = 'paystack'"
                         :class="{ 'bg-green-50 dark:bg-green-900 border-green-500': paymentMethod === 'paystack' }">
                        <RadioButton v-model="paymentMethod" value="paystack" />
                        <div class="ml-3 flex-1">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-800 dark:text-white">Pay with Paystack</p>
                                <span class="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Recommended</span>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Card, Bank Transfer, Mobile Money</p>
                        </div>
                        <img src="/images/paystack-logo.svg" alt="Paystack" class="h-6 ml-2" onerror="this.style.display='none'" />
                    </div>

                    <!-- M-Pesa Option -->
                    <div v-if="isMpesaAvailable"
                         class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                         @click="paymentMethod = 'mpesa'"
                         :class="{ 'bg-blue-50 dark:bg-blue-900 border-blue-500': paymentMethod === 'mpesa' }">
                        <RadioButton v-model="paymentMethod" value="mpesa" />
                        <div class="ml-3 flex-1">
                            <p class="font-medium text-gray-800 dark:text-white">M-Pesa STK Push</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Instant payment via M-Pesa</p>
                        </div>
                    </div>

                    <!-- Card Payment Option -->
                    <div v-if="isCardAvailable"
                         class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                         @click="paymentMethod = 'card'"
                         :class="{ 'bg-blue-50 dark:bg-blue-900 border-blue-500': paymentMethod === 'card' }">
                        <RadioButton v-model="paymentMethod" value="card" />
                        <div class="ml-3 flex-1">
                            <p class="font-medium text-gray-800 dark:text-white">Credit/Debit Card</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Visa, Mastercard, or other card</p>
                        </div>
                    </div>

                    <!-- Bank Transfer / Manual Option (Always available) -->
                    <div class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                         @click="paymentMethod = 'manual'"
                         :class="{ 'bg-blue-50 dark:bg-blue-900 border-blue-500': paymentMethod === 'manual' }">
                        <RadioButton v-model="paymentMethod" value="manual" />
                        <div class="ml-3 flex-1">
                            <p class="font-medium text-gray-800 dark:text-white">Bank Transfer</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Manual transfer to provided account</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- M-Pesa Fields -->
            <div v-if="paymentMethod === 'mpesa'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Phone Number: *</label>
                    <InputText
                        v-model="mpesaPhone"
                        placeholder="254712345678"
                        class="w-full"
                    />
                    <small class="text-gray-500 dark:text-gray-400">Without + or 00, e.g., 254712345678</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Amount: *</label>
                    <InputNumber
                        v-model="mpesaAmount"
                        :use-grouping="true"
                        :currency="invoice?.currency || 'KES'"
                        :maxFractionDigits="2"
                        class="w-full"
                    />
                </div>

                <Message severity="info" :closable="false">
                    <p class="text-sm">You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.</p>
                </Message>
            </div>

            <!-- Paystack Fields -->
            <div v-else-if="paymentMethod === 'paystack'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Your Name:</label>
                    <InputText
                        v-model="cardHolderName"
                        :placeholder="customerName || 'Full Name'"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Email Address: *</label>
                    <InputText
                        v-model="cardEmail"
                        type="email"
                        :placeholder="customerEmail || 'email@example.com'"
                        class="w-full"
                    />
                    <small class="text-gray-500 dark:text-gray-400">Payment receipt will be sent to this email</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Amount: *</label>
                    <InputNumber
                        v-model="cardAmount"
                        :use-grouping="true"
                        :currency="invoice?.currency || 'KES'"
                        :maxFractionDigits="2"
                        class="w-full"
                    />
                </div>

                <Message severity="success" :closable="false">
                    <div class="text-sm">
                        <p class="font-medium mb-1">Secure Payment via Paystack</p>
                        <p>You will be redirected to Paystack's secure checkout page where you can pay using:</p>
                        <ul class="list-disc list-inside mt-1 text-xs">
                            <li>Credit/Debit Card (Visa, Mastercard)</li>
                            <li>Bank Transfer</li>
                            <li>Mobile Money</li>
                        </ul>
                    </div>
                </Message>
            </div>

            <!-- Card Fields -->
            <div v-else-if="paymentMethod === 'card'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Cardholder Name: *</label>
                    <InputText 
                        v-model="cardHolderName"
                        :placeholder="customerName || 'Full Name'"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Email Address: *</label>
                    <InputText 
                        v-model="cardEmail"
                        type="email"
                        :placeholder="customerEmail || 'email@example.com'"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Amount: *</label>
                    <InputNumber 
                        v-model="cardAmount"
                        :use-grouping="true"
                        :currency="invoice?.currency || 'KES'"
                        :maxFractionDigits="2"
                        class="w-full"
                    />
                </div>

                <Message severity="info" :closable="false">
                    <p class="text-sm">You will be redirected to a secure payment gateway to complete your card payment.</p>
                </Message>
            </div>

            <!-- Manual Payment Info -->
            <div v-else-if="paymentMethod === 'manual'" class="space-y-4">
                <Message severity="warn" :closable="false">
                    <p class="text-sm font-medium mb-2">Please make payment to the following account:</p>
                    <div v-if="invoice?.payment_accounts?.length > 0" class="space-y-2">
                        <div v-for="account in invoice.payment_accounts" :key="account.id" class="text-sm bg-white dark:bg-gray-800 p-3 rounded">
                            <p class="font-medium">{{ account.account_name }}</p>
                            <p>{{ account.account_type === 'mobile_money' ? 'Mobile' : account.account_type }}: {{ account.account_number }}</p>
                            <p v-if="account.additional_info" class="text-xs text-gray-500">{{ account.additional_info }}</p>
                        </div>
                    </div>
                    <p class="text-sm mt-3">Reference: {{ invoice?.invoice_number }}</p>
                </Message>

                <div>
                    <label class="block text-sm font-medium mb-2">Payment Reference (Optional)</label>
                    <InputText 
                        v-model="manualReference"
                        placeholder="Enter transaction ID or reference"
                        class="w-full"
                    />
                </div>
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
                :label="paymentMethod === 'paystack' ? `Pay ${formatCurrency(balanceDue)} with Paystack` : `Pay ${formatCurrency(balanceDue)}`"
                :icon="paymentMethod === 'mpesa' ? 'pi pi-phone' : paymentMethod === 'card' ? 'pi pi-credit-card' : paymentMethod === 'paystack' ? 'pi pi-lock' : 'pi pi-check'"
                @click="handlePayment"
                :loading="loading"
                :class="paymentMethod === 'paystack' ? 'p-button-success' : ''"
            />
        </template>
    </Dialog>
</template>

<style scoped></style>
