<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// Reactive state
const loading = ref(true);
const paymentStatus = ref(null); // 'success', 'failed', 'pending'
const paymentData = ref(null);
const error = ref(null);

// Get reference from URL query params (Paystack adds ?reference=xxx)
const reference = computed(() => route.query.reference || route.query.trxref);

// Verify payment status
const verifyPayment = async () => {
    if (!reference.value) {
        error.value = 'No payment reference found';
        paymentStatus.value = 'failed';
        loading.value = false;
        return;
    }

    try {
        const response = await axios.get(`/api/v1/finance/payment/paystack/verify/${reference.value}/`);

        if (response.data?.success) {
            paymentStatus.value = 'success';
            paymentData.value = response.data;
        } else if (response.data?.status === 'pending') {
            paymentStatus.value = 'pending';
            paymentData.value = response.data;
        } else {
            paymentStatus.value = 'failed';
            error.value = response.data?.error || 'Payment verification failed';
        }
    } catch (err) {
        console.error('Payment verification error:', err);
        paymentStatus.value = 'failed';
        error.value = err.response?.data?.error || 'Unable to verify payment status';
    } finally {
        loading.value = false;
    }
};

// Redirect to invoice view if we have the invoice info
const viewInvoice = () => {
    if (paymentData.value?.invoice_id && paymentData.value?.invoice_token) {
        router.push({
            name: 'public-invoice-view',
            params: {
                id: paymentData.value.invoice_id,
                token: paymentData.value.invoice_token
            }
        });
    }
};

// Lifecycle
onMounted(() => {
    verifyPayment();
});
</script>

<template>
    <div class="payment-callback-container min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
        <div class="max-w-lg mx-auto">
            <!-- Loading State -->
            <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <i class="pi pi-spin pi-spinner text-5xl text-blue-500 mb-4 block"></i>
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Verifying Payment</h2>
                <p class="text-gray-600 dark:text-gray-400">Please wait while we confirm your payment...</p>
            </div>

            <!-- Success State -->
            <div v-else-if="paymentStatus === 'success'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div class="bg-green-500 p-6 text-center">
                    <i class="pi pi-check-circle text-6xl text-white mb-4 block"></i>
                    <h2 class="text-2xl font-bold text-white">Payment Successful!</h2>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <p class="text-green-800 dark:text-green-200 text-center">
                            Your payment has been processed successfully.
                        </p>
                    </div>

                    <div v-if="paymentData" class="space-y-3 text-sm">
                        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="text-gray-600 dark:text-gray-400">Reference:</span>
                            <span class="font-semibold text-gray-800 dark:text-white">{{ paymentData.reference }}</span>
                        </div>
                        <div v-if="paymentData.amount" class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                            <span class="font-semibold text-green-600">{{ paymentData.currency }} {{ paymentData.amount?.toLocaleString() }}</span>
                        </div>
                        <div v-if="paymentData.invoice_number" class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="text-gray-600 dark:text-gray-400">Invoice:</span>
                            <span class="font-semibold text-gray-800 dark:text-white">{{ paymentData.invoice_number }}</span>
                        </div>
                    </div>

                    <div class="pt-4 space-y-3">
                        <Button
                            v-if="paymentData?.invoice_id"
                            label="View Invoice"
                            icon="pi pi-file"
                            class="w-full p-button-outlined"
                            @click="viewInvoice"
                        />
                        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                            A receipt has been sent to your email address.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Pending State -->
            <div v-else-if="paymentStatus === 'pending'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div class="bg-amber-500 p-6 text-center">
                    <i class="pi pi-clock text-6xl text-white mb-4 block"></i>
                    <h2 class="text-2xl font-bold text-white">Payment Pending</h2>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                        <p class="text-amber-800 dark:text-amber-200 text-center">
                            Your payment is being processed. This may take a few minutes.
                        </p>
                    </div>

                    <div v-if="reference" class="text-sm">
                        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="text-gray-600 dark:text-gray-400">Reference:</span>
                            <span class="font-semibold text-gray-800 dark:text-white">{{ reference }}</span>
                        </div>
                    </div>

                    <div class="pt-4 space-y-3">
                        <Button
                            label="Check Status Again"
                            icon="pi pi-refresh"
                            class="w-full"
                            @click="verifyPayment"
                        />
                        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                            You will receive an email notification once the payment is confirmed.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Failed State -->
            <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div class="bg-red-500 p-6 text-center">
                    <i class="pi pi-times-circle text-6xl text-white mb-4 block"></i>
                    <h2 class="text-2xl font-bold text-white">Payment Failed</h2>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <p class="text-red-800 dark:text-red-200 text-center">
                            {{ error || 'We were unable to process your payment.' }}
                        </p>
                    </div>

                    <div v-if="reference" class="text-sm">
                        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="text-gray-600 dark:text-gray-400">Reference:</span>
                            <span class="font-semibold text-gray-800 dark:text-white">{{ reference }}</span>
                        </div>
                    </div>

                    <div class="pt-4 space-y-3">
                        <Button
                            label="Try Again"
                            icon="pi pi-refresh"
                            class="w-full"
                            @click="verifyPayment"
                        />
                        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                            If the problem persists, please contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.payment-callback-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>
