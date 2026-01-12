<script setup>
import { coreService } from '@/services/shared/coreService';
import { inventoryService } from '@/services/ecommerce/inventoryService';
import { posService } from '@/services/ecommerce/posService';
import { formatCurrency } from '@/utils/formatters.js';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

const emit = defineEmits(['save', 'cancel']);
const props = defineProps({
    transfer: {
        type: Object,
        default: null
    }
});

const toast = useToast();

// Data
const branches = ref([]);
const products = ref([]);
const filteredProducts = ref([]);
const searchText = ref('');
const showDropdown = ref(false);
const loading = ref(false);

const transferStatuses = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Transit', value: 'In-Transit' },
    { label: 'Completed', value: 'Completed' }
];

const transfer = reactive({
    branch_from: null,
    branch_to: null,
    ref_no: '',
    status: 'Pending',
    transfer_shipping_charge: 0,
    notes: '',
    transfer_items: []
});

const cart = ref([]);

// Computed
const subtotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
});

const total = computed(() => {
    return subtotal.value + (transfer.transfer_shipping_charge || 0);
});

const isFormValid = computed(() => {
    return transfer.branch_from && transfer.branch_to && transfer.branch_from !== transfer.branch_to && cart.value.length > 0;
});

// Methods
const fetchBranches = async () => {
    try {
        loading.value = true;
        const response = await coreService.getBranches();
        branches.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch branches', error);
    } finally {
        loading.value = false;
    }
};

const fetchProducts = async () => {
    try {
        loading.value = true;
        const response = await posService.getProducts({
            page_size: 100,
            ordering: 'title',
            include: 'unit'
        });
        products.value = response.data.results;
        filteredProducts.value = products.value;
    } catch (error) {
        showError('Failed to fetch products', error);
    } finally {
        loading.value = false;
    }
};

const applyFilter = () => {
    if (!searchText.value) {
        showDropdown.value = false;
        return;
    }

    const searchTextLower = searchText.value.toLowerCase();
    filteredProducts.value = products.value.filter((item) => {
        const productTitle = item.product.title.toLowerCase();
        const sku = (item.product_type === 'single' ? item.product.sku : item.variation?.sku || '').toLowerCase();
        const serial = (item.product_type === 'single' ? item.product.serial : item.variation?.serial || '').toLowerCase();

        return productTitle.includes(searchTextLower) || sku.includes(searchTextLower) || serial.includes(searchTextLower);
    });

    showDropdown.value = filteredProducts.value.length > 0;

    // Auto-add if exact match found
    const exactMatch = filteredProducts.value.find((item) => {
        const sku = item.product_type === 'single' ? item.product.sku : item.variation?.sku;
        const serial = item.product_type === 'single' ? item.product.serial : item.variation?.serial;
        return sku?.toLowerCase() === searchTextLower || serial?.toLowerCase() === searchTextLower;
    });

    if (exactMatch) {
        addToCart({ data: exactMatch });
        searchText.value = '';
        showDropdown.value = false;
    }
};

const addToCart = ({ data }) => {
    const existingItem = cart.value.find((item) => item.product.id === data.product.id && (!item.variation || item.variation?.id === data.variation?.id));

    if (existingItem) {
        if (existingItem.quantity + 1 > data.stock_level) {
            showWarning(`Cannot add more than available stock (${data.stock_level})`);
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.value.push({
            product: data.product,
            variation: data.variation,
            quantity: 1,
            unit_price: data.buying_price,
            stock_level: data.stock_level,
            unit: data.unit
        });
    }

    searchText.value = '';
    showDropdown.value = false;
};

const removeFromCart = (index) => {
    cart.value.splice(index, 1);
};

const handleSubmit = async () => {
    try {
        loading.value = true;

        const transferData = {
            ...transfer,
            transfer_items: cart.value.map((item) => ({
                stock_item: item.product.id,
                variation_id: item.variation?.id,
                quantity: item.quantity,
                sub_total: item.unit_price * item.quantity
            }))
        };

        const response = props.transfer ? await inventoryService.updateStockTransfer(props.transfer.id, transferData) : await inventoryService.createStockTransfer(transferData);

        showSuccess(`Transfer ${props.transfer ? 'updated' : 'created'} successfully`);
        emit('save', response.data);
    } catch (error) {
        showError('Failed to save transfer', error);
    } finally {
        loading.value = false;
    }
};

const cancel = () => {
    emit('cancel');
};

const showSuccess = (message) => {
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000
    });
};

const showError = (message, error) => {
    console.error(error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `${message}: ${error.response?.data?.detail || error.message}`,
        life: 5000
    });
};

const showWarning = (message) => {
    toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: message,
        life: 3000
    });
};

// Helper function to get status severity
const getStatusSeverity = (status) => {
    switch (status) {
        case 'Pending':
            return 'info';
        case 'In-Transit':
            return 'warning';
        case 'Completed':
            return 'success';
        default:
            return null;
    }
};

// Lifecycle
onMounted(() => {
    fetchBranches();
    fetchProducts();

    if (props.transfer) {
        Object.assign(transfer, props.transfer);
        cart.value = props.transfer.transfer_items || [];
    }
});
</script>

<template>
    <div class="add-transfer">
        <form @submit.prevent="handleSubmit">
            <!-- Transfer Details Section -->
            <Card class="mb-4">
                <template #title>Transfer Details</template>
                <template #content>
                    <div class="grid">
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label>From Branch</label>
                                <Dropdown
                                    v-model="transfer.branch_from"
                                    :options="branches"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select branch"
                                    class="w-full"
                                    :class="{ 'p-invalid': transfer.branch_from === transfer.branch_to && transfer.branch_to !== null }"
                                />
                                <small class="p-error" v-if="transfer.branch_from === transfer.branch_to && transfer.branch_to !== null"> You can't transfer stock to the same branch </small>
                            </div>
                        </div>

                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label>To Branch</label>
                                <Dropdown
                                    v-model="transfer.branch_to"
                                    :options="branches"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select branch"
                                    class="w-full"
                                    :class="{ 'p-invalid': transfer.branch_from === transfer.branch_to && transfer.branch_from !== null }"
                                />
                            </div>
                        </div>

                        <div class="col-12 md:col-2">
                            <div class="field">
                                <label>Reference No</label>
                                <InputText v-model="transfer.ref_no" placeholder="Auto-generate if empty" class="w-full" />
                            </div>
                        </div>

                        <div class="col-12 md:col-2">
                            <div class="field">
                                <label>Status</label>
                                <Dropdown v-model="transfer.status" :options="transferStatuses" optionLabel="label" optionValue="value" class="w-full" />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Product Search Section -->
            <Card class="mb-4">
                <template #title>Add Products</template>
                <template #content>
                    <div class="grid">
                        <div class="col-12">
                            <div class="p-inputgroup">
                                <span class="p-inputgroup-addon">
                                    <i class="pi pi-search"></i>
                                </span>
                                <InputText v-model="searchText" placeholder="Search by product name, SKU or scan code" class="w-full" @input="applyFilter" />
                            </div>

                            <DataTable :value="filteredProducts" :visible="showDropdown" selectionMode="single" @rowSelect="addToCart" v-if="showDropdown" class="search-results mt-2">
                                <Column field="product.title" header="Product">
                                    <template #body="{ data }">
                                        {{ data.product.title }}
                                        <small v-if="data.variation" class="text-gray-500 ml-2"> ({{ data.variation.title }}) </small>
                                    </template>
                                </Column>
                                <Column field="stock_level" header="Stock">
                                    <template #body="{ data }"> {{ data.stock_level }} {{ data.unit?.title || '' }} </template>
                                </Column>
                                <Column field="buying_price" header="Unit Price">
                                    <template #body="{ data }">
                                        {{ formatCurrency(data.buying_price) }}
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Transfer Items Section -->
            <Card class="mb-4">
                <template #title>Transfer Items</template>
                <template #content>
                    <DataTable :value="cart" :scrollable="true" scrollHeight="400px" class="p-datatable-sm">
                        <Column header="Product">
                            <template #body="{ data }">
                                <div>
                                    <strong>{{ data.product.title }}</strong>
                                    <div v-if="data.variation" class="text-sm text-gray-500">
                                        {{ data.variation.title }}
                                    </div>
                                    <div class="text-xs text-gray-400">Stock: {{ data.stock_level }} {{ data.unit?.title || '' }}</div>
                                </div>
                            </template>
                        </Column>

                        <Column header="Quantity" style="width: 120px">
                            <template #body="{ data }">
                                <InputNumber v-model="data.quantity" mode="decimal" :min="1" :max="data.stock_level" class="w-full" />
                            </template>
                        </Column>

                        <Column header="Unit Price" style="width: 150px">
                            <template #body="{ data }">
                                <InputNumber v-model="data.unit_price" mode="currency" :min="0" currency="KES" class="w-full" />
                            </template>
                        </Column>

                        <Column header="Subtotal" style="width: 150px">
                            <template #body="{ data }">
                                {{ formatCurrency(data.unit_price * data.quantity) }}
                            </template>
                        </Column>

                        <Column header="Actions" style="width: 80px">
                            <template #body="{ data, index }">
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="removeFromCart(index)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Summary Section -->
            <Card class="mt-4">
                <template #title>Transfer Summary</template>
                <template #content>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label class="block mb-2 font-medium">Shipping Charge</label>
                                <InputNumber v-model="transfer.transfer_shipping_charge" mode="currency" currency="KES" class="w-full" />
                            </div>

                            <div class="field mt-4">
                                <label class="block mb-2 font-medium">Notes</label>
                                <Textarea v-model="transfer.notes" rows="3" placeholder="Additional transfer notes..." class="w-full" />
                            </div>
                        </div>

                        <div class="col-12 md:col-6">
                            <div class="summary-card p-4 border-round surface-card border-1 surface-border">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-lg font-semibold">Summary</span>
                                    <Tag :value="transfer.status" :severity="getStatusSeverity(transfer.status)" />
                                </div>

                                <div class="grid">
                                    <div class="col-6 text-500">Items Count:</div>
                                    <div class="col-6 text-right font-medium">{{ cart.length }}</div>

                                    <div class="col-6 text-500 mt-2">Products:</div>
                                    <div class="col-6 text-right mt-2">
                                        <div v-for="(item, index) in cart" :key="index" class="mb-1">
                                            <div class="flex justify-between">
                                                <span class="text-sm wrap" style="max-width: 200px">
                                                    {{ item.product.title }}
                                                    <span v-if="item.variation" class="text-xs text-400"> ({{ item.variation.title }}) </span>
                                                </span>
                                                <span class="text-sm"> {{ item.quantity }} × {{ formatCurrency(item.unit_price) }} </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <Divider class="my-3" />
                                    </div>

                                    <div class="col-6 text-500 font-semibold">Subtotal:</div>
                                    <div class="col-6 text-right font-semibold">{{ formatCurrency(subtotal) }}</div>

                                    <div class="col-6 text-500 mt-2">Shipping:</div>
                                    <div class="col-6 text-right mt-2">{{ formatCurrency(transfer.transfer_shipping_charge || 0) }}</div>

                                    <div class="col-12">
                                        <Divider class="my-2" />
                                    </div>

                                    <div class="col-6 text-900 font-bold">Total Amount:</div>
                                    <div class="col-6 text-right font-bold text-primary">{{ formatCurrency(total) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Action Buttons -->
            <div class="flex justify-between mt-4">
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="cancel" />
                <Button label="Save Transfer" icon="pi pi-check" type="submit" :disabled="!isFormValid" class="p-button-success" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.add-transfer {
    padding: 1rem;
}

.search-results {
    position: absolute;
    z-index: 1000;
    width: calc(100% - 2rem);
    max-height: 300px;
    overflow-y: auto;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-card {
    min-width: 300px;
}

:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable-tbody td) {
    padding: 0.5rem 1rem;
}
</style>
