<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import CouponManager from './CouponManager.vue';

import defaultImage from '@/assets/images/products/default.png';

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    cartId: {
        type: [String, Number],
        default: ''
    },
    shipping: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    },
    couponCode: {
        type: String,
        default: ''
    },
    couponError: {
        type: String,
        default: ''
    },
    couponSuccess: {
        type: String,
        default: ''
    },
    discount: {
        type: Number,
        default: 0
    }
});
const emits = defineEmits(['apply-coupon', 'remove-coupon', 'coupon-error', 'coupon-success']);

const toast = useToast();

const totalItems = computed(() => {
    // Ensure items is an array before using reduce
    if (!Array.isArray(props.items)) {
        return 0;
    }
    return props.items.reduce((total, item) => total + (item.quantity || 0), 0);
});

const orderSummary = computed(() => {
    // Default values if items is not an array
    let subtotal = 0;
    let tax = 0;
    const shipping = props.shipping || 0;
    const discount = props.discount || 0; // Use the discount value from props

    // Only calculate if items is a valid array
    if (Array.isArray(props.items)) {
        subtotal = props.items.reduce((total, item) => {
            // Use item_subtotal if available, otherwise calculate from item_total
            const itemSubtotal = item.item_subtotal ? parseFloat(item.item_subtotal) : parseFloat(item.item_total || 0);
            return total + itemSubtotal;
        }, 0);

        tax = props.items.reduce((total, item) => {
            // Use tax_amount if available, otherwise use 0
            const itemTax = parseFloat(item.tax_amount || 0);
            return total + itemTax;
        }, 0);
    }

    return {
        subtotal,
        tax,
        shipping,
        discount,
        total: subtotal + tax + shipping - discount
    };
});

const formatPrice = (price) => {
    return price ? price.toLocaleString() : '0';
};

// Methods for CouponManager integration
const onApplyCoupon = (code) => {
    emits('apply-coupon', code);
};

const onRemoveCoupon = () => {
    emits('remove-coupon');
};

const onCouponError = (message) => {
    emits('coupon-error', message);
};

const onCouponSuccess = (message) => {
    emits('coupon-success', message);
};
</script>

<template>
    <div class="checkout-summary bg-white rounded shadow-sm p-4">
        <h3 class="text-xl font-bold border-b pb-3 mb-4">Order Summary</h3>

        <div v-if="loading" class="flex justify-center my-4">
            <ProgressSpinner style="width: 50px; height: 50px" />
        </div>

        <div v-else>
            <div class="summary-details space-y-3">
                <div class="flex justify-between">
                    <span>Subtotal ({{ totalItems }} items):</span>
                    <span>KSh {{ formatPrice(orderSummary.subtotal) }}</span>
                </div>

                <div class="flex justify-between">
                    <span>Shipping:</span>
                    <span>KSh {{ formatPrice(orderSummary.shipping) }}</span>
                </div>

                <div class="flex justify-between">
                    <span>Tax:</span>
                    <span>KSh {{ formatPrice(orderSummary.tax) }}</span>
                </div>

                <div v-if="orderSummary.discount > 0" class="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-KSh {{ formatPrice(orderSummary.discount) }}</span>
                </div>

                <div class="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                    <span>Total:</span>
                    <span>KSh {{ formatPrice(orderSummary.total) }}</span>
                </div>
            </div>

            <!-- Order Items -->
            <div class="order-items mt-6 border-t pt-4">
                <h4 class="font-medium mb-3">Items in Order</h4>
                <div v-for="item in items" :key="item.id" class="order-item flex mb-3 pb-3 border-b">
                    <div class="w-16 shrink-0">
                        <img :src="item.stock?.product_image || defaultImage" :alt="item.stock?.product_title || 'Product'" class="w-full h-16 object-contain" />
                    </div>
                    <div class="ml-3 grow">
                        <h5 class="text-sm font-medium line-clamp-1">{{ item.stock?.product_title || 'Product' }}</h5>
                        <div class="text-xs text-gray-500">Qty: {{ item.quantity }}</div>
                        <div class="text-sm font-medium">KSh {{ formatPrice(item.item_total) }}</div>
                    </div>
                </div>
            </div>

            <!-- Coupon Manager Component -->
            <div class="coupon-section mt-4 pt-3 border-t">
                <CouponManager
                    :cart-id="cartId"
                    :shipping="props.shipping"
                    :applied-coupon-code="props.couponCode"
                    :error="props.couponError"
                    :success="props.couponSuccess"
                    @apply-coupon="onApplyCoupon"
                    @remove-coupon="onRemoveCoupon"
                    @coupon-error="onCouponError"
                    @coupon-success="onCouponSuccess"
                />
            </div>

            <!-- Slot for additional actions like payment buttons -->
            <slot name="additional-actions"></slot>

            <!-- Order Processing Info -->
            <div class="flex items-center mt-4 text-xs text-gray-500">
                <i class="pi pi-shield mr-2 text-primary"></i>
                <span>Your personal data is protected and secure</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-inputtext:enabled:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}
</style>
