<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { CustomerService } from '@/services/ecommerce/customerService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();
const { hasPermission, hasAnyPermission } = usePermissions();

// Reactive data
const leads = ref([]);
const contacts = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const showDeleteDialog = ref(false);
const isEditing = ref(false);
const selectedLeadId = ref(null);

// Form data
const form = ref({
    contact: null,
    source: '',
    status: 'new',
    value: 0
});

// Filter data
const filters = ref({
    global: null
});

// Options for dropdowns
const sourceOptions = [
    { label: 'Website', value: 'website' },
    { label: 'Referral', value: 'referral' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Email Campaign', value: 'email_campaign' },
    { label: 'Phone Call', value: 'phone_call' },
    { label: 'Trade Show', value: 'trade_show' },
    { label: 'Other', value: 'other' }
];

const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' }
];

// Computed properties
const contactsDisplayName = computed(() => {
    return contacts.value.map((contact) => ({
        ...contact,
        display_name: contact.business_name || `${contact.user?.first_name || ''} ${contact.user?.last_name || ''}`.trim() || contact.user?.email || 'Unknown Contact'
    }));
});

// Methods
const fetchLeads = async () => {
    loading.value = true;
    try {
        const response = await customerService.listLeads();
        leads.value = response.results || response || [];
    } catch (error) {
        console.error('Error fetching leads:', error);
        showToast('error', 'Error', 'Failed to fetch leads');
        leads.value = [];
    } finally {
        loading.value = false;
    }
};

const fetchContacts = async () => {
    try {
        const response = await customerService.getCustomers({ limit: 1000 });
        contacts.value = response.results || response || [];
    } catch (error) {
        console.error('Error fetching contacts:', error);
        contacts.value = [];
    }
};

const openCreate = () => {
    isEditing.value = false;
    selectedLeadId.value = null;
    form.value = {
        contact: null,
        source: '',
        status: 'new',
        value: 0
    };
    showDialog.value = true;
};

const editLead = (lead) => {
    isEditing.value = true;
    selectedLeadId.value = lead.id;
    form.value = {
        contact: lead.contact?.id || null,
        source: lead.source || '',
        status: lead.status || 'new',
        value: lead.value || 0
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    form.value = {
        contact: null,
        source: '',
        status: 'new',
        value: 0
    };
};

const saveLead = async () => {
    if (!form.value.contact) {
        showToast('warn', 'Validation Error', 'Please select a contact');
        return;
    }

    saving.value = true;
    try {
        if (isEditing.value) {
            await customerService.updateLead(selectedLeadId.value, form.value);
            showToast('success', 'Success', 'Lead updated successfully');
        } else {
            await customerService.createLead(form.value);
            showToast('success', 'Success', 'Lead created successfully');
        }

        closeDialog();
        await fetchLeads();
    } catch (error) {
        console.error('Error saving lead:', error);
        showToast('error', 'Error', 'Failed to save lead');
    } finally {
        saving.value = false;
    }
};

const removeLead = (id) => {
    selectedLeadId.value = id;
    showDeleteDialog.value = true;
};

const confirmDelete = async () => {
    try {
        await customerService.deleteLead(selectedLeadId.value);
        showToast('success', 'Success', 'Lead deleted successfully');
        await fetchLeads();
    } catch (error) {
        console.error('Error deleting lead:', error);
        showToast('error', 'Error', 'Failed to delete lead');
    } finally {
        showDeleteDialog.value = false;
        selectedLeadId.value = null;
    }
};

const getStatusSeverity = (status) => {
    const severityMap = {
        new: 'info',
        contacted: 'warning',
        qualified: 'success',
        won: 'success',
        lost: 'danger'
    };
    return severityMap[status] || 'info';
};

// Lifecycle
onMounted(async () => {
    await Promise.all([fetchLeads(), fetchContacts()]);
});
</script>

<template>
    <div v-if="hasPermission('view_lead')" class="p-4">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Leads Management</h2>
            <Button v-if="hasPermission('add_lead')" label="New Lead" icon="pi pi-plus" @click="openCreate" class="p-button-primary" />
        </div>
        <!-- Leads Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="leads"
                    :loading="loading"
                    dataKey="id"
                    class="w-full"
                    stripedRows
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    filterDisplay="menu"
                    :globalFilterFields="['contact.user.first_name', 'contact.user.last_name', 'source', 'status']"
                >
                    <template #header>
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-semibold">All Leads</span>
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.global" placeholder="Search leads..." />
                            </span>
                        </div>
                    </template>

                    <Column field="contact.user.first_name" header="Contact" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-400/10 rounded-full flex items-center justify-center mr-3">
                                    <i class="pi pi-user text-blue-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium">{{ slotProps.data.contact?.user?.first_name }} {{ slotProps.data.contact?.user?.last_name }}</div>
                                    <div class="text-sm text-muted-color">{{ slotProps.data.contact?.business_name || 'N/A' }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="source" header="Source" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.source || 'N/A'" severity="info" />
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" class="capitalize" />
                        </template>
                    </Column>

                    <Column field="value" header="Value" sortable>
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.value) }}
                        </template>
                    </Column>

                    <Column field="created_at" header="Created" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.created_at) }}
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button v-if="hasPermission('change_lead')" icon="pi pi-pencil" size="small" severity="secondary" @click="editLead(slotProps.data)" class="p-button-text" />
                                <Button v-if="hasPermission('delete_lead')" icon="pi pi-trash" size="small" severity="danger" @click="removeLead(slotProps.data.id)" class="p-button-text" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Lead Dialog -->
        <Dialog v-model:visible="showDialog" :header="isEditing ? 'Edit Lead' : 'Create Lead'" :modal="true" :style="{ width: '40rem' }" :closable="false">
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Contact</label>
                        <Dropdown v-model="form.contact" :options="contactsDisplayName" optionLabel="display_name" optionValue="id" placeholder="Select a contact" class="w-full" :filter="true" filterPlaceholder="Search contacts..." />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Source</label>
                        <Dropdown v-model="form.source" :options="sourceOptions" placeholder="Select source" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Status</label>
                        <Dropdown v-model="form.status" :options="statusOptions" placeholder="Select status" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Value</label>
                        <InputNumber v-model="form.value" mode="currency" currency="USD" locale="en-US" class="w-full" placeholder="0.00" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                    <Button v-if="isEditing ? hasPermission('change_lead') : hasPermission('add_lead')" :label="isEditing ? 'Update' : 'Create'" @click="saveLead" :loading="saving" class="p-button-primary" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="showDeleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '25rem' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete this lead?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="showDeleteDialog = false" class="p-button-text" />
                <Button v-if="hasPermission('delete_lead')" label="Yes" icon="pi pi-check" @click="confirmDelete" class="p-button-danger" autofocus />
            </template>
        </Dialog>
    </div>
    <div v-else class="p-4 text-center">
        <div class="text-red-500 text-xl font-semibold mb-4">Access Denied</div>
        <p class="text-gray-600">You don't have permission to view leads.</p>
    </div>
</template>

<style scoped>
.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
