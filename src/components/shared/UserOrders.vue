<script>
import { orderService } from '@/services/ecommerce/orderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
    name: 'UserOrders',
    props: {
        // Type of user viewing orders
        userType: {
            type: String,
            default: 'customer',
            validator: (value) => ['customer', 'staff', 'admin'].includes(value)
        }
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();
        const toast = useToast();

        const loading = ref(true);
        const orders = ref([]);
        const expandedRows = ref([]);
        const selectedOrder = ref(null);
        const orderDetailsVisible = ref(false);

        // Filter state
        const filters = ref({
            search: '',
            status: null,
            dateRange: null
        });

        // Filter options
        const statusOptions = [
            { label: 'All Status', value: null },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Processing', value: 'PROCESSING' },
            { label: 'Shipped', value: 'SHIPPED' },
            { label: 'Delivered', value: 'DELIVERED' },
            { label: 'Cancelled', value: 'CANCELLED' }
        ];

        const dateRangeOptions = [
            { label: 'All Time', value: null },
            { label: 'Last 30 Days', value: '30d' },
            { label: 'Last 3 Months', value: '3m' },
            { label: 'Last 6 Months', value: '6m' },
            { label: 'Last Year', value: '1y' }
        ];

        // Computed properties
        const userId = computed(() => store.state.auth.user?.id);
        const isStaffUser = computed(() => ['staff', 'admin'].includes(props.userType));

        const filteredOrders = computed(() => {
            let result = [...orders.value];

            // Filter by search term
            if (filters.value.search) {
                const searchTerm = filters.value.search.toLowerCase();
                result = result.filter((order) => {
                    // Search in order number
                    if (order.order_number.toLowerCase().includes(searchTerm)) return true;

                    // Search in product names
                    if (order.items.some((item) => item.name.toLowerCase().includes(searchTerm))) return true;

                    return false;
                });
            }

            // Filter by status
            if (filters.value.status) {
                result = result.filter((order) => order.status === filters.value.status);
            }

            // Filter by date range
            if (filters.value.dateRange) {
                const now = new Date();
                let cutoffDate;

                switch (filters.value.dateRange) {
                    case '30d':
                        cutoffDate = new Date(now.setDate(now.getDate() - 30));
                        break;
                    case '3m':
                        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
                        break;
                    case '6m':
                        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
                        break;
                    case '1y':
                        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
                        break;
                }

                if (cutoffDate) {
                    result = result.filter((order) => new Date(order.date) >= cutoffDate);
                }
            }

            return result;
        });

        // Lifecycle hooks
        onMounted(async () => {
            await fetchOrders();
        });

        // Methods
        const fetchOrders = async () => {
            try {
                loading.value = true;
                let response;

                // Backend scopes orders to request.user; do not pass user_id
                response = await orderService.getOrders();

                orders.value = response.data;
            } catch (error) {
                console.error('Error fetching orders:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load orders',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        };

        const getStatusSeverity = (status) => {
            switch (status) {
                case 'DELIVERED':
                    return 'success';
                case 'SHIPPED':
                    return 'info';
                case 'PROCESSING':
                    return 'warning';
                case 'PENDING':
                    return 'primary';
                case 'CANCELLED':
                    return 'danger';
                default:
                    return 'secondary';
            }
        };

        const viewOrderDetails = (order) => {
            selectedOrder.value = order;
            orderDetailsVisible.value = true;
        };

        const goToShop = () => {
            router.push('/ecommerce/shop');
        };

        const canTrackOrder = (order) => {
            // Only orders that have been shipped can be tracked
            return ['SHIPPED', 'DELIVERED'].includes(order.status);
        };

        const canReorderItems = (order) => {
            return false; // Not supported yet
        };

        const canUpdateOrder = (order) => {
            // Staff users can update orders that are not delivered or cancelled
            return !['DELIVERED', 'CANCELLED'].includes(order.status);
        };

        const trackOrder = (order) => {
            router.push(`/app/shop/order-tracking?orderId=${order.id}`);
        };

        const reorderItems = async (order) => {};

        const updateOrder = (order) => {
            router.push(`/app/orders/edit/${order.id}`);
        };

        const downloadInvoice = async (order) => {
            try {
                await orderService.downloadInvoice(order.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Invoice downloaded successfully',
                    life: 3000
                });
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to download invoice',
                    life: 3000
                });
            }
        };

        const printOrder = () => {
            window.print();
        };

        return {
            // State
            loading,
            orders,
            expandedRows,
            selectedOrder,
            orderDetailsVisible,
            filters,
            statusOptions,
            dateRangeOptions,
            isStaffUser,
            filteredOrders,

            // Methods
            formatDate,
            formatCurrency,
            getStatusSeverity,
            viewOrderDetails,
            goToShop,
            canTrackOrder,
            canReorderItems,
            canUpdateOrder,
            trackOrder,
            reorderItems,
            updateOrder,
            downloadInvoice,
            printOrder
        };
    }
};
</script>

<template>
    <div class="user-orders">
        <Card>
            <template #title>
                <div class="flex align-items-center">
                    <i class="pi pi-shopping-bag mr-2"></i>
                    <span>Order History</span>
                </div>
            </template>

            <template #content>
                <div v-if="loading" class="flex justify-content-center">
                    <ProgressSpinner />
                </div>

                <div v-else-if="orders.length === 0" class="no-orders p-4 text-center">
                    <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-3"></i>
                    <h3>No Orders Found</h3>
                    <p class="text-gray-500">You haven't placed any orders yet.</p>
                    <Button label="Start Shopping" icon="pi pi-shopping-cart" @click="goToShop" />
                </div>

                <div v-else>
                    <!-- Order Filters -->
                    <div class="order-filters mb-3 flex flex-column md:flex-row gap-2 justify-content-between">
                        <div class="search-container p-inputgroup w-full md:w-25rem">
                            <InputText v-model="filters.search" placeholder="Search by order or product" />
                            <Button icon="pi pi-search" />
                        </div>

                        <div class="filter-buttons flex flex-wrap gap-2">
                            <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" placeholder="Filter by status" class="w-full md:w-12rem" />
                            <Dropdown v-model="filters.dateRange" :options="dateRangeOptions" optionLabel="label" placeholder="Date range" class="w-full md:w-12rem" />
                        </div>
                    </div>

                    <!-- Orders List -->
                    <DataTable :value="filteredOrders" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" responsiveLayout="stack" breakpoint="960px" class="p-datatable-sm" dataKey="id" v-model:expandedRows="expandedRows">
                        <Column expander style="width: 3rem" />

                        <Column field="order_number" header="Order #" style="min-width: 10rem">
                            <template #body="slotProps">
                                <span class="font-semibold">{{ slotProps.data.order_number }}</span>
                            </template>
                        </Column>

                        <Column field="date" header="Date" style="min-width: 10rem">
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.date) }}
                            </template>
                        </Column>

                        <Column field="status" header="Status" style="min-width: 8rem">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>

                        <Column field="total" header="Total" style="min-width: 8rem">
                            <template #body="slotProps">
                                <span class="font-semibold">{{ formatCurrency(slotProps.data.total) }}</span>
                            </template>
                        </Column>

                        <Column header="Actions" style="min-width: 10rem">
                            <template #body="slotProps">
                                <div class="flex flex-wrap gap-2">
                                    <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewOrderDetails(slotProps.data)" />
                                    <Button v-if="canTrackOrder(slotProps.data)" icon="pi pi-map-marker" class="p-button-text p-button-sm" @click="trackOrder(slotProps.data)" />
                                    <Button v-if="canReorderItems(slotProps.data)" icon="pi pi-refresh" class="p-button-text p-button-sm" @click="reorderItems(slotProps.data)" />
                                    <Button v-if="isStaffUser && canUpdateOrder(slotProps.data)" icon="pi pi-pencil" class="p-button-text p-button-sm" @click="updateOrder(slotProps.data)" />
                                </div>
                            </template>
                        </Column>

                        <template #expansion="slotProps">
                            <div class="order-details p-3">
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <h5>Order Items</h5>
                                        <div v-for="item in slotProps.data.items" :key="item.id" class="order-item flex mb-2 p-2 border-bottom-1 border-gray-200">
                                            <div class="product-image mr-2">
                                                <img :src="item.image || '/layout/images/product-placeholder.jpg'" :alt="item.name" width="50" height="50" class="border-round" />
                                            </div>
                                            <div class="product-details flex-1">
                                                <div class="product-name font-semibold">{{ item.name }}</div>
                                                <div class="flex justify-content-between">
                                                    <span class="text-sm text-gray-700"> {{ item.quantity }} × {{ formatCurrency(item.price) }} </span>
                                                    <span class="font-semibold">{{ formatCurrency(item.quantity * item.price) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12 md:col-6">
                                        <h5>Shipping Details</h5>
                                        <div class="shipping-address p-2">
                                            <div><span class="font-semibold">Name:</span> {{ slotProps.data.shipping.name }}</div>
                                            <div><span class="font-semibold">Address:</span> {{ slotProps.data.shipping.address }}</div>
                                            <div><span class="font-semibold">City:</span> {{ slotProps.data.shipping.city }}</div>
                                            <div><span class="font-semibold">Phone:</span> {{ slotProps.data.shipping.phone }}</div>
                                        </div>

                                        <h5 class="mt-3">Payment Information</h5>
                                        <div class="payment-info p-2">
                                            <div><span class="font-semibold">Method:</span> {{ slotProps.data.payment.method }}</div>
                                            <div><span class="font-semibold">Status:</span> {{ slotProps.data.payment.status }}</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-content-end mt-3">
                                    <Button label="Download Invoice" icon="pi pi-download" class="p-button-outlined p-button-sm" @click="downloadInvoice(slotProps.data)" />
                                </div>
                            </div>
                        </template>
                    </DataTable>
                </div>
            </template>
        </Card>

        <!-- Order Details Dialog -->
        <Dialog v-model:visible="orderDetailsVisible" :header="`Order #${selectedOrder?.order_number || ''}`" :style="{ width: '80vw' }" modal>
            <div v-if="selectedOrder" class="order-details-dialog">
                <div class="grid">
                    <!-- Order Summary -->
                    <div class="col-12 mb-3">
                        <div class="flex justify-content-between flex-column sm:flex-row">
                            <div>
                                <h5 class="mt-0">Order Information</h5>
                                <p><span class="font-semibold">Date:</span> {{ formatDate(selectedOrder.date) }}</p>
                                <p>
                                    <span class="font-semibold">Status:</span>
                                    <Tag :value="selectedOrder.status" :severity="getStatusSeverity(selectedOrder.status)" />
                                </p>
                            </div>
                            <div>
                                <h5 class="mt-0">Customer Information</h5>
                                <p><span class="font-semibold">Name:</span> {{ selectedOrder.customer.name }}</p>
                                <p><span class="font-semibold">Email:</span> {{ selectedOrder.customer.email }}</p>
                                <p><span class="font-semibold">Phone:</span> {{ selectedOrder.customer.phone }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Order Items -->
                    <div class="col-12 mb-3">
                        <h5>Order Items</h5>
                        <DataTable :value="selectedOrder.items" responsiveLayout="stack" class="p-datatable-sm">
                            <Column field="name" header="Product">
                                <template #body="slotProps">
                                    <div class="product-in-order flex align-items-center">
                                        <img :src="slotProps.data.image || '/layout/images/product-placeholder.jpg'" :alt="slotProps.data.name" width="40" height="40" class="mr-2 border-round" />
                                        <span>{{ slotProps.data.name }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="price" header="Price">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.price) }}
                                </template>
                            </Column>
                            <Column field="quantity" header="Quantity" />
                            <Column field="subtotal" header="Subtotal">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.price * slotProps.data.quantity) }}
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- Order Summary and Shipping -->
                    <div class="col-12 md:col-6">
                        <h5>Shipping Address</h5>
                        <div class="shipping-address p-3 border-1 border-gray-200 border-round">
                            <p class="m-0">{{ selectedOrder.shipping.name }}</p>
                            <p class="m-0">{{ selectedOrder.shipping.address }}</p>
                            <p class="m-0">{{ selectedOrder.shipping.city }}</p>
                            <p class="m-0">{{ selectedOrder.shipping.phone }}</p>
                        </div>

                        <h5 class="mt-3">Payment Method</h5>
                        <div class="payment-method p-3 border-1 border-gray-200 border-round">
                            <p class="m-0"><span class="font-semibold">Method:</span> {{ selectedOrder.payment.method }}</p>
                            <p class="m-0"><span class="font-semibold">Status:</span> {{ selectedOrder.payment.status }}</p>
                            <p v-if="selectedOrder.payment.transaction_id" class="m-0"><span class="font-semibold">Transaction ID:</span> {{ selectedOrder.payment.transaction_id }}</p>
                        </div>
                    </div>

                    <div class="col-12 md:col-6">
                        <h5>Order Summary</h5>
                        <div class="order-summary p-3 border-1 border-gray-200 border-round">
                            <div class="flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>{{ formatCurrency(selectedOrder.subtotal) }}</span>
                            </div>
                            <div class="flex justify-content-between mb-2">
                                <span>Shipping:</span>
                                <span>{{ formatCurrency(selectedOrder.shipping_fee) }}</span>
                            </div>
                            <div class="flex justify-content-between mb-2">
                                <span>Tax:</span>
                                <span>{{ formatCurrency(selectedOrder.tax) }}</span>
                            </div>
                            <div class="flex justify-content-between font-bold mt-3 pt-3 border-top-1 border-gray-200">
                                <span>Total:</span>
                                <span>{{ formatCurrency(selectedOrder.total) }}</span>
                            </div>
                        </div>

                        <div v-if="selectedOrder.notes" class="mt-3">
                            <h5>Order Notes</h5>
                            <div class="order-notes p-3 border-1 border-gray-200 border-round">
                                {{ selectedOrder.notes }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap justify-content-end gap-2 mt-4">
                    <Button label="Print Order" icon="pi pi-print" class="p-button-outlined" @click="printOrder" />
                    <Button label="Download Invoice" icon="pi pi-download" @click="downloadInvoice(selectedOrder)" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.order-filters {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
}

.order-details {
    background-color: #f8f9fa;
}

:deep(.p-datatable-scrollable) {
    overflow-x: auto;
}

@media print {
    .no-print {
        display: none !important;
    }
}

:deep(.p-dialog-content) {
    overflow-y: auto;
    max-height: 80vh;
}
</style>
