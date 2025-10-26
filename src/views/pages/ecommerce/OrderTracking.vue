<script setup>
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const { applyBusinessBranding } = useBusinessBranding();

// State
const loading = ref(true);
const order = ref(null);
const tracking = ref({
    estimated_delivery: null,
    carrier_info: null,
    events: []
});
const orderId = ref(null);
const searchOrderNumber = ref('');

// Support dialog
const supportDialogVisible = ref(false);
const supportData = ref({
    subject: null,
    message: ''
});

const supportSubjects = [
    { label: 'Delivery Delay', value: 'delay' },
    { label: 'Wrong Item Received', value: 'wrong_item' },
    { label: 'Damaged Package', value: 'damaged' },
    { label: 'Missing Item', value: 'missing' },
    { label: 'Cancellation Request', value: 'cancel' },
    { label: 'Other', value: 'other' }
];

// Watch for route changes
watch(
    () => route.query.orderId,
    (newOrderId) => {
        if (newOrderId) {
            orderId.value = newOrderId;
            fetchOrder();
        } else {
            order.value = null;
            tracking.value = {
                estimated_delivery: null,
                carrier_info: null,
                events: []
            };
        }
    },
    { immediate: true }
);

// Lifecycle hooks
onMounted(() => {
    applyBusinessBranding();

    if (route.query.orderId) {
        orderId.value = route.query.orderId;
        fetchOrder();
    } else {
        loading.value = false;
    }
});

// Methods
const fetchOrder = async () => {
    if (!orderId.value) return;

    try {
        loading.value = true;
        const orderResponse = await ecommerceService.getOrderById(orderId.value);
        order.value = orderResponse.data;

        // Fetch tracking information if order is shipped or delivered
        if (['SHIPPED', 'DELIVERED'].includes(order.value.status)) {
            const trackingResponse = await ecommerceService.getOrderTracking(orderId.value);
            tracking.value = trackingResponse.data;
        } else {
            // Create basic tracking events based on order status
            tracking.value = createBasicTracking(order.value);
        }
    } catch (error) {
        console.error('Error fetching order:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load order information',
            life: 3000
        });
        order.value = null;
    } finally {
        loading.value = false;
    }
};

const createBasicTracking = (order) => {
    const events = [];

    // Always add order placed event
    events.push({
        status: 'Order Placed',
        location: 'Online',
        timestamp: order.date,
        notes: 'Your order has been received and is being processed.'
    });

    // Add payment confirmed if order is not cancelled
    if (order.status !== 'CANCELLED') {
        events.push({
            status: 'Payment Confirmed',
            location: 'Online',
            timestamp: new Date(new Date(order.date).getTime() + 1000 * 60 * 5), // 5 minutes after order
            notes: 'Your payment has been verified and confirmed.'
        });
    }

    // Add processing event if order is at least processing
    if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
        events.push({
            status: 'Processing',
            location: 'Warehouse',
            timestamp: new Date(new Date(order.date).getTime() + 1000 * 60 * 60 * 2), // 2 hours after order
            notes: 'Your order is being prepared for shipping.'
        });
    }

    // Add cancelled event if order is cancelled
    if (order.status === 'CANCELLED') {
        events.push({
            status: 'Cancelled',
            location: 'System',
            timestamp: new Date(new Date(order.date).getTime() + 1000 * 60 * 60 * 24), // 24 hours after order
            notes: 'Your order has been cancelled.'
        });
    }

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
        estimated_delivery: null,
        carrier_info: null,
        events
    };
};

const searchOrder = () => {
    if (!searchOrderNumber.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please enter an order number',
            life: 3000
        });
        return;
    }

    // Normally you would look up the order by order number in the API
    // For now, let's just show a message
    toast.add({
        severity: 'info',
        summary: 'Order Lookup',
        detail: 'Searching for order ' + searchOrderNumber.value,
        life: 3000
    });

    // Simulate no order found
    setTimeout(() => {
        toast.add({
            severity: 'error',
            summary: 'Order Not Found',
            detail: 'No order found with number ' + searchOrderNumber.value,
            life: 3000
        });
    }, 1500);
};

const getMarkerClass = (status) => {
    switch (status) {
        case 'Order Placed':
            return 'marker-order-placed';
        case 'Payment Confirmed':
            return 'marker-payment';
        case 'Processing':
            return 'marker-processing';
        case 'Shipped':
            return 'marker-shipped';
        case 'In Transit':
            return 'marker-transit';
        case 'Out for Delivery':
            return 'marker-out-delivery';
        case 'Delivered':
            return 'marker-delivered';
        case 'Cancelled':
            return 'marker-cancelled';
        default:
            return 'marker-default';
    }
};

const getMarkerIcon = (status) => {
    switch (status) {
        case 'Order Placed':
            return 'pi pi-shopping-cart';
        case 'Payment Confirmed':
            return 'pi pi-check-circle';
        case 'Processing':
            return 'pi pi-cog';
        case 'Shipped':
            return 'pi pi-box';
        case 'In Transit':
            return 'pi pi-truck';
        case 'Out for Delivery':
            return 'pi pi-map-marker';
        case 'Delivered':
            return 'pi pi-home';
        case 'Cancelled':
            return 'pi pi-times-circle';
        default:
            return 'pi pi-circle';
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

    return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatDateTime = (dateString) => {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const goToOrders = () => {
    router.push('/app/shop/account?tab=orders');
};

const openCarrierTracking = () => {
    if (tracking.value.carrier_info?.tracking_url) {
        window.open(tracking.value.carrier_info.tracking_url, '_blank');
    }
};

const contactSupport = () => {
    supportDialogVisible.value = true;
};

const submitSupportRequest = () => {
    if (!supportData.value.subject || !supportData.value.message) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please fill in all fields',
            life: 3000
        });
        return;
    }

    // Here you would normally submit the support request to an API
    // For now, just show a success message
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Your support request has been submitted',
        life: 3000
    });

    // Reset form and close dialog
    supportData.value = {
        subject: null,
        message: ''
    };
    supportDialogVisible.value = false;
};

const downloadInvoice = () => {
    if (!order.value) return;

    ecommerceService.downloadInvoice(order.value.id)
        .then((response) => {
            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'application/pdf' });

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${order.value.order_number}.pdf`;

            // Append to the document, click and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            window.URL.revokeObjectURL(url);

            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Invoice downloaded successfully',
                life: 3000
            });
        })
        .catch((error) => {
            console.error('Error downloading invoice:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to download invoice',
                life: 3000
            });
        });
};
</script>

<template>
    <div class="order-tracking-page">
        <Toast />
        <div class="grid">
            <div class="col-12">
                <Card>
                    <template #title>
                        <div class="flex align-items-center">
                            <i class="pi pi-map-marker mr-2"></i>
                            <span>Order Tracking</span>
                        </div>
                    </template>

                    <template #subtitle>
                        <div v-if="order">Order #{{ order.order_number }} | {{ formatDate(order.date) }}</div>
                    </template>

                    <template #content>
                        <div v-if="loading" class="flex justify-content-center p-5">
                            <ProgressSpinner />
                        </div>

                        <div v-else-if="!order" class="no-order p-5 text-center">
                            <i class="pi pi-search text-6xl text-gray-300 mb-3"></i>
                            <h3>No Order Found</h3>
                            <p class="text-gray-500 mb-3">The order you're looking for could not be found.</p>

                            <div v-if="!orderId" class="lookup-form mt-4 mb-4 flex flex-column align-items-center">
                                <h4>Look up your order</h4>
                                <div class="p-inputgroup w-full md:w-25rem mb-3">
                                    <InputText v-model="searchOrderNumber" placeholder="Order Number" />
                                    <Button icon="pi pi-search" @click="searchOrder" />
                                </div>
                            </div>

                            <Button label="Return to Orders" icon="pi pi-arrow-left" @click="goToOrders" />
                        </div>

                        <div v-else>
                            <div class="grid">
                                <div class="col-12 md:col-7">
                                    <div class="tracking-timeline mb-4">
                                        <div class="tracking-header flex justify-content-between mb-3">
                                            <div>
                                                <h3 class="m-0 mb-1">Shipment Status</h3>
                                                <div v-if="tracking.estimated_delivery" class="text-gray-600">
                                                    Estimated Delivery:
                                                    {{ formatDate(tracking.estimated_delivery) }}
                                                </div>
                                            </div>

                                            <Tag :value="order.status" :severity="getStatusSeverity(order.status)" class="order-status-badge" />
                                        </div>

                                        <Timeline :value="tracking.events" class="customized-timeline mb-4">
                                            <template #marker="slotProps">
                                                <span class="custom-marker shadow-2" :class="getMarkerClass(slotProps.item.status)">
                                                    <i :class="getMarkerIcon(slotProps.item.status)"></i>
                                                </span>
                                            </template>

                                            <template #content="slotProps">
                                                <div class="timeline-event-content">
                                                    <span class="event-title font-bold">{{ slotProps.item.status }}</span>
                                                    <div class="event-location text-gray-600">
                                                        {{ slotProps.item.location }}
                                                    </div>
                                                    <div class="text-gray-500 text-sm">
                                                        {{ formatDateTime(slotProps.item.timestamp) }}
                                                    </div>
                                                    <div v-if="slotProps.item.notes" class="event-notes mt-2 p-2 border-round surface-100">
                                                        {{ slotProps.item.notes }}
                                                    </div>
                                                </div>
                                            </template>
                                        </Timeline>

                                        <div v-if="tracking.carrier_info" class="carrier-info p-3 border-1 border-gray-200 border-round">
                                            <div class="flex align-items-center">
                                                <i class="pi pi-truck mr-2"></i>
                                                <span class="font-semibold">Shipping Carrier:</span>
                                                <span class="ml-2">{{ tracking.carrier_info.name }}</span>
                                            </div>
                                            <div class="mt-2">
                                                <span class="font-semibold">Tracking Number:</span>
                                                <span class="ml-2">{{ tracking.carrier_info.tracking_number }}</span>
                                                <Button v-if="tracking.carrier_info.tracking_url" label="Track on Carrier Website" icon="pi pi-external-link" class="p-button-text p-button-sm ml-3" @click="openCarrierTracking" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 md:col-5">
                                    <div class="order-summary p-3 border-1 border-gray-200 border-round mb-4">
                                        <h3 class="mt-0 mb-3">Order Summary</h3>

                                        <div v-for="item in order.items" :key="item.id" class="order-item flex mb-3 pb-2 border-bottom-1 border-gray-200">
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

                                        <div class="order-totals mt-3 pt-2">
                                            <div class="flex justify-content-between mb-2">
                                                <span>Subtotal:</span>
                                                <span>{{ formatCurrency(order.subtotal) }}</span>
                                            </div>
                                            <div class="flex justify-content-between mb-2">
                                                <span>Shipping:</span>
                                                <span>{{ formatCurrency(order.shipping_fee) }}</span>
                                            </div>
                                            <div class="flex justify-content-between mb-2">
                                                <span>Tax:</span>
                                                <span>{{ formatCurrency(order.tax) }}</span>
                                            </div>
                                            <div class="flex justify-content-between font-bold mt-3 pt-3 border-top-1 border-gray-200">
                                                <span>Total:</span>
                                                <span>{{ formatCurrency(order.total) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="shipping-info p-3 border-1 border-gray-200 border-round mb-4">
                                        <h3 class="mt-0 mb-3">Shipping Address</h3>
                                        <p class="m-0 mb-1">
                                            <strong>{{ order.shipping.name }}</strong>
                                        </p>
                                        <p class="m-0 mb-1">{{ order.shipping.address }}</p>
                                        <p class="m-0 mb-1">
                                            {{ order.shipping.city }}, {{ order.shipping.state }}
                                            {{ order.shipping.postal_code }}
                                        </p>
                                        <p class="m-0">{{ order.shipping.phone }}</p>
                                    </div>

                                    <div class="action-buttons flex flex-wrap gap-2 justify-content-center">
                                        <Button label="Contact Support" icon="pi pi-comments" class="p-button-outlined" @click="contactSupport" />
                                        <Button label="Download Invoice" icon="pi pi-download" @click="downloadInvoice" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Support Dialog -->
        <Dialog v-model:visible="supportDialogVisible" header="Contact Support" :style="{ width: '500px' }" modal>
            <div class="support-dialog p-3">
                <h3>Order Support</h3>
                <p>If you have any questions about your order, our support team is here to help.</p>

                <div class="contact-methods">
                    <div class="p-field mb-3">
                        <label for="supportSubject" class="block mb-2">Subject</label>
                        <Dropdown id="supportSubject" v-model="supportData.subject" :options="supportSubjects" optionLabel="label" placeholder="Select a subject" class="w-full" />
                    </div>

                    <div class="p-field mb-3">
                        <label for="supportMessage" class="block mb-2">Message</label>
                        <Textarea id="supportMessage" v-model="supportData.message" rows="5" placeholder="Describe your issue or question..." class="w-full" />
                    </div>

                    <div class="support-contact-info mb-3 p-3 border-1 border-gray-200 border-round bg-gray-50">
                        <h4 class="mt-0 mb-2">Contact us directly</h4>
                        <p class="m-0 mb-2"><i class="pi pi-phone mr-2"></i> +254 123 456 789</p>
                        <p class="m-0"><i class="pi pi-envelope mr-2"></i> support@procurepro.co.ke</p>
                    </div>

                    <div class="flex justify-content-end mt-3">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text mr-2" @click="supportDialogVisible = false" />
                        <Button label="Submit" icon="pi pi-send" @click="submitSupportRequest" />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.order-tracking-page {
    padding-bottom: 2rem;
}

/* Timeline customization */
:deep(.customized-timeline) .p-timeline-event-content,
:deep(.customized-timeline) .p-timeline-event-opposite {
    line-height: 1.5;
}

:deep(.customized-timeline) .p-timeline-event {
    min-height: 70px;
}

:deep(.customized-timeline) .p-timeline-event:last-child {
    min-height: 0;
}

:deep(.timeline-event-content) {
    padding: 0 1rem;
}

:deep(.p-timeline) .p-timeline-event-marker {
    width: auto;
    height: auto;
}

.custom-marker {
    display: flex;
    width: 2rem;
    height: 2rem;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    z-index: 1;
}

/* Marker colors */
.marker-order-placed {
    background-color: #64b5f6;
    color: #ffffff;
}

.marker-payment {
    background-color: #81c784;
    color: #ffffff;
}

.marker-processing {
    background-color: #ffb74d;
    color: #ffffff;
}

.marker-shipped {
    background-color: #7986cb;
    color: #ffffff;
}

.marker-transit {
    background-color: #4db6ac;
    color: #ffffff;
}

.marker-out-delivery {
    background-color: #4fc3f7;
    color: #ffffff;
}

.marker-delivered {
    background-color: #66bb6a;
    color: #ffffff;
}

.marker-cancelled {
    background-color: #e57373;
    color: #ffffff;
}

.marker-default {
    background-color: #bdbdbd;
    color: #ffffff;
}

/* Other styling */
.order-status-badge {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
}

.shipping-info,
.order-summary {
    background-color: #f9f9f9;
}
</style>
