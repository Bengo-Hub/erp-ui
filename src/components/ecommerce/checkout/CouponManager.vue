<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useToast } from 'primevue/usetoast';
import { formatCurrency, formatDate } from '@/utils/formatters';

const props = defineProps({
    cartId: {
        type: [String, Number],
        required: true
    },
    shipping: {
        type: Number,
        default: 0
    },
    appliedCouponCode: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    },
    success: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['apply-coupon', 'remove-coupon', 'coupon-error', 'coupon-success']);

const toast = useToast();
const couponCodeInput = ref(props.appliedCouponCode || '');
const loading = ref(false);
const availableCoupons = ref([]);
const appliedCoupon = ref(null);

// Watch for changes in the applied coupon code prop
watch(
    () => props.appliedCouponCode,
    (newValue) => {
        if (newValue !== couponCodeInput.value) {
            couponCodeInput.value = newValue || '';
        }
    }
);

// Apply the entered coupon code
const applyCoupon = async () => {
    if (!couponCodeInput.value) {
        emit('coupon-error', 'Please enter a coupon code');
        return;
    }

    loading.value = true;
    emit('coupon-error', '');
    emit('coupon-success', '');

    emit('apply-coupon', couponCodeInput.value);
    loading.value = false;
};

// Select a coupon from the available coupons list
const selectCoupon = (coupon) => {
    couponCodeInput.value = coupon.code;
    applyCoupon();
};

// Remove the applied coupon
const removeCoupon = () => {
    emit('remove-coupon');
    couponCodeInput.value = '';
    appliedCoupon.value = null;
};

// Format a price value
const formatPrice = (price) => {
    return price ? parseFloat(price).toLocaleString() : '0';
};

// Format a date string
// Get a label for the discount (e.g., "10% off" or "KSh 500 off")
const getDiscountLabel = (coupon) => {
    if (!coupon) return '';

    if (coupon.discount_type === 'percentage') {
        return `${coupon.discount_value}% off your order`;
    } else if (coupon.discount_type === 'fixed') {
        return `KSh ${formatPrice(coupon.discount_value)} off your order`;
    }

    return '';
};

// Get a badge label for the discount
const getDiscountBadge = (coupon) => {
    if (!coupon) return '';

    if (coupon.discount_type === 'percentage') {
        return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'fixed') {
        return `KSh ${formatPrice(coupon.discount_value)} OFF`;
    }

    return '';
};

// Fetch available coupons
const fetchAvailableCoupons = async () => {
    try {
        const response = await ecommerceService.getAvailableCoupons();
        if (response.data) {
            availableCoupons.value = response.data;
        }
    } catch (error) {
        console.error('Error fetching available coupons:', error);
    }
};

// Fetch the currently applied coupon details if any
const fetchAppliedCoupon = async () => {
    if (!props.appliedCouponCode) {
        appliedCoupon.value = null;
        return;
    }

    try {
        // First check if the coupon exists in available coupons to avoid unnecessary API calls
        const existingCoupon = availableCoupons.value.find((c) => c.code === props.appliedCouponCode);
        if (existingCoupon) {
            appliedCoupon.value = existingCoupon;
            return;
        }

        // If not in our available coupons, fetch from API
        const response = await ecommerceService.getCouponDetails(props.appliedCouponCode);
        if (response.data) {
            appliedCoupon.value = response.data;
        }
    } catch (error) {
        // Handle 404 errors gracefully (coupon not found)
        if (error.response && error.response.status === 404) {
            console.warn('Coupon not found, treating as invalid');
            emit('coupon-error', 'Invalid coupon code');
        } else {
            console.error('Error fetching applied coupon details:', error);
        }
        appliedCoupon.value = null;
    }
};

onMounted(async () => {
    await fetchAvailableCoupons();
    await fetchAppliedCoupon();
});
</script>

<template>
    <div class="coupon-manager">
        <!-- Coupon input and apply button -->
        <div class="coupon-input mb-3">
            <h4 class="font-medium mb-2">VOUCHERS &amp; COUPONS</h4>
            <div class="flex">
                <InputText v-model="couponCodeInput" placeholder="Enter coupon code" class="w-full text-sm" />
                <Button label="Apply" class="ml-2" @click="applyCoupon" :loading="loading" />
            </div>
            <small v-if="error" class="text-red-500">{{ error }}</small>
            <small v-if="success" class="text-green-500">{{ success }}</small>
        </div>

        <!-- Available coupons section -->
        <div v-if="availableCoupons.length > 0" class="available-coupons mb-3">
            <Divider align="center">
                <span class="text-xs text-gray-500">OR SELECT AVAILABLE COUPON</span>
            </Divider>

            <div class="coupon-list mt-3">
                <div
                    v-for="coupon in availableCoupons"
                    :key="coupon.code"
                    class="coupon-item border rounded-lg p-2 mb-2 cursor-pointer hover:border-primary transition-all"
                    :class="{ 'border-primary bg-primary-50': appliedCoupon?.code === coupon.code }"
                    @click="selectCoupon(coupon)"
                >
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-sm">{{ coupon.code }}</div>
                            <div class="text-xs text-gray-600">
                                {{ getDiscountLabel(coupon) }}
                                <span v-if="coupon.minimum_order_amount" class="text-xs text-gray-500"> (Min. order: KSh {{ formatPrice(coupon.minimum_order_amount) }}) </span>
                            </div>
                            <div v-if="coupon.end_date" class="text-xs text-gray-500">Expires: {{ formatDate(coupon.end_date) }}</div>
                        </div>
                        <div class="discount-label text-right">
                            <Badge :value="getDiscountBadge(coupon)" severity="success" class="text-xs" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Applied coupon summary -->
        <div v-if="appliedCoupon" class="applied-coupon mb-3 mt-4">
            <div class="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div>
                    <div class="font-medium">{{ appliedCoupon.code }}</div>
                    <div class="text-sm text-gray-600">{{ getDiscountLabel(appliedCoupon) }}</div>
                </div>
                <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-button-sm p-button-text" @click="removeCoupon" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.coupon-item {
    transition: all 0.2s ease;
}
.coupon-item:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
