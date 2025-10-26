<script setup>
import defaultImage from '@/assets/images/products/default.png';
import CouponManager from '@/components/ecommerce/checkout/CouponManager.vue';
import { useToast } from '@/composables/useToast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { useCartManager } from '@/utils/cartManager';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();
const { applyBusinessBranding } = useBusinessBranding();

// Get cart state from cartManager
const { cartItems, loading, totalItems, cartSummary, fetchCartItems, updateCartItem, removeCartItem, clearCart } = useCartManager();

// Additional state
const confirmDialog = ref(false);
const appliedCouponCode = ref('');
const cartSessionId = computed(() => cartItems.value[0]?.id || '');
const selectedDelivery = ref(1);

// Delivery options
const deliveryOptions = ref([]);
const loadingDeliveryOptions = ref(false);

// Function to fetch delivery options from backend
const fetchDeliveryOptions = async () => {
    loadingDeliveryOptions.value = true;
    try {
        // Try to get delivery options from sessionStorage first (set by product detail)
        const storedOptions = sessionStorage.getItem('deliveryOptions');
        if (storedOptions) {
            deliveryOptions.value = JSON.parse(storedOptions);
            // Find the first default option and select it
            const defaultOption = deliveryOptions.value.find((option) => option.is_default);
            if (defaultOption) {
                selectedDelivery.value = defaultOption.id;
            } else if (deliveryOptions.value.length > 0) {
                selectedDelivery.value = deliveryOptions.value[0].id;
            }
        } else {
            // Use the dedicated delivery options endpoint
            const response = await ecommerceService.getDeliveryOptions();

            if (response.data && Array.isArray(response.data)) {
                // Format the API response to match our structure
                deliveryOptions.value = response.data.map((option) => ({
                    id: option.id || Math.random().toString(36).substr(2, 9),
                    name: option.name,
                    description: option.description,
                    price: option.fee, // Backend uses 'fee', frontend uses 'price'
                    is_default: option.is_default
                }));

                // Save to sessionStorage for consistency between pages
                sessionStorage.setItem('deliveryOptions', JSON.stringify(deliveryOptions.value));

                // Set default selected delivery
                if (deliveryOptions.value.length > 0) {
                    const defaultOption = deliveryOptions.value.find((option) => option.is_default);
                    selectedDelivery.value = defaultOption ? defaultOption.id : deliveryOptions.value[0].id;
                }
            } else {
                throw new Error('Invalid delivery options response format');
            }
        }
    } catch (error) {
        console.error('Error fetching delivery options:', error);
        showToast('error', 'Error', 'Failed to load delivery options. Using default options.', 3000);
        // Fallback to default options if API fails
        deliveryOptions.value = [
            {
                id: 1,
                name: 'Standard Delivery',
                description: 'Delivery within 3-5 business days',
                price: 350,
                is_default: true
            },
            {
                id: 2,
                name: 'Express Delivery',
                description: 'Delivery within 1-2 business days',
                price: 500,
                is_default: false
            },
            {
                id: 3,
                name: 'Same Day Delivery',
                description: 'Delivery on the same day (order before 12 PM)',
                price: 750,
                is_default: false
            }
        ];
        // Set default selected delivery
        selectedDelivery.value = 1;
    } finally {
        loadingDeliveryOptions.value = false;
    }
};

// Computed
const breadcrumbItems = computed(() => [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/ecommerce/shop' },
    { label: 'Shopping Cart', to: '/ecommerce/shop/cart' }
]);

// Extend the cart summary with delivery fee
const extendedCartSummary = computed(() => {
    const deliveryFee = getSelectedDeliveryPrice();
    return {
        subtotal: cartSummary.value.subtotal,
        tax: cartSummary.value.tax,
        discount: cartSummary.value.discount,
        deliveryFee,
        total: cartSummary.value.subtotal + cartSummary.value.tax - cartSummary.value.discount + deliveryFee
    };
});

// Methods
onMounted(() => {
    applyBusinessBranding();
    fetchCartItems();
    console.log(cartItems.value);
    fetchDeliveryOptions();
});

const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
        // Use the centralized cart manager
        await updateCartItem(item.id, newQuantity);
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('error', 'Error', 'Failed to update quantity. Please try again.', 3000);
    }
};

const removeItem = async (itemId) => {
    try {
        // Use the centralized cart manager
        await removeCartItem(itemId);

        showToast('success', 'Item Removed', 'Item has been removed from your cart.', 3000);
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('error', 'Error', 'Failed to remove item. Please try again.', 3000);
    }
};

const confirmClearCart = () => {
    confirmDialog.value = true;
};

const clearCartHandler = async () => {
    try {
        // Use the centralized cart manager
        await clearCart();
        confirmDialog.value = false;

        showToast('success', 'Cart Cleared', 'All items have been removed from your cart.', 3000);
    } catch (error) {
        console.error('Error clearing cart:', error);
        showToast('error', 'Error', 'Failed to clear cart. Please try again.', 3000);
    }
};

const updateCart = async () => {
    showToast('success', 'Cart Updated', 'Your cart has been updated.', 3000);
};

// Handle coupon events from CouponManager
const handleCouponApplied = (couponData) => {
    appliedCouponCode.value = couponData.code;
    fetchCartItems(); // Refresh cart to reflect updated totals

    showToast('success', 'Coupon Applied', `Coupon ${couponData.code} applied successfully!`, 3000);
};

const handleCouponRemoved = () => {
    appliedCouponCode.value = '';
    fetchCartItems(); // Refresh cart to reflect updated totals

    showToast('info', 'Coupon Removed', 'Coupon has been removed.', 3000);
};

const selectDelivery = (deliveryId) => {
    selectedDelivery.value = deliveryId;
};

const getSelectedDeliveryPrice = () => {
    if (deliveryOptions.value.length === 0) return 0;
    const selected = deliveryOptions.value.find((option) => option.id === selectedDelivery.value);
    return selected ? parseFloat(selected.price) : 0;
};

const formatPrice = (price) => {
    if (!price && price !== 0) return '0';
    // Ensure price is a number and fixed to 2 decimal places
    const numPrice = parseFloat(price);
    return isNaN(numPrice)
        ? '0'
        : numPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
          });
};

const navigateToShop = () => {
    router.push('/ecommerce/shop');
};

const navigateToProduct = (productId) => {
    router.push(`/ecommerce/shop/product/${productId}`);
};

const proceedToCheckout = () => {
    router.push('/ecommerce/shop/checkout');
};
</script>

<template>
    <div class="shopping-cart">
        <!-- Breadcrumb Navigation -->
        <div v-if="loading" class="flex justify-center my-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="cartItems.length === 0" class="bg-white p-8 rounded shadow-sm text-center my-8">
            <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-medium mb-2">Your Cart is Empty</h2>
            <p class="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
            <Button label="Start Shopping" icon="pi pi-shopping-bag" @click="navigateToShop" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Cart Items -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded shadow-sm p-4">
                    <div class="flex justify-between items-center border-b pb-3 mb-4">
                        <h2 class="text-xl font-bold">Shopping Cart ({{ totalItems }} items)</h2>
                        <Button icon="pi pi-trash" label="Clear Cart" class="p-button-danger p-button-outlined p-button-sm" @click="confirmClearCart" />
                    </div>

                    <div class="cart-items">
                        <div v-for="item in cartItems" :key="item.id" class="cart-item border-b pb-4 mb-4">
                            <div class="flex flex-col md:flex-row">
                                <!-- Product Image -->
                                <div class="md:w-24 flex-shrink-0 mb-3 md:mb-0" @click="navigateToProduct(item.stock.product_id)">
                                    <img :src="item.stock.product_image != null ? item.stock.product_image : defaultImage" :alt="item.stock.product_id" class="w-full h-24 object-contain cursor-pointer" />
                                </div>

                                <!-- Product Details -->
                                <div class="flex-grow md:ml-4">
                                    <div class="flex justify-between items-start">
                                        <h3 class="text-base font-medium cursor-pointer" @click="navigateToProduct(item.stock.product_id)">
                                            {{ item.stock.product_title }}
                                        </h3>
                                        <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-sm" @click="removeItem(item.id)" />
                                    </div>

                                    <div class="text-sm text-gray-500 mb-1">
                                        <span v-if="item.stock.variation">Variant: {{ item.stock.variation.title }}</span>
                                    </div>

                                    <div class="price mt-2 mb-3 flex items-baseline">
                                        <span class="text-primary font-bold">KSh {{ formatPrice(item.stock.selling_price) }}</span>
                                        <span v-if="item.discount_amount > 0" class="text-gray-400 text-xs line-through ml-2"> KSh {{ formatPrice(item.stock.selling_price + item.discount_amount) }} </span>
                                    </div>

                                    <div class="flex justify-between items-center">
                                        <div class="quantity-selector flex items-center">
                                            <Button icon="pi pi-minus" class="p-button-outlined p-button-sm" @click="updateQuantity(item, item.quantity - 1)" :disabled="item.quantity <= 1" />
                                            <InputNumber v-model="item.quantity" showButtons buttonLayout="horizontal" :min="1" :max="100" class="w-20 mx-2" @update:modelValue="updateQuantity(item, item.quantity)" />
                                            <Button icon="pi pi-plus" class="p-button-outlined p-button-sm" @click="updateQuantity(item, item.quantity + 1)" />
                                        </div>

                                        <div class="item-total">
                                            <span class="font-medium">Total: KSh {{ formatPrice(item.item_total) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="cart-actions flex justify-between mt-6">
                        <Button label="Continue Shopping" icon="pi pi-arrow-left" class="p-button-outlined" @click="navigateToShop" />
                        <Button label="Update Cart" icon="pi pi-refresh" @click="updateCart" />
                    </div>
                </div>
            </div>

            <!-- Cart Summary -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded shadow-sm p-4">
                    <h3 class="text-xl font-bold border-b pb-3 mb-4">Order Summary</h3>

                    <div class="summary-details space-y-3">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span>KSh {{ formatPrice(extendedCartSummary.subtotal) }}</span>
                        </div>

                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span>KSh {{ formatPrice(extendedCartSummary.tax) }}</span>
                        </div>

                        <div v-if="extendedCartSummary.discount > 0" class="flex justify-between text-red-500">
                            <span>Discount:</span>
                            <span>-KSh {{ formatPrice(extendedCartSummary.discount) }}</span>
                        </div>

                        <div class="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                            <span>Total:</span>
                            <span>KSh {{ formatPrice(extendedCartSummary.total) }}</span>
                        </div>
                    </div>

                    <!-- Coupon Manager -->
                    <div class="coupon-section mt-6 border-t pt-4">
                        <CouponManager :applied-coupon-code="appliedCouponCode" :cart-session-id="cartSessionId" :shipping-fee="cartItems[0]?.shipping_fee || 0" @coupon-applied="handleCouponApplied" @coupon-removed="handleCouponRemoved" />
                    </div>

                    <!-- Checkout Button -->
                    <div class="checkout-button mt-6">
                        <Button label="Proceed to Checkout" icon="pi pi-check" class="w-full p-button-lg" @click="proceedToCheckout" />
                    </div>
                </div>

                <!-- Delivery Options -->
                <div class="bg-white rounded shadow-sm p-4 mt-4">
                    <h3 class="font-bold mb-3">Delivery Options</h3>
                    <div class="delivery-options">
                        <div
                            v-for="option in deliveryOptions"
                            :key="option.id"
                            class="delivery-option p-3 mb-2 border rounded cursor-pointer"
                            :class="{ 'border-primary bg-primary-lightest': selectedDelivery === option.id }"
                            @click="selectDelivery(option.id)"
                        >
                            <div class="flex items-center">
                                <RadioButton :value="option.id" v-model="selectedDelivery" :inputId="'delivery_' + option.id" />
                                <label :for="'delivery_' + option.id" class="ml-2 cursor-pointer">
                                    <div class="font-medium">{{ option.name }}</div>
                                    <div class="text-sm text-gray-500">{{ option.description }}</div>
                                </label>
                                <div class="ml-auto font-medium">KSh {{ formatPrice(option.price) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Confirmation Dialog for Clearing Cart -->
        <Dialog v-model:visible="confirmDialog" header="Clear Cart" :style="{ width: '450px' }" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to clear all items from your cart?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="confirmDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="clearCartHandler" autofocus />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.shopping-cart {
    font-family:
        system-ui,
        -apple-system,
        sans-serif;
    background-color: #f5f5f5;
    padding: 1rem;
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}

:deep(.p-inputtext:enabled:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}

.border-primary {
    border-color: var(--primary-color);
}

.bg-primary-lightest {
    background-color: var(--primary-color-lightest);
}

:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
    border-color: var(--primary-color);
    background: var(--primary-color);
}

@media (max-width: 768px) {
    .shopping-cart {
        padding: 0.5rem;
    }
}
</style>
