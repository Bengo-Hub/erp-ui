<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import ProductCard from '@/components/ecommerce/ProductCard.vue';

export default {
    name: 'FeaturedProducts',
    components: {
        ProductCard
    },
    props: {
        title: {
            type: String,
            default: 'Featured Products'
        },
        maxItems: {
            type: Number,
            default: 4
        },
        category: {
            type: Number,
            default: null
        },
        showViewAll: {
            type: Boolean,
            default: true
        },
        sort: {
            type: String,
            default: null
        },
        filter: {
            type: Object,
            default: () => ({})
        }
    },
    setup(props) {
        const router = useRouter();

        const products = ref([]);
        const loading = ref(true);
        const carouselPage = ref(0);

        onMounted(async () => {
            await fetchProducts();
        });

        const fetchProducts = async () => {
            try {
                // Prepare query parameters based on props
                const params = {
                    limit: props.maxItems,
                    ...props.filter
                };

                if (props.category) {
                    params.category = props.category;
                }

                if (props.sort) {
                    params.sort = props.sort;
                }

                const response = await ecommerceService.getProducts(params);
                products.value = response.data || [];

                // If API returns no products, generate mock data for demo
                if (products.value.length === 0) {
                    generateMockProducts();
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                generateMockProducts();
            } finally {
                loading.value = false;
            }
        };

        const generateMockProducts = () => {
            const mockData = [];

            for (let i = 1; i <= props.maxItems; i++) {
                const hasDiscount = Math.random() > 0.7;
                const price = Math.floor(Math.random() * 15000) + 2000;
                const discount = hasDiscount ? Math.floor(Math.random() * 30) + 10 : null;

                mockData.push({
                    id: i,
                    title: `Product ${i}`,
                    image: '/layout/images/product-placeholder.jpg',
                    selling_price: price,
                    original_price: hasDiscount ? Math.floor(price * (100 / (100 - discount))) : null,
                    discount,
                    rating: Math.floor(Math.random() * 5) + 1,
                    review_count: Math.floor(Math.random() * 100)
                });
            }

            products.value = mockData;
        };

        const updateFavoriteStatus = ({ id, isFavorite }) => {
            const product = products.value.find((p) => p.id === id);
            if (product) {
                product.isFavorite = isFavorite;
            }
        };

        const navigateToAll = () => {
            if (props.category) {
                router.push(`/ecommerce/shop/category/${props.category}`);
            } else {
                router.push('/ecommerce/shop/products');
            }
        };

        return {
            products,
            loading,
            carouselPage,
            updateFavoriteStatus,
            navigateToAll
        };
    }
};
</script>

<template>
    <div class="featured-products bg-white p-4 rounded shadow-sm mb-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">{{ title }}</h3>
            <Button v-if="showViewAll" label="View All" class="p-button-outlined p-button-sm" @click="navigateToAll" />
        </div>

        <div v-if="loading" class="flex justify-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="products.length === 0" class="text-center py-8 text-gray-500">No products available at the moment.</div>

        <div v-else>
            <!-- Desktop Grid View -->
            <div class="hidden md:grid grid-cols-4 gap-4">
                <ProductCard v-for="product in products" :key="product.id" :product="product" @favorite-toggled="updateFavoriteStatus" />
            </div>

            <!-- Mobile Carousel View -->
            <div class="block md:hidden">
                <Carousel :value="products" :numVisible="1" :numScroll="1" :circular="false" :showIndicators="false">
                    <template #item="slotProps">
                        <div class="product-carousel-item p-2">
                            <ProductCard :product="slotProps.data" @favorite-toggled="updateFavoriteStatus" />
                        </div>
                    </template>
                    <template #header>
                        <div class="carousel-dots flex justify-center mb-2">
                            <div v-for="(_, index) in products" :key="index" class="dot w-2 h-2 rounded-full mx-1" :class="{ 'bg-primary': carouselPage === index, 'bg-gray-300': carouselPage !== index }"></div>
                        </div>
                    </template>
                </Carousel>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bg-primary {
    background-color: var(--primary-color);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}

:deep(.p-carousel .p-carousel-indicators .p-carousel-indicator.p-highlight button) {
    background-color: var(--primary-color);
}
</style>
