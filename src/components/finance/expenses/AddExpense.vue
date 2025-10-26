<script setup>
import Spinner from '@/components/ui/Spinner.vue'; // Custom spinner component
import { userManagementService } from '@/services/auth/userManagementService';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

// Data
const expenseCategories = ref([]);
const users = ref([]);
const contacts = ref([]);
const taxRates = ref([]);
const intervals = ref(['Days', 'Weeks', 'Months', 'Years']);
const isProcessing = ref(false);
const spinner_title = ref('Processing...');
const register = ref(null);

const expense = ref({
    register: null,
    business_location: null,
    category: null,
    reference_no: '',
    date_added: moment(new Date()).format('YYYY-MM-DD'),
    expense_for_user: null,
    expense_for_contact: null,
    attach_document: null,
    applicable_tax: null,
    total_amount: null,
    expense_note: '',
    is_refund: false,
    is_recurring: false,
    recurring_interval: 0,
    interval_type: 'Days',
    repetitions: null
});

// Fetch data on mount
onMounted(() => {
    fetchExpenseCategories();
    fetchUsers();
    fetchContacts();
    fetchTaxRates();
    fetchRegister();
});

// Methods
const fetchExpenseCategories = async () => {
    try {
        const response = await ExpenseService.getExpenseCategories();
        expenseCategories.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch expense categories.', life: 3000 });
    }
};

const fetchUsers = async () => {
    try {
        const response = await userManagementService.getUsers();
        users.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show toast for users as it might not be critical
    }
};

const fetchContacts = async () => {
    try {
        // Use CustomerService instead of userManagementService
        const response = await CustomerService.getCustomers();
        contacts.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching contacts:', error);
        // Don't show toast for contacts as it might not be critical
    }
};

const fetchTaxRates = async () => {
    try {
        const response = await ExpenseService.getTaxRates();
        taxRates.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching tax rates:', error);
        // Don't show toast for tax rates as it might not be critical
    }
};

const fetchRegister = async () => {
    try {
        // First check if register is open
        const response = await POSService.checkRegister();
        if (response.data && response.data.is_open) {
            // Now get the register details
            const registerDetails = await POSService.getRegisterData();
            register.value = registerDetails.data?.registerDetails || registerDetails.data;
            if (register.value) {
                expense.value.register = register.value.id;
            }

            // Set business location from register
            const business = JSON.parse(sessionStorage.getItem('business'));
            if (business) {
                expense.value.business_branch = business.branch_code;
            }
        }
    } catch (error) {
        console.error('Error fetching register information:', error);
        // Don't show toast for register as it might not be critical for expense creation
    }
};

const addExpense = async () => {
    isProcessing.value = true;
    try {
        // Make sure to capture the register ID if available
        if (register.value) {
            expense.value.register = register.value.id;
        }

        // Format date properly
        expense.value.date_added = moment(expense.value.date_added).format('YYYY-MM-DD');

        // Extract IDs for nested objects
        if (expense.value.category && typeof expense.value.category === 'object') {
            expense.value.category = expense.value.category.id;
        }
        if (expense.value.expense_for_user && typeof expense.value.expense_for_user === 'object') {
            expense.value.expense_for_user = expense.value.expense_for_user.id;
        }
        if (expense.value.expense_for_contact && typeof expense.value.expense_for_contact === 'object') {
            expense.value.expense_for_contact = expense.value.expense_for_contact.id;
        }
        if (expense.value.applicable_tax && typeof expense.value.applicable_tax === 'object') {
            expense.value.applicable_tax = expense.value.applicable_tax.id;
        }

        const response = await ExpenseService.createExpense(expense.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Expense added successfully!', life: 3000 });

        // Reset form
        expense.value = {
            register: register.value?.id || null,
            business_location: expense.value.business_location, // Keep the same business location
            category: null,
            reference_no: '',
            date_added: moment(new Date()).format('YYYY-MM-DD'),
            expense_for_user: null,
            expense_for_contact: null,
            attach_document: null,
            applicable_tax: null,
            total_amount: null,
            expense_note: '',
            is_refund: false,
            is_recurring: false,
            recurring_interval: 0,
            interval_type: 'Days',
            repetitions: null
        };
    } catch (error) {
        console.error('Error adding expense:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.detail || error.message || 'Failed to add expense.', life: 5000 });
    } finally {
        isProcessing.value = false;
    }
};

const handleSubmit = () => {
    // Handle form submission if needed
};
</script>

<template>
    <div class="container mx-auto p-4">
        <Card class="mb-4">
            <template #title>Add Expense</template>
            <template #content>
                <form @submit.prevent="handleSubmit">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Expense Category:</label>
                            <MultiSelect v-model="expense.category" :options="expenseCategories" optionLabel="name" placeholder="Select..." class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Reference No:</label>
                            <InputText v-model="expense.reference_no" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Date Added:</label>
                            <Calendar v-model="expense.date_added" class="w-full" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Expense For User:</label>
                            <MultiSelect v-model="expense.expense_for_user" :options="users" optionLabel="username" placeholder="Select..." class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Expense For Contact:</label>
                            <MultiSelect v-model="expense.expense_for_contact" :options="contacts" optionLabel="name" placeholder="Select..." class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Attach Document:</label>
                            <FileUpload v-model="expense.attach_document" mode="basic" class="w-full" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Applicable Tax:</label>
                            <MultiSelect v-model="expense.applicable_tax" :options="taxRates" optionLabel="tax_name" placeholder="Select..." class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Total Amount:</label>
                            <InputNumber v-model="expense.total_amount" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Expense Note:</label>
                            <Textarea v-model="expense.expense_note" class="w-full" rows="3" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Is Refund:</label>
                            <Checkbox v-model="expense.is_refund" binary />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Is Recurring:</label>
                            <Checkbox v-model="expense.is_recurring" binary />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Recurring Interval:</label>
                            <div class="flex gap-2">
                                <InputNumber v-model="expense.recurring_interval" class="w-1/2" />
                                <Dropdown v-model="expense.interval_type" :options="intervals" class="w-1/2" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Repetitions:</label>
                            <InputNumber v-model="expense.repetitions" class="w-full" />
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <Button label="Save" icon="pi pi-save" class="p-button-secondary" @click="addExpense" />
                    </div>
                </form>
            </template>
        </Card>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
