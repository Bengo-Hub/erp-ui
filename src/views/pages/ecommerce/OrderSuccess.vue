<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBusinessBranding } from '@/utils/businessBranding';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import ProductCard from '@/components/ecommerce/ProductCard.vue';

export default {
    name: 'OrderSuccess',
    components: {
        ProductCard
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const { applyBusinessBranding } = useBusinessBranding();

        // Order details
        const order = ref({
            orderNumber: route.query.orderNumber || 'ORD-123456',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            email: 'customer@example.com',
            paymentMethod: route.query.paymentMethod || 'Credit Card',
            totalAmount: parseInt(route.query.amount) || 36795.7
        });

        // Recommended products
        const recommendedProducts = ref([]);

        // Computed
        const breadcrumbItems = computed(() => [
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/ecommerce/shop' },
            { label: 'Order Success', to: '/ecommerce/shop/order-success' }
        ]);

        // Methods
        onMounted(() => {
            applyBusinessBranding();
            fetchRecommendedProducts();
        });

        const fetchRecommendedProducts = async () => {
            try {
                const response = await ecommerceService.getProducts({ limit: 4 });
                recommendedProducts.value = response.data || [];

                // If API returns no products, use mock data
                if (recommendedProducts.value.length === 0) {
                    recommendedProducts.value = [
                        { id: 1, title: 'Smartphone X Pro', image: '/layout/images/product-placeholder.jpg', selling_price: 24999, rating: 4.5, review_count: 127 },
                        { id: 2, title: 'Wireless Earbuds', image: '/layout/images/product-placeholder.jpg', selling_price: 3999, rating: 4.2, review_count: 89 },
                        { id: 3, title: 'Smart Watch', image: '/layout/images/product-placeholder.jpg', selling_price: 7999, original_price: 9999, discount: 20, rating: 4.7, review_count: 56 },
                        { id: 4, title: 'Bluetooth Speaker', image: '/layout/images/product-placeholder.jpg', selling_price: 4599, rating: 4.0, review_count: 42 }
                    ];
                }
            } catch (error) {
                console.error('Error fetching recommended products:', error);
                recommendedProducts.value = [
                    { id: 1, title: 'Smartphone X Pro', image: '/layout/images/product-placeholder.jpg', selling_price: 24999, rating: 4.5, review_count: 127 },
                    { id: 2, title: 'Wireless Earbuds', image: '/layout/images/product-placeholder.jpg', selling_price: 3999, rating: 4.2, review_count: 89 },
                    { id: 3, title: 'Smart Watch', image: '/layout/images/product-placeholder.jpg', selling_price: 7999, original_price: 9999, discount: 20, rating: 4.7, review_count: 56 },
                    { id: 4, title: 'Bluetooth Speaker', image: '/layout/images/product-placeholder.jpg', selling_price: 4599, rating: 4.0, review_count: 42 }
                ];
            }
        };

        const updateFavoriteStatus = ({ id, isFavorite }) => {
            const product = recommendedProducts.value.find((p) => p.id === id);
            if (product) {
                product.isFavorite = isFavorite;
            }
        };

        const formatPrice = (price) => {
            return price ? price.toLocaleString() : '0';
        };

        const trackOrder = () => {
            router.push(`/ecommerce/shop/order-tracking?orderId=${order.value.orderNumber}`);
        };

        const continueShoppingBusiness = () => {
            router.push('/ecommerce/shop');
        };

        return {
            order,
            recommendedProducts,
            breadcrumbItems,
            updateFavoriteStatus,
            formatPrice,
            trackOrder,
            continueShoppingBusiness
        };
    }
};
</script>

<template>
    <div class="order-success">
        <!-- Breadcrumb Navigation -->
        <div class="bg-white p-6 rounded shadow-sm">
            <div class="flex flex-col items-center text-center">
                <i class="pi pi-check-circle text-7xl text-green-500 mb-4"></i>
                <h1 class="text-3xl font-bold mb-2">Order Successful!</h1>
                <p class="text-xl text-gray-600 mb-6">Thank you for your purchase</p>

                <div class="order-details bg-gray-50 p-5 rounded-lg mb-6 w-full max-w-lg">
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Order Number:</span>
                        <span>{{ order.orderNumber }}</span>
                    </div>
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Date:</span>
                        <span>{{ order.date }}</span>
                    </div>
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Payment Method:</span>
                        <span>{{ order.paymentMethod }}</span>
                    </div>
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Total Amount:</span>
                        <span>KSh {{ formatPrice(order.totalAmount) }}</span>
                    </div>
                </div>

                <div class="order-confirmation mb-6 text-gray-600">
                    <p class="mb-2">A confirmation email has been sent to {{ order.email }}</p>
                    <p>You can track your order status in your account</p>
                </div>

                <div class="next-steps grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                    <Button label="Track Order" icon="pi pi-map-marker" class="p-button-outlined" @click="trackOrder" />
                    <Button label="Continue Shopping" icon="pi pi-shopping-bag" @click="continueShoppingBusiness" />
                </div>

                <!-- Recommended Products -->
                <div class="recommended-products w-full mt-10">
                    <h2 class="text-xl font-bold mb-4 text-left">You Might Also Like</h2>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ProductCard v-for="product in recommendedProducts" :key="product.id" :product="product" @favorite-toggled="updateFavoriteStatus" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.order-success {
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

@media (max-width: 768px) {
    .order-success {
        padding: 0.5rem;
    }
}
</style>
