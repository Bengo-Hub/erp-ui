<script setup>
import bankicon from '@/assets/img/shop/bank.png';
import mpesaicon from '@/assets/img/shop/mpesa.png';
import paypalicon from '@/assets/img/shop/paypal.png';
import visaicon from '@/assets/img/shop/visa.png';
import MpesaPayment from '@/components/payment/MpesaPayment.vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useVuelidate } from '@vuelidate/core';
import { helpers, minLength, required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

const toast = useToast();

const props = defineProps({
    orderTotal: {
        type: Number,
        required: true
    },
    cartItems: {
        type: Array,
        default: () => []
    },
    customerInfo: {
        type: Object,
        default: () => ({})
    },
    orderId: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['back-to-shipping', 'place-order']);

// Payment methods - load from backend to reflect supported gateways
const paymentMethods = ref([]);

const selectedMethod = ref('mpesa'); // Default payment method
const termsAccepted = ref(false);
const showTerms = ref(false);
const submitted = ref(false);
const showMpesaPayment = ref(false);
const mpesaTransactionData = ref(null);

// Bank payment details
const bankDetails = ref(null);
const loadingBankDetails = ref(false);
const paypalLoading = ref(false);
const paypalCompleted = ref(false);

// M-Pesa details
const mpesaDetails = reactive({
    phone: ''
});

// Card details
const cardDetails = reactive({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
});

// Generate a random order reference
const orderReference = computed(() => {
    return Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
});

// Validation rules
const rules = {
    mpesaDetails: {
        phone: {
            required: helpers.withMessage('Phone number is required', required),
            minLength: helpers.withMessage('Phone number must be at least 10 characters', minLength(10))
        }
    },
    cardDetails: {
        number: {
            required: helpers.withMessage('Card number is required', required),
            minLength: helpers.withMessage('Card number must be at least 16 digits', minLength(16))
        },
        name: { required: helpers.withMessage('Cardholder name is required', required) },
        expiry: { required: helpers.withMessage('Expiry date is required', required) },
        cvv: { required: helpers.withMessage('CVV is required', required) }
    },
    termsAccepted: {
        accepted: helpers.withMessage('You must accept the terms and conditions', (value) => value === true)
    }
};

const v$ = useVuelidate(rules, { mpesaDetails, cardDetails, termsAccepted });

// Load supported payment methods from backend
const loadPaymentMethods = async () => {
    try {
        const res = await ecommerceService.getPaymentMethods();
        const methods = res.data?.results || res.data || [];
        paymentMethods.value = methods.map((m) => {
            const id = (m.code || m.id || '').toLowerCase();
            const name = m.name || m.label || id.toUpperCase();
            let icon = mpesaicon;
            if (id.includes('card')) icon = visaicon;
            if (id.includes('paypal')) icon = paypalicon;
            if (id.includes('bank')) icon = bankicon;
            return {
                id,
                name,
                description: m.description || '',
                icon
            };
        });
        if (paymentMethods.value.length > 0) {
            selectedMethod.value = paymentMethods.value[0].id;
        }
    } catch (e) {
        // fallback to common methods if backend not available
        paymentMethods.value = [
            { id: 'mpesa', name: 'M-Pesa', description: 'Pay using M-Pesa mobile money', icon: mpesaicon },
            { id: 'card', name: 'Credit/Debit Card', description: 'Pay securely with your card', icon: visaicon },
            { id: 'paypal', name: 'PayPal', description: 'Pay via PayPal or credit card', icon: paypalicon },
            { id: 'bank', name: 'Bank Transfer', description: 'Pay via bank transfer', icon: bankicon }
        ];
    }
};

onMounted(() => {
    loadPaymentMethods();
});

// Fetch bank details from the backend
const fetchBankDetails = async () => {
    try {
        loadingBankDetails.value = true;
        // Call the API to fetch bank payment details
        const response = await ecommerceService.getBankPaymentDetails();
        if (response.data) {
            bankDetails.value = response.data;
        } else {
            bankDetails.value = null;
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Could not load bank details',
                life: 5000
            });
        }
    } catch (error) {
        console.error('Error fetching bank details:', error);
        bankDetails.value = null;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not load bank details. Please try again.',
            life: 5000
        });
    } finally {
        loadingBankDetails.value = false;
    }
};

// Payment method selection
const selectMethod = (methodId) => {
    selectedMethod.value = methodId;
    // Reset validation when switching payment methods
    v$.value.$reset();
    submitted.value = false;

    // If bank payment is selected, fetch bank details
    if (methodId === 'bank') {
        fetchBankDetails();
    }
};

const acceptTerms = () => {
    termsAccepted.value = true;
    showTerms.value = false;
};

const goBackToShipping = () => {
    emit('back-to-shipping');
};

const initiatePayPalPayment = async () => {
    if (!termsAccepted.value) {
        await v$.value.termsAccepted.$validate();
        submitted.value = true;
        return;
    }

    paypalLoading.value = true;

    try {
        // Call our backend API to create a PayPal order through the PaymentIntegrationManager
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_method: 'paypal',
                amount: props.orderTotal,
                order_data: {
                    return_url: window.location.origin + '/checkout/success',
                    cancel_url: window.location.origin + '/checkout/cancel',
                    items: props.cartItems || [],
                    customer: props.customerInfo || {}
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to initiate PayPal payment');
        }

        const result = await response.json();

        // Check if we have approval URL from PayPal
        if (result.success && result.data && result.data.approvalUrl) {
            // Redirect user to PayPal for approval
            window.location.href = result.data.approvalUrl;
            return;
        }

        // If no redirect URL, handle as a completed transaction
        const paymentData = {
            method: 'paypal',
            details: {
                orderId: result.data?.orderId || 'PP-' + Math.random().toString(36).substr(2, 9),
                status: result.data?.status || 'PENDING'
            }
        };

        paypalCompleted.value = true;
        emit('place-order', paymentData);
    } catch (error) {
        console.error('PayPal payment error:', error);
        // Display error message to user
        toast.add({
            severity: 'error',
            summary: 'Payment Failed',
            detail: 'Could not process PayPal payment. Please try again.',
            life: 5000
        });
    } finally {
        paypalLoading.value = false;
    }
};

const processCardPayment = async () => {
    if (!(await v$.value.cardDetails.$validate()) || !termsAccepted.value) {
        return false;
    }

    try {
        const [expiryMonth, expiryYear] = cardDetails.expiry.split('/');

        // Call backend API to process the card payment through the PaymentIntegrationManager
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_method: 'card',
                amount: props.orderTotal,
                payment_details: {
                    cardNumber: cardDetails.number.replace(/\s/g, ''),
                    cardholderName: cardDetails.name,
                    expiryMonth,
                    expiryYear: '20' + expiryYear, // Convert to 4-digit year format
                    cvv: cardDetails.cvv
                },
                order_data: {
                    order_id: props.orderId,
                    customer: props.customerInfo || {}
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to process card payment');
        }

        const result = await response.json();

        if (!result.success) {
            toast.add({
                severity: 'error',
                summary: 'Payment Failed',
                detail: result.message || 'Could not process card payment. Please try again.',
                life: 5000
            });
            return false;
        }

        return {
            method: 'card',
            details: {
                cardNumber: cardDetails.number.replace(/\s/g, '').substr(-4), // Only store last 4 digits
                cardholderName: cardDetails.name,
                expiryMonth,
                expiryYear: '20' + expiryYear,
                processor: 'stripe',
                transactionId: result.data?.transactionId || 'CC-' + Math.random().toString(36).substr(2, 9)
            }
        };
    } catch (error) {
        console.error('Card processing error:', error);
        toast.add({
            severity: 'error',
            summary: 'Payment Failed',
            detail: 'Could not process card payment. Please try again.',
            life: 5000
        });
        return false;
    }
};

const placeOrder = async () => {
    submitted.value = true;

    // Validate based on selected payment method
    let isValid = false;

    if (selectedMethod.value === 'mpesa') {
        isValid = (await v$.value.mpesaDetails.$validate()) && termsAccepted.value;
    } else if (selectedMethod.value === 'card') {
        isValid = (await v$.value.cardDetails.$validate()) && termsAccepted.value;
    } else if (selectedMethod.value === 'paypal') {
        isValid = termsAccepted.value;
    } else if (selectedMethod.value === 'bank') {
        isValid = termsAccepted.value;
    }

    if (!termsAccepted.value) {
        await v$.value.termsAccepted.$validate();
    }

    if (!isValid) {
        return;
    }

    // Special handling for M-Pesa payments
    if (selectedMethod.value === 'mpesa') {
        // Show the M-Pesa payment modal
        showMpesaPayment.value = true;
        return;
    }

    // Special handling for PayPal
    if (selectedMethod.value === 'paypal') {
        initiatePayPalPayment();
        return;
    }

    // For other payment methods, proceed normally
    // Prepare payment data based on method
    let paymentData = {
        method: selectedMethod.value
    };

    if (selectedMethod.value === 'card') {
        const cardPaymentResult = await processCardPayment();
        if (!cardPaymentResult) {
            return; // Validation or processing failed
        }
        paymentData = cardPaymentResult;
    } else if (selectedMethod.value === 'bank') {
        paymentData.reference = orderReference.value;
    }

    // Emit the payment data to the parent component
    emit('place-order', paymentData);
};

// M-Pesa Dialog Handlers
const cancelMpesaPayment = () => {
    showMpesaPayment.value = false;
};

const completeMpesaPayment = (transactionData) => {
    mpesaTransactionData.value = transactionData;
    showMpesaPayment.value = false;

    // Prepare payment data with M-Pesa transaction details
    const paymentData = {
        method: 'mpesa',
        details: mpesaDetails,
        transactionData: transactionData
    };

    // Emit the payment data to the parent component
    emit('place-order', paymentData);
};

const failedMpesaPayment = (error) => {
    // Keep the dialog open to allow user to try again
    toast.add({
        severity: 'error',
        summary: 'M-Pesa Payment Failed',
        detail: error?.message || 'Unable to process M-Pesa payment. Please try again.',
        life: 5000
    });
};

const timeoutMpesaPayment = () => {
    // Handle timeout - the mpesa component already has retry functionality
    toast.add({
        severity: 'warn',
        summary: 'Payment Timeout',
        detail: 'M-Pesa payment request timed out. Please try again.',
        life: 5000
    });
};
</script>

<template>
    <div class="payment-method-form bg-white rounded shadow-sm p-4">
        <h3 class="text-xl font-bold border-b pb-3 mb-4">Payment Method</h3>

        <div class="payment-methods">
            <div class="payment-method" v-for="method in paymentMethods" :key="method.id">
                <div class="p-field-radiobutton mb-4">
                    <div class="flex items-center p-3 border rounded cursor-pointer" :class="{ 'border-primary bg-primary-lightest': selectedMethod === method.id }" @click="selectMethod(method.id)">
                        <RadioButton :inputId="'method_' + method.id" name="paymentMethod" :value="method.id" v-model="selectedMethod" />

                        <label :for="'method_' + method.id" class="ml-2 cursor-pointer flex-grow">
                            <div class="flex items-center">
                                <img :src="method.icon" :alt="method.name" class="w-10 h-10 object-contain mr-3" />
                                <div>
                                    <div class="font-medium">{{ method.name }}</div>
                                    <div class="text-sm text-gray-500">{{ method.description }}</div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- M-Pesa Information -->
                <div v-if="selectedMethod === 'mpesa' && method.id === 'mpesa'" class="payment-details pl-7 mb-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <div class="field mb-3">
                            <label for="mpesaPhone" class="block mb-1">M-Pesa Phone Number</label>
                            <InputText id="mpesaPhone" v-model="mpesaDetails.phone" class="w-full" :class="{ 'p-invalid': v$.mpesaDetails.phone.$invalid && submitted }" />
                            <small v-if="v$.mpesaDetails.phone.$invalid && submitted" class="p-error">
                                {{ v$.mpesaDetails.phone.$errors[0].$message }}
                            </small>
                            <small class="text-gray-500">After placing your order, you'll be prompted to complete the M-Pesa payment</small>
                        </div>
                    </div>
                </div>

                <!-- Card Payment Form -->
                <div v-if="selectedMethod === 'card' && method.id === 'card'" class="payment-details pl-7 mb-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <div class="field mb-3">
                            <label for="cardNumber" class="block mb-1">Card Number</label>
                            <InputText id="cardNumber" v-model="cardDetails.number" class="w-full" :class="{ 'p-invalid': v$.cardDetails.number.$invalid && submitted }" />
                            <small v-if="v$.cardDetails.number.$invalid && submitted" class="p-error">
                                {{ v$.cardDetails.number.$errors[0].$message }}
                            </small>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="field mb-3">
                                <label for="cardName" class="block mb-1">Cardholder Name</label>
                                <InputText id="cardName" v-model="cardDetails.name" class="w-full" :class="{ 'p-invalid': v$.cardDetails.name.$invalid && submitted }" />
                                <small v-if="v$.cardDetails.name.$invalid && submitted" class="p-error">
                                    {{ v$.cardDetails.name.$errors[0].$message }}
                                </small>
                            </div>

                            <div class="field mb-3">
                                <label for="cardExpiry" class="block mb-1">Expiry Date (MM/YY)</label>
                                <InputMask id="cardExpiry" v-model="cardDetails.expiry" mask="99/99" class="w-full" :class="{ 'p-invalid': v$.cardDetails.expiry.$invalid && submitted }" />
                                <small v-if="v$.cardDetails.expiry.$invalid && submitted" class="p-error">
                                    {{ v$.cardDetails.expiry.$errors[0].$message }}
                                </small>
                            </div>

                            <div class="field mb-3">
                                <label for="cardCvv" class="block mb-1">CVV</label>
                                <InputText id="cardCvv" v-model="cardDetails.cvv" type="password" class="w-full" :class="{ 'p-invalid': v$.cardDetails.cvv.$invalid && submitted }" />
                                <small v-if="v$.cardDetails.cvv.$invalid && submitted" class="p-error">
                                    {{ v$.cardDetails.cvv.$errors[0].$message }}
                                </small>
                            </div>
                        </div>
                        <div class="payment-card-brands flex items-center gap-2 mt-3 justify-end">
                            <img src="@/assets/img/shop/visa.png" alt="Visa" class="h-6" />
                            <img src="@/assets/img/shop/mastercard.png" alt="Mastercard" class="h-6" />
                            <img src="@/assets/img/shop/amex.png" alt="American Express" class="h-6" />
                        </div>
                    </div>
                </div>

                <!-- PayPal Payment Form -->
                <div v-if="selectedMethod === 'paypal' && method.id === 'paypal'" class="payment-details pl-7 mb-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <div class="text-center my-4">
                            <div class="paypal-button-container">
                                <div v-if="!paypalLoading" class="paypal-button-placeholder bg-blue-500 text-white py-3 rounded text-center cursor-pointer hover:bg-blue-600" @click="initiatePayPalPayment">
                                    <i class="pi pi-paypal mr-2"></i> Pay with PayPal
                                </div>
                                <div v-else class="flex justify-center py-2">
                                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                                </div>
                            </div>
                            <small class="text-gray-500 block mt-3">You will be redirected to PayPal to complete your payment securely.</small>
                        </div>
                    </div>
                </div>

                <!-- Bank Transfer Form -->
                <div v-if="selectedMethod === 'bank' && method.id === 'bank'" class="payment-details pl-7 mb-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <div v-if="loadingBankDetails" class="flex justify-center my-3">
                            <ProgressSpinner style="width: 40px; height: 40px" />
                        </div>

                        <div v-else-if="bankDetails" class="bank-details mb-3">
                            <h5 class="font-medium mb-2">Bank Transfer Details</h5>
                            <table class="text-sm w-full">
                                <tr>
                                    <td class="py-1 font-medium">Bank Name:</td>
                                    <td>{{ bankDetails.bank_name }}</td>
                                </tr>
                                <tr>
                                    <td class="py-1 font-medium">Account Name:</td>
                                    <td>{{ bankDetails.account_name }}</td>
                                </tr>
                                <tr>
                                    <td class="py-1 font-medium">Account Number:</td>
                                    <td>{{ bankDetails.account_number }}</td>
                                </tr>
                                <tr>
                                    <td class="py-1 font-medium">Branch:</td>
                                    <td>{{ bankDetails.branch }}</td>
                                </tr>
                                <tr>
                                    <td class="py-1 font-medium">Swift Code:</td>
                                    <td>{{ bankDetails.swift_code || 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td class="py-1 font-medium">Reference:</td>
                                    <td>ORDER-{{ orderReference }}</td>
                                </tr>
                            </table>
                        </div>

                        <div v-else class="text-center p-3 text-red-500 text-sm">
                            <i class="pi pi-exclamation-triangle mr-2"></i>
                            Could not load bank details. Please contact support.
                        </div>

                        <div class="field mb-3">
                            <label for="transferReference" class="block mb-1">Upload Proof of Payment (Optional)</label>
                            <FileUpload mode="basic" name="payment-proof" url="./upload" accept="image/*" :maxFileSize="1000000" @upload="onUpload" />
                            <small class="text-gray-500">Max file size: 1MB</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex items-center mt-6">
            <Checkbox id="termsAccepted" v-model="termsAccepted" :binary="true" :class="{ 'p-invalid': v$.termsAccepted.$invalid && submitted }" />
            <label for="termsAccepted" class="ml-2 cursor-pointer"> I agree to the <a href="#" class="text-primary hover:underline" @click.prevent="showTerms = true">Terms and Conditions</a> </label>
        </div>
        <small v-if="v$.termsAccepted.$invalid && submitted" class="p-error"> You must accept the terms and conditions to proceed </small>

        <div class="flex justify-between mt-6">
            <Button label="Back to Shipping" icon="pi pi-arrow-left" class="p-button-outlined" @click="goBackToShipping" />
            <Button label="Place Order" icon="pi pi-check" class="p-button-lg" @click="placeOrder" />
        </div>

        <!-- M-Pesa Payment Dialog -->
        <Dialog v-model:visible="showMpesaPayment" header="Complete M-Pesa Payment" :style="{ width: '550px' }" :modal="true" :closable="false">
            <MpesaPayment
                v-if="showMpesaPayment"
                :initialPhoneNumber="mpesaDetails.phone"
                :initialAmount="orderTotal"
                :paymentDescription="`Online Order - ${orderReference}`"
                :referenceNumber="'E-COM' + orderReference"
                :isAmountEditable="false"
                :timeoutSeconds="120"
                paymentType="online"
                @cancel="cancelMpesaPayment"
                @payment-complete="completeMpesaPayment"
                @payment-failed="failedMpesaPayment"
                @payment-timeout="timeoutMpesaPayment"
            />
        </Dialog>

        <!-- Terms and Conditions Dialog -->
        <Dialog v-model:visible="showTerms" header="Terms and Conditions" :style="{ width: '50vw' }" :modal="true">
            <div class="terms-content">
                <h4 class="font-medium mb-2">1. General Terms</h4>
                <p class="mb-3">By placing an order through this website, you agree to the following terms and conditions.</p>

                <h4 class="font-medium mb-2">2. Payment</h4>
                <p class="mb-3">All payments are processed securely. For M-Pesa payments, a prompt will be sent to your phone. For bank transfers, please include your order reference in the payment details.</p>

                <h4 class="font-medium mb-2">3. Delivery</h4>
                <p class="mb-3">Delivery times are estimated and may vary depending on your location and product availability. Standard delivery takes 3-5 business days.</p>

                <h4 class="font-medium mb-2">4. Returns and Refunds</h4>
                <p class="mb-3">You may return items within 7 days of delivery. Items must be unused and in original packaging. Refunds will be processed within 14 days of receiving the returned items.</p>
            </div>
            <template #footer>
                <Button label="I Accept" class="p-button-sm" @click="acceptTerms" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.border-primary {
    border-color: var(--primary-color);
}

.bg-primary-lightest {
    background-color: var(--primary-color-lightest);
}

.text-primary {
    color: var(--primary-color);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight),
:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-inputtext:enabled:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}
</style>
