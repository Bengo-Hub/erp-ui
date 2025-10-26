<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

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

// Tax rates
const taxRates = ref([]);
const tax = ref({});
const taxDialog = ref(false);
const editingTax = ref(false);
const savingTax = ref(false);
const loadingTaxRates = ref(false);

// Prefix settings
const prefixSettings = ref({
    purchase: 'P',
    purchase_order: 'PO',
    purchase_return: 'PRT',
    purchase_requisition: 'PRQ',
    stock_transfer: 'ST',
    sale_return: 'SR',
    expense: 'EP',
    business_branch: 'BR'
});
const originalPrefixSettings = ref({});
const savingPrefixSettings = ref(false);

// Dropdown options
const months = [
    { name: 'January', code: 'Jan' },
    { name: 'February', code: 'Feb' },
    { name: 'March', code: 'March' },
    { name: 'April', code: 'Apr' },
    { name: 'May', code: 'May' },
    { name: 'June', code: 'Jun' },
    { name: 'July', code: 'Jul' },
    { name: 'August', code: 'Aug' },
    { name: 'September', code: 'Sept' },
    { name: 'October', code: 'Oct' },
    { name: 'November', code: 'Nov' },
    { name: 'December', code: 'Dec' }
];

const accountingMethods = [
    { name: 'First In First Out (FIFO)', code: 'FIFO' },
    { name: 'Last In Last Out (LIFO)', code: 'LIFO' },
    { name: 'Average Cost', code: 'AVG' }
];

const industryOptions = [
    'Retail', 'Manufacturing', 'Services', 'Technology', 'Healthcare', 
    'Education', 'Construction', 'Agriculture', 'Transportation', 'Other'
];

// Logo handling removed - now in Look & Feel settings

// Load data on component mount
onMounted(async () => {
    await loadBusinessDetails();
    await loadBranches();
    await loadTaxRates();
    await loadPrefixSettings();
});

// Business Details Methods
async function loadBusinessDetails() {
    try {
        const response = await systemConfigService.getBusinessSettings();
        if (response.success) {
            let data = response.data.results;
            if (data) {
                console.log(data);
                businessDetails.value = data[0];
                branches.value = businessDetails.value.branches;
            }
            originalBusinessDetails.value = JSON.parse(JSON.stringify(businessDetails.value));

            // Format date if needed
            if (businessDetails.value.start_date) {
                businessDetails.value.start_date = new Date(businessDetails.value.start_date);
            }

            // Logo loading removed - now in Look & Feel settings
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

// Logo and watermark functions removed - now in Look & Feel settings

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

// Tax Methods
async function loadTaxRates() {
    loadingTaxRates.value = true;
    try {
        const response = await systemConfigService.getTaxSettings();

        if (response.success) {
            taxRates.value = response.data;
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to load tax rates', 3000);
        console.error('Error loading tax rates:', error);
    } finally {
        loadingTaxRates.value = false;
    }
}

function getTaxSeverity(percentage) {
    if (percentage < 5) return 'success';
    if (percentage < 15) return 'info';
    if (percentage < 25) return 'warning';
    return 'danger';
}

function openTaxDialog() {
    tax.value = {
        tax_name: '',
        tax_number: '',
        percentage: 0
    };
    editingTax.value = false;
    taxDialog.value = true;
}

function editTax(data) {
    tax.value = { ...data };
    editingTax.value = true;
    taxDialog.value = true;
}

function closeTaxDialog() {
    taxDialog.value = false;
}

async function saveTax() {
    savingTax.value = true;
    try {
        let response;

        if (editingTax.value) {
            response = await systemConfigService.updateTaxSetting(tax.value.id, tax.value);
        } else {
            response = await systemConfigService.createTaxSetting(tax.value);
        }

        if (response.success) {
            showToast('success', 'Success', `Tax rate ${editingTax.value ? 'updated' : 'created'} successfully`, 3000);

            taxDialog.value = false;
            await loadTaxRates();
        }
    } catch (error) {
        showToast('error', 'Error', `Failed to ${editingTax.value ? 'update' : 'create'} tax rate`, 3000);
        console.error(`Error ${editingTax.value ? 'updating' : 'creating'} tax rate:`, error);
    } finally {
        savingTax.value = false;
    }
}

function confirmDeleteTax(data) {
    confirm.require({
        message: `Are you sure you want to delete the tax rate "${data.tax_name}"?`,
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            deleteTax(data.id);
        }
    });
}

async function deleteTax(id) {
    try {
        const response = await systemConfigService.deleteTaxSetting(id);

        if (response.success) {
            showToast('success', 'Success', 'Tax rate deleted successfully', 3000);

            loadTaxRates();
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete tax rate', 3000);
        console.error('Error deleting tax rate:', error);
    }
}

// Prefix Settings Methods
async function loadPrefixSettings() {
    try {
        const response = await systemConfigService.getPrefixSettings();

        if (response.success) {
            prefixSettings.value = response.data;
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to load prefix settings', 3000);
        console.error('Error loading prefix settings:', error);
    }
}

async function savePrefixSettings() {
    try {
        const response = await systemConfigService.createPrefixSettings(prefixSettings.value);

        if (response.success) {
            showToast('success', 'Success', 'Prefix settings updated successfully', 3000);
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to update prefix settings', 3000);
        console.error('Error updating prefix settings:', error);
    }
}

function resetPrefixSettings() {
    // Reset to default prefix settings
    prefixSettings.value = {
        sales_prefix: 'SL',
        purchase_prefix: 'PO',
        invoice_prefix: 'INV',
        receipt_prefix: 'RCP',
        quotation_prefix: 'QT',
        employee_prefix: 'EMP',
        customer_prefix: 'CUST',
        supplier_prefix: 'SUPP',
        product_prefix: 'PRD'
    };
}

// Removed: Branding settings now centralized in Look & Feel page

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
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card p-4">
                <Breadcrumb :home="home" :model="items" />
                <Divider />
                <div class="flex align-items-center justify-content-between mb-4">
                    <div>
                        <h5 class="text-2xl font-bold">Business Settings</h5>
                        <p class="text-gray-600">Configure your business details and preferences</p>
                    </div>
                </div>

                <TabView class="custom-tabview">
                    <!-- Basic Information Tab -->
                    <TabPanel header="Business Details">
                        <form @submit.prevent="saveBusinessDetails" class="p-fluid">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="name" class="font-medium">Business Name <span class="text-red-500">*</span></label>
                                        <InputText id="name" v-model="businessDetails.name" class="w-full" placeholder="Enter business name" required />
                                        <small class="text-gray-500">Your official business name</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="start_date" class="font-medium">Start Date <span class="text-red-500">*</span></label>
                                        <Calendar id="start_date" v-model="businessDetails.start_date" dateFormat="yy-mm-dd" class="w-full" placeholder="Select start date" :showIcon="true" required />
                                        <small class="text-gray-500">When your business was established</small>
                                    </div>
                                </div>

                                <!-- Currency, Timezone, Financial Year moved to Currency & Time settings -->

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="stock_accounting_method" class="font-medium">Inventory Method <span class="text-red-500">*</span></label>
                                        <Dropdown id="stock_accounting_method" v-model="businessDetails.stock_accounting_method" :options="accountingMethods" optionLabel="name" optionValue="code" placeholder="Select Method" class="w-full" required />
                                        <small class="text-gray-500">How inventory costs are calculated</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="industry" class="font-medium">Industry</label>
                                        <Dropdown id="industry" v-model="businessDetails.industry" :options="industryOptions" placeholder="Select Industry" class="w-full" editable />
                                        <small class="text-gray-500">Your business industry/sector</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="tax_id" class="font-medium">Tax ID / PIN</label>
                                        <InputText id="tax_id" v-model="businessDetails.tax_id" class="w-full" placeholder="Enter Tax ID" />
                                        <small class="text-gray-500">Business tax identification number</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="registration_number" class="font-medium">Registration Number</label>
                                        <InputText id="registration_number" v-model="businessDetails.registration_number" class="w-full" placeholder="Enter Registration No." />
                                        <small class="text-gray-500">Business registration number</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="phone" class="font-medium">Business Phone</label>
                                        <InputText id="phone" v-model="businessDetails.phone" class="w-full" placeholder="Enter phone number" />
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="email" class="font-medium">Business Email</label>
                                        <InputText id="email" v-model="businessDetails.email" type="email" class="w-full" placeholder="Enter email address" />
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="website" class="font-medium">Website</label>
                                        <InputText id="website" v-model="businessDetails.website" class="w-full" placeholder="https://example.com" />
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="address" class="font-medium">Physical Address</label>
                                        <Textarea id="address" v-model="businessDetails.address" rows="2" class="w-full" placeholder="Enter business address" />
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="transaction_edit_days" class="font-medium">Edit Window (Days) <span class="text-red-500">*</span></label>
                                        <InputNumber id="transaction_edit_days" v-model="businessDetails.transaction_edit_days" class="w-full" :min="1" :max="365" required />
                                        <small class="text-gray-500">How long transactions can be edited</small>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label for="default_profit_margin" class="font-medium">Default Margin (%) <span class="text-red-500">*</span></label>
                                        <InputNumber id="default_profit_margin" v-model="businessDetails.default_profit_margin" class="w-full" mode="decimal" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" suffix="%" required />
                                        <small class="text-gray-500">Default profit margin for products</small>
                                    </div>
                                </div>

                                <!-- Logo uploads moved to Look & Feel settings -->

                                <div class="col-12">
                                    <div class="flex justify-content-end gap-3 mt-4">
                                        <Button type="button" label="Cancel" severity="secondary" outlined @click="resetBusinessDetails" />
                                        <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="savingBusinessDetails" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </TabPanel>

                    <!-- Branches Tab -->
                    <TabPanel header="Business Branches">
                        <div class="card">
                            <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-3">
                                <div>
                                    <h6 class="text-xl font-semibold m-0">Manage Branches</h6>
                                    <p class="text-gray-600 m-0">Add and manage your business branches</p>
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
                                <Column field="location.contact_number" header="Contact"></Column>
                                <Column field="location.email" header="Email"></Column>
                                <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                    <template #body="{ data }">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-pencil" outlined rounded severity="secondary" @click="editBranch(data)" v-tooltip.top="'Edit'" />
                                            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteBranch(data)" v-tooltip.top="'Delete'" />
                                        </div>
                                    </template>
                                </Column>
                                <template #empty>
                                    <div class="text-center py-4">
                                        <i class="pi pi-building text-4xl text-gray-400 mb-2"></i>
                                        <p class="text-gray-600">No branches found</p>
                                        <Button label="Add First Branch" icon="pi pi-plus" @click="openBranchDialog()" class="mt-3" />
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                    </TabPanel>

                    <!-- Tax Settings Tab -->
                    <TabPanel header="Tax Settings">
                        <div class="card">
                            <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-3">
                                <div>
                                    <h6 class="text-xl font-semibold m-0">Tax Rates</h6>
                                    <p class="text-gray-600 m-0">Configure your tax rates and VAT settings</p>
                                </div>
                                <Button label="Add Tax Rate" icon="pi pi-plus" @click="openTaxDialog()" class="w-full md:w-auto" />
                            </div>

                            <DataTable
                                :value="taxRates"
                                :paginator="true"
                                :rows="10"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tax rates"
                                responsiveLayout="scroll"
                                stripedRows
                                class="p-datatable-sm"
                                :loading="loadingTaxRates"
                            >
                                <Column field="tax_name" header="Name" :sortable="true"></Column>
                                <Column field="tax_number" header="Tax Number" :sortable="true"></Column>
                                <Column field="percentage" header="Rate" :sortable="true">
                                    <template #body="{ data }">
                                        <Tag :value="data.percentage + '%'" :severity="getTaxSeverity(data.percentage)" />
                                    </template>
                                </Column>
                                <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                    <template #body="{ data }">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-pencil" outlined rounded severity="secondary" @click="editTax(data)" v-tooltip.top="'Edit'" />
                                            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteTax(data)" v-tooltip.top="'Delete'" />
                                        </div>
                                    </template>
                                </Column>
                                <template #empty>
                                    <div class="text-center py-4">
                                        <i class="pi pi-percentage text-4xl text-gray-400 mb-2"></i>
                                        <p class="text-gray-600">No tax rates configured</p>
                                        <Button label="Add First Tax Rate" icon="pi pi-plus" @click="openTaxDialog()" class="mt-3" />
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                    </TabPanel>

                    <!-- Prefix Settings Tab -->
                    <TabPanel header="Prefix Settings">
                        <div class="card">
                            <div class="mb-5">
                                <h6 class="text-xl font-semibold m-0">Document Prefixes</h6>
                                <p class="text-gray-600 m-0">Configure prefixes for your business documents</p>
                            </div>

                            <form @submit.prevent="savePrefixSettings" class="p-fluid">
                                <div class="grid">
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="purchase" class="font-medium">Purchase</label>
                                            <InputText id="purchase" v-model="prefixSettings.purchase" maxlength="5" class="w-full" placeholder="P" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="purchase_order" class="font-medium">Purchase Order</label>
                                            <InputText id="purchase_order" v-model="prefixSettings.purchase_order" maxlength="5" class="w-full" placeholder="PO" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="purchase_return" class="font-medium">Purchase Return</label>
                                            <InputText id="purchase_return" v-model="prefixSettings.purchase_return" maxlength="5" class="w-full" placeholder="PR" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="purchase_requisition" class="font-medium">Purchase Requisition</label>
                                            <InputText id="purchase_requisition" v-model="prefixSettings.purchase_requisition" maxlength="5" class="w-full" placeholder="PRQ" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="stock_transfer" class="font-medium">Stock Transfer</label>
                                            <InputText id="stock_transfer" v-model="prefixSettings.stock_transfer" maxlength="5" class="w-full" placeholder="ST" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="sale_return" class="font-medium">Sale Return</label>
                                            <InputText id="sale_return" v-model="prefixSettings.sale_return" maxlength="5" class="w-full" placeholder="SR" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="expense" class="font-medium">Expense</label>
                                            <InputText id="expense" v-model="prefixSettings.expense" maxlength="5" class="w-full" placeholder="EXP" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6 lg:col-4 xl:col-3">
                                        <div class="field">
                                            <label for="business_branch" class="font-medium">Branch</label>
                                            <InputText id="business_branch" v-model="prefixSettings.business_branch" maxlength="5" class="w-full" placeholder="BR" />
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="flex justify-content-end gap-3 mt-4">
                                            <Button type="button" label="Reset Defaults" severity="secondary" outlined @click="resetPrefixSettings" />
                                            <Button type="submit" label="Save Prefixes" icon="pi pi-check" :loading="savingPrefixSettings" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </TabPanel>

                    <!-- Branding removed - now in Look & Feel settings -->
                </TabView>
            </div>
        </div>

        <!-- Business Branch Dialog -->
        <Dialog v-model:visible="branchDialog" :style="{ width: '450px' }" :header="editingBranch ? 'Edit Branch' : 'Add Branch'" :modal="true" class="p-fluid" :draggable="false">
            <div class="field">
                <label for="branch_name" class="font-medium">Branch Name <span class="text-red-500">*</span></label>
                <InputText id="branch_name" v-model="branch.name" class="w-full" placeholder="e.g. Main Branch" required autofocus />
            </div>
            <div class="field">
                <label for="branch_code" class="font-medium">Branch Code <span class="text-red-500">*</span></label>
                <InputText id="branch_code" v-model="branch.branch_code" class="w-full" placeholder="e.g. MB00100" required />
            </div>
            <div class="field">
                <label for="city" class="font-medium">City <span class="text-red-500">*</span></label>
                <InputText id="city" v-model="branch.location.city" class="w-full" placeholder="e.g. Nairobi" required />
            </div>
            <div class="field">
                <label for="zip_code" class="font-medium">Zip Code</label>
                <InputText id="zip_code" v-model="branch.location.zip_code" class="w-full" placeholder="e.g. 00100" />
            </div>
            <div class="field">
                <label for="address" class="font-medium">Address</label>
                <Textarea id="address" v-model="branch.location.address" rows="3" class="w-full" placeholder="Full physical address" />
            </div>
            <div class="field">
                <label for="contact_number" class="font-medium">Contact Number</label>
                <InputText id="contact_number" v-model="branch.location.contact_number" class="w-full" placeholder="e.g. +254712345678" />
            </div>
            <div class="field">
                <label for="email" class="font-medium">Email</label>
                <InputText id="email" v-model="branch.location.email" class="w-full" placeholder="e.g. info@branch.com" />
            </div>
            <div class="field-checkbox mt-4">
                <Checkbox id="is_main_branch" v-model="branch.is_main_branch" binary :disabled="branch.is_main_branch && editingBranch" />
                <label for="is_main_branch" class="font-medium">Set as Main Branch</label>
                <small v-if="branch.is_main_branch && editingBranch" class="block text-gray-500 ml-5">This is already your main branch</small>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="closeBranchDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveBranch" :loading="savingBranch" />
            </template>
        </Dialog>

        <!-- Tax Rate Dialog -->
        <Dialog v-model:visible="taxDialog" :style="{ width: '450px' }" :header="editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'" :modal="true" class="p-fluid" :draggable="false">
            <div class="field">
                <label for="tax_name" class="font-medium">Tax Name <span class="text-red-500">*</span></label>
                <InputText id="tax_name" v-model="tax.tax_name" class="w-full" placeholder="e.g. VAT" required autofocus />
            </div>
            <div class="field">
                <label for="tax_number" class="font-medium">Tax Number</label>
                <InputText id="tax_number" v-model="tax.tax_number" class="w-full" placeholder="e.g. P123456789" />
            </div>
            <div class="field">
                <label for="percentage" class="font-medium">Rate (%) <span class="text-red-500">*</span></label>
                <InputNumber id="percentage" v-model="tax.percentage" class="w-full" mode="decimal" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" suffix="%" placeholder="e.g. 16.00" required />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="closeTaxDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveTax" :loading="savingTax" />
            </template>
        </Dialog>

        <!-- Delete confirmation dialogs -->
        <ConfirmDialog></ConfirmDialog>
        <Toast />
    </div>
</template>

<style scoped>
.card {
    padding: 1.5rem;
}

:deep(.p-tabview-panels) {
    padding: 1.5rem 0 0 0;
}

.logo-preview img {
    max-width: 100%;
    height: auto;
    max-height: 100px;
}

.p-field-checkbox {
    margin-bottom: 1rem;
}

.color-preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.color-box {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-bottom: 0.5rem;
}

.color-label {
    font-size: 0.8rem;
    text-align: center;
}
</style>
