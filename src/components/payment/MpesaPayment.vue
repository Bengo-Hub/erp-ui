<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

// Import services
import { posService } from '@/services/ecommerce/posService';

const toast = useToast();

// Props
const props = defineProps({
    initialPhoneNumber: {
        type: String,
        default: ''
    },
    initialAmount: {
        type: Number,
        required: true
    },
    paymentDescription: {
        type: String,
        default: 'Payment for goods and services'
    },
    referenceNumber: {
        type: String,
        required: true
    },
    isAmountEditable: {
        type: Boolean,
        default: false
    },
    timeoutSeconds: {
        type: Number,
        default: 30 // Default timeout of 30 seconds
    },
    paymentType: {
        type: String,
        default: 'pos', // 'pos' or 'online'
        validator: (value) => ['pos', 'online'].includes(value)
    }
});

// Emits
const emit = defineEmits(['cancel', 'payment-complete', 'payment-failed', 'payment-timeout', 'payment-pending']);

// Reactive state
const phoneNumber = ref(props.initialPhoneNumber);
const amount = ref(props.initialAmount);
const description = ref(props.paymentDescription);
const isProcessing = ref(false);
const isSuccess = ref(false);
const successMessage = ref('');
const transactionData = ref(null);
const timeout = ref(props.timeoutSeconds);
const timeLeft = ref(props.timeoutSeconds);
const timer = ref(null);
const statusCheckInterval = ref(null);
const checkoutRequestId = ref('');
const transactionTimestamp = ref('');
const transactionPassword = ref('');
const showTimeoutDialog = ref(false);

// Status messages
const currentStatusMessage = ref('Processing your payment');
const currentStatusSubMessage = ref('Please wait while we prepare your payment request...');
const pendingTimerStarted = ref(false);

// Computed properties
const isValidPhone = computed(() => {
    const phoneRegex = /^254[0-9]{9}$/;
    return phoneRegex.test(phoneNumber.value);
});

const isValidForm = computed(() => {
    return isValidPhone.value && amount.value > 0;
});

// Methods
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const startTimer = () => {
    clearInterval(timer.value);
    timeLeft.value = timeout.value;

    timer.value = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            clearInterval(timer.value);
            handleTimeout();
        }
    }, 1000);
};

const handleTimeout = () => {
    clearInterval(statusCheckInterval.value);

    if (pendingTimerStarted.value) {
        // If we started the pending timer, automatically save as pending
        currentStatusMessage.value = 'Transaction saved as pending';
        currentStatusSubMessage.value = 'Your transaction has been saved as pending and can be confirmed later.';

        // Notify parent component about the timeout with pending status
        emit('payment-timeout', {
            checkoutRequestId: checkoutRequestId.value,
            status: 'pending',
            phoneNumber: phoneNumber.value,
            amount: amount.value,
            date: new Date().toISOString()
        });

        // Show timeout dialog after a short delay to allow user to see the pending message
        setTimeout(() => {
            showTimeoutDialog.value = true;
        }, 2000);
    } else {
        // Standard timeout handling
        showTimeoutDialog.value = true;
        currentStatusMessage.value = 'Payment request timed out';
        currentStatusSubMessage.value = "We haven't received a response from M-Pesa.";

        // Notify parent component
        emit('payment-timeout', { checkoutRequestId: checkoutRequestId.value });
    }
};

const cancelPayment = () => {
    showTimeoutDialog.value = false;
    isProcessing.value = false;
    emit('cancel');
};

const resetAndRetry = () => {
    showTimeoutDialog.value = false;
    isProcessing.value = false;
    checkoutRequestId.value = '';
};

const requestPayment = async () => {
    try {
        isProcessing.value = true;
        currentStatusMessage.value = 'Sending payment request';
        currentStatusSubMessage.value = 'Please wait while we connect to M-Pesa...';

        const paymentData = {
            phone_number: phoneNumber.value,
            amount: amount.value,
            reference: props.referenceNumber,
            description: description.value,
            payment_type: props.paymentType
        };

        const response = await posService.initiateSTKPush(paymentData);
        console.log(response);
        if (response && response.data.checkoutID) {
            checkoutRequestId.value = response.data.checkoutID;
            transactionTimestamp.value = response.data.timestamp;
            transactionPassword.value = response.data.password;

            currentStatusMessage.value = 'STK Push sent successfully';
            currentStatusSubMessage.value = 'Please check your phone and enter M-Pesa PIN to complete payment. Your transaction will be saved as pending if not completed within the time limit.';

            // Start the countdown timer
            startTimer();

            // Start checking for status
            startStatusCheck();

            // Start the pending timer (will save as pending after 30 seconds if not completed)
            pendingTimerStarted.value = true;

            toast.add({
                severity: 'info',
                summary: 'Payment Request Sent',
                detail: 'Please check your phone to enter your M-Pesa PIN',
                life: 5000
            });
        } else {
            throw new Error('Invalid response from payment service');
        }
    } catch (error) {
        console.error('Payment request error:', error);
        isProcessing.value = false;

        toast.add({
            severity: 'error',
            summary: 'Payment Request Failed',
            detail: error.response?.data?.message || 'Failed to initiate payment. Please try again.',
            life: 5000
        });

        emit('payment-failed', { error });
    }
};

const startStatusCheck = () => {
    // Clear any existing interval
    clearInterval(statusCheckInterval.value);

    // Check every 5 seconds
    statusCheckInterval.value = setInterval(() => {
        if (checkoutRequestId.value) {
            checkPaymentStatus();
        }
    }, 5000);
};

const checkPaymentStatus = async () => {
    if (!checkoutRequestId.value) return;
    if (!transactionTimestamp.value) return;
    if (!transactionPassword.value) return;

    try {
        currentStatusMessage.value = 'Checking payment status';
        currentStatusSubMessage.value = 'Please wait while we verify your transaction with M-Pesa...';

        const payload = {
            checkoutID: checkoutRequestId.value,
            timestamp: transactionTimestamp.value,
            password: transactionPassword.value
        };

        const response = await posService.checkSTKPushStatus(payload);

        if (response) {
            // Handle different response statuses
            if (response.data.ResultCode === 0) {
                // Payment successful
                handleSuccessfulPayment(response);
            } else if (response.data.errorCode === '500.001.1001') {
                // Transaction not found - still pending or hasn't been processed
                currentStatusMessage.value = 'Payment pending';
                currentStatusSubMessage.value = "We're still waiting for confirmation from M-Pesa...";
            } else {
                // Payment failed
                handleFailedPayment(response);
            }
        }
    } catch (error) {
        console.error('Payment status check error:', error);

        // If the request itself failed (not the payment)
        if (timeLeft.value <= 0) {
            // Only show this toast if we're already in timeout state
            toast.add({
                severity: 'warning',
                summary: 'Status Check Failed',
                detail: "Couldn't verify payment status. Please try checking again.",
                life: 3000
            });
        }
    }
};

const handleSuccessfulPayment = (response) => {
    // Stop all timers and intervals
    clearInterval(timer.value);
    clearInterval(statusCheckInterval.value);
    showTimeoutDialog.value = false;
    pendingTimerStarted.value = false;

    // Update state
    isProcessing.value = false;
    isSuccess.value = true;
    successMessage.value = `Payment of KES ${amount.value.toFixed(2)} has been successfully processed.`;

    // Store transaction data
    transactionData.value = {
        checkoutRequestId: checkoutRequestId.value,
        transactionId: response.data.MpesaReceiptNumber,
        amount: amount.value,
        phoneNumber: phoneNumber.value,
        date: new Date().toISOString(),
        status: 'completed'
    };

    // Show success notification
    toast.add({
        severity: 'success',
        summary: 'Payment Successful',
        detail: `M-Pesa payment of KES ${amount.value.toFixed(2)} has been received.`,
        life: 5000
    });

    // Notify parent component
    emit('payment-complete', transactionData.value);
};

const handleFailedPayment = (response) => {
    // Stop all timers and intervals
    clearInterval(timer.value);
    clearInterval(statusCheckInterval.value);

    // Update state
    isProcessing.value = false;
    showTimeoutDialog.value = false;

    // Show error notification
    toast.add({
        severity: response.data.ResultCode === '1032' ? 'info' : 'error',
        summary: response.data.ResultCode === '1032' ? response.data.ResultDesc : 'Payment Failed',
        detail: response.data.ResponseDescription || 'The payment request was not completed.',
        life: 5000
    });

    // Notify parent component
    emit('payment-failed', {
        error: response,
        checkoutRequestId: checkoutRequestId.value
    });
};

// Lifecycle hooks
onMounted(() => {
    // If a phone number was not provided, try to get it from session storage
    if (!phoneNumber.value) {
        try {
            const userData = JSON.parse(sessionStorage.getItem('user'));
            if (userData && userData.phone) {
                // Format phone number to start with 254 if it doesn't already
                if (userData.phone.startsWith('0')) {
                    phoneNumber.value = '254' + userData.phone.slice(1);
                } else if (userData.phone.startsWith('+254')) {
                    phoneNumber.value = userData.phone.replace('+', '');
                } else {
                    phoneNumber.value = userData.phone;
                }
            }
        } catch (e) {
            console.error('Error getting phone number from session:', e);
        }
    }
});

onBeforeUnmount(() => {
    // Clean up timers and intervals
    clearInterval(timer.value);
    clearInterval(statusCheckInterval.value);
});

// Watch for prop changes
watch(
    () => props.initialAmount,
    (newValue) => {
        amount.value = newValue;
    }
);

watch(
    () => props.initialPhoneNumber,
    (newValue) => {
        phoneNumber.value = newValue;
    }
);

watch(
    () => props.paymentDescription,
    (newValue) => {
        description.value = newValue;
    }
);
</script>

<template>
    <div class="mpesa-payment-container">
        <!-- Payment Request Form -->
        <div v-if="!isProcessing && !isSuccess" class="mpesa-form p-4 border rounded-lg shadow-md bg-white">
            <div class="text-center mb-4">
                <img src="@/assets/img/shop/mpesa.png" alt="M-Pesa Logo" class="h-16 mx-auto mb-2" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png'; this.onerror=null;" />
                <h2 class="text-xl font-bold text-green-600">M-Pesa Payment</h2>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <InputText v-model="phoneNumber" class="w-full p-inputtext-sm" placeholder="254XXXXXXXXX" :class="{ 'p-invalid': !isValidPhone && phoneNumber }" />
                <small v-if="!isValidPhone && phoneNumber" class="p-error block mt-1">Please enter a valid phone number starting with 254</small>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <InputNumber v-model="amount" class="w-full" :readonly="!isAmountEditable" :min="1" mode="currency" currency="KES" locale="en-KE" />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Description</label>
                <InputText v-model="description" class="w-full p-inputtext-sm" :readonly="true" />
            </div>

            <div class="flex justify-between pt-4">
                <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-danger" @click="$emit('cancel')" />
                <Button label="Request Payment" icon="pi pi-send" class="p-button-success" :disabled="!isValidForm" @click="requestPayment" />
            </div>
        </div>

        <!-- Processing Payment -->
        <div v-if="isProcessing && !isSuccess" class="processing-container p-6 border rounded-lg shadow-md bg-white text-center">
            <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".8s" class="mb-4" />
            <div class="status-text">
                <h3 class="font-bold text-xl mb-2">{{ currentStatusMessage }}</h3>
                <p class="text-gray-600 mb-4">{{ currentStatusSubMessage }}</p>

                <div v-if="timeLeft > 0" class="countdown mb-4">
                    <p class="text-sm">Time remaining: {{ formatTime(timeLeft) }}</p>
                    <ProgressBar :value="Number((timeLeft / timeout) * 100).toFixed(0)" class="mt-2" />
                </div>

                <div v-if="checkoutRequestId && timeLeft <= 0" class="mt-4">
                    <Button label="Check Payment Status" icon="pi pi-refresh" class="p-button-info mr-2" @click="checkPaymentStatus" />
                    <Button label="Try Again" icon="pi pi-replay" class="p-button-warning" @click="resetAndRetry" />
                </div>
            </div>
        </div>

        <!-- Success Message -->
        <div v-if="isSuccess" class="success-container p-6 border rounded-lg shadow-md bg-white text-center">
            <i class="pi pi-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="font-bold text-xl mb-2">Payment Successful!</h3>
            <p class="text-gray-600 mb-4">{{ successMessage }}</p>
            <Button label="Continue" icon="pi pi-arrow-right" class="p-button-success" @click="$emit('payment-complete', transactionData)" />
        </div>

        <!-- Confirmation Dialog for Timeout -->
        <Dialog v-model:visible="showTimeoutDialog" header="Payment Time Exceeded" :modal="true" :closable="false" :style="{ width: '450px' }">
            <div class="timeout-dialog-content p-3">
                <i class="pi pi-exclamation-triangle text-yellow-500 text-3xl block text-center mb-3"></i>
                <p class="mb-3">The payment request has timed out. What would you like to do?</p>
                <div class="flex justify-between mt-4">
                    <Button label="Cancel Payment" icon="pi pi-times" class="p-button-outlined p-button-danger" @click="cancelPayment" />
                    <Button label="Check Again" icon="pi pi-refresh" class="p-button-info" @click="checkPaymentStatus" />
                    <Button label="Try Again" icon="pi pi-replay" class="p-button-warning" @click="resetAndRetry" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.mpesa-payment-container {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}

.mpesa-form,
.processing-container,
.success-container {
    transition: all 0.3s ease;
}

.countdown {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 10px;
    border-radius: 8px;
}
</style>
