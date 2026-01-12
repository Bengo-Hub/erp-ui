<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();

// Breadcrumb items
const home = ref({ icon: 'pi pi-home', to: '/' });
const items = ref([
    { label: 'Settings', to: '/settings' },
    { label: 'Business', to: '/settings/business' }
]);

// Business details (core business info only - currency/timezone/financial year moved to Currency & Time settings)
const businessDetails = ref({
    name: '',
    start_date: null,
    stock_accounting_method: '',
    transaction_edit_days: 30,
    default_profit_margin: 25.0,
    industry: '',
    tax_id: '',
    registration_number: '',
    phone: '',
    email: '',
    website: '',
    address: ''
});
const originalBusinessDetails = ref({});
const savingBusinessDetails = ref(false);

// Branches
const branches = ref([]);
const branch = ref({});
const branchDialog = ref(false);
const editingBranch = ref(false);
const savingBranch = ref(false);
const loadingBranches = ref(false);

// Prefix settings with all document types matching backend
const prefixSettings = ref({
    id: null,
    purchase: 'P',
    purchase_order: 'LSO',
    purchase_return: 'PRT',
    purchase_requisition: 'PRQ',
    stock_transfer: 'STR',
    stock_adjustment: 'ADJ',
    sale_return: 'SR',
    invoice: 'INV',
    quotation: 'QOT',
    credit_note: 'CRN',
    debit_note: 'DBN',
    delivery_note: 'POD',
    expense: 'EP',
    business_location: 'BL'
});
const originalPrefixSettings = ref({});
const savingPrefixSettings = ref(false);
const loadingPrefixSettings = ref(false);

// Document Sequences
const documentSequences = ref([]);
const loadingSequences = ref(false);

// Dropdown options
const accountingMethods = [
    { name: 'First In First Out (FIFO)', code: 'FIFO' },
    { name: 'Last In Last Out (LIFO)', code: 'LIFO' },
    { name: 'Average Cost', code: 'AVG' }
];

const industryOptions = [
    'Retail', 'Manufacturing', 'Services', 'Technology', 'Healthcare',
    'Education', 'Construction', 'Agriculture', 'Transportation', 'Other'
];

// Grouped prefix settings for display
const prefixGroups = computed(() => [
    {
        title: 'Finance Documents',
        icon: 'pi pi-file',
        fields: [
            { key: 'invoice', label: 'Invoice', placeholder: 'INV' },
            { key: 'quotation', label: 'Quotation', placeholder: 'QOT' },
            { key: 'credit_note', label: 'Credit Note', placeholder: 'CRN' },
            { key: 'debit_note', label: 'Debit Note', placeholder: 'DBN' },
            { key: 'delivery_note', label: 'Delivery Note', placeholder: 'POD' },
            { key: 'expense', label: 'Expense', placeholder: 'EP' }
        ]
    },
    {
        title: 'Procurement',
        icon: 'pi pi-shopping-cart',
        fields: [
            { key: 'purchase', label: 'Purchase', placeholder: 'P' },
            { key: 'purchase_order', label: 'Purchase Order', placeholder: 'LSO' },
            { key: 'purchase_return', label: 'Purchase Return', placeholder: 'PRT' },
            { key: 'purchase_requisition', label: 'Purchase Requisition', placeholder: 'PRQ' }
        ]
    },
    {
        title: 'Inventory',
        icon: 'pi pi-box',
        fields: [
            { key: 'stock_transfer', label: 'Stock Transfer', placeholder: 'STR' },
            { key: 'stock_adjustment', label: 'Stock Adjustment', placeholder: 'ADJ' },
            { key: 'sale_return', label: 'Sale Return', placeholder: 'SR' }
        ]
    },
    {
        title: 'Other',
        icon: 'pi pi-cog',
        fields: [
            { key: 'business_location', label: 'Business Location', placeholder: 'BL' }
        ]
    }
]);

// Load data on component mount
onMounted(async () => {
    await loadBusinessDetails();
    await loadBranches();
    await loadPrefixSettings();
    await loadDocumentSequences();
});

// Business Details Methods
async function loadBusinessDetails() {
    try {
        const response = await systemConfigService.getBusinessSettings();
        if (response.success) {
            let data = response.data.results;
            if (data) {
                businessDetails.value = data[0];
                branches.value = businessDetails.value.branches;
            }
            originalBusinessDetails.value = JSON.parse(JSON.stringify(businessDetails.value));

            // Format date if needed
            if (businessDetails.value.start_date) {
                businessDetails.value.start_date = new Date(businessDetails.value.start_date);
            }
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to load business details', 3000);
        console.error('Error loading business details:', error);
    }
}

async function saveBusinessDetails() {
    savingBusinessDetails.value = true;
    try {
        const response = await systemConfigService.updateBusinessSettings(businessDetails.value);

        if (response.success) {
            showToast('success', 'Success', 'Business details updated successfully', 3000);
            originalBusinessDetails.value = JSON.parse(JSON.stringify(businessDetails.value));
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to update business details', 3000);
        console.error('Error updating business details:', error);
    } finally {
        savingBusinessDetails.value = false;
    }
}

function resetBusinessDetails() {
    businessDetails.value = JSON.parse(JSON.stringify(originalBusinessDetails.value));
}

// Branch Methods
function openBranchDialog() {
    branch.value = {
        name: '',
        branch_code: '',
        location: {
            city: '',
            zip_code: '',
            address: '',
            contact_number: '',
            email: '',
            default: false
        }
    };
    editingBranch.value = false;
    branchDialog.value = true;
}

function editBranch(data) {
    branch.value = { ...data };
    editingBranch.value = true;
    branchDialog.value = true;
}

function closeBranchDialog() {
    branchDialog.value = false;
}

async function saveBranch() {
    savingBranch.value = true;
    try {
        let response;

        if (editingBranch.value) {
            response = await systemConfigService.updateBusinessBranch(branch.value.id, branch.value);
        } else {
            response = await systemConfigService.createBusinessBranch(branch.value);
        }

        if (response.success) {
            showToast('success', 'Success', `Business branch ${editingBranch.value ? 'updated' : 'created'} successfully`, 3000);

            branchDialog.value = false;
            await loadBranches();
        }
    } catch (error) {
        showToast('error', 'Error', `Failed to ${editingBranch.value ? 'update' : 'create'} business branch`, 3000);
        console.error(`Error ${editingBranch.value ? 'updating' : 'creating'} business branch:`, error);
    } finally {
        savingBranch.value = false;
    }
}

function confirmDeleteBranch(data) {
    confirm.require({
        message: `Are you sure you want to delete the branch "${data.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        rejectClass: 'p-button-text',
        accept: () => {
            deleteBranch(data.id);
        }
    });
}

async function deleteBranch(id) {
    try {
        const response = await systemConfigService.deleteBusinessBranch(id);

        if (response.success) {
            showToast('success', 'Success', 'Business branch deleted successfully', 3000);

            await loadBranches();
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete business branch', 3000);
        console.error('Error deleting business branch:', error);
    }
}

// Prefix Settings Methods
async function loadPrefixSettings() {
    loadingPrefixSettings.value = true;
    try {
        const response = await systemConfigService.getPrefixSettings();

        if (response.success && response.data) {
            prefixSettings.value = { ...prefixSettings.value, ...response.data };
            originalPrefixSettings.value = JSON.parse(JSON.stringify(prefixSettings.value));
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to load prefix settings', 3000);
        console.error('Error loading prefix settings:', error);
    } finally {
        loadingPrefixSettings.value = false;
    }
}

async function savePrefixSettings() {
    savingPrefixSettings.value = true;
    try {
        let response;
        if (prefixSettings.value.id) {
            response = await systemConfigService.updatePrefixSettings(prefixSettings.value.id, prefixSettings.value);
        } else {
            response = await systemConfigService.createPrefixSettings(prefixSettings.value);
        }

        if (response.success) {
            showToast('success', 'Success', 'Prefix settings updated successfully', 3000);
            originalPrefixSettings.value = JSON.parse(JSON.stringify(prefixSettings.value));
            if (response.data?.id) {
                prefixSettings.value.id = response.data.id;
            }
            // Refresh sequences to show updated prefixes
            await loadDocumentSequences();
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to update prefix settings', 3000);
        console.error('Error updating prefix settings:', error);
    } finally {
        savingPrefixSettings.value = false;
    }
}

function resetPrefixSettings() {
    prefixSettings.value = JSON.parse(JSON.stringify(originalPrefixSettings.value));
}

// Document Sequences Methods
async function loadDocumentSequences() {
    loadingSequences.value = true;
    try {
        const response = await systemConfigService.getDocumentSequencesSummary();

        if (response.success) {
            documentSequences.value = response.data || [];
        }
    } catch (error) {
        console.error('Error loading document sequences:', error);
        // Not showing error toast as this is optional data
    } finally {
        loadingSequences.value = false;
    }
}

async function loadBranches() {
    try {
        loadingBranches.value = true;
        const response = await systemConfigService.getBusinessBranches();
        if (response.success) {
            branches.value = response.data.results;
        }
    } catch (error) {
        console.error('Error fetching branches:', error);
        showToast('error', 'Error', 'Failed to fetch branches', 3000);
    } finally {
        loadingBranches.value = false;
    }
}

// Helper for sequence badge color
function getSequenceSeverity(docType) {
    const severityMap = {
        invoice: 'info',
        quotation: 'secondary',
        credit_note: 'warning',
        debit_note: 'danger',
        delivery_note: 'success',
        expense: 'contrast',
        purchase_order: 'info',
        purchase: 'secondary',
        stock_transfer: 'warning',
        stock_adjustment: 'danger',
        sale_return: 'success',
        purchase_return: 'contrast'
    };
    return severityMap[docType] || 'secondary';
}
</script>

<template>
    <div class="business-settings-page">
        <div class="card">
            <Breadcrumb :home="home" :model="items" class="mb-4" />

            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Business Settings</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1 m-0">Configure your business details and document settings</p>
                </div>
            </div>

            <TabView class="custom-tabview">
                <!-- Basic Information Tab -->
                <TabPanel header="Business Details">
                    <div class="p-4">
                        <form @submit.prevent="saveBusinessDetails" class="p-fluid">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="field">
                                    <label for="name" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Name <span class="text-red-500">*</span></label>
                                    <InputText id="name" v-model="businessDetails.name" class="w-full" placeholder="Enter business name" required />
                                    <small class="text-surface-500">Your official business name</small>
                                </div>

                                <div class="field">
                                    <label for="start_date" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Start Date <span class="text-red-500">*</span></label>
                                    <DatePicker id="start_date" v-model="businessDetails.start_date" dateFormat="yy-mm-dd" class="w-full" placeholder="Select start date" showIcon required />
                                    <small class="text-surface-500">When your business was established</small>
                                </div>

                                <div class="field">
                                    <label for="stock_accounting_method" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Inventory Method <span class="text-red-500">*</span></label>
                                    <Select id="stock_accounting_method" v-model="businessDetails.stock_accounting_method" :options="accountingMethods" optionLabel="name" optionValue="code" placeholder="Select Method" class="w-full" required />
                                    <small class="text-surface-500">How inventory costs are calculated</small>
                                </div>

                                <div class="field">
                                    <label for="industry" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Industry</label>
                                    <Select id="industry" v-model="businessDetails.industry" :options="industryOptions" placeholder="Select Industry" class="w-full" editable />
                                    <small class="text-surface-500">Your business industry/sector</small>
                                </div>

                                <div class="field">
                                    <label for="tax_id" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Tax ID / PIN</label>
                                    <InputText id="tax_id" v-model="businessDetails.tax_id" class="w-full" placeholder="Enter Tax ID" />
                                    <small class="text-surface-500">Business tax identification number</small>
                                </div>

                                <div class="field">
                                    <label for="registration_number" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Registration Number</label>
                                    <InputText id="registration_number" v-model="businessDetails.registration_number" class="w-full" placeholder="Enter Registration No." />
                                    <small class="text-surface-500">Business registration number</small>
                                </div>

                                <div class="field">
                                    <label for="phone" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Phone</label>
                                    <InputText id="phone" v-model="businessDetails.phone" class="w-full" placeholder="Enter phone number" />
                                </div>

                                <div class="field">
                                    <label for="email" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Email</label>
                                    <InputText id="email" v-model="businessDetails.email" type="email" class="w-full" placeholder="Enter email address" />
                                </div>

                                <div class="field">
                                    <label for="website" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Website</label>
                                    <InputText id="website" v-model="businessDetails.website" class="w-full" placeholder="https://example.com" />
                                </div>

                                <div class="field">
                                    <label for="transaction_edit_days" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Edit Window (Days) <span class="text-red-500">*</span></label>
                                    <InputNumber id="transaction_edit_days" v-model="businessDetails.transaction_edit_days" class="w-full" :min="1" :max="365" required />
                                    <small class="text-surface-500">How long transactions can be edited</small>
                                </div>

                                <div class="field">
                                    <label for="default_profit_margin" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Default Margin (%) <span class="text-red-500">*</span></label>
                                    <InputNumber id="default_profit_margin" v-model="businessDetails.default_profit_margin" class="w-full" mode="decimal" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" suffix="%" required />
                                    <small class="text-surface-500">Default profit margin for products</small>
                                </div>

                                <div class="field md:col-span-2">
                                    <label for="address" class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Physical Address</label>
                                    <Textarea id="address" v-model="businessDetails.address" rows="3" class="w-full" placeholder="Enter business address" />
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <Button type="button" label="Cancel" severity="secondary" outlined @click="resetBusinessDetails" class="w-full sm:w-auto" />
                                <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="savingBusinessDetails" class="w-full sm:w-auto" />
                            </div>
                        </form>
                    </div>
                </TabPanel>

                <!-- Branches Tab -->
                <TabPanel header="Branches">
                    <div class="p-4">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 class="text-xl font-semibold m-0 text-surface-900 dark:text-surface-0">Manage Branches</h2>
                                <p class="text-surface-600 dark:text-surface-400 m-0 mt-1">Add and manage your business branches</p>
                            </div>
                            <Button label="Add Branch" icon="pi pi-plus" @click="openBranchDialog()" class="w-full md:w-auto" />
                        </div>

                        <DataTable
                            :value="branches"
                            :paginator="true"
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 25, 50]"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} branches"
                            responsiveLayout="scroll"
                            stripedRows
                            class="p-datatable-sm"
                            :loading="loadingBranches"
                        >
                            <Column field="name" header="Branch Name" :sortable="true">
                                <template #body="{ data }">
                                    <span class="font-medium">{{ data.name }}</span>
                                    <Tag v-if="data.is_main_branch" value="Main" severity="info" class="ml-2" />
                                </template>
                            </Column>
                            <Column field="branch_code" header="Branch Code" :sortable="true"></Column>
                            <Column field="location.city" header="City" :sortable="true"></Column>
                            <Column field="location.contact_number" header="Contact" class="hidden md:table-cell"></Column>
                            <Column field="location.email" header="Email" class="hidden lg:table-cell"></Column>
                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-pencil" outlined rounded severity="secondary" @click="editBranch(data)" v-tooltip.top="'Edit'" />
                                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteBranch(data)" v-tooltip.top="'Delete'" />
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-8">
                                    <i class="pi pi-building text-4xl text-surface-400 mb-3 block"></i>
                                    <p class="text-surface-600 dark:text-surface-400 mb-4">No branches found</p>
                                    <Button label="Add First Branch" icon="pi pi-plus" @click="openBranchDialog()" />
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- Document Sequences Tab -->
                <TabPanel header="Document Sequences">
                    <div class="p-4">
                        <div class="mb-6">
                            <h2 class="text-xl font-semibold m-0 text-surface-900 dark:text-surface-0">Document Number Sequences</h2>
                            <p class="text-surface-600 dark:text-surface-400 m-0 mt-1">View current document number sequences and next numbers</p>
                        </div>

                        <div v-if="loadingSequences" class="flex justify-center py-8">
                            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                        </div>

                        <div v-else-if="documentSequences.length === 0" class="text-center py-8">
                            <i class="pi pi-list text-4xl text-surface-400 mb-3 block"></i>
                            <p class="text-surface-600 dark:text-surface-400">No document sequences found. Sequences are created automatically when documents are generated.</p>
                        </div>

                        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div v-for="seq in documentSequences" :key="seq.document_type"
                                 class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="font-semibold text-surface-700 dark:text-surface-200">{{ seq.document_type_display }}</span>
                                    <Tag :value="seq.prefix" :severity="getSequenceSeverity(seq.document_type)" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-surface-500">Current:</span>
                                        <span class="font-mono font-medium text-surface-700 dark:text-surface-200">{{ seq.current_sequence.toString().padStart(4, '0') }}</span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <span class="text-surface-500">Next Number:</span>
                                        <span class="font-mono font-medium text-primary">{{ seq.next_number }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div class="flex gap-3">
                                <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                <div>
                                    <p class="text-sm text-blue-700 dark:text-blue-300 m-0">
                                        Document numbers follow the format: <strong class="font-mono">PREFIX0000-DDMMYY</strong>
                                    </p>
                                    <p class="text-sm text-blue-600 dark:text-blue-400 m-0 mt-1">
                                        Example: INV0033-150126 (Invoice #33 on Jan 15, 2026)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Prefix Settings Tab -->
                <TabPanel header="Prefix Settings">
                    <div class="p-4">
                        <div class="mb-6">
                            <h2 class="text-xl font-semibold m-0 text-surface-900 dark:text-surface-0">Document Prefixes</h2>
                            <p class="text-surface-600 dark:text-surface-400 m-0 mt-1">Configure prefixes for your business documents (max 5 characters)</p>
                        </div>

                        <div v-if="loadingPrefixSettings" class="flex justify-center py-8">
                            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                        </div>

                        <form v-else @submit.prevent="savePrefixSettings" class="p-fluid">
                            <div v-for="group in prefixGroups" :key="group.title" class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i :class="[group.icon, 'text-lg text-primary']"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">{{ group.title }}</h3>
                                </div>

                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <div v-for="field in group.fields" :key="field.key" class="field">
                                        <label :for="field.key" class="text-sm font-medium text-surface-600 dark:text-surface-300 mb-2 block">{{ field.label }}</label>
                                        <InputText
                                            :id="field.key"
                                            v-model="prefixSettings[field.key]"
                                            maxlength="5"
                                            class="w-full font-mono text-center uppercase"
                                            :placeholder="field.placeholder"
                                            @input="prefixSettings[field.key] = ($event.target.value || '').toUpperCase()"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <Button type="button" label="Reset" severity="secondary" outlined @click="resetPrefixSettings" class="w-full sm:w-auto" />
                                <Button type="submit" label="Save Prefixes" icon="pi pi-check" :loading="savingPrefixSettings" class="w-full sm:w-auto" />
                            </div>
                        </form>
                    </div>
                </TabPanel>
            </TabView>
        </div>

        <!-- Business Branch Dialog -->
        <Dialog v-model:visible="branchDialog" :style="{ width: '500px' }" :header="editingBranch ? 'Edit Branch' : 'Add Branch'" :modal="true" class="p-fluid" :draggable="false">
            <div class="grid grid-cols-1 gap-4">
                <div class="field">
                    <label for="branch_name" class="font-semibold mb-2 block">Branch Name <span class="text-red-500">*</span></label>
                    <InputText id="branch_name" v-model="branch.name" class="w-full" placeholder="e.g. Main Branch" required autofocus />
                </div>
                <div class="field">
                    <label for="branch_code" class="font-semibold mb-2 block">Branch Code <span class="text-red-500">*</span></label>
                    <InputText id="branch_code" v-model="branch.branch_code" class="w-full" placeholder="e.g. MB00100" required />
                </div>
                <div class="field">
                    <label for="city" class="font-semibold mb-2 block">City <span class="text-red-500">*</span></label>
                    <InputText id="city" v-model="branch.location.city" class="w-full" placeholder="e.g. Nairobi" required />
                </div>
                <div class="field">
                    <label for="zip_code" class="font-semibold mb-2 block">Zip Code</label>
                    <InputText id="zip_code" v-model="branch.location.zip_code" class="w-full" placeholder="e.g. 00100" />
                </div>
                <div class="field">
                    <label for="address" class="font-semibold mb-2 block">Address</label>
                    <Textarea id="address" v-model="branch.location.address" rows="2" class="w-full" placeholder="Full physical address" />
                </div>
                <div class="field">
                    <label for="contact_number" class="font-semibold mb-2 block">Contact Number</label>
                    <InputText id="contact_number" v-model="branch.location.contact_number" class="w-full" placeholder="e.g. +254712345678" />
                </div>
                <div class="field">
                    <label for="branch_email" class="font-semibold mb-2 block">Email</label>
                    <InputText id="branch_email" v-model="branch.location.email" class="w-full" placeholder="e.g. info@branch.com" />
                </div>
                <div class="flex items-center gap-2 mt-2">
                    <Checkbox id="is_main_branch" v-model="branch.is_main_branch" binary :disabled="branch.is_main_branch && editingBranch" />
                    <label for="is_main_branch" class="font-medium cursor-pointer">Set as Main Branch</label>
                </div>
                <small v-if="branch.is_main_branch && editingBranch" class="text-surface-500 ml-6">This is already your main branch</small>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="closeBranchDialog" />
                    <Button label="Save" icon="pi pi-check" @click="saveBranch" :loading="savingBranch" />
                </div>
            </template>
        </Dialog>

        <!-- Delete confirmation dialogs -->
        <ConfirmDialog></ConfirmDialog>
        <Toast />
    </div>
</template>

<style scoped>
.business-settings-page {
    padding: 1rem;
}

@media (max-width: 768px) {
    .business-settings-page {
        padding: 0.5rem;
    }
}

:deep(.p-tabview-panels) {
    padding: 0;
}

:deep(.p-tabview-nav) {
    flex-wrap: wrap;
}

.field {
    margin-bottom: 0;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>
