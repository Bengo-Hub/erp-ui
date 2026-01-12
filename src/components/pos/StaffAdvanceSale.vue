<script setup>
import { formatCurrency } from '@/components/hrm/payroll/payslipGenerator';
import Spinner from '@/components/ui/Spinner.vue';
import { posService } from '@/services/ecommerce/posService';
import { useToast } from 'primevue/usetoast';
import { computed, defineEmits, defineProps, onMounted, ref, watch } from 'vue';

const props = defineProps({
    cartItems: {
        type: Array,
        default: () => []
    },
    closeDialog: {
        type: Function,
        default: () => {}
    }
});

const emit = defineEmits(['processSale', 'cancel']);
const toast = useToast();

// Data
const staffMembers = ref([]);
const selectedStaff = ref(null);
const advanceType = ref('salary_advance');
const isProcessing = ref(false);
const note = ref('');
const staffAdvanceBalance = ref(0);
const installments = ref(1);

const advanceTypes = ref([
    { name: 'Salary Advance', value: 'salary_advance' },
    { name: 'Loan Repayment', value: 'loan_repayment' }
]);

// Computed properties
const totalCartAmount = computed(() => {
    return props.cartItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
});

const installmentAmount = computed(() => {
    if (installments.value <= 0) return totalCartAmount.value;
    return totalCartAmount.value / installments.value;
});

const getBalanceClass = (balance) => {
    return balance > 0 ? 'text-green-600' : 'text-red-600';
};

const isValid = computed(() => {
    if (!selectedStaff.value) return false;
    if (advanceType.value === 'salary_advance' && totalCartAmount.value > selectedStaff.value.max_advance) {
        return false;
    }
    return true;
});

// Methods
const fetchStaffMembers = async () => {
    isProcessing.value = true;
    try {
        const response = await posService.getEmployees();
        staffMembers.value = response.data.results.map((staff) => ({
            ...staff,
            fullName: `${staff.user.first_name} ${staff.user.last_name}`,
            max_advance: staff.max_advance || 5000, // Default max advance if not set
            current_advances: staff.current_advances || 0
        }));
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch staff members', life: 3000 });
    } finally {
        isProcessing.value = false;
    }
};

const fetchStaffAdvance = async (staffId) => {
    try {
        const response = await posService.getStaffAdvances(staffId);
        staffAdvanceBalance.value = response.data.available_advance || 0;
    } catch (error) {
        staffAdvanceBalance.value = 0;
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Could not fetch staff advance information', life: 3000 });
    }
};

const handleSubmit = async () => {
    if (!isValid.value) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Sale amount exceeds allowed advance limit',
            life: 3000
        });
        return;
    }

    isProcessing.value = true;
    try {
        // Process the staff advance sale
        const saleData = {
            staff_id: selectedStaff.value.id,
            cart_items: props.cartItems,
            advance_type: advanceType.value,
            total_amount: totalCartAmount.value,
            installments: installments.value,
            note: note.value
        };

        // Call the endpoint to create staff advance sale using POSService
        const response = await posService.createStaffAdvanceSale(saleData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Staff advance sale processed successfully',
            life: 3000
        });

        // Emit event to notify parent and clear cart
        emit('processSale', {
            staff: selectedStaff.value,
            total: totalCartAmount.value,
            reference: response.data.reference_id
        });

        // Close the modal
        closeModal();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to process staff advance sale',
            life: 5000
        });
    } finally {
        isProcessing.value = false;
    }
};

const closeModal = () => {
    if (props.closeDialog) {
        props.closeDialog();
    }
    emit('cancel');
};

// Watch for selected staff changes
watch(selectedStaff, (newStaff) => {
    if (newStaff) {
        fetchStaffAdvance(newStaff.id);
    } else {
        staffAdvanceBalance.value = 0;
    }
});

// Lifecycle hooks
onMounted(() => {
    fetchStaffMembers();
});
</script>

<template>
    <div class="container mx-auto p-4">
        <Card class="mb-4">
            <template #title>Staff Advance Sale</template>
            <template #content>
                <form @submit.prevent="handleSubmit">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Select Staff Member:</label>
                            <Dropdown v-model="selectedStaff" :options="staffMembers" optionLabel="fullName" placeholder="Select a staff member" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Total Sale Amount:</label>
                            <div class="text-xl font-bold">KES {{ formatCurrency(totalCartAmount) }}</div>
                        </div>
                    </div>

                    <div v-if="selectedStaff" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Advance Type:</label>
                            <Dropdown v-model="advanceType" :options="advanceTypes" optionLabel="name" optionValue="value" placeholder="Select advance type" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Current Advance Balance:</label>
                            <div class="text-xl" :class="getBalanceClass(staffAdvanceBalance)">KES {{ formatCurrency(staffAdvanceBalance) }}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Installments:</label>
                            <div class="flex items-center">
                                <InputNumber
                                    v-model="installments"
                                    :min="1"
                                    :max="12"
                                    showButtons
                                    buttonLayout="horizontal"
                                    decrementButtonClass="p-button-danger"
                                    incrementButtonClass="p-button-success"
                                    incrementButtonIcon="pi pi-plus"
                                    decrementButtonIcon="pi pi-minus"
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Installment Amount:</label>
                            <div class="text-xl font-semibold">KES {{ formatCurrency(installmentAmount) }}</div>
                        </div>
                    </div>

                    <div v-if="selectedStaff" class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Description/Note:</label>
                            <Textarea v-model="note" rows="3" class="w-full" placeholder="Enter details about this advance sale" />
                        </div>
                    </div>

                    <div class="flex justify-end space-x-2">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-outlined" @click="closeModal" />
                        <Button type="submit" label="Process Sale" icon="pi pi-check" :disabled="!selectedStaff || !isValid" :loading="isProcessing" />
                    </div>
                </form>
            </template>
        </Card>
        <Spinner :isLoading="isProcessing" title="Processing staff advance sale..." />
    </div>
</template>

<style scoped>
/* Any custom styles can go here */
</style>
