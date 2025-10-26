<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/FinanceService';
import { getBusinessDetails } from '@/utils/businessBranding';
import { formatCurrency } from '@/utils/formatters';
import { computed, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    voucher: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'saved']);

const { showToast } = useToast();

const loading = ref(false);
const accounts = ref([]);
const businessDetails = ref(null);
const activeTab = ref(0);

const voucherTypes = [
    { label: 'Payment Voucher', value: 'payment', icon: 'pi pi-credit-card', severity: 'success' },
    { label: 'Receipt Voucher', value: 'receipt', icon: 'pi pi-check-circle', severity: 'info' },
    { label: 'Journal Voucher', value: 'journal', icon: 'pi pi-book', severity: 'warning' },
    { label: 'Contra Voucher', value: 'contra', icon: 'pi pi-exchange', severity: 'secondary' }
];

const voucherStatuses = [
    { label: 'Draft', value: 'draft', severity: 'secondary' },
    { label: 'Pending Approval', value: 'pending', severity: 'warning' },
    { label: 'Approved', value: 'approved', severity: 'success' },
    { label: 'Rejected', value: 'rejected', severity: 'danger' },
    { label: 'Posted', value: 'posted', severity: 'info' }
];

const form = reactive({
    voucher_number: '',
    voucher_type: '',
    date: new Date(),
    amount: 0,
    description: '',
    status: 'draft',
    items: [],
    // Document template settings
    template_settings: {
        show_logo: true,
        logo_position: 'header',
        terms_conditions: '',
        footer_text: '',
        custom_header: '',
        custom_footer: '',
        include_tax_breakdown: false,
        show_payment_terms: true,
        payment_terms: 'Net 30 days',
        currency: 'KES',
        language: 'en',
        require_approval: false,
        approval_workflow: 'single'
    }
});

const isEdit = computed(() => !!props.voucher);

// Load business details for branding
const loadBusinessDetails = () => {
    businessDetails.value = getBusinessDetails();
};

// Load accounts for voucher items
const loadAccounts = async () => {
    try {
        const response = await financeService.getPaymentAccounts();
        accounts.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error loading accounts:', error);
        showToast('error', 'Failed to load accounts');
    }
};

// Initialize form
const initForm = () => {
    if (props.voucher) {
        Object.assign(form, {
            voucher_number: props.voucher.voucher_number || '',
            voucher_type: props.voucher.voucher_type || '',
            date: props.voucher.date ? new Date(props.voucher.date) : new Date(),
            amount: props.voucher.amount || 0,
            description: props.voucher.description || '',
            status: props.voucher.status || 'draft',
            items: props.voucher.items || [],
            template_settings: {
                ...form.template_settings,
                ...props.voucher.template_settings
            }
        });
    } else {
        Object.assign(form, {
            voucher_number: '',
            voucher_type: '',
            date: new Date(),
            amount: 0,
            description: '',
            status: 'draft',
            items: [],
            template_settings: {
                show_logo: true,
                logo_position: 'header',
                terms_conditions: '',
                footer_text: '',
                custom_header: '',
                custom_footer: '',
                include_tax_breakdown: false,
                show_payment_terms: true,
                payment_terms: 'Net 30 days',
                currency: 'KES',
                language: 'en',
                require_approval: false,
                approval_workflow: 'single'
            }
        });
    }
};

// Add voucher item
const addVoucherItem = () => {
    form.items.push({
        account: null,
        debit: 0,
        credit: 0,
        description: ''
    });
};

// Remove voucher item
const removeVoucherItem = (index) => {
    form.items.splice(index, 1);
};

// Calculate total debits
const calculateTotalDebits = () => {
    return form.items.reduce((sum, item) => sum + (item.debit || 0), 0);
};

// Calculate total credits
const calculateTotalCredits = () => {
    return form.items.reduce((sum, item) => sum + (item.credit || 0), 0);
};

// Check if voucher is balanced
const isVoucherBalanced = () => {
    const totalDebit = calculateTotalDebits();
    const totalCredit = calculateTotalCredits();
    return Math.abs(totalDebit - totalCredit) < 0.01;
};

// Auto-balance voucher items
const autoBalanceVoucher = () => {
    if (form.items.length === 0) return;
    
    const totalDebit = calculateTotalDebits();
    const totalCredit = calculateTotalCredits();
    
    if (totalDebit > totalCredit) {
        // Add credit to balance
        const lastItem = form.items[form.items.length - 1];
        if (lastItem) {
            lastItem.credit = (lastItem.credit || 0) + (totalDebit - totalCredit);
        }
    } else if (totalCredit > totalDebit) {
        // Add debit to balance
        const lastItem = form.items[form.items.length - 1];
        if (lastItem) {
            lastItem.debit = (lastItem.debit || 0) + (totalCredit - totalDebit);
        }
    }
};

// Handle form submission
const handleSubmit = async () => {
    if (form.items.length === 0) {
        showToast('error', 'Please add at least one voucher item');
        return;
    }

    // Validate total debits equal total credits
    if (!isVoucherBalanced()) {
        showToast('error', 'Total debits must equal total credits');
        return;
    }

    loading.value = true;
    try {
        if (isEdit.value) {
            await financeService.updateVoucher(props.voucher.id, form);
            showToast('success', 'Voucher updated successfully');
        } else {
            await financeService.createVoucher(form);
            showToast('success', 'Voucher created successfully');
        }
        emit('saved');
        emit('update:visible', false);
    } catch (error) {
        console.error('Error saving voucher:', error);
        showToast('error', 'Failed to save voucher');
    } finally {
        loading.value = false;
    }
};

// Preview voucher
const previewVoucher = () => {
    showToast('info', 'Voucher preview feature coming soon');
};

// Watch for voucher changes
watch(() => props.voucher, initForm, { immediate: true });

// Load data when component mounts
onMounted(() => {
    loadBusinessDetails();
    loadAccounts();
});
</script>

<template>
    <Dialog 
        :visible="visible" 
        :modal="true" 
        :header="isEdit ? 'Edit Voucher' : 'Create New Voucher'" 
        :style="{ width: '95vw', maxWidth: '1400px' }" 
        @update:visible="$emit('update:visible', false)"
        class="voucher-form"
    >
        <div class="flex flex-col lg:flex-row gap-6 h-full">
            <!-- Main Form Section -->
            <div class="flex-1 space-y-6">
                <!-- Tab Navigation -->
                <TabView v-model:activeIndex="activeTab" class="custom-tabview">
                    <TabPanel header="Voucher Details" icon="pi pi-file-edit">
                        <form @submit.prevent="handleSubmit" class="space-y-6">
                            <!-- Voucher Header -->
                            <Card class="shadow-sm">
                                <template #title>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-credit-card text-primary"></i>
                                        <span>Voucher Information</span>
                                    </div>
                                </template>
                                <template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-hashtag mr-1"></i>Voucher Number
                                            </label>
                                            <InputText 
                                                v-model="form.voucher_number" 
                                                :disabled="isEdit" 
                                                class="w-full" 
                                                placeholder="Auto-generated"
                                                :class="{ 'opacity-50': isEdit }"
                                            />
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-tag mr-1"></i>Voucher Type
                                            </label>
                                            <Dropdown 
                                                v-model="form.voucher_type" 
                                                :options="voucherTypes" 
                                                optionLabel="label" 
                                                optionValue="value" 
                                                class="w-full" 
                                                placeholder="Select voucher type"
                                                :showClear="true"
                                            >
                                                <template #option="slotProps">
                                                    <div class="flex items-center gap-2">
                                                        <i :class="slotProps.option.icon"></i>
                                                        <span>{{ slotProps.option.label }}</span>
                                                    </div>
                                                </template>
                                            </Dropdown>
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-calendar mr-1"></i>Date
                                            </label>
                                            <Calendar 
                                                v-model="form.date" 
                                                class="w-full" 
                                                :showIcon="true" 
                                                dateFormat="dd/mm/yy"
                                                :showButtonBar="true"
                                            />
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-dollar mr-1"></i>Total Amount
                                            </label>
                                            <InputNumber 
                                                v-model="form.amount" 
                                                class="w-full" 
                                                mode="currency" 
                                                currency="KES" 
                                                :minFractionDigits="2" 
                                                :maxFractionDigits="2" 
                                                placeholder="0.00"
                                                readonly
                                            />
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-info-circle mr-1"></i>Status
                                            </label>
                                            <Dropdown 
                                                v-model="form.status" 
                                                :options="voucherStatuses" 
                                                optionLabel="label" 
                                                optionValue="value" 
                                                class="w-full" 
                                                placeholder="Select status"
                                            >
                                                <template #option="slotProps">
                                                    <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" />
                                                </template>
                                            </Dropdown>
                                        </div>

                                        <div class="space-y-2 md:col-span-2 lg:col-span-3">
                                            <label class="block text-sm font-medium text-gray-700">
                                                <i class="pi pi-align-left mr-1"></i>Description
                                            </label>
                                            <Textarea 
                                                v-model="form.description" 
                                                class="w-full" 
                                                rows="3" 
                                                placeholder="Enter voucher description"
                                                autoResize
                                            />
                                        </div>
                                    </div>
                                </template>
                            </Card>

                            <!-- Voucher Items Section -->
                            <Card class="shadow-sm">
                                <template #title>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-list text-primary"></i>
                                            <span>Voucher Items</span>
                                            <Badge :value="form.items.length" severity="info" />
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <Button 
                                                type="button" 
                                                icon="pi pi-calculator" 
                                                label="Auto Balance" 
                                                @click="autoBalanceVoucher" 
                                                class="p-button-sm"
                                                severity="outlined"
                                                :disabled="form.items.length === 0"
                                            />
                                            <Button 
                                                type="button" 
                                                icon="pi pi-plus" 
                                                label="Add Item" 
                                                @click="addVoucherItem" 
                                                class="p-button-sm"
                                                severity="success"
                                            />
                                        </div>
                                    </div>
                                </template>
                                <template #content>
                                    <div v-if="form.items.length === 0" class="text-center py-12">
                                        <i class="pi pi-inbox text-4xl text-gray-300 mb-4"></i>
                                        <p class="text-gray-500 mb-4">No voucher items added yet</p>
                                        <Button 
                                            type="button" 
                                            icon="pi pi-plus" 
                                            label="Add First Item" 
                                            @click="addVoucherItem"
                                            severity="outlined"
                                        />
                                    </div>

                                    <div v-else class="space-y-4">
                                        <div 
                                            v-for="(item, index) in form.items" 
                                            :key="index" 
                                            class="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div class="flex items-center justify-between mb-3">
                                                <h4 class="font-medium text-gray-800">Item {{ index + 1 }}</h4>
                                                <Button 
                                                    type="button" 
                                                    icon="pi pi-trash" 
                                                    severity="danger" 
                                                    @click="removeVoucherItem(index)" 
                                                    class="p-button-sm"
                                                    text
                                                />
                                            </div>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Account</label>
                                                    <Dropdown 
                                                        v-model="item.account" 
                                                        :options="accounts" 
                                                        optionLabel="name" 
                                                        optionValue="id" 
                                                        class="w-full" 
                                                        placeholder="Select account"
                                                        :showClear="true"
                                                    />
                                                </div>

                                                <div class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Debit</label>
                                                    <InputNumber 
                                                        v-model="item.debit" 
                                                        class="w-full" 
                                                        mode="currency" 
                                                        currency="KES" 
                                                        :minFractionDigits="2" 
                                                        :maxFractionDigits="2" 
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Credit</label>
                                                    <InputNumber 
                                                        v-model="item.credit" 
                                                        class="w-full" 
                                                        mode="currency" 
                                                        currency="KES" 
                                                        :minFractionDigits="2" 
                                                        :maxFractionDigits="2" 
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Balance</label>
                                                    <InputText 
                                                        :value="formatCurrency((item.debit || 0) - (item.credit || 0))" 
                                                        class="w-full bg-gray-100 font-medium" 
                                                        readonly 
                                                    />
                                                </div>
                                            </div>

                                            <div class="mt-4">
                                                <label class="block text-sm font-medium text-gray-700">Description</label>
                                                <InputText 
                                                    v-model="item.description" 
                                                    class="w-full" 
                                                    placeholder="Item description"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </form>
                    </TabPanel>

                    <TabPanel header="Document Template" icon="pi pi-palette">
                        <div class="space-y-6">
                            <!-- Template Settings -->
                            <Card class="shadow-sm">
                                <template #title>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-cog text-primary"></i>
                                        <span>Template Settings</span>
                                    </div>
                                </template>
                                <template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <!-- Logo Settings -->
                                        <div class="space-y-4">
                                            <h4 class="font-medium text-gray-800">Logo & Branding</h4>
                                            
                                            <div class="space-y-3">
                                                <div class="flex items-center justify-between">
                                                    <label class="text-sm font-medium text-gray-700">Show Logo</label>
                                                    <InputSwitch v-model="form.template_settings.show_logo" />
                                                </div>
                                                
                                                <div v-if="form.template_settings.show_logo" class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Logo Position</label>
                                                    <Dropdown 
                                                        v-model="form.template_settings.logo_position" 
                                                        :options="[
                                                            { label: 'Header', value: 'header' },
                                                            { label: 'Footer', value: 'footer' },
                                                            { label: 'Both', value: 'both' }
                                                        ]" 
                                                        optionLabel="label" 
                                                        optionValue="value" 
                                                        class="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Approval Settings -->
                                        <div class="space-y-4">
                                            <h4 class="font-medium text-gray-800">Approval Settings</h4>
                                            
                                            <div class="space-y-3">
                                                <div class="flex items-center justify-between">
                                                    <label class="text-sm font-medium text-gray-700">Require Approval</label>
                                                    <InputSwitch v-model="form.template_settings.require_approval" />
                                                </div>
                                                
                                                <div v-if="form.template_settings.require_approval" class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-700">Approval Workflow</label>
                                                    <Dropdown 
                                                        v-model="form.template_settings.approval_workflow" 
                                                        :options="[
                                                            { label: 'Single Level', value: 'single' },
                                                            { label: 'Multi Level', value: 'multi' },
                                                            { label: 'Role Based', value: 'role' }
                                                        ]" 
                                                        optionLabel="label" 
                                                        optionValue="value" 
                                                        class="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Card>

                            <!-- Terms and Conditions -->
                            <Card class="shadow-sm">
                                <template #title>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-file-text text-primary"></i>
                                        <span>Terms & Conditions</span>
                                    </div>
                                </template>
                                <template #content>
                                    <div class="space-y-4">
                                        <Textarea 
                                            v-model="form.template_settings.terms_conditions" 
                                            class="w-full" 
                                            rows="6" 
                                            placeholder="Enter terms and conditions for this voucher..."
                                            autoResize
                                        />
                                        <p class="text-sm text-gray-500">
                                            <i class="pi pi-info-circle mr-1"></i>
                                            These terms will appear at the bottom of the generated document.
                                        </p>
                                    </div>
                                </template>
                            </Card>

                            <!-- Custom Header/Footer -->
                            <Card class="shadow-sm">
                                <template #title>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-pencil text-primary"></i>
                                        <span>Custom Header & Footer</span>
                                    </div>
                                </template>
                                <template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">Custom Header</label>
                                            <Textarea 
                                                v-model="form.template_settings.custom_header" 
                                                class="w-full" 
                                                rows="4" 
                                                placeholder="Enter custom header text..."
                                                autoResize
                                            />
                                        </div>
                                        
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-700">Custom Footer</label>
                                            <Textarea 
                                                v-model="form.template_settings.custom_footer" 
                                                class="w-full" 
                                                rows="4" 
                                                placeholder="Enter custom footer text..."
                                                autoResize
                                            />
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </TabPanel>
                </TabView>
            </div>

            <!-- Summary Sidebar -->
            <div class="w-full lg:w-80 space-y-4">
                <!-- Voucher Summary -->
                <Card class="shadow-sm sticky top-4">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-calculator text-primary"></i>
                            <span>Voucher Summary</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Voucher Info -->
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Voucher Type:</span>
                                    <span class="font-medium">
                                        {{ voucherTypes.find(v => v.value === form.voucher_type)?.label || 'Not selected' }}
                                    </span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Status:</span>
                                    <Tag 
                                        :value="voucherStatuses.find(s => s.value === form.status)?.label || 'Draft'" 
                                        :severity="voucherStatuses.find(s => s.value === form.status)?.severity || 'secondary'"
                                    />
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Items:</span>
                                    <span class="font-medium">{{ form.items.length }}</span>
                                </div>
                            </div>

                            <!-- Financial Summary -->
                            <div v-if="form.items.length > 0" class="border-t pt-4 space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Total Debits:</span>
                                    <span class="font-medium">{{ formatCurrency(calculateTotalDebits()) }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Total Credits:</span>
                                    <span class="font-medium">{{ formatCurrency(calculateTotalCredits()) }}</span>
                                </div>
                                <div class="flex justify-between text-lg font-bold border-t pt-2" :class="isVoucherBalanced() ? 'text-success' : 'text-danger'">
                                    <span>Balance:</span>
                                    <span>{{ formatCurrency(calculateTotalDebits() - calculateTotalCredits()) }}</span>
                                </div>
                                <div v-if="!isVoucherBalanced()" class="text-sm text-red-600 text-center">
                                    <i class="pi pi-exclamation-triangle mr-1"></i>
                                    Voucher is not balanced
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="space-y-2 pt-4 border-t">
                                <Button 
                                    type="button" 
                                    icon="pi pi-eye" 
                                    label="Preview Voucher" 
                                    @click="previewVoucher"
                                    class="w-full"
                                    severity="outlined"
                                />
                                <Button 
                                    type="submit" 
                                    :label="isEdit ? 'Update Voucher' : 'Create Voucher'" 
                                    :loading="loading"
                                    class="w-full"
                                    :disabled="form.items.length === 0 || !isVoucherBalanced()"
                                />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Business Info Preview -->
                <Card v-if="businessDetails" class="shadow-sm">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-building text-primary"></i>
                            <span>Business Info</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center gap-2">
                                <img 
                                    v-if="businessDetails.logo" 
                                    :src="businessDetails.logo" 
                                    alt="Business Logo" 
                                    class="w-8 h-8 object-contain"
                                />
                                <span class="font-medium">{{ businessDetails.name || 'Business Name' }}</span>
                            </div>
                            <p class="text-gray-600">{{ businessDetails.address || 'Business Address' }}</p>
                            <p class="text-gray-600">{{ businessDetails.phone || 'Phone Number' }}</p>
                            <p class="text-gray-600">{{ businessDetails.email || 'Email Address' }}</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Form Actions -->
        <template #footer>
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <Button 
                        type="button" 
                        label="Cancel" 
                        severity="secondary" 
                        @click="$emit('update:visible', false)"
                        text
                    />
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        type="button" 
                        icon="pi pi-eye" 
                        label="Preview" 
                        @click="previewVoucher"
                        severity="outlined"
                    />
                    <Button 
                        type="submit" 
                        :label="isEdit ? 'Update Voucher' : 'Create Voucher'" 
                        :loading="loading"
                        :disabled="form.items.length === 0 || !isVoucherBalanced()"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.voucher-form {
    max-height: 90vh;
    overflow-y: auto;
}

.custom-tabview :deep(.p-tabview-panels) {
    padding: 0;
}

.custom-tabview :deep(.p-tabview-nav) {
    border-bottom: 2px solid #e5e7eb;
}

.custom-tabview :deep(.p-tabview-nav-link) {
    border: none;
    background: transparent;
    color: #6b7280;
    font-weight: 500;
    padding: 1rem 1.5rem;
    transition: all 0.2s;
}

.custom-tabview :deep(.p-tabview-nav-link:hover) {
    background: #f3f4f6;
    color: #374151;
}

.custom-tabview :deep(.p-tabview-nav-link.p-highlight) {
    background: #3b82f6;
    color: white;
    border-bottom: 2px solid #3b82f6;
}

.custom-tabview :deep(.p-tabview-nav-link.p-highlight:hover) {
    background: #2563eb;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .voucher-form {
        max-height: 95vh;
    }
}

@media (max-width: 768px) {
    .custom-tabview :deep(.p-tabview-nav-link) {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
    }
}
</style>
