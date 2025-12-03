<script setup>
import { formatCurrency } from '@/utils/formatters';
import { ref, watch } from 'vue';

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    products: {
        type: Array,
        default: () => []
    },
    readonly: {
        type: Boolean,
        default: false
    },
    showActions: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['update:items', 'item-changed', 'item-added', 'item-removed']);

const filteredProducts = ref([]);

// Methods
const searchProducts = (event) => {
    const query = event.query.toLowerCase();
    filteredProducts.value = props.products.filter(p => {
        // Handle both direct product and StockInventory structure
        const title = p.product?.title || p.title || '';
        const sku = p.product?.sku || p.sku || '';
        const serial = p.product?.serial || p.serial || '';
        
        return title.toLowerCase().includes(query) ||
               sku.toLowerCase().includes(query) ||
               serial.toLowerCase().includes(query);
    });
};

const onProductSelect = (item) => {
    if (item.product) {
        // Handle both direct product and StockInventory structure
        let productData = item.product;
        
        // If it's a StockInventory object, extract the nested product
        if (productData.product) {
            const stockItem = productData;
            productData = stockItem.product;
            
            // Set item details from stock inventory
            item.name = productData.title || '';
            item.description = productData.description || '';
            item.unit_price = parseFloat(stockItem.selling_price || 0);
            item.sku = productData.sku || '';
            item.stock_id = stockItem.id;
            
            // Get applicable tax from stock item
            if (stockItem.applicable_tax) {
                item.tax_rate = parseFloat(stockItem.applicable_tax.percentage || 0);
            } else {
                item.tax_rate = 0;
            }
        } else {
            // Direct product structure
            item.name = productData.title || '';
            item.description = productData.description || '';
            item.unit_price = parseFloat(productData.selling_price || 0);
            item.sku = productData.sku || '';
            
            // Get applicable tax
            if (productData.applicable_tax) {
                item.tax_rate = parseFloat(productData.applicable_tax.percentage || 0);
            } else {
                item.tax_rate = 0;
            }
        }
        
        calculateLineItem(item);
    }
};

const calculateLineItem = (item) => {
    // Calculate subtotal
    item.subtotal = item.quantity * item.unit_price;
    
    // Calculate tax
    item.tax_amount = (item.subtotal * item.tax_rate) / 100;
    
    // Calculate total
    item.total = item.subtotal + item.tax_amount;
    
    emit('item-changed', item);
};

const addItem = () => {
    const newItem = {
        product: null,
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        tax_amount: 0,
        subtotal: 0,
        total: 0
    };
    
    emit('item-added', newItem);
};

const removeItem = (index) => {
    emit('item-removed', index);
};

// Watch for external changes
watch(() => props.items, (newItems) => {
    filteredProducts.value = props.products;
}, { deep: true });
</script>

<template>
    <div class="line-items-table">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Line Items</h3>
            <Button 
                v-if="!readonly && showActions"
                icon="pi pi-plus" 
                label="Add Item" 
                class="p-button-sm p-button-outlined"
                @click="addItem"
            />
        </div>

        <DataTable 
            :value="items"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            :rowHover="true"
        >
            <Column header="#" headerStyle="width: 50px">
                <template #body="{ index }">
                    <span class="font-mono text-surface-500">{{ index + 1 }}</span>
                </template>
            </Column>

            <Column header="Product/Service" style="min-width: 300px">
                <template #body="{ data }">
                    <AutoComplete 
                        v-if="!readonly"
                        v-model="data.product"
                        :suggestions="filteredProducts"
                        @complete="searchProducts"
                        @item-select="onProductSelect(data)"
                        optionLabel="displayName"
                        placeholder="Search existing or enter custom..."
                        class="w-full"
                        :dropdown="true"
                        :forceSelection="false"
                    >
                        <template #item="slotProps">
                            <div class="flex items-center gap-3 py-2">
                                <div class="bg-primary-50 dark:bg-primary-900 p-2 rounded">
                                    <i class="pi pi-box text-primary text-lg"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                        {{ slotProps.item.product?.title || slotProps.item.title }}
                                    </div>
                                    <div class="flex gap-3 text-sm text-surface-600">
                                        <span>SKU: {{ slotProps.item.product?.sku || slotProps.item.sku }}</span>
                                        <span class="text-green-600">Stock: {{ slotProps.item.stock_level || 'N/A' }}</span>
                                        <span class="font-semibold text-primary">{{ formatCurrency(slotProps.item.selling_price || 0) }}</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </AutoComplete>
                    <span v-else class="font-medium">{{ data.product?.title || data.name }}</span>
                </template>
            </Column>

            <Column header="Item Name *" style="min-width: 200px">
                <template #body="{ data }">
                    <InputText 
                        v-if="!readonly"
                        v-model="data.name"
                        placeholder="Enter item name (required)"
                        class="w-full"
                        @input="calculateLineItem(data)"
                    />
                    <span v-else class="font-medium">{{ data.name }}</span>
                </template>
            </Column>

            <Column header="Description" style="min-width: 200px">
                <template #body="{ data }">
                    <Textarea 
                        v-if="!readonly"
                        v-model="data.description"
                        rows="2"
                        placeholder="Item description..."
                        class="w-full"
                        @input="calculateLineItem(data)"
                    />
                    <div v-else class="text-sm text-surface-500">{{ data.description }}</div>
                </template>
            </Column>

            <Column header="Qty *" headerStyle="width: 100px">
                <template #body="{ data }">
                    <InputNumber 
                        v-if="!readonly"
                        v-model="data.quantity"
                        :min="1"
                        class="w-full"
                        @input="calculateLineItem(data)"
                    />
                    <span v-else>{{ data.quantity }}</span>
                </template>
            </Column>

            <Column header="Unit Price *" headerStyle="width: 120px">
                <template #body="{ data }">
                    <InputNumber 
                        v-if="!readonly"
                        v-model="data.unit_price"
                        mode="currency"
                        currency="KES"
                        locale="en-KE"
                        class="w-full"
                        @input="calculateLineItem(data)"
                    />
                    <span v-else>{{ formatCurrency(data.unit_price) }}</span>
                </template>
            </Column>

            <Column header="Tax %" headerStyle="width: 100px">
                <template #body="{ data }">
                    <InputNumber 
                        v-if="!readonly"
                        v-model="data.tax_rate"
                        suffix="%"
                        :min="0"
                        :max="100"
                        class="w-full"
                        @input="calculateLineItem(data)"
                    />
                    <span v-else>{{ data.tax_rate }}%</span>
                </template>
            </Column>

            <Column header="Amount" headerStyle="width: 120px">
                <template #body="{ data }">
                    <div class="text-right font-semibold">
                        {{ formatCurrency(data.total) }}
                    </div>
                </template>
            </Column>

            <Column v-if="!readonly && showActions" headerStyle="width: 80px">
                <template #body="{ index }">
                    <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-text p-button-danger p-button-sm"
                        @click="removeItem(index)"
                        v-tooltip.top="'Remove'"
                    />
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-6">
                    <i class="pi pi-inbox text-4xl text-surface-400 mb-3"></i>
                    <p class="text-surface-600 dark:text-surface-400">No items added yet</p>
                    <Button 
                        v-if="!readonly && showActions"
                        label="Add First Item" 
                        icon="pi pi-plus" 
                        class="mt-3 p-button-sm p-button-outlined"
                        @click="addItem"
                    />
                </div>
            </template>
        </DataTable>
    </div>
</template>

<style scoped>
.line-items-table {
    width: 100%;
}

/* Make table responsive */
@media (max-width: 768px) {
    .line-items-table :deep(.p-datatable-wrapper) {
        overflow-x: auto;
    }
}
</style>

