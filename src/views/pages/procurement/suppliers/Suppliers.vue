<script setup>
import AddSupplier from '@/components/crm/AddSupplier.vue';
import { useToast } from '@/composables/useToast';
import { procurementService } from '@/services/procurement/procurementService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Reactive state
const suppliers = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const selectedSupplierId = ref(null);
const editingContactData = ref({});
const business = ref(JSON.parse(sessionStorage.getItem('business')));

// Filter data
const filters = ref({ global: null });

// Options for dropdowns
const contactTypeOptions = [
    { label: 'Suppliers', value: 'Suppliers' },
    { label: 'Customers & Suppliers', value: 'Customers & Suppliers' }
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
const transformedSuppliers = computed(() => {
    return suppliers.value.map(supplier => ({
        ...supplier,
        display_name: supplier.business_name || `${supplier.user?.first_name || ''} ${supplier.user?.last_name || ''}`.trim() || supplier.user?.email || 'Unknown',
        phone: supplier.user?.phone || supplier.phone || 'N/A',
        email: supplier.user?.email || 'N/A',
        account_balance: supplier.accounts?.[0]?.account_balance || '0.00',
        advance_balance: supplier.accounts?.[0]?.advance_balance || '0.00'
    }));
});

// Methods
const fetchSuppliers = async () => {
    loading.value = true;
    try {
        const response = await procurementService.getSuppliers({
            branch_code: business.value.branch_code,
            contact_type: 'Suppliers'
        });
        suppliers.value = response.data.results || response.data || [];
    } catch (error) {
        showToast('error', 'Error', 'Failed to load suppliers: ' + error.message);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    isEditing.value = false;
    editingContactData.value = {
        contact_type: 'Suppliers',
        account_type: 'Individual'
    };
    showDialog.value = true;
};

const editSupplier = (supplier) => {
    isEditing.value = true;
    selectedSupplierId.value = supplier.id;
    editingContactData.value = {
        contact_id: supplier.contact_id,
        designation: supplier.designation,
        customer_group: supplier.customer_group,
        first_name: supplier.user?.first_name || '',
        last_name: supplier.user?.last_name || '',
        landline: supplier.landline,
        contact_type: supplier.contact_type,
        account_type: supplier.account_type,
        business_name: supplier.business_name,
        tax_number: supplier.tax_number,
        credit_limit: supplier.credit_limit,
        phone: supplier.user?.phone || '',
        alternative_contact: supplier.alternative_contact,
        director_first_name: supplier.director_first_name,
        director_last_name: supplier.director_last_name,
        email: supplier.user?.email || ''
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    editingContactData.value = {};
    isEditing.value = false;
    selectedSupplierId.value = null;
};

const onSupplierSaved = () => {
    closeDialog();
    fetchSuppliers();
};

const deleteSupplier = async (supplier) => {
    try {
        await procurementService.deleteSupplier(supplier.id);
        showToast('success', 'Success', 'Supplier deleted successfully');
        await fetchSuppliers();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete supplier: ' + error.message);
    }
};

// Lifecycle hooks
onMounted(() => {
    fetchSuppliers();
});
</script>

<template>
    <div class="p-4">
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Suppliers</h2>
                <Button label="Add Supplier" icon="pi pi-plus" @click="openCreate" class="p-button-success" />
            </div>

            <DataTable :value="transformedSuppliers" :loading="loading" paginator :rows="10" :currentPage="0" responsiveLayout="scroll">
                <Column field="display_name" header="Name" sortable>
                    <template #body="slotProps">
                        <div>
                            <!-- Show business name for Business accounts, first/last name for Individual -->
                            <div class="font-medium" v-if="slotProps.data.account_type === 'Business'">
                                {{ slotProps.data.business_name || 'Business Supplier' }}
                            </div>
                            <div class="font-medium" v-else>
                                {{ slotProps.data.user?.first_name }} {{ slotProps.data.user?.last_name }}
                            </div>
                            <!-- Show director name or subsidiary info if available -->
                            <div class="text-sm text-gray-500" v-if="slotProps.data.account_type === 'Business' && slotProps.data.director_first_name">
                                Dir: {{ slotProps.data.director_first_name }} {{ slotProps.data.director_last_name }}
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="user.email" header="Email" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.user?.email || 'N/A' }}
                    </template>
                </Column>
                <Column field="phone" header="Phone" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.user?.phone || 'N/A' }}
                    </template>
                </Column>
                <Column field="account_balance" header="Account Balance">
                    <template #body="slotProps">
                        {{ slotProps.data.account_balance }}
                    </template>
                </Column>
                <Column field="advance_balance" header="Advance Balance">
                    <template #body="slotProps">
                        {{ slotProps.data.advance_balance }}
                    </template>
                </Column>
                <Column header="Actions" :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" size="small" severity="secondary" @click="editSupplier(slotProps.data)" class="p-button-text" v-tooltip.top="'Edit'" />
                            <Button icon="pi pi-trash" size="small" severity="danger" @click="deleteSupplier(slotProps.data)" class="p-button-text" v-tooltip.top="'Delete'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="showDialog" :header="isEditing ? 'Edit Supplier' : 'Add Supplier'" :modal="true" :style="{ width: '50vw' }" @hide="closeDialog">
            <AddSupplier :editmode="isEditing" :prefilledData="editingContactData" :id="selectedSupplierId" @saved="onSupplierSaved" />
        </Dialog>
    </div>
</template>

<style scoped>
.bg-gray-100 {
    background-color: #f7f6ebfb;
}
</style>
