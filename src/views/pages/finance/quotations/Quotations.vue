<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { quotationService } from '@/services/finance/quotationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Data
const quotations = ref([]);
const loading = ref(false);
const selectedQuotations = ref([]);
const filters = ref({
    status_filter: '',
    customer: '',
    date_from: null,
    date_to: null,
    search: ''
});
const summary = ref({
    total_quotations: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    converted: 0,
    expired: 0,
    conversion_rate: 0,
    total_value: 0,
    converted_value: 0
});

// Pagination
const currentPage = ref(1);
const perPage = ref(25);
const totalRecords = ref(0);

// Modals
const showConvertDialog = ref(false);
const selectedQuotation = ref(null);
const conversionData = ref({
    payment_terms: 'net_30',
    invoice_date: new Date(),
    custom_message: ''
});

// Options
const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Viewed', value: 'viewed' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Declined', value: 'declined' },
    { label: 'Expired', value: 'expired' },
    { label: 'Converted', value: 'converted' },
];

const paymentTermsOptions = [
    { label: 'Due on Receipt', value: 'due_on_receipt' },
    { label: 'Net 15', value: 'net_15' },
    { label: 'Net 30', value: 'net_30' },
    { label: 'Net 45', value: 'net_45' },
    { label: 'Net 60', value: 'net_60' },
    { label: 'Net 90', value: 'net_90' },
];

// Computed
const canCreate = computed(() => hasPermission('add_billingdocument'));
const canEdit = computed(() => hasPermission('change_billingdocument'));

// Methods
const fetchQuotations = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            page_size: perPage.value,
            ...filters.value
        };
        
        const response = await quotationService.getQuotations(params);
        
        // Handle different response structures
        const data = response.data || response;
        quotations.value = data?.results || data || [];
        totalRecords.value = data?.count || quotations.value.length;
        
        console.log('✅ Quotations loaded:', quotations.value.length);
    } catch (error) {
        console.error('❌ Error fetching quotations:', error);
        showToast('error', 'Error', 'Failed to load quotations');
        quotations.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
};

const fetchSummary = async () => {
    try {
        const response = await quotationService.getQuotationSummary();
        if (response.data) {
            summary.value = response.data;
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
};

const onPage = (event) => {
    currentPage.value = event.page + 1;
    perPage.value = event.rows;
    fetchQuotations();
};

const onFilter = () => {
    currentPage.value = 1;
    fetchQuotations();
};

const createQuotation = () => {
    router.push('/finance/quotations/create');
};

const editQuotation = (quotation) => {
    router.push(`/finance/quotations/${quotation.id}/edit`);
};

const viewQuotation = (quotation) => {
    router.push(`/finance/quotations/${quotation.id}`);
};

const sendQuotation = async (quotation) => {
    try {
        loading.value = true;
        await quotationService.sendQuotation(quotation.id);
        showToast('success', 'Success', `Quotation ${quotation.quotation_number} sent successfully`);
        fetchQuotations();
    } catch (error) {
        showToast('error', 'Error', 'Failed to send quotation');
    } finally {
        loading.value = false;
    }
};

const acceptQuotation = async (quotation) => {
    try {
        loading.value = true;
        await quotationService.acceptQuotation(quotation.id);
        showToast('success', 'Success', 'Quotation accepted');
        fetchQuotations();
    } catch (error) {
        showToast('error', 'Error', 'Failed to accept quotation');
    } finally {
        loading.value = false;
    }
};

const declineQuotation = async (quotation) => {
    const reason = prompt('Reason for declining (optional):');
    try {
        loading.value = true;
        await quotationService.declineQuotation(quotation.id, reason);
        showToast('success', 'Success', 'Quotation declined');
        fetchQuotations();
    } catch (error) {
        showToast('error', 'Error', 'Failed to decline quotation');
    } finally {
        loading.value = false;
    }
};

const openConvertDialog = (quotation) => {
    selectedQuotation.value = quotation;
    conversionData.value = {
        payment_terms: 'net_30',
        invoice_date: new Date(),
        custom_message: ''
    };
    showConvertDialog.value = true;
};

const convertToInvoice = async () => {
    try {
        loading.value = true;
        const payload = {
            ...conversionData.value,
            invoice_date: conversionData.value.invoice_date instanceof Date
                ? conversionData.value.invoice_date.toISOString().split('T')[0]
                : conversionData.value.invoice_date
        };

        const response = await quotationService.convertToInvoice(selectedQuotation.value.id, payload);
        const respPayload = response?.data || response || {};
        showToast('success', 'Success', `Quotation converted to invoice ${respPayload?.invoice?.invoice_number || respPayload?.invoice?.invoice_number}`);
        showConvertDialog.value = false;
        fetchQuotations();
        fetchSummary();
        
        // Optionally navigate to the new invoice
        if (response.data?.invoice?.id) {
            router.push(`/finance/invoices/${response.data.invoice.id}`);
        }
    } catch (error) {
        showToast('error', 'Error', error.response?.data?.message || 'Failed to convert quotation');
    } finally {
        loading.value = false;
    }
};

const cloneQuotation = async (quotation) => {
    try {
        loading.value = true;
        const response = await quotationService.cloneQuotation(quotation.id);
        const respPayload = response?.data || response || {};
        showToast('success', 'Success', `Quotation cloned as ${respPayload.quotation_number || respPayload.data?.quotation_number || ''}`);
        fetchQuotations();
    } catch (error) {
        showToast('error', 'Error', 'Failed to clone quotation');
    } finally {
        loading.value = false;
    }
};

const sendFollowUp = async (quotation) => {
    try {
        loading.value = true;
        await quotationService.sendFollowUp(quotation.id);
        showToast('success', 'Success', 'Follow-up sent successfully');
        fetchQuotations();
    } catch (error) {
        showToast('error', 'Error', 'Failed to send follow-up');
    } finally {
        loading.value = false;
    }
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'secondary',
        sent: 'info',
        viewed: 'info',
        accepted: 'success',
        declined: 'danger',
        expired: 'warning',
        converted: 'success',
        cancelled: 'secondary'
    };
    return severityMap[status] || 'secondary';
};

// Lifecycle
onMounted(() => {
    fetchQuotations();
    fetchSummary();
});
</script>

<template>
    <div class="quotations-page">
        <!-- Header with Summary Cards -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Quotations</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Create quotes and convert to invoices</p>
                </div>
                <PermissionButton 
                    :permission="'add_billingdocument'"
                    icon="pi pi-plus" 
                    label="New Quotation" 
                    @click="createQuotation"
                    class="p-button-primary"
                />
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <template #content>
                        <div class="text-center">
                            <p class="text-sm text-surface-600 dark:text-surface-400">Total Quotes</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-2">{{ summary.total_quotations }}</p>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="text-center">
                            <p class="text-sm text-surface-600 dark:text-surface-400">Accepted</p>
                            <p class="text-2xl font-bold text-green-600 mt-2">{{ summary.accepted }}</p>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="text-center">
                            <p class="text-sm text-surface-600 dark:text-surface-400">Converted</p>
                            <p class="text-2xl font-bold text-blue-600 mt-2">{{ summary.converted }}</p>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="text-center">
                            <p class="text-sm text-surface-600 dark:text-surface-400">Conversion Rate</p>
                            <p class="text-2xl font-bold text-purple-600 mt-2">{{ summary.conversion_rate }}%</p>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="text-center">
                            <p class="text-sm text-surface-600 dark:text-surface-400">Total Value</p>
                            <p class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-2">{{ formatCurrency(summary.total_value) }}</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-6">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Status</label>
                        <Dropdown 
                            v-model="filters.status_filter" 
                            :options="statusOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="All Statuses"
                            class="w-full"
                            @change="onFilter"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Search</label>
                        <InputText 
                            v-model="filters.search" 
                            placeholder="Quote #, Customer..."
                            class="w-full"
                            @keyup.enter="onFilter"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">From Date</label>
                        <Calendar 
                            v-model="filters.date_from" 
                            class="w-full" 
                            :showIcon="true"
                            dateFormat="dd/mm/yy"
                            @date-select="onFilter"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">To Date</label>
                        <Calendar 
                            v-model="filters.date_to" 
                            class="w-full" 
                            :showIcon="true"
                            dateFormat="dd/mm/yy"
                            @date-select="onFilter"
                        />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Quotations Table -->
        <Card>
            <template #content>
                <DataTable 
                    v-model:selection="selectedQuotations"
                    :value="quotations" 
                    :loading="loading"
                    :paginator="true" 
                    :rows="perPage"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPage"
                    dataKey="id"
                    class="p-datatable-sm"
                    responsiveLayout="scroll"
                    :rowHover="true"
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-file-edit text-4xl text-surface-400 mb-3"></i>
                            <p class="text-surface-600 dark:text-surface-400">No quotations found</p>
                            <PermissionButton 
                                :permission="'add_billingdocument'"
                                label="Create your first quotation" 
                                icon="pi pi-plus" 
                                class="mt-4 p-button-outlined"
                                @click="createQuotation"
                            />
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem" />
                    
                    <Column field="quotation_number" header="Quote #" sortable>
                        <template #body="{ data }">
                            <span class="font-mono font-semibold text-primary cursor-pointer hover:underline" @click="viewQuotation(data)">
                                {{ data.quotation_number }}
                            </span>
                        </template>
                    </Column>

                    <Column field="customer_details" header="Customer" sortable>
                        <template #body="{ data }">
                            <div>
                                <p class="font-medium">{{ data.customer_details?.business_name || `${data.customer_details?.user?.first_name} ${data.customer_details?.user?.last_name}` }}</p>
                                <p class="text-sm text-surface-500">{{ data.customer_details?.user?.email }}</p>
                            </div>
                        </template>
                    </Column>

                    <Column field="quotation_date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.quotation_date) }}
                        </template>
                    </Column>

                    <Column field="valid_until" header="Valid Until" sortable>
                        <template #body="{ data }">
                            <div>
                                {{ formatDate(data.valid_until) }}
                                <Badge v-if="data.is_expired" value="Expired" severity="warning" class="ml-2" />
                                <span v-else-if="data.days_until_expiry !== null" class="text-sm text-surface-500 ml-2">
                                    ({{ data.days_until_expiry }}d left)
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <Badge :value="data.status_display || data.status" :severity="getStatusSeverity(data.status)" />
                                <Badge v-if="data.is_converted" value="Converted" severity="success" />
                            </div>
                        </template>
                    </Column>

                    <Column field="total" header="Amount" sortable>
                        <template #body="{ data }">
                            <div class="text-right font-semibold">
                                {{ formatCurrency(data.total) }}
                            </div>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <PermissionButton 
                                    :permission="'view_billingdocument'"
                                    icon="pi pi-eye" 
                                    class="p-button-rounded p-button-text p-button-sm"
                                    v-tooltip.top="'View'"
                                    @click="viewQuotation(data)"
                                />
                                
                                <PermissionButton 
                                    v-if="data.status === 'draft'"
                                    :permission="'change_billingdocument'"
                                    icon="pi pi-pencil" 
                                    class="p-button-rounded p-button-text p-button-sm"
                                    v-tooltip.top="'Edit'"
                                    @click="editQuotation(data)"
                                />

                                <PermissionButton 
                                    v-if="data.can_convert"
                                    :permission="['change_billingdocument', 'add_billingdocument']"
                                    mode="any"
                                    icon="pi pi-file-import" 
                                    label="Convert"
                                    class="p-button-sm p-button-success"
                                    v-tooltip.top="'Convert to Invoice'"
                                    @click="openConvertDialog(data)"
                                />

                                <SplitButton 
                                    label="More" 
                                    :model="getQuotationActions(data)"
                                    class="p-button-sm p-button-outlined"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Convert to Invoice Dialog -->
        <Dialog v-model:visible="showConvertDialog" modal header="Convert to Invoice" :style="{ width: '500px' }">
            <div v-if="selectedQuotation" class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-arrow-right-arrow-left text-2xl text-blue-600"></i>
                        <div>
                            <p class="font-semibold">Converting Quotation</p>
                            <p class="text-sm">{{ selectedQuotation.quotation_number }} → Invoice</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Payment Terms *</label>
                    <Dropdown 
                        v-model="conversionData.payment_terms" 
                        :options="paymentTermsOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Invoice Date</label>
                    <Calendar 
                        v-model="conversionData.invoice_date" 
                        dateFormat="dd/mm/yy"
                        class="w-full"
                        :showIcon="true"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                    <Textarea 
                        v-model="conversionData.custom_message" 
                        rows="3" 
                        class="w-full"
                        placeholder="Add a note for the invoice..."
                    />
                </div>

                <Message severity="info" :closable="false">
                    This will create a new invoice with all items from this quotation. The quotation status will be marked as "Converted".
                </Message>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showConvertDialog = false" class="p-button-text" />
                <Button label="Convert to Invoice" icon="pi pi-check" @click="convertToInvoice" :loading="loading" severity="success" />
            </template>
        </Dialog>

        <Spinner :isLoading="loading" title="Processing..." />
    </div>
</template>

<script>
export default {
    methods: {
        getQuotationActions(quotation) {
            const actions = [];

            if (quotation.status === 'draft') {
                actions.push({
                    label: 'Send Quotation',
                    icon: 'pi pi-send',
                    command: () => this.sendQuotation(quotation)
                });
            }

            if (quotation.status === 'sent' || quotation.status === 'viewed') {
                actions.push({
                    label: 'Accept',
                    icon: 'pi pi-check',
                    command: () => this.acceptQuotation(quotation)
                });
                actions.push({
                    label: 'Decline',
                    icon: 'pi pi-times',
                    command: () => this.declineQuotation(quotation)
                });
                actions.push({
                    label: 'Send Follow-up',
                    icon: 'pi pi-bell',
                    command: () => this.sendFollowUp(quotation)
                });
            }

            actions.push({
                label: 'Clone',
                icon: 'pi pi-copy',
                command: () => this.cloneQuotation(quotation)
            });

            return actions;
        }
    }
};
</script>

<style scoped>
.quotations-page {
    padding: 1.5rem;
}

@media (max-width: 768px) {
    .quotations-page {
        padding: 1rem;
    }
}
</style>

