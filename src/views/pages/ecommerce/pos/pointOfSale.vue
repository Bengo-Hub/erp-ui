<script setup>
import { formatCurrency } from '@/components/hrm/payroll/payslipGenerator';
import Discount from '@/components/pos/Discount.vue';
import PosProductCard from '@/components/pos/PosProductCard.vue';
import RecentTransactions from '@/components/pos/RecentTransactions.vue';
import RegisterManager from '@/components/pos/RegisterManager.vue';
import ServiceCharge from '@/components/pos/ServiceCharge.vue';
import Shipping from '@/components/pos/Shipping.vue';
import StaffAdvanceSale from '@/components/pos/StaffAdvanceSale.vue';
import SuspendedSales from '@/components/pos/SuspendedSales.vue';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { getProductImage } from '@/utils/productUtils';
import { debounce } from 'lodash-es';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import printReceipt from './printReceipt.vue';
import SaleRegister from './register.vue';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

// Reactive state
const business = ref(JSON.parse(sessionStorage.getItem('business')));
const selectedCustomer = ref(null);
const customerData = ref([]);
const searchText = ref('');
const products = ref([]);
const filteredProducts = ref([]);
const cart = ref([]);
const currentPage = ref(1);
const perPage = ref(6);
const totalProducts = ref(0);
const orderTax = ref(0);
const orderDiscount = ref(0);
const orderPackingCharge = ref(0);
const orderShippingCharge = ref(0);
const paymentMethod = ref('Cash');
const amountPaid = ref(0);
const selectedCustomerAccount = ref('');
const PhoneNumber = ref('0743793901');
const editablePhoneNumber = ref(false);
const isLoading = ref(false);
const isProcessing = ref(false);
const spinner_title = ref('Processing...');
const mpesaPassword = ref(null);
const mpesaCheckoutID = ref(null);
const mpesaLipaTime = ref(null);
const sale_data = ref(null);
const registerOpen = ref(false);
const user = ref(JSON.parse(sessionStorage.user));
const modals = ref({
    'modal-expense': false,
    'modal-receipt': false,
    'modal-register': false,
    'modal-order-tax': false,
    'modal-mpesa': false,
    'modal-service-charge': false,
    'modal-recents': false,
    'modal-shipping': false,
    'modal-discount': false,
    'modal-print': false,
    'modal-closeregister': false,
    'modal-staff-advance': false,
    'modal-suspended': false,
    'modal-register-required': false,
    'modal-register-summary': false
});
const drawers = ref({
    'recent-transactions': false,
    'suspended-sales': false
});

// Add new data properties
const paymentMethods = ref([]);
const selectedPaymentMethod = ref(null);
const isProcessingPayment = ref(false);
const lastSale = ref(null);

// Fetch locations for use in OpenRegister or other POS needs
const locations = ref([]);
const fetchLocations = async () => {
    try {
        const response = await systemConfigService.getBusinessLocations();
        if (response.success) {
            locations.value = response.data.results;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch locations', life: 4000 });
    }
};

// Fetch customers using CustomerService
const fetchCustomers = async () => {
    try {
        const customerParams = {
            // Add any filters needed for your business logic
        };
        const res = await customerService.getCustomers(customerParams);
        const data = res.data.results || res.data;
        if (!data || data.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'No Customers Found',
                detail: 'Please login to your admin portal and add customers to start selling.',
                life: 5000
            });
            return;
        }
        customerData.value = data
            .filter((customer) => customer.user && customer.user.id)
            .map((customer) => ({
                ...customer,
                fullName: customer.fullName || `${customer.user?.first_name || ''} ${customer.user?.last_name || ''}`.trim(),
                accounts: customer.accounts || []
            }));
        selectedCustomer.value = customerData.value.find((u) => u.user?.username?.includes('walkin'));
        // Initialize default accounts if not already set
        if (selectedCustomer.value && (!selectedCustomer.value.accounts || selectedCustomer.value.accounts.length === 0)) {
            selectedCustomer.value.accounts = [{ account_balance: 0, advance_balance: 0 }];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
    }
};

// Computed properties
const TotalPayableBefortax = computed(() => cart.value.reduce((acc, item) => acc + item.selling_price * item.quantity, 0) - orderDiscount.value);
const TotalPayable = computed(() => {
    let total = TotalPayableBefortax.value + orderTax.value + orderPackingCharge.value - orderDiscount.value;
    if (customerAdvance.value >= total) return 0;
    return Math.ceil(total - customerAdvance.value);
});
const grandTotal = computed(() => Math.ceil(TotalPayableBefortax.value + orderTax.value + orderPackingCharge.value - orderDiscount.value));
const change = computed(() => {
    return Math.max(0, (amountPaid.value || 0) - TotalPayable.value);
});
const formattedPhoneNumber = computed(() => {
    if (/^0/.test(PhoneNumber.value)) return PhoneNumber.value.replace(/^0/, '254');
    if (/^254/.test(PhoneNumber.value)) return PhoneNumber.value;
    return PhoneNumber.value;
});
const customerAdvance = computed(() => {
    if (!selectedCustomer.value) return 0;
    if (selectedCustomerAccount.value === 'customer_account') return Number(selectedCustomer.value.accounts[0].account_balance);
    if (selectedCustomerAccount.value === 'customer_advance') return Number(selectedCustomer.value.accounts[0].advance_balance);
    return 0;
});

// Lifecycle hooks
onMounted(async () => {
    await fetchLocations();
    await fetchCustomers();
    await checkRegisterAndShowModal();
    await loadPaymentMethods();
    await applyFilter(); // Fetch POS stock on mount
});

// Methods
const onPageChange = () => {
    currentPage.value = 1; // Reset to first page when changing page size
    applyFilter();
};
const getFirstTwoWords = (name) => {
    return name.split(' ').slice(0, 2).join(' ');
};
const openModal = (modal) => {
    if (cart.value.length === 0 && modal === 'modal-mpesa') {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No items in cart!',
            life: 3000
        });
        return;
    }
    modals.value[modal] = true;
};
const applyFilter = async () => {
    try {
        const params = {
            filter: searchText.value,
            limit: perPage.value,
            offset: (currentPage.value - 1) * perPage.value
        };
        const response = await posService.getProducts(params);
        products.value = response.data.results;
        totalProducts.value = response.data.count;
        filteredProducts.value = products.value;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
    }
};

const handlePageChange = (event) => {
    currentPage.value = event.page + 1;
    applyFilter();
};

const updatearrays = async () => {
    try {
        const params = {
            filter: searchText.value,
            limit: perPage.value,
            offset: (currentPage.value - 1) * perPage.value
        };
        const response = await posService.getProducts(params);
        products.value = response.data.results;
        totalProducts.value = response.data.count;
        filteredProducts.value = products.value;

        const customerParams = {
            branch_code: business.value.branch_code,
            contact_type: 'Customers',
            query: ''
        };

        const res = await posService.getCustomers(customerParams);
        const data = res.data.results;
        if (!data || data.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'No Customers Found',
                detail: 'Please login to your admin portal and add customers to start selling.',
                life: 5000
            });
            return;
        }
        customerData.value = data.map((customer) => ({
            ...customer,
            fullName: `${customer.user.first_name} ${customer.user.last_name}`,
            accounts: customer.accounts || []
        }));
        selectedCustomer.value = customerData.value.find((u) => u.user.username.includes('walkin'));

        // Initialize default accounts if not already set
        if (selectedCustomer.value && (!selectedCustomer.value.accounts || selectedCustomer.value.accounts.length === 0)) {
            selectedCustomer.value.accounts = [{ account_balance: 0, advance_balance: 0 }];
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
    }
};

const checkRegisterAndShowModal = async () => {
    try {
        const response = await posService.getRegisterStatus(user.value.id, business.value.branch_code);
        registerOpen.value = response.data.is_open;
        if (!response.data.is_open) {
            modals.value['modal-register-required'] = true;
        } else {
            modals.value['modal-register-required'] = false;
        }
    } catch (e) {
        console.error('Register check error:', e);
        modals.value['modal-register-required'] = true;
    }
};

const addToCart = (item) => {
    console.log(item);
    // Always use product.id, product.title, etc.
    const productId = item.product?.id;
    const variationSku = item.variation?.sku;
    const productSku = item.product?.sku;
    const uniqueKey = variationSku ? `${productId}-${variationSku}` : `${productId}-${productSku}`;

    // Find existing item by unique key
    const existingItem = cart.value.find((e) => e.uniqueKey === uniqueKey);

    if (existingItem) {
        if (existingItem.quantity + 1 > item.stock_level) {
            toast.add({
                severity: 'warn',
                summary: 'Low Stock',
                detail: `Item ${productSku} cannot accommodate the requested quantity.`,
                life: 5000
            });
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.value.push({
            uniqueKey,
            sku: productSku,
            product: {
                id: productId,
                title: item.product?.title || 'No Title',
                sku: productSku,
                images: item.product?.images || []
            },
            variation: item.variation || null,
            quantity: 1,
            selling_price: item.selling_price || 0,
            stock_level: item.stock_level || 0
        });
    }
};

const removeFromCart = (item) => {
    cart.value = cart.value.filter((e) => e.uniqueKey !== item.uniqueKey);
};

const loadPaymentMethods = async () => {
    try {
        const response = await PaymentService.getPaymentMethods();
        const methods = response.data?.results || response.data || [];
        const normalized = [];
        const addIf = (cond, id, label, icon) => {
            if (cond) normalized.push({ id, label, icon, trigger: label });
        };
        const joined = (methods || []).map((m) => (m.code || m.id || '').toLowerCase());
        addIf(true, 'Cash', 'Cash', 'pi pi-money-bill');
        addIf(
            joined.some((c) => c.includes('mpesa')),
            'Mpesa',
            'M-Pesa',
            'pi pi-mobile'
        );
        addIf(
            joined.some((c) => c.includes('card')),
            'Card',
            'Card',
            'pi pi-credit-card'
        );
        addIf(
            joined.some((c) => c.includes('bank')),
            'Bank',
            'Bank',
            'pi pi-wallet'
        );
        addIf(
            joined.some((c) => c.includes('paypal')),
            'PayPal',
            'PayPal',
            'pi pi-paypal'
        );
        paymentMethods.value = normalized;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load payment methods',
            life: 3000
        });
    }
};

const processPayment = async (status, method) => {
    if (!validatePayment()) return;

    isProcessingPayment.value = true;
    try {
        const paymentData = preparePaymentData(status, method);

        if (method === 'Mpesa') {
            await handleMpesaPayment(paymentData);
        } else if (method === 'Card') {
            await handleCardPayment(paymentData);
        } else {
            await handleCashPayment(paymentData);
        }
    } catch (error) {
        handlePaymentError(error);
    } finally {
        isProcessingPayment.value = false;
    }
};

const validatePayment = () => {
    if (cart.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No items in cart!',
            life: 3000
        });
        return false;
    }

    if (!registerOpen.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please open the register first!',
            life: 3000
        });
        return false;
    }

    return true;
};

const preparePaymentData = (status, method) => {
    console.log(user.value);
    if (!selectedCustomer.value || !selectedCustomer.value.user || !selectedCustomer.value.user.id) {
        toast.add({
            severity: 'error',
            summary: 'Customer Error',
            detail: 'Please select a valid customer before proceeding.',
            life: 4000
        });
        throw new Error('No valid customer selected');
    }
    const formData = new FormData();
    // Cart items (new structure)
    cart.value.forEach((item) => {
        formData.append('product_id[]', item.product?.id || null);
        formData.append('variation_id[]', item.variation?.id || '');
        formData.append('qty[]', item.quantity);
        formData.append('unit_price[]', item.selling_price);
        formData.append('sku[]', item.product?.sku || '');
        formData.append('discount[]', item.discount?.discount_amount || 0);
        formData.append('tax[]', item.applicable_tax?.percentage || 0);
        formData.append('unit[]', item.unit?.title || item.unit?.id || '');
        formData.append('sub_total[]', (item.quantity * item.selling_price).toFixed(2));
    });
    // Payment details
    formData.append('customer_account', selectedCustomerAccount.value);
    formData.append('tax_amount', orderTax.value);
    formData.append('sale_discount', orderDiscount.value);
    formData.append('change_amount', change.value.toFixed(2));
    formData.append('tendered_amount', amountPaid.value);
    formData.append('grand_total', grandTotal.value);
    formData.append('status', status);
    formData.append('paymethod', method);
    formData.append('attendant', user.value.id);
    formData.append('customer_id', selectedCustomer.value.user.id);
    formData.append('customer_advance', customerAdvance.value);
    return formData;
};

const handleMpesaPayment = async (paymentData) => {
    const stkData = {
        amount: paymentData.get('grand_total'),
        phone: formattedPhoneNumber.value,
        tr_description: `${business.value.business__name} (${business.value.location_name})`
    };

    const response = await posService.initiateSTKPush(stkData);

    if (response.data.ResponseCode === '0') {
        mpesaCheckoutID.value = response.data.checkoutID;
        startMpesaStatusCheck();
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Please check your phone to complete the payment',
            life: 5000
        });
    }
};

const handleCardPayment = async (paymentData) => {
    const response = await PaymentService.processCardPayment(paymentData);
    if (response.data.success) {
        await submitsale(paymentData);
    }
};

const handleCashPayment = async (paymentData) => {
    await submitsale(paymentData);
};

const startMpesaStatusCheck = () => {
    const checkInterval = setInterval(async () => {
        try {
            const response = await posService.checkSTKPushStatus({
                checkoutId: mpesaCheckoutID.value
            });

            if (response.data.status === 'COMPLETED') {
                clearInterval(checkInterval);
                await confirmPayment('Paid', 'Mpesa');
            } else if (response.data.status === 'FAILED') {
                clearInterval(checkInterval);
                toast.add({
                    severity: 'error',
                    summary: 'Payment Failed',
                    detail: 'M-Pesa payment was not completed',
                    life: 3000
                });
            }
        } catch (error) {
            console.error('Error checking M-Pesa status:', error);
        }
    }, 5000);

    // Stop checking after 2 minutes
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 120000);
};

const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.add({
        severity: 'error',
        summary: 'Payment Failed',
        detail: error.response?.data?.message || 'Failed to process payment',
        life: 3000
    });
};

const handleStaffAdvanceSale = async (saleData) => {
    try {
        // Process the staff advance sale
        const data = {
            ...saleData,
            items: cart.value,
            total_amount: cartTotal.value,
            discount: orderDiscount.value,
            tax: orderTax.value,
            shipping: shipping.value,
            service_charge: serviceCharge.value
        };

        const response = await posService.createStaffAdvanceSale(data);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Staff advance sale processed for ${saleData.staff.fullName}`,
            life: 3000
        });

        // Clear the cart and reset values
        clearCart();

        // Close the modal
        modals.value['modal-staff-advance'] = false;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to process staff advance sale',
            life: 5000
        });
    }
};

const suspendSale = async () => {
    if (cart.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Cannot suspend an empty cart',
            life: 3000
        });
        return;
    }

    try {
        isProcessing.value = true;
        spinner_title.value = 'Suspending sale...';

        // Use a dialog instead of prompt for note entry
        confirm.require({
            message: 'Do you want to add a note for this suspended sale?',
            header: 'Suspend Sale',
            icon: 'pi pi-info-circle',
            accept: async () => {
                const note = prompt('Enter a note for this suspended sale:') || '';
                await processSuspendSale(note);
            },
            reject: async () => {
                await processSuspendSale('');
            }
        });
    } catch (error) {
        isProcessing.value = false;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to suspend sale',
            life: 5000
        });
    }
};

const processSuspendSale = async (note) => {
    try {
        // First check if register is open
        if (!registerOpen.value) {
            const registerResponse = await posService.getRegisterStatus(user.value.id, business.value.branch_code);
            if (!registerResponse.data.is_open) {
                toast.add({
                    severity: 'error',
                    summary: 'Register Closed',
                    detail: 'Please open the register before suspending sales',
                    life: 3000
                });
                openModal('modal-register');
                isProcessing.value = false;
                return;
            } else {
                registerOpen.value = true;
            }
        }

        // Make sure each product has an ID - check your cart items to see what format is expected
        for (const item of cart.value) {
            if (!item.product || !item.product.id) {
                console.error('Invalid product in cart:', item);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'One or more products in your cart are invalid. Please clear and try again.',
                    life: 5000
                });
                isProcessing.value = false;
                return;
            }
        }

        const data = {
            items: cart.value.map((item) => ({
                product_id: item.product.id || null,
                variation_id: item.variation?.id || null,
                quantity: parseInt(item.quantity) || 1,
                unit_price: parseFloat(item.selling_price) || 0,
                sku: item.sku || ''
            })),
            customer_id: selectedCustomer.value?.id || null,
            discount: orderDiscount.value || 0,
            tax: orderTax.value || 0,
            shipping: shipping.value || 0,
            service_charge: serviceCharge.value || 0,
            note: note || ''
        };

        const response = await posService.createSuspendedSale(data);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Sale suspended successfully',
            life: 3000
        });

        // Clear the cart and reset values
        clearCart();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to suspend sale. Check data format.',
            life: 5000
        });
    } finally {
        isProcessing.value = false;
    }
};

const resumeSuspendedSale = async (suspendedSale) => {
    try {
        // Clear current cart first
        clearCart();

        // Add the suspended sale items to the cart
        for (const item of suspendedSale.items) {
            cart.value.push({
                ...item,
                quantity: parseInt(item.quantity)
            });
        }

        // Set the customer if available
        if (suspendedSale.customer) {
            const customers = await posService.getCustomers({
                search: suspendedSale.customer.id
            });
            if (customers.data.results.length > 0) {
                selectedCustomer.value = customers.data.results[0];
            }
        }

        // Set discount, tax, shipping and service charge
        orderDiscount.value = suspendedSale.discount || 0;
        orderTax.value = suspendedSale.tax || 0;
        shipping.value = suspendedSale.shipping || 0;
        serviceCharge.value = suspendedSale.service_charge || 0;

        // Delete the suspended sale
        await posService.deleteSuspendedSale(suspendedSale.id);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Suspended sale resumed',
            life: 3000
        });

        // Close the modal
        modals.value['modal-suspended'] = false;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to resume suspended sale',
            life: 5000
        });
    }
};

const showDrawer = (drawer) => {
    drawers.value[drawer] = true;
};

function setWalkInCustomer() {
    selectedCustomer.value = { id: null, name: 'Walk-in' };
}

watch(
    searchText,
    debounce(() => {
        applyFilter();
    }, 300)
);

const submitsale = async (paymentData) => {
    try {
        const response = await posService.createSale(paymentData);
        lastSale.value = response.data;
        toast.add({
            severity: 'success',
            summary: 'Sale Complete',
            detail: 'Sale processed successfully!',
            life: 4000
        });
        clearCart();
        amountPaid.value = 0;
        orderDiscount.value = 0;
        orderPackingCharge.value = 0;
        orderShippingCharge.value = 0;
        await checkRegisterAndShowModal();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to process sale.',
            life: 5000
        });
    }
};

const redirectToOpenRegister = () => {
    router.push({ name: 'openregister' });
};
</script>

<template>
    <div class="pos-modern-container">
        <!-- Modern Header -->
        <header class="pos-header-modern">
            <div class="pos-header-left">
                <h1>Point of Sale</h1>
            </div>
            <div class="pos-header-center">
                <Button label="Register Summary" icon="pi pi-list" class="p-button-primary" v-tooltip="'Register Summary'" @click="openModal('modal-register-summary')" />
                <Button label="Staff Advance" icon="pi pi-user-plus" class="p-button-info" v-tooltip="'Staff Advance'" @click="openModal('modal-staff-advance')" />
                <Button label="Print Receipt" icon="pi pi-print" class="p-button-secondary" v-tooltip="'Print Receipt'" :disabled="!lastSale" @click="openModal('modal-print')" />
            </div>
            <div class="pos-header-right">
                <label for="customer-select" class="customer-label">Customer:</label>
                <Dropdown id="customer-select" v-model="selectedCustomer" :options="customerData" optionLabel="fullName" placeholder="Select Customer" class="customer-dropdown" />
                <Button v-if="!selectedCustomer" label="Walk-in" class="p-button-text p-button-info" @click="setWalkInCustomer" />
            </div>
        </header>
        <!-- Floating Action Buttons for Recent and Suspended Sales -->
        <div class="fab-container">
            <Button icon="pi pi-history" class="fab fab-recent" v-tooltip="'Recent Sales'" @click="openModal('modal-recents')" />
            <Button icon="pi pi-pause" class="fab fab-suspended" v-tooltip="'Suspended Sales'" @click="openModal('modal-suspended')" />
        </div>
        <div class="pos-main-grid">
            <!-- Products Section -->
            <section class="products-section">
                <div class="search-bar">
                    <InputText v-model="searchText" placeholder="Search products..." />
                    <Button icon="pi pi-search" />
                </div>
                <div class="products-grid" v-if="!isLoading">
                    <template v-if="filteredProducts.length > 0">
                        <PosProductCard v-for="product in filteredProducts" :key="product.id" :product="product" @add-to-cart="addToCart" />
                    </template>
                    <div v-else class="empty-state">
                        <i class="pi pi-box empty-icon"></i>
                        <p class="empty-message">No products found</p>
                    </div>
                </div>
                <div v-else class="loading-skeleton"></div>
                <!-- Pagination Controls -->
                <div v-if="totalProducts > perPage" class="flex justify-center mt-4">
                    <Paginator
                        :rows="perPage"
                        :totalRecords="totalProducts"
                        :first="(currentPage - 1) * perPage"
                        :rowsPerPageOptions="[6, 12, 24, 48]"
                        @page="handlePageChange"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    />
                </div>
            </section>
            <!-- Cart Section -->
            <aside class="cart-section">
                <div class="cart-header">
                    <h2>Cart</h2>
                    <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="clearCart" />
                </div>
                <!-- Cart Management Buttons -->
                <div class="cart-actions">
                    <Button label="Service Charge" icon="pi pi-cog" class="p-button-secondary" @click="openModal('modal-service-charge')" />
                    <Button label="Shipping" icon="pi pi-truck" class="p-button-help" @click="openModal('modal-shipping')" />
                    <Button label="Discount" icon="pi pi-percentage" class="p-button-warning" @click="openModal('modal-discount')" />
                </div>
                <div class="cart-items">
                    <template v-if="cart.length > 0">
                        <div v-for="item in cart" :key="item.uniqueKey" class="cart-item">
                            <img :src="getProductImage(item)" :alt="item.product.title" width="40" height="40" />
                            <div class="item-details">
                                <span class="item-name">{{ item.product.title }}</span>
                                <span class="item-price">{{ formatCurrency(item.selling_price) }}</span>
                            </div>
                            <div class="item-actions">
                                <Button icon="pi pi-minus" class="p-button-text p-button-sm" @click="decrementQuantity(item)" />
                                <span>{{ item.quantity }}</span>
                                <Button icon="pi pi-plus" class="p-button-text p-button-sm" @click="incrementQuantity(item)" />
                                <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" @click="removeFromCart(item)" />
                            </div>
                        </div>
                    </template>
                    <div v-else class="empty-state">
                        <i class="pi pi-shopping-cart empty-icon"></i>
                        <p class="empty-message">Your cart is empty</p>
                    </div>
                </div>
                <div class="cart-footer">
                    <div class="totals">
                        <span>Subtotal:</span>
                        <span>{{ formatCurrency(TotalPayableBefortax) }}</span>
                        <span>Tax:</span>
                        <span>{{ formatCurrency(orderTax) }}</span>
                        <span>Discount:</span>
                        <span>{{ formatCurrency(orderDiscount) }}</span>
                        <span>Service Charge:</span>
                        <span>{{ formatCurrency(orderPackingCharge) }}</span>
                        <span>Shipping:</span>
                        <span>{{ formatCurrency(orderShippingCharge) }}</span>
                        <span class="grand-total">Total:</span>
                        <span class="grand-total">{{ formatCurrency(TotalPayable) }}</span>
                    </div>
                    <div class="payment-buttons">
                        <Button label="Cash" icon="pi pi-money-bill" class="p-button-success" @click="processPayment('paid', 'Cash')" />
                        <Button label="M-Pesa" icon="pi pi-mobile" class="p-button-primary" @click="processPayment('paid', 'Mpesa')" />
                        <Button label="Card" icon="pi pi-credit-card" class="p-button-warning" @click="processPayment('paid', 'Card')" />
                        <Button label="Bank" icon="pi pi-wallet" class="p-button-help" @click="processPayment('paid', 'Bank')" />
                    </div>
                </div>
            </aside>
        </div>
        <!-- Modals -->
        <Dialog v-model:visible="modals['modal-service-charge']" header="Service Charge" :modal="true" :style="{ minWidth: '350px', maxWidth: '95vw', borderRadius: '16px' }" class="modern-dialog">
            <ServiceCharge v-model:charge="orderPackingCharge" />
        </Dialog>
        <Dialog v-model:visible="modals['modal-shipping']" header="Shipping" :modal="true" :style="{ minWidth: '350px', maxWidth: '95vw', borderRadius: '16px' }" class="modern-dialog">
            <Shipping v-model:charge="orderShippingCharge" />
        </Dialog>
        <Dialog v-model:visible="modals['modal-discount']" header="Discount" :modal="true" :style="{ minWidth: '350px', maxWidth: '95vw', borderRadius: '16px' }" class="modern-dialog">
            <Discount v-model:discount="orderDiscount" />
        </Dialog>
        <Dialog v-model:visible="modals['modal-recents']" header="Recent Sales" :modal="true" :style="{ minWidth: '500px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <RecentTransactions />
        </Dialog>
        <Dialog v-model:visible="modals['modal-suspended']" header="Suspended Sales" :modal="true" :style="{ minWidth: '500px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <SuspendedSales />
        </Dialog>
        <Dialog v-model:visible="modals['modal-staff-advance']" header="Staff Advance" :modal="true" :style="{ minWidth: '400px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <StaffAdvanceSale />
        </Dialog>
        <Dialog v-model:visible="modals['modal-register']" header="Cash Register" :modal="true" :style="{ minWidth: '800px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <RegisterManager :user-id="user.id" :branch-code="business.branch_code" :auto-refresh="true" />
        </Dialog>
        <Dialog v-model:visible="modals['modal-print']" header="Print Receipt" :modal="true" :style="{ minWidth: '500px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <printReceipt v-if="lastSale" :sale="lastSale" />
            <div v-else>No sale to print.</div>
        </Dialog>
        <Dialog v-model:visible="modals['modal-register-required']" header="Open Register Required" :modal="true" :closable="false" :dismissableMask="false" :style="{ minWidth: '400px', maxWidth: '95vw', borderRadius: '16px' }" class="modern-dialog">
            <div style="text-align: center">
                <i class="pi pi-lock" style="font-size: 2.5rem; color: #ff9800; margin-bottom: 1rem"></i>
                <p style="font-size: 1.2rem">You must open a cash register to use the POS.</p>
                <Button label="Open Register" icon="pi pi-cash" class="p-button-success" @click="redirectToOpenRegister" style="margin-top: 1rem" />
            </div>
        </Dialog>
        <Dialog v-model:visible="modals['modal-register-summary']" header="Register Summary" :modal="true" :style="{ minWidth: '500px', maxWidth: '98vw', borderRadius: '16px' }" class="modern-dialog">
            <SaleRegister />
        </Dialog>
        <!-- Error Dialog -->
        <Dialog v-model:visible="showError" header="Error" :modal="true" :style="{ minWidth: '350px', maxWidth: '95vw', borderRadius: '16px' }" class="modern-dialog">
            <div class="error-state">
                <i class="pi pi-exclamation-triangle error-icon"></i>
                <p class="error-message">{{ errorMessage }}</p>
            </div>
            <template #footer>
                <Button label="Close" @click="showError = false" />
            </template>
        </Dialog>
    </div>
</template>

<style lang="scss" scoped>
.pos-modern-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f8f9fa;
}
.pos-header-modern {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    box-shadow: 0 2px 12px rgba(25, 118, 210, 0.07);
    padding: 1.2rem 2rem 1.2rem 2rem;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 1.2rem;
    border-radius: 0 0 16px 16px;
}
.pos-header-left h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    color: #1976d2;
}
.pos-header-center {
    display: flex;
    gap: 0.7rem;
    align-items: center;
}
.pos-header-right {
    display: flex;
    align-items: center;
    gap: 0.7rem;
}
.customer-label {
    font-weight: 500;
    margin-right: 0.3rem;
    color: #333;
}
.customer-dropdown {
    min-width: 180px;
    max-width: 260px;
}
.pos-main-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    padding: 0 2rem;
}
.products-section {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}
.cart-section {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
.cart-actions {
    display: flex;
    gap: 0.7rem;
    margin-bottom: 1rem;
}
.cart-items {
    flex: 1;
    overflow-y: auto;
    min-height: 200px;
}
.cart-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
}
.cart-footer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.totals {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    font-size: 0.95rem;
}
.totals .grand-total {
    font-size: 1.2rem;
    font-weight: bold;
    color: #1976d2;
}
.payment-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
}
.modern-dialog .p-dialog {
    border-radius: 16px !important;
    padding: 1.5rem !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.modern-dialog .p-dialog-header {
    font-size: 1.3rem;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 0.5rem;
}
.modern-dialog .p-dialog-content {
    padding: 1.5rem 1rem;
}
@media (max-width: 600px) {
    .modern-dialog .p-dialog {
        min-width: 95vw !important;
        max-width: 100vw !important;
        padding: 1rem !important;
    }
    .modern-dialog .p-dialog-content {
        padding: 1rem 0.5rem;
    }
}
.fab-container {
    position: fixed;
    bottom: 2.5rem;
    right: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    z-index: 1000;
}
.fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    color: #fff;
    border: none;
}
.fab-recent {
    background: #1976d2 !important; // Blue
}
.fab-suspended {
    background: #ff9800 !important; // Orange
}
.fab:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
}
@media (max-width: 600px) {
    .fab-container {
        bottom: 1.2rem;
        right: 1.2rem;
        gap: 0.8rem;
    }
    .fab {
        width: 44px;
        height: 44px;
        font-size: 1.2rem;
    }
}
</style>
