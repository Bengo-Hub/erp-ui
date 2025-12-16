<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { customerService } from '@/services/crm/customerService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Reactive data
const customers = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const selectedCustomerId = ref(null);

// Form data
const form = ref({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    contact_type: 'Customers',
    account_type: 'Individual',
    designation: 'Mr',
    credit_limit: 0
});

// Filter data
const filters = ref({
    global: null
});

// Options for dropdowns
const contactTypeOptions = [
    { label: 'Customers', value: 'Customers' },
    { label: 'Suppliers', value: 'Suppliers' },
    { label: 'Partners', value: 'Partners' }
];

const accountTypeOptions = [
    { label: 'Individual', value: 'Individual' },
    { label: 'Business', value: 'Business' }
];

const designationOptions = [
    { label: 'Mr', value: 'Mr' },
    { label: 'Mrs', value: 'Mrs' },
    { label: 'Ms', value: 'Ms' },
    { label: 'Dr', value: 'Dr' },
    { label: 'Prof', value: 'Prof' },
    { label: 'Other', value: 'Other' }
];

// Computed properties
const customersDisplayName = computed(() => {
    return customers.value.map((customer) => ({
        ...customer,
        display_name: customer.business_name || `${customer.user?.first_name || ''} ${customer.user?.last_name || ''}`.trim() || customer.user?.email || 'Unknown Customer'
    }));
});

// Methods
const fetchCustomers = async () => {
    loading.value = true;
    try {
        const response = await customerService.getCustomers({ limit: 1000 });
        customers.value = response.results || response || [];
    } catch (error) {
        console.error('Error fetching customers:', error);
        showToast('error', 'Failed to load customers');
        customers.value = [];
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    isEditing.value = false;
    selectedCustomerId.value = null;
    form.value = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        business_name: '',
        contact_type: 'Customers',
        account_type: 'Individual',
        designation: 'Mr',
        credit_limit: 0
    };
    showDialog.value = true;
};

const editCustomer = (customer) => {
    isEditing.value = true;
    selectedCustomerId.value = customer.id;
    form.value = {
        first_name: customer.user?.first_name || '',
        last_name: customer.user?.last_name || '',
        email: customer.user?.email || '',
        phone: customer.user?.phone || '',
        business_name: customer.business_name || '',
        contact_type: customer.contact_type || 'Customers',
        account_type: customer.account_type || 'Individual',
        designation: customer.designation || 'Mr',
        credit_limit: customer.credit_limit || 0
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    form.value = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        business_name: '',
        contact_type: 'Customers',
        account_type: 'Individual',
        designation: 'Mr',
        credit_limit: 0
    };
};

const saveCustomer = async () => {
    if (!form.value.first_name || !form.value.last_name || !form.value.email) {
        showToast('warn', 'Please fill in all required fields');
        return;
    }

    saving.value = true;
    try {
        if (isEditing.value) {
            await customerService.updateCustomer(selectedCustomerId.value, form.value);
            showToast('success', 'Customer updated successfully');
        } else {
            await customerService.createCustomer(form.value);
            showToast('success', 'Customer created successfully');
        }

        closeDialog();
        await fetchCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('error', 'Failed to save customer');
    } finally {
        saving.value = false;
    }
};

const deleteCustomer = async (customerId) => {
    try {
        await customerService.deleteCustomer(customerId);
        showToast('success', 'Customer deleted successfully');
        await fetchCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showToast('error', 'Failed to delete customer');
    }
};

const getContactTypeSeverity = (contactType) => {
    switch (contactType) {
        case 'Customers':
            return 'success';
        case 'Suppliers':
            return 'info';
        case 'Partners':
            return 'warning';
        default:
            return 'secondary';
    }
};

const getAccountTypeSeverity = (accountType) => {
    return accountType === 'Business' ? 'primary' : 'secondary';
};

// Lifecycle
onMounted(fetchCustomers);
</script>

<template>
    <div v-if="hasPermission('view_customergroup')" class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Customers Management</h2>
            <Button v-if="hasPermission('add_customergroup')" label="New Customer" icon="pi pi-plus" @click="openCreate" class="p-button-primary" />
        </div>

        <!-- Customers Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="customers"
                    :loading="loading"
                    dataKey="id"
                    class="w-full"
                    stripedRows
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    filterDisplay="menu"
                    :globalFilterFields="['user.first_name', 'user.last_name', 'user.email', 'business_name', 'contact_type']"
                >
                    <template #header>
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-semibold">All Customers</span>
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.global" placeholder="Search customers..." />
                            </span>
                        </div>
                    </template>

                    <Column field="user.first_name" header="Name" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-400/10 rounded-full flex items-center justify-center mr-3">
                                    <i class="pi pi-user text-blue-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium">{{ slotProps.data.user?.first_name }} {{ slotProps.data.user?.last_name }}</div>
                                    <div class="text-sm text-muted-color">{{ slotProps.data.business_name || 'N/A' }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="user.email" header="Email" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ slotProps.data.user?.email }}</div>
                        </template>
                    </Column>

                    <Column field="user.phone" header="Phone" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ slotProps.data.user?.phone || 'N/A' }}</div>
                        </template>
                    </Column>

                    <Column field="contact_type" header="Type" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.contact_type" :severity="getContactTypeSeverity(slotProps.data.contact_type)" />
                        </template>
                    </Column>

                    <Column field="account_type" header="Account" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.account_type" :severity="getAccountTypeSeverity(slotProps.data.account_type)" />
                        </template>
                    </Column>

                    <Column field="credit_limit" header="Credit Limit" sortable>
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.credit_limit) }}
                        </template>
                    </Column>

                    <Column field="added_on" header="Added On" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.added_on) }}
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button v-if="hasPermission('change_customergroup')" icon="pi pi-pencil" size="small" severity="secondary" @click="editCustomer(slotProps.data)" class="p-button-text" />
                                <Button v-if="hasPermission('delete_customergroup')" icon="pi pi-trash" size="small" severity="danger" @click="deleteCustomer(slotProps.data.id)" class="p-button-text" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Customer Dialog -->
        <Dialog v-model:visible="showDialog" :header="isEditing ? 'Edit Customer' : 'Create Customer'" :modal="true" :style="{ width: '45rem' }" :closable="false">
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">First Name *</label>
                        <InputText v-model="form.first_name" class="w-full" placeholder="Enter first name" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Last Name *</label>
                        <InputText v-model="form.last_name" class="w-full" placeholder="Enter last name" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Email *</label>
                        <InputText v-model="form.email" type="email" class="w-full" placeholder="Enter email" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Phone</label>
                        <InputText v-model="form.phone" class="w-full" placeholder="Enter phone number" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Business Name</label>
                        <InputText v-model="form.business_name" class="w-full" placeholder="Enter business name" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Designation</label>
                        <Dropdown v-model="form.designation" :options="designationOptions" placeholder="Select designation" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Contact Type</label>
                        <Dropdown v-model="form.contact_type" :options="contactTypeOptions" placeholder="Select contact type" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Account Type</label>
                        <Dropdown v-model="form.account_type" :options="accountTypeOptions" placeholder="Select account type" class="w-full" />
                    </div>
                </div>

                <div>
                    <label class="block mb-2 font-medium">Credit Limit</label>
                    <InputText v-model="form.credit_limit" type="number" class="w-full" placeholder="0.00" step="0.01" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                    <Button v-if="isEditing ? hasPermission('change_customergroup') : hasPermission('add_customergroup')" :label="isEditing ? 'Update' : 'Create'" @click="saveCustomer" :loading="saving" class="p-button-primary" />
                </div>
            </template>
        </Dialog>
    </div>
    <div v-else class="p-6 text-center">
        <div class="text-red-500 text-xl font-semibold mb-4">Access Denied</div>
        <p class="text-gray-600">You don't have permission to view customers.</p>
    </div>
</template>

<style scoped></style>
