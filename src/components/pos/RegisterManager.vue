<script setup>
import { posService } from '@/services/ecommerce/posService';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// Props
const props = defineProps({
    userId: {
        type: [String, Number],
        required: true
    },
    branchCode: {
        type: [String, Number],
        required: true
    },
    autoRefresh: {
        type: Boolean,
        default: true
    }
});

// Reactive state
const isProcessing = ref(false);
const registerDetails = ref(null);
const isRegisterOpen = ref(false);
const currentBalance = ref(0);
const salesCount = ref(0);
const totalSalesAmount = ref(0);

// Modal states
const showOpenModal = ref(false);
const showCloseModal = ref(false);
const openingBalance = ref(0);
const openingNotes = ref('');
const closingBalance = ref(0);
const closingNotes = ref('');

// Computed properties
const registerStatusText = computed(() => {
    return isRegisterOpen.value ? 'Open' : 'Closed';
});

const registerStatusIcon = computed(() => {
    return isRegisterOpen.value ? 'pi pi-check-circle' : 'pi pi-times-circle';
});

const registerStatusColor = computed(() => {
    return isRegisterOpen.value ? 'text-green-600' : 'text-red-600';
});

// Methods

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const checkRegisterStatus = async () => {
    try {
        isProcessing.value = true;
        const response = await posService.getRegisterStatus(props.userId, props.branchCode);

        if (response.data.register_exists) {
            registerDetails.value = {
                id: response.data.register_id,
                location: response.data.location || 'Unknown',
                opened_at: response.data.opened_at,
                opened_by: response.data.opened_by,
                closed_at: response.data.closed_at,
                closed_by: response.data.closed_by
            };

            isRegisterOpen.value = response.data.is_open;

            if (response.data.is_open) {
                currentBalance.value = response.data.current_balance || 0;
                salesCount.value = response.data.sales_count || 0;
                totalSalesAmount.value = response.data.total_sales_amount || 0;
            }
        } else {
            // No register exists
            registerDetails.value = null;
            isRegisterOpen.value = false;
            currentBalance.value = 0;
            salesCount.value = 0;
            totalSalesAmount.value = 0;
        }
    } catch (error) {
        console.error('Error checking register status:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to check register status',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};

const openRegister = async () => {
    if (!openingBalance.value || openingBalance.value < 0) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please provide a valid opening balance.',
            life: 3000
        });
        return;
    }

    try {
        isProcessing.value = true;

        // First check if register exists
        const checkResponse = await posService.getRegisterStatus(props.userId, props.branchCode);

        let registerId = null;

        if (!checkResponse.data.register_exists) {
            // Create a new register
            const createResponse = await posService.createOrGetRegister({
                user_id: props.userId,
                branch_code: props.branchCode
            });
            registerId = createResponse.data.register_id;
        } else {
            registerId = checkResponse.data.register_id;
        }

        // Now open the register
        const openData = {
            opening_balance: openingBalance.value,
            notes: openingNotes.value
        };

        const response = await posService.openRegister(registerId, openData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Register opened successfully!',
            life: 3000
        });

        // Reset form and refresh status
        showOpenModal.value = false;
        openingBalance.value = 0;
        openingNotes.value = '';
        await checkRegisterStatus();
    } catch (error) {
        console.error('Error opening register:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.detail || error.response?.data?.message || 'Failed to open register.',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};

const closeRegister = async () => {
    if (!closingBalance.value || closingBalance.value < 0) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please provide a valid closing balance.',
            life: 3000
        });
        return;
    }

    try {
        isProcessing.value = true;

        const closeData = {
            closing_balance: closingBalance.value,
            notes: closingNotes.value
        };

        const response = await posService.closeRegister(registerDetails.value.id, closeData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Register closed successfully!',
            life: 3000
        });

        // Reset form and refresh status
        showCloseModal.value = false;
        closingBalance.value = 0;
        closingNotes.value = '';
        await checkRegisterStatus();
    } catch (error) {
        console.error('Error closing register:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.detail || error.response?.data?.message || 'Failed to close register.',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};

const viewSummary = () => {
    if (registerDetails.value?.id) {
        router.push({
            name: 'register',
            params: { id: registerDetails.value.id },
            query: { close_register: true }
        });
    }
};

// Auto-refresh functionality
let refreshInterval = null;

const startAutoRefresh = () => {
    if (props.autoRefresh) {
        refreshInterval = setInterval(checkRegisterStatus, 30000); // Refresh every 30 seconds
    }
};

const stopAutoRefresh = () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
};

// Lifecycle
onMounted(() => {
    checkRegisterStatus();
    startAutoRefresh();
});

onUnmounted(() => {
    stopAutoRefresh();
});

// Expose methods for parent components
defineExpose({
    checkRegisterStatus,
    openRegister,
    closeRegister
});
</script>

<template>
    <div class="register-manager">
        <!-- Register Status Display -->
        <div class="status-card mb-4">
            <Card>
                <template #title>
                    <div class="flex items-center gap-2">
                        <i :class="registerStatusIcon" :style="{ color: registerStatusColor }"></i>
                        <span>Register Status</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold" :class="registerStatusColor">
                                {{ registerStatusText }}
                            </div>
                            <div class="text-sm text-gray-600">Current Status</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xl font-semibold text-green-600">
                                {{ formatCurrency(currentBalance) }}
                            </div>
                            <div class="text-sm text-gray-600">Current Balance</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xl font-semibold text-blue-600">
                                {{ salesCount }}
                            </div>
                            <div class="text-sm text-gray-600">Sales Count</div>
                        </div>
                    </div>

                    <!-- Register Details -->
                    <div v-if="registerDetails" class="mt-4 p-3 bg-gray-50 rounded">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div><strong>Location:</strong> {{ registerDetails.location }}</div>
                            <div><strong>Opened At:</strong> {{ formatDateTime(registerDetails.opened_at) }}</div>
                            <div v-if="registerDetails.opened_by"><strong>Opened By:</strong> {{ registerDetails.opened_by }}</div>
                            <div v-if="registerDetails.closed_at"><strong>Closed At:</strong> {{ formatDateTime(registerDetails.closed_at) }}</div>
                            <div v-if="registerDetails.closed_by"><strong>Closed By:</strong> {{ registerDetails.closed_by }}</div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Action Buttons -->
        <div class="actions mb-4">
            <div class="flex flex-wrap gap-2">
                <Button v-if="!isRegisterOpen" label="Open Register" icon="pi pi-plus" class="p-button-success" @click="showOpenModal = true" :loading="isProcessing" />
                <Button v-if="isRegisterOpen" label="Close Register" icon="pi pi-times" class="p-button-danger" @click="showCloseModal = true" :loading="isProcessing" />
                <Button label="View Summary" icon="pi pi-chart-bar" class="p-button-info" @click="viewSummary" />
                <Button label="Refresh Status" icon="pi pi-refresh" class="p-button-secondary" @click="checkRegisterStatus" :loading="isProcessing" />
            </div>
        </div>

        <!-- Open Register Modal -->
        <Dialog v-model:visible="showOpenModal" modal header="Open Register" :style="{ width: '500px' }">
            <div class="flex flex-col space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Opening Balance:</label>
                    <InputNumber v-model="openingBalance" class="w-full" placeholder="Enter opening balance" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional):</label>
                    <Textarea v-model="openingNotes" class="w-full" placeholder="Enter any notes about opening the register" rows="3" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showOpenModal = false" />
                <Button label="Open Register" class="p-button-success" @click="openRegister" :loading="isProcessing" />
            </template>
        </Dialog>

        <!-- Close Register Modal -->
        <Dialog v-model:visible="showCloseModal" modal header="Close Register" :style="{ width: '500px' }">
            <div class="flex flex-col space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Closing Balance:</label>
                    <InputNumber v-model="closingBalance" class="w-full" placeholder="Enter closing balance" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional):</label>
                    <Textarea v-model="closingNotes" class="w-full" placeholder="Enter any notes about closing the register" rows="3" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showCloseModal = false" />
                <Button label="Close Register" class="p-button-danger" @click="closeRegister" :loading="isProcessing" />
            </template>
        </Dialog>

        <!-- Loading Spinner -->
        <Spinner v-if="isProcessing" :isLoading="true" title="Processing..." />
    </div>
</template>

<style scoped>
.register-manager {
    width: 100%;
}

.status-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
}
</style>
