<script setup>
import { formatCurrency } from '@/components/hrm/payroll/payslipGenerator';
import { getProductImage } from '@/utils/productUtils';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { defineEmits, defineProps } from 'vue';

const props = defineProps({
    product: { type: Object, required: true }
});
const emit = defineEmits(['add-to-cart']);
const { formatCurrencySync } = useGlobalCurrency();

// Helper method for currency formatting
const formatPOSAmount = (amount) => formatCurrencySync(amount).value;

function addToCart() {
    emit('add-to-cart', props.product);
}
</script>

<template>
    <div class="pos-product-card">
        <img :src="getProductImage(product)" :alt="product.title" class="product-image" />
        <div class="product-info">
            <h3 class="product-title">{{ product.title }}</h3>
            <p class="product-price">{{ formatPOSAmount(product.selling_price) }}</p>
            <Button v-if="product.stock_level > 0" icon="pi pi-plus" label="Add to Cart" @click="addToCart" />
            <span v-else class="out-of-stock">Out of Stock</span>
        </div>
    </div>
</template>

<style scoped>
.pos-product-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    margin-bottom: 1rem;
}
.product-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 0.5rem;
}
.product-title {
    font-size: 1.1rem;
    margin: 0.5rem 0 0.2rem 0;
    text-align: center;
}
.product-price {
    font-weight: bold;
    color: #2e7d32;
    margin-bottom: 0.5rem;
}
.out-of-stock {
    color: #d32f2f;
    font-size: 0.9rem;
}
</style>
