<script setup>
import ItemsTable from '@/components/shared/ItemsTable.vue';
import Spinner from '@/components/ui/Spinner.vue';
import AddSupplier from '@/components/crm/AddSupplier.vue';
import AccountForm from '@/components/finance/accounts/AccountForm.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { useToast } from '@/composables/useToast';
import { useAddEditModal } from '@/composables/useAddEditModal';
import { PAYMENT_METHODS } from '@/constants/finance/paymentMethods';
import { userManagementService } from '@/services/auth/userManagementService';
import { crmService } from '@/services/crm/crmService';
import { expenseCategoryService, expenseService } from '@/services/finance/expenseService';
import { financeService } from '@/services/finance/financeService';
import { procurementService } from '@/services/procurement/procurementService';
import { formatCurrency } from '@/utils/formatters';
import { useVuelidate } from '@vuelidate/core';
import { minValue, required } from '@vuelidate/validators';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/utils/axiosConfig';

const router = useRouter();
const route = useRoute();
const { showToast } = useToast();

// Check if edit mode
const isEditMode = computed(() => !!route.params.id);

// Form data
const form = reactive({
    category: null,
    date_added: new Date(),
    expense_for_user: null,
    expense_for_contact: null,
    payment_method: 'cash',
    payment_account: null,
    expense_note: '',
    items: [],
    attach_document: null,
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    is_refund: false,
    is_recurring: false,
    recurring_interval: 1,
    interval_type: 'Months',
    repetitions: 12,
    status: 'draft'
});

// Validation rules
const rules = {
    category: { required },
    date_added: { required },
    items: {
        required,
        minValue: minValue(1)
    },
    total_amount: {
        required,
        minValue: minValue(0.01)
    }
};

const v$ = useVuelidate(rules, form);

// State
const loading = ref(false);
const categories = ref([]);
const users = ref([]);
const contacts = ref([]);
const paymentAccounts = ref([]);
const intervalTypes = ref(['Days', 'Weeks', 'Months', 'Years']);

// Supplier Dialog state
const showContactDialog = ref(false);
const contactEditMode = ref(false);
const contactEditId = ref(null);

// Account Dialog state
const showAccountDialog = ref(false);
const accountEditMode = ref(false);
const accountEditData = ref(null);

// Category Dialog state
const showCategoryDialog = ref(false);
const categoryForm = ref({
    name: '',
    description: ''
});

const openAddContact = () => {
    contactEditMode.value = false;
    contactEditId.value = null;
    showContactDialog.value = true;
};

const openEditContact = (id, data) => {
    contactEditMode.value = true;
    contactEditId.value = id;
    showContactDialog.value = true;
};

const handleAddAccount = () => {
    accountEditMode.value = false;
    accountEditData.value = null;
    showAccountDialog.value = true;
};

const handleEditAccount = (account) => {
    accountEditMode.value = true;
    accountEditData.value = account;
    showAccountDialog.value = true;
};

const handleAccountSaved = async (savedAccount) => {
    showAccountDialog.value = false;
    await loadPaymentAccounts();
    // Auto-select the newly created or edited account
    if (savedAccount && savedAccount.id) {
        form.payment_account = savedAccount;
    }
};
const handleSupplierSaved = async (saved) => {
    // Refresh contacts and close dialog; if the saved payload includes an id, select it
    await loadContacts();
    showContactDialog.value = false;
    if (saved && saved.id) {
        form.expense_for_contact = saved;
    }
};

const openAddCategory = () => {
    categoryForm.value = { name: '', description: '' };
    showCategoryDialog.value = true;
};

const closeCategoryDialog = () => {
    showCategoryDialog.value = false;
    categoryForm.value = { name: '', description: '' };
};

const saveCategory = async () => {
    if (!categoryForm.value.name.trim()) {
        showToast('error', 'Error', 'Category name is required');
        return;
    }

    try {
        const response = await expenseCategoryService.create(categoryForm.value);
        const newCategory = response.data || response;
        showToast('success', 'Success', 'Expense category created successfully!');
        closeCategoryDialog();
        await loadCategories();
        // Auto-select the newly created category
        if (newCategory && newCategory.id) {
            form.category = categories.value.find(c => c.id === newCategory.id) || newCategory;
        }
    } catch (error) {
        console.error('Error saving expense category:', error);
        showToast('error', 'Error', 'Failed to save expense category');
    }
};

// Options
const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Submit for Approval', value: 'pending' }
];

// Methods
const loadCategories = async () => {
    try {
        const response = await expenseCategoryService.getAll({ page_size: 100 });
        const data = response.data || response;
        categories.value = data?.results || data || [];
        console.log('✅ Expense categories loaded:', categories.value.length);
    } catch (error) {
        console.error('❌ Error loading categories:', error.message);
        categories.value = [];
    }
};

const loadUsers = async () => {
    try {
        const response = await userManagementService.getUsers({ page_size: 100 });
        const data = response.data || response;
        users.value = data?.results || data || [];
        console.log('✅ Users loaded:', users.value.length);
    } catch (error) {
        console.error('❌ Error loading users:', error.message);
        users.value = [];
    }
};

const loadContacts = async () => {
    try {
        const response = await crmService.getContacts({ page_size: 100 });
        const data = response.data || response;
        contacts.value = data?.results || data || [];
        console.log('✅ Contacts loaded:', contacts.value.length);
    } catch (error) {
        console.error('❌ Error loading contacts:', error.message);
        contacts.value = [];
    }
};

const loadPaymentAccounts = async () => {
    try {
        const response = await financeService.getPaymentAccounts({ page_size: 100 });
        const data = response.data || response;
        paymentAccounts.value = data?.results || data || [];
        console.log('✅ Payment accounts loaded:', paymentAccounts.value.length);
    } catch (error) {
        console.error('❌ Error loading payment accounts:', error.message);
        paymentAccounts.value = [];
    }
};

const calculateTotals = () => {
    // Calculate from line items
    let subtotal = 0;
    let taxTotal = 0;

    const itemsArray = Array.isArray(form.items) ? form.items : [];
    itemsArray.forEach(item => {
        subtotal += parseFloat(item.subtotal || 0) || 0;
        taxTotal += parseFloat(item.tax_amount || 0) || 0;
    });

    form.subtotal = subtotal;
    form.tax_amount = taxTotal;
    form.total_amount = subtotal + taxTotal;
};

const handleLineItemsChange = (items) => {
    form.items = items;
    calculateTotals();
};

const handleFileUpload = (event) => {
    const file = event.files[0];
    if (file) {
        form.attach_document = file;
    }
};

const saveExpense = async (isDraft = false) => {
    // Validate
    const isValid = await v$.value.$validate();
    if (!isValid) {
        showToast('warn', 'Validation Error', 'Please fill all required fields');
        return;
    }

    loading.value = true;
    try {
        // Prepare form data
        const formData = new FormData();
        
        // Basic fields
        formData.append('category', form.category?.id || form.category);
        formData.append('date_added', form.date_added instanceof Date 
            ? form.date_added.toISOString().split('T')[0] 
            : form.date_added);
        formData.append('expense_note', form.expense_note);
        formData.append('total_amount', form.total_amount);
        formData.append('status', isDraft ? 'draft' : 'pending');
        formData.append('is_refund', form.is_refund);
        formData.append('is_recurring', form.is_recurring);
        
        // Optional fields
        if (form.expense_for_user) {
            formData.append('expense_for_user', form.expense_for_user?.id || form.expense_for_user);
        }
        if (form.expense_for_contact) {
            formData.append('expense_for_contact', form.expense_for_contact?.id || form.expense_for_contact);
        }
        if (form.payment_account) {
            formData.append('payment_account', form.payment_account?.id || form.payment_account);
        }
        if (form.payment_method) {
            formData.append('payment_method', form.payment_method);
        }
        
        // Recurring fields
        if (form.is_recurring) {
            formData.append('recurring_interval', form.recurring_interval);
            formData.append('interval_type', form.interval_type);
            formData.append('repetitions', form.repetitions);
        }
        
        // Items (as JSON)
        formData.append('items', JSON.stringify(form.items));
        
        // File attachment
        if (form.attach_document) {
            formData.append('attach_document', form.attach_document);
        }

        // Get business context
        const business = JSON.parse(sessionStorage.getItem('business') || '{}');
        if (business.branch_code) {
            formData.append('branch', business.branch_code);
        }

        let response;
        if (isEditMode.value) {
            response = await expenseService.update(route.params.id, formData);
        } else {
            response = await expenseService.create(formData);
        }

        showToast('success', 'Success', `Expense ${isEditMode.value ? 'updated' : 'created'} successfully`);
        router.push('/finance/expenses');
    } catch (error) {
        console.error('Error saving expense:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to save expense');
    } finally {
        loading.value = false;
    }
};

const saveDraft = () => {
    saveExpense(true);
};

const submitForApproval = () => {
    saveExpense(false);
};

const cancel = () => {
    router.push('/finance/expenses');
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadCategories(),
        loadUsers(),
        loadContacts(),
        loadPaymentAccounts()
    ]);
    
    // Add initial line item if creating new
    if (!isEditMode.value && form.items.length === 0) {
        form.items = [{
            name: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: null,
            tax_amount: 0,
            subtotal: 0,
            total: 0
        }];
    }
    
    // Load expense if edit mode
    if (isEditMode.value) {
        await loadExpense(route.params.id);
    }
});

const loadExpense = async (id) => {
    try {
        loading.value = true;
        const response = await expenseService.getById(id);
        const expense = response.data || response;
        
        // Populate form
        form.category = categories.value.find(c => c.id === expense.category) || expense.category;
        form.date_added = new Date(expense.date_added);
        form.expense_for_user = expense.expense_for_user;
        form.expense_for_contact = expense.expense_for_contact;
        form.payment_method = expense.payment_method;
        form.payment_account = expense.payment_account;
        form.expense_note = expense.expense_note;
        form.is_refund = expense.is_refund;
        form.is_recurring = expense.is_recurring;
        form.recurring_interval = expense.recurring_interval;
        form.interval_type = expense.interval_type;
        form.repetitions = expense.repetitions;
        form.status = expense.status;
        
        // Load items
        if (expense.items && expense.items.length > 0) {
            form.items = expense.items;
        }
        
        calculateTotals();
    } catch (error) {
        console.error('Error loading expense:', error);
        showToast('error', 'Error', 'Failed to load expense');
        router.push('/finance/expenses');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="expense-form-page">
        <!-- Page Header -->
        <div class="page-header bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-10">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                        {{ isEditMode ? 'Edit Expense' : 'New Expense' }}
                    </h1>
                    <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
                        {{ isEditMode ? 'Update expense details' : 'Create a new expense record' }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        @click="cancel" 
                        class="p-button-text"
                        :disabled="loading"
                    />
                    <Button 
                        label="Save Draft" 
                        icon="pi pi-save" 
                        @click="saveDraft" 
                        class="p-button-secondary"
                        :loading="loading"
                    />
                    <Button 
                        label="Submit for Approval" 
                        icon="pi pi-send" 
                        @click="submitForApproval" 
                        class="p-button-primary"
                        :loading="loading"
                    />
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !isEditMode" class="flex justify-center items-center py-12">
            <Spinner />
        </div>

        <!-- Form Content -->
        <div v-else class="p-6 space-y-6">
            <!-- Basic Information Card -->
            <Card>
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-info-circle text-primary"></i>
                        <span>Basic Information</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Category -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Category *</label>
                            <div class="flex gap-2">
                                <Dropdown
                                    v-model="form.category"
                                    :options="categories"
                                    optionLabel="name"
                                    placeholder="Select category"
                                    class="flex-1"
                                    :class="{ 'p-invalid': v$.category.$error }"
                                    filter
                                />
                                <Button
                                    icon="pi pi-plus"
                                    class="p-button-success"
                                    @click="openAddCategory"
                                    v-tooltip.top="'Add new category'"
                                />
                            </div>
                            <small v-if="v$.category.$error" class="p-error">Category is required</small>
                        </div>

                        <!-- Date -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Date *</label>
                            <Calendar 
                                v-model="form.date_added"
                                dateFormat="dd/mm/yy"
                                :showIcon="true"
                                class="w-full"
                                :class="{ 'p-invalid': v$.date_added.$error }"
                            />
                        </div>

                        <!-- Payment Method -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Payment Method</label>
                            <Dropdown 
                                v-model="form.payment_method"
                                :options="PAYMENT_METHODS"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select payment method"
                                class="w-full"
                            >
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2">
                                        <i :class="['pi', slotProps.option.icon]"></i>
                                        <span>{{ slotProps.option.label }}</span>
                                    </div>
                                </template>
                            </Dropdown>
                        </div>

                        <!-- Payment Account -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Payment Account</label>
                            <div class="flex gap-2">
                                <Dropdown
                                    v-model="form.payment_account"
                                    :options="paymentAccounts"
                                    optionLabel="name"
                                    placeholder="Select account"
                                    class="w-full"
                                >
                                    <template #option="slotProps">
                                        <div class="flex items-center justify-between w-full group">
                                            <span>{{ slotProps.option.name }}</span>
                                            <Button 
                                                v-if="slotProps.option"
                                                type="button"
                                                icon="pi pi-pencil"
                                                class="p-button-sm p-button-text opacity-0 group-hover:opacity-100 transition-opacity"
                                                @click.stop="handleEditAccount(slotProps.option)"
                                                text
                                            />
                                        </div>
                                    </template>
                                </Dropdown>
                                <Button 
                                    type="button"
                                    icon="pi pi-plus"
                                    class="p-button-sm"
                                    severity="success"
                                    @click="handleAddAccount"
                                    v-tooltip.top="'Add new account'"
                                />
                            </div>
                        </div>

                        <!-- Expense For User -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Expense For (User)</label>
                            <Dropdown 
                                v-model="form.expense_for_user"
                                :options="users"
                                optionLabel="username"
                                placeholder="Select user"
                                class="w-full"
                                :filter="true"
                            />
                        </div>

                        <!-- Expense For Contact -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Expense For (Contact)</label>
                            <div class="flex gap-2">
                                <Dropdown 
                                    v-model="form.expense_for_contact"
                                    :options="contacts"
                                    optionLabel="business_name"
                                    placeholder="Select contact"
                                    class="flex-1"
                                    :filter="true"
                                />
                                <PermissionButton 
                                    icon="pi pi-plus" 
                                    @click="openAddContact" 
                                    severity="success"
                                    tooltip="Add new contact"
                                />
                                <PermissionButton 
                                    v-if="form.expense_for_contact"
                                    icon="pi pi-pencil" 
                                    @click="openEditContact(form.expense_for_contact.id, form.expense_for_contact)" 
                                    severity="info"
                                    tooltip="Edit contact"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="mt-4">
                        <label class="block text-sm font-medium mb-2">Notes</label>
                        <Textarea 
                            v-model="form.expense_note"
                            rows="3"
                            class="w-full"
                            placeholder="Add any additional notes about this expense..."
                        />
                    </div>
                </template>
            </Card>

            <!-- Line Items Card -->
            <Card>
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-list text-primary"></i>
                        <span>Expense Items</span>
                    </div>
                </template>
                <template #content>
                    <ItemsTable 
                        :items="form.items"
                        :readonly="false"
                        @update:items="handleLineItemsChange"
                    />
                    
                    <small v-if="v$.items.$error" class="p-error">At least one item is required</small>
                </template>
            </Card>

            <!-- Totals Summary -->
            <Card>
                <template #content>
                    <div class="flex justify-end">
                        <div class="w-full md:w-96 space-y-3">
                            <div class="flex justify-between text-lg">
                                <span class="font-medium">Subtotal:</span>
                                <span>{{ formatCurrency(form.subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-lg">
                                <span class="font-medium">Tax:</span>
                                <span>{{ formatCurrency(form.tax_amount) }}</span>
                            </div>
                            <Divider />
                            <div class="flex justify-between text-2xl font-bold text-primary">
                                <span>Total:</span>
                                <span>{{ formatCurrency(form.total_amount) }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Additional Options Card -->
            <Card>
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-cog text-primary"></i>
                        <span>Additional Options</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Attachment -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Attach Document</label>
                            <FileUpload 
                                mode="basic" 
                                name="attach_document"
                                accept="image/*,application/pdf,.doc,.docx"
                                :maxFileSize="5000000"
                                @select="handleFileUpload"
                                chooseLabel="Choose File"
                                class="w-full"
                            />
                            <small class="text-surface-500">Max file size: 5MB</small>
                        </div>

                        <!-- Flags -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <Checkbox 
                                    v-model="form.is_refund" 
                                    inputId="is_refund"
                                    binary
                                />
                                <label for="is_refund" class="text-sm font-medium">
                                    This is a refund
                                </label>
                            </div>

                            <div class="flex items-center gap-2">
                                <Checkbox 
                                    v-model="form.is_recurring" 
                                    inputId="is_recurring"
                                    binary
                                />
                                <label for="is_recurring" class="text-sm font-medium">
                                    Make this a recurring expense
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Recurring Options -->
                    <div v-if="form.is_recurring" class="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <h4 class="font-semibold mb-4 flex items-center gap-2">
                            <i class="pi pi-refresh"></i>
                            Recurring Schedule
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Repeat Every</label>
                                <InputNumber 
                                    v-model="form.recurring_interval"
                                    :min="1"
                                    class="w-full"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Interval</label>
                                <Dropdown 
                                    v-model="form.interval_type"
                                    :options="intervalTypes"
                                    class="w-full"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Number of Repetitions</label>
                                <InputNumber 
                                    v-model="form.repetitions"
                                    :min="1"
                                    class="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>

    <!-- Supplier Dialog -->
    <Dialog v-model:visible="showContactDialog" header="Add / Edit Supplier" :modal="true" :style="{ width: '700px' }">
        <AddSupplier :id="contactEditId" :editmode="contactEditMode" @saved="handleSupplierSaved" />
    </Dialog>

    <!-- Account Dialog -->
    <Dialog
        v-model:visible="showAccountDialog"
        :header="accountEditMode ? 'Edit Account' : 'Create New Account'"
        modal
        :style="{ width: '100%', maxWidth: '600px' }"
        class="p-4"
    >
        <AccountForm
            v-if="showAccountDialog"
            :account="accountEditData"
            :isEdit="accountEditMode"
            @saved="handleAccountSaved"
            @cancel="showAccountDialog = false"
        />
    </Dialog>

    <!-- Expense Category Dialog -->
    <Dialog
        v-model:visible="showCategoryDialog"
        header="Add New Expense Category"
        modal
        :style="{ width: '100%', maxWidth: '500px' }"
        :closable="true"
        @hide="closeCategoryDialog"
    >
        <div class="space-y-4">
            <div class="field">
                <label for="categoryName" class="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span class="text-red-500">*</span>
                </label>
                <InputText
                    id="categoryName"
                    v-model="categoryForm.name"
                    placeholder="Enter category name"
                    class="w-full"
                    :class="{ 'p-invalid': !categoryForm.name.trim() && categoryForm.name !== '' }"
                />
            </div>

            <div class="field">
                <label for="categoryDescription" class="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <Textarea
                    id="categoryDescription"
                    v-model="categoryForm.description"
                    placeholder="Enter category description (optional)"
                    class="w-full"
                    rows="3"
                />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" class="p-button-text" @click="closeCategoryDialog" />
                <Button
                    label="Save Category"
                    icon="pi pi-check"
                    class="p-button-success"
                    @click="saveCategory"
                    :disabled="!categoryForm.name.trim()"
                />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.expense-form-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.page-header {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .page-header .flex {
        flex-direction: column;
        gap: 1rem;
    }
    
    .page-header .flex > div:last-child {
        width: 100%;
    }
    
    .page-header .flex > div:last-child .flex {
        justify-content: stretch;
    }
    
    .page-header .flex > div:last-child .flex button {
        flex: 1;
    }
}
</style>

