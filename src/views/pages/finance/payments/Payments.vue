<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { debounce } from 'lodash-es';
import { onMounted, ref, watch } from 'vue';

const { toast } = useToast();

// Data
const payments = ref([]);
const paymentMethods = ref([]);
const customers = ref([]);
const loading = ref(false);
const saving = ref(false);
const methodsLoading = ref(false);
const methodSaving = ref(false);

// Dialogs
const showPaymentDialog = ref(false);
const showPaymentMethodsDialog = ref(false);
const showMethodDialog = ref(false);
const isEditing = ref(false);
const isEditingMethod = ref(false);

// Pagination
const perPage = ref(25);
const totalRecords = ref(0);
const currentPage = ref(1);

// Filters
const filters = ref({
    paymentMethod: null,
    status: null,
    dateRange: null,
    amountRange: null,
    search: ''
});

// Forms
const paymentForm = ref({
    amount: 0,
    payment_method: null,
    customer: null,
    payment_date: new Date(),
    reference_type: '',
    reference_id: '',
    notes: ''
});

const methodForm = ref({
    name: '',
    code: '',
    is_active: true,
    requires_verification: false
});

const paymentErrors = ref({});
const methodErrors = ref({});

// Options
const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' }
];

const amountRangeOptions = [
    { label: '0 - 1,000', value: '0-1000' },
    { label: '1,000 - 10,000', value: '1000-10000' },
    { label: '10,000 - 100,000', value: '10000-100000' },
    { label: '100,000+', value: '100000+' }
];

const referenceTypeOptions = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Order', value: 'order' },
    { label: 'Expense', value: 'expense' },
    { label: 'Other', value: 'other' }
];

const paymentMethodOptions = ref([]);
const customerOptions = ref([]);

// Computed
const debouncedSearch = debounce(() => {
    fetchPayments();
}, 300);

// Methods
const fetchPayments = async () => {
    try {
        loading.value = true;
        const params = {
            page: currentPage.value,
            page_size: perPage.value,
            ...filters.value
        };

        const response = await financeService.getPayments(params);
        payments.value = response.data.results || response.data;
        totalRecords.value = response.data.count || payments.value.length;
    } catch (error) {
        console.error('Error fetching payments:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch payments',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const fetchPaymentMethods = async () => {
    try {
        methodsLoading.value = true;
        const response = await financeService.getPaymentMethods();
        paymentMethods.value = response.data.results || response.data;
        paymentMethodOptions.value = paymentMethods.value;
    } catch (error) {
        console.error('Error fetching payment methods:', error);
    } finally {
        methodsLoading.value = false;
    }
};

const fetchCustomers = async () => {
    try {
        // This would need to be implemented in the customer service
        // For now, we'll use a placeholder
        customerOptions.value = [{ id: 1, name: 'Sample Customer' }];
    } catch (error) {
        console.error('Error fetching customers:', error);
    }
};

const onDateRangeSelect = () => {
    fetchPayments();
};

const openCreatePaymentDialog = () => {
    isEditing.value = false;
    resetPaymentForm();
    showPaymentDialog.value = true;
};

const editPayment = (payment) => {
    isEditing.value = true;
    paymentForm.value = { ...payment };
    showPaymentDialog.value = true;
};

const savePayment = async () => {
    try {
        // Validate form
        paymentErrors.value = {};
        if (!paymentForm.value.amount) paymentErrors.value.amount = 'Amount is required';
        if (!paymentForm.value.payment_method) paymentErrors.value.payment_method = 'Payment method is required';
        if (!paymentForm.value.customer) paymentErrors.value.customer = 'Customer is required';
        if (!paymentForm.value.payment_date) paymentErrors.value.payment_date = 'Payment date is required';

        if (Object.keys(paymentErrors.value).length > 0) return;

        saving.value = true;

        if (isEditing.value) {
            await financeService.updatePayment(paymentForm.value.id, paymentForm.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Payment updated successfully',
                life: 3000
            });
        } else {
            await financeService.createPayment(paymentForm.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Payment created successfully',
                life: 3000
            });
        }

        showPaymentDialog.value = false;
        await fetchPayments();
    } catch (error) {
        console.error('Error saving payment:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save payment',
            life: 3000
        });
    } finally {
        saving.value = false;
    }
};

const deletePayment = async (payment) => {
    try {
        await financeService.deletePayment(payment.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment deleted successfully',
            life: 3000
        });
        await fetchPayments();
    } catch (error) {
        console.error('Error deleting payment:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete payment',
            life: 3000
        });
    }
};

const viewPayment = (payment) => {
    // Implement payment details view
    console.log('View payment:', payment);
};

const printReceipt = (payment) => {
    // Implement receipt printing
    console.log('Print receipt for:', payment);
};

const openPaymentMethodsDialog = () => {
    showPaymentMethodsDialog.value = true;
};

const openCreateMethodDialog = () => {
    isEditingMethod.value = false;
    resetMethodForm();
    showMethodDialog.value = true;
};

const editMethod = (method) => {
    isEditingMethod.value = true;
    methodForm.value = { ...method };
    showMethodDialog.value = true;
};

const saveMethod = async () => {
    try {
        // Validate form
        methodErrors.value = {};
        if (!methodForm.value.name) methodErrors.value.name = 'Method name is required';
        if (!methodForm.value.code) methodErrors.value.code = 'Method code is required';

        if (Object.keys(methodErrors.value).length > 0) return;

        methodSaving.value = true;

        if (isEditingMethod.value) {
            await financeService.updatePaymentMethod(methodForm.value.id, methodForm.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Payment method updated successfully',
                life: 3000
            });
        } else {
            await financeService.createPaymentMethod(methodForm.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Payment method created successfully',
                life: 3000
            });
        }

        showMethodDialog.value = false;
        await fetchPaymentMethods();
    } catch (error) {
        console.error('Error saving payment method:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save payment method',
            life: 3000
        });
    } finally {
        methodSaving.value = false;
    }
};

const deleteMethod = async (method) => {
    try {
        await financeService.deletePaymentMethod(method.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment method deleted successfully',
            life: 3000
        });
        await fetchPaymentMethods();
    } catch (error) {
        console.error('Error deleting payment method:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete payment method',
            life: 3000
        });
    }
};

const resetPaymentForm = () => {
    paymentForm.value = {
        amount: 0,
        payment_method: null,
        customer: null,
        payment_date: new Date(),
        reference_type: '',
        reference_id: '',
        notes: ''
    };
    paymentErrors.value = {};
};

const resetMethodForm = () => {
    methodForm.value = {
        name: '',
        code: '',
        is_active: true,
        requires_verification: false
    };
    methodErrors.value = {};
};

const onPageChange = (event) => {
    currentPage.value = event.page + 1;
    fetchPayments();
};

const getPaymentMethodSeverity = (method) => {
    const severityMap = {
        CASH: 'success',
        MPESA: 'info',
        CARD: 'warning',
        BANK: 'secondary'
    };
    return severityMap[method] || 'info';
};

const getStatusSeverity = (status) => {
    const severityMap = {
        completed: 'success',
        pending: 'warning',
        failed: 'danger',
        cancelled: 'secondary'
    };
    return severityMap[status] || 'info';
};

// Lifecycle
onMounted(() => {
    fetchPayments();
    fetchPaymentMethods();
    fetchCustomers();
});

// Watchers
watch(
    filters,
    () => {
        currentPage.value = 1;
        fetchPayments();
    },
    { deep: true }
);
</script>

<template>
    <div class="payments-management">
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">Payment Management</h1>
                <div class="flex gap-2">
                    <Button label="New Payment" icon="pi pi-plus" @click="openCreatePaymentDialog" class="p-button-primary" />
                    <Button label="Payment Methods" icon="pi pi-cog" @click="openPaymentMethodsDialog" class="p-button-outlined" />
                </div>
            </div>

            <!-- Filters -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Payment Method</label>
                    <Dropdown v-model="filters.paymentMethod" :options="paymentMethodOptions" optionLabel="name" optionValue="id" placeholder="All Methods" @change="fetchPayments" clearable />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Status</label>
                    <Dropdown v-model="filters.status" :options="statusOptions" placeholder="All Status" @change="fetchPayments" clearable />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Date Range</label>
                    <Calendar v-model="filters.dateRange" selectionMode="range" placeholder="Select date range" @date-select="onDateRangeSelect" />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Amount Range</label>
                    <Dropdown v-model="filters.amountRange" :options="amountRangeOptions" placeholder="All Amounts" @change="fetchPayments" clearable />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Search</label>
                    <InputText v-model="filters.search" placeholder="Search payments..." @input="debouncedSearch" />
                </div>
            </div>

            <!-- Payments Table -->
            <DataTable :value="payments" :loading="loading" :paginator="true" :rows="perPage" :totalRecords="totalRecords" :rowsPerPageOptions="[10, 25, 50, 100]" stripedRows class="p-datatable-sm" @page="onPageChange">
                <Column field="transaction_id" header="Transaction ID" sortable></Column>
                <Column field="amount" header="Amount" sortable>
                    <template #body="slotProps">
                        <span class="font-medium">{{ formatCurrency(slotProps.data.amount) }}</span>
                    </template>
                </Column>
                <Column field="payment_method" header="Method" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.payment_method" :severity="getPaymentMethodSeverity(slotProps.data.payment_method)" />
                    </template>
                </Column>
                <Column field="status" header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column field="payment_date" header="Date" sortable>
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.payment_date) }}
                    </template>
                </Column>
                <Column field="customer_name" header="Customer" sortable></Column>
                <Column field="reference_type" header="Reference" sortable></Column>
                <Column header="Actions" :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" @click="viewPayment(slotProps.data)" v-tooltip.top="'View Details'" />
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm p-button-success" @click="editPayment(slotProps.data)" v-tooltip.top="'Edit Payment'" />
                            <Button icon="pi pi-print" class="p-button-rounded p-button-text p-button-sm p-button-info" @click="printReceipt(slotProps.data)" v-tooltip.top="'Print Receipt'" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="deletePayment(slotProps.data)" v-tooltip.top="'Delete Payment'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Create/Edit Payment Dialog -->
        <Dialog v-model:visible="showPaymentDialog" :header="isEditing ? 'Edit Payment' : 'New Payment'" :modal="true" :style="{ width: '60rem' }" @hide="resetPaymentForm">
            <form @submit.prevent="savePayment" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Amount *</label>
                        <InputNumber v-model="paymentForm.amount" class="w-full" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" :class="{ 'p-invalid': paymentErrors.amount }" required />
                        <small v-if="paymentErrors.amount" class="p-error">{{ paymentErrors.amount }}</small>
                    </div>

                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Payment Method *</label>
                        <Dropdown v-model="paymentForm.payment_method" :options="paymentMethodOptions" optionLabel="name" optionValue="id" placeholder="Select Method" class="w-full" :class="{ 'p-invalid': paymentErrors.payment_method }" required />
                        <small v-if="paymentErrors.payment_method" class="p-error">{{ paymentErrors.payment_method }}</small>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Customer *</label>
                        <Dropdown v-model="paymentForm.customer" :options="customerOptions" optionLabel="name" optionValue="id" placeholder="Select Customer" class="w-full" :class="{ 'p-invalid': paymentErrors.customer }" required />
                        <small v-if="paymentErrors.customer" class="p-error">{{ paymentErrors.customer }}</small>
                    </div>

                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Payment Date *</label>
                        <Calendar v-model="paymentForm.payment_date" class="w-full" :class="{ 'p-invalid': paymentErrors.payment_date }" required />
                        <small v-if="paymentErrors.payment_date" class="p-error">{{ paymentErrors.payment_date }}</small>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Reference Type</label>
                        <Dropdown v-model="paymentForm.reference_type" :options="referenceTypeOptions" placeholder="Select Type" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label class="text-sm font-medium mb-2">Reference ID</label>
                        <InputText v-model="paymentForm.reference_id" class="w-full" placeholder="Invoice/Order ID" />
                    </div>
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Notes</label>
                    <Textarea v-model="paymentForm.notes" rows="3" class="w-full" placeholder="Payment notes" />
                </div>
            </form>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showPaymentDialog = false" />
                <Button :label="isEditing ? 'Update' : 'Create'" icon="pi pi-check" @click="savePayment" :loading="saving" class="p-button-primary" />
            </template>
        </Dialog>

        <!-- Payment Methods Dialog -->
        <Dialog v-model:visible="showPaymentMethodsDialog" header="Payment Methods" :modal="true" :style="{ width: '50rem' }">
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Manage Payment Methods</h3>
                    <Button label="Add Method" icon="pi pi-plus" @click="openCreateMethodDialog" class="p-button-sm" />
                </div>

                <DataTable :value="paymentMethods" :loading="methodsLoading" stripedRows class="p-datatable-sm">
                    <Column field="name" header="Method Name" sortable></Column>
                    <Column field="code" header="Code" sortable></Column>
                    <Column field="is_active" header="Active" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.is_active ? 'Active' : 'Inactive'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                        </template>
                    </Column>
                    <Column field="requires_verification" header="Verification" sortable>
                        <template #body="slotProps">
                            <i v-if="slotProps.data.requires_verification" class="pi pi-check text-green-600"></i>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </Column>
                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm p-button-success" @click="editMethod(slotProps.data)" v-tooltip.top="'Edit Method'" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="deleteMethod(slotProps.data)" v-tooltip.top="'Delete Method'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </Dialog>

        <!-- Payment Method Dialog -->
        <Dialog v-model:visible="showMethodDialog" :header="isEditingMethod ? 'Edit Payment Method' : 'New Payment Method'" :modal="true" :style="{ width: '40rem' }" @hide="resetMethodForm">
            <form @submit.prevent="saveMethod" class="space-y-4">
                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Method Name *</label>
                    <InputText v-model="methodForm.name" class="w-full" :class="{ 'p-invalid': methodErrors.name }" required />
                    <small v-if="methodErrors.name" class="p-error">{{ methodErrors.name }}</small>
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium mb-2">Code *</label>
                    <InputText v-model="methodForm.code" class="w-full" :class="{ 'p-invalid': methodErrors.code }" placeholder="e.g., CASH, MPESA, CARD" required />
                    <small v-if="methodErrors.code" class="p-error">{{ methodErrors.code }}</small>
                </div>

                <div class="flex items-center">
                    <Checkbox v-model="methodForm.is_active" :binary="true" inputId="method_is_active" />
                    <label for="method_is_active" class="ml-2">Active</label>
                </div>

                <div class="flex items-center">
                    <Checkbox v-model="methodForm.requires_verification" :binary="true" inputId="method_requires_verification" />
                    <label for="method_requires_verification" class="ml-2">Requires Verification</label>
                </div>
            </form>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showMethodDialog = false" />
                <Button :label="isEditingMethod ? 'Update' : 'Create'" icon="pi pi-check" @click="saveMethod" :loading="methodSaving" class="p-button-primary" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.payments-management {
    padding: 1.5rem;
}

.card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
</style>
