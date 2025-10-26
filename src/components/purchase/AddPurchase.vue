<script setup>
import ImportProducts from '@/components/products/ImportProducts.vue';
import ProductForm from '@/components/products/ProductForm.vue';
import { coreService } from '@/services/shared/coreService';
import { procurementService } from '@/services/procurementService';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

// Data
const suppliers = ref([]);
const purchase_statuses = ref([
    { title: 'Ordered', value: 'ordered' },
    { title: 'Received', value: 'received' },
    { title: 'Pending', value: 'pending' }
]);
const duration_types = ref(['Days', 'Months']);
const branches = ref([]);
const purchase = ref({
    supplier: null,
    added_by: null,
    purchase_document: null,
    pay_term: { pay_duration: 0, duration_type: 'Days' },
    purchase_id: '',
    purchase_tax: 0.0,
    purchase_discount: 0.0,
    sub_total: 0.0,
    grand_total: 0.0,
    purchase_amount: 0.0,
    location: null,
    balance_due: 0.0,
    balance_overdue: 0.0,
    date_added: null,
    date_updated: null,
    purchase_status: null,
    payment_status: 'pending',
    paymethod: 'cash',
    delete_status: false
});
const purchaseTax = ref(0);
const purchaseDiscount = ref(0);
const purchaseShippingCharge = ref(0);
const purchasePackingCharge = ref(0);
const searchText = ref('');
const showDropdown = ref(false);
const products = ref([]);
const cart = ref([]);
const filteredProducts = ref([]);
const importModalVisible = ref(false);
const user = ref(JSON.parse(sessionStorage.user));
const business = ref(JSON.parse(sessionStorage.getItem('business')));
const productDialog = ref({
    visible: false,
    data: null
});

// Computed Properties
const totalItems = computed(() => cart.value.reduce((acc, item) => acc + item.quantity, 0));
const subTotal = computed(() => cart.value.reduce((total, item) => total + item.unit_price_before_tax * item.quantity, 0));
const grandTotal = computed(() => Math.ceil(subTotal.value + purchaseTax.value + purchasePackingCharge.value - purchaseDiscount.value));

// Methods
//openProductDialog
const openProductDialog = (product) => {
    productDialog.value.visible = true;
    productDialog.value.data = {};
};
const addToCart = (item) => {
    showDropdown.value = false;
    const existingItem = cart.value.find((e) => e.sku === item.sku);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.value.push({
            sku: item.sku,
            product: item.product,
            variation: item.variation,
            quantity: 1,
            discount_amount: 0,
            unit_price: item.buying_price,
            unit_price_before_tax: item.buying_price,
            profit_margin: 25,
            selling_price: item.selling_price
        });
    }
};

const removeFromCart = (index) => {
    cart.value.splice(index, 1);
};

const calculateProfitMargin = (item) => {
    const discount = (item.unit_price * item.discount_amount) / 100;
    item.unit_price_before_tax = item.unit_price - discount;
    item.profit_margin = ((item.selling_price - item.unit_price_before_tax) / item.unit_price_before_tax) * 100;
};

const applyFilter = () => {
    filteredProducts.value = products.value.filter((item) => item.product.title.toLowerCase().includes(searchText.value.toLowerCase()));
    showDropdown.value = true;
};

const addPurchase = () => {
    purchase.value.sub_total = subTotal.value;
    purchase.value.grand_total = grandTotal.value;
    purchase.value.purchase_amount = grandTotal.value;
    purchase.value.date_added = new Date().toISOString();
    purchase.value.purhaseitems = cart.value;
    purchase.value.added_by = user.value.user.id;
    purchase.value.location = purchase.value.location?.id || null;
    purchase.value.purchase_status = purchase.value.purchase_status?.value || 'pending';
    purchase.value.supplier = purchase.value.supplier?.id || null;

    axios
        .post(`purchases/`, purchase.value)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Purchase added successfully!', life: 3000 });
            cart.value = [];
        })
        .catch((err) => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add purchase. Please try again.', life: 5000 });
            console.error(err);
        });
};

const openImportModal = () => {
    importModalVisible.value = true;
};

const fetchStock = async () => {
    try {
        const response = await procurementService.getStock({ filter: '', limit: 10, offset: 0 });
        products.value = response.data.results;
        filteredProducts.value = products.value;
    } catch (error) {
        console.error('Error fetching stock:', error);
    }
};

const fetchSuppliers = async () => {
    try {
        const response = await procurementService.getSuppliers({ branch_code: business.value.branch_code, contact_type: 'Suppliers' });
        suppliers.value = response.data.results.map((sup) => ({
            ...sup,
            name: `${sup.user.first_name} ${sup.user.last_name}`
        }));
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
};

const fetchBranches = async () => {
    try {
        const response = await coreService.getBranches();
        branches.value = response.data.results.map((loc) => ({
            ...loc,
            name: `${business.value.branch_name} (${loc.branch_code})`
        }));
        purchase.value.branch = branches.value.find((l) => l.branch_code === business.value.branch_code);
    } catch (error) {
        console.error('Error fetching branches:', error);
    }
};

// Lifecycle Hooks
onMounted(() => {
    fetchStock();
    fetchSuppliers();
    fetchBranches();
});
</script>

<template>
    <div class="container mx-auto p-4">
        <form @submit.prevent="handleSubmit">
            <!-- Supplier and Purchase Details Section -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 rounded-lg border border-blue-500">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Supplier:</label>
                    <Dropdown v-model="purchase.supplier" :options="suppliers" optionLabel="name" placeholder="Select Supplier" class="w-full mt-1" />
                    <router-link :to="{ name: 'Suppliers' }" class="text-blue-500 text-sm mt-1 inline-block"> <i class="pi pi-plus"></i> Add New </router-link>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Purchase Status:</label>
                    <Dropdown v-model="purchase.purchase_status" :options="purchase_statuses" optionLabel="title" placeholder="Select Status" class="w-full mt-1" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ref No:</label>
                    <InputText v-model="purchase.purchase_id" placeholder="Leave blank to auto generate..." class="w-full mt-1" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Business Location:</label>
                    <Dropdown v-model="purchase.location" :options="branches" optionLabel="name" placeholder="Select Location" class="w-full mt-1" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Pay Term:</label>
                    <div class="flex gap-2 mt-1">
                        <InputNumber v-model="purchase.pay_term.pay_duration" class="w-1/2" />
                        <Dropdown v-model="purchase.pay_term.duration_type" :options="duration_types" placeholder="Select Type" class="w-1/2" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Attach Document:</label>
                    <FileUpload v-model="purchase.purchase_document" mode="basic" accept=".pdf, .doc, .docx, .jpg, .jpeg, .png" chooseLabel="Choose File" class="w-full mt-1" />
                </div>
            </div>

            <!-- Product Search and Import Section -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 rounded-lg border border-blue-500">
                <div>
                    <Button label="Import Products" icon="pi pi-upload" class="w-full mt-4" @click="openImportModal" />
                </div>
                <div>
                    <div class="relative">
                        <InputText v-model="searchText" placeholder="Enter Product Name / SKU / Scan Code" class="w-full mt-4" @input="applyFilter" />
                        <ul v-if="showDropdown" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto">
                            <li v-for="item in filteredProducts" :key="item.id" class="p-2 hover:bg-blue-500 hover:text-white cursor-pointer" @click="addToCart(item)">
                                {{ item.product.title }} ({{ item.product.serial || item.variation.title }}) Qty({{ item.stock_level }})
                            </li>
                        </ul>
                    </div>
                </div>
                <div>
                    <Button label="Add New Product" icon="pi pi-plus" class="w-full mt-4" @click="openProductDialog" />
                </div>
            </div>

            <!-- Cart Section -->
            <div class="mb-6">
                <DataTable :value="cart" class="p-datatable-sm">
                    <Column field="title" header="Product Name">
                        <template #body="{ data }"> {{ data.product.title }} {{ data.variation ? data.variation.title : '' }} </template>
                    </Column>
                    <Column field="quantity" header="Purchase Quantity">
                        <template #body="{ data }">
                            <InputNumber v-model="data.quantity" class="w-20" />
                        </template>
                    </Column>
                    <Column field="unit_price" header="Unit Cost (Before Dsct.)">
                        <template #body="{ data }">
                            <InputNumber v-model="data.unit_price" class="w-20" />
                        </template>
                    </Column>
                    <Column field="discount_amount" header="Discount (%)">
                        <template #body="{ data }">
                            <InputNumber v-model="data.discount_amount" class="w-20" @input="calculateProfitMargin(data)" />
                        </template>
                    </Column>
                    <Column field="unit_price_before_tax" header="Unit Cost (Before Tax)">
                        <template #body="{ data }">
                            <InputNumber v-model="data.unit_price_before_tax" class="w-20" />
                        </template>
                    </Column>
                    <Column field="profit_margin" header="Profit Margin (%)">
                        <template #body="{ data }">
                            <InputNumber v-model="data.profit_margin" class="w-20" />
                        </template>
                    </Column>
                    <Column field="selling_price" header="Unit Selling Price (Inc. Tax)">
                        <template #body="{ data }">
                            <InputNumber v-model="data.selling_price" class="w-20" />
                        </template>
                    </Column>
                    <Column field="line_total" header="Line Total">
                        <template #body="{ data }">
                            {{ new Intl.NumberFormat().format(data.selling_price * data.quantity) }}
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="{ index }">
                            <Button icon="pi pi-trash" class="p-button-danger" @click="removeFromCart(index)" />
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Summary Section -->
            <div class="bg-gray-100 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Purchase Discount (-):</label>
                        <InputNumber v-model="purchaseDiscount" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Purchase Tax (+):</label>
                        <InputNumber v-model="purchaseTax" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Shipping (+):</label>
                        <InputNumber v-model="purchaseShippingCharge" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Packing Charge (+):</label>
                        <InputNumber v-model="purchasePackingCharge" class="w-full" />
                    </div>
                </div>
                <div class="text-right">
                    <h4 class="text-lg font-semibold">
                        Total Items: <strong>{{ totalItems }}</strong>
                    </h4>
                    <h4 class="text-lg font-semibold text-red-500">
                        Net Total Amount: <strong>KES {{ new Intl.NumberFormat().format(grandTotal) }}</strong>
                    </h4>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="mt-6">
                <Button label="Add Purchase" class="w-full bg-yellow-500 hover:bg-yellow-600" @click="addPurchase" />
            </div>
        </form>

        <!-- Import Products Modal -->
        <Dialog v-model:visible="importModalVisible" header="Import Products" :modal="true" class="w-11/12 md:w-1/2">
            <ImportProducts :business="business" />
        </Dialog>
        <!-- Product Manager Modal -->
        <Dialog v-model:visible="productDialog.visible" header="Product Manager" :modal="true" class="w-11/12 md:w-1/2">
            <ProductForm :product="productDialog.data" @close="productDialog.visible = false" />
        </Dialog>
    </div>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
