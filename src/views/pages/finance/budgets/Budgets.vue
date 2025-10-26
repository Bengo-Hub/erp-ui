<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();

// State
const budgets = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const editingId = ref(null);

// Form data
const form = reactive({
    name: '',
    start_date: new Date(),
    end_date: new Date(),
    description: '',
    total_amount: 0,
    status: 'draft'
});

// Options
const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
];

// Methods
const fetchBudgets = async () => {
    loading.value = true;
    try {
        const response = await financeService.getBudgets();
        budgets.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching budgets:', error);
        showToast('error', 'Failed to load budgets');
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    isEdit.value = false;
    editingId.value = null;
    resetForm();
    showDialog.value = true;
};

const editBudget = (budget) => {
    isEdit.value = true;
    editingId.value = budget.id;
    Object.assign(form, {
        name: budget.name || '',
        start_date: budget.start_date ? new Date(budget.start_date) : new Date(),
        end_date: budget.end_date ? new Date(budget.end_date) : new Date(),
        description: budget.description || '',
        total_amount: budget.total_amount || 0,
        status: budget.status || 'draft'
    });
    showDialog.value = true;
};

const viewBudget = (budget) => {
    router.push({ name: 'finance-budget-detail', params: { id: budget.id } });
};

const saveBudget = async () => {
    if (!form.name.trim()) {
        showToast('error', 'Budget name is required');
        return;
    }

    saving.value = true;
    try {
        if (isEdit.value) {
            await financeService.updateBudget(editingId.value, form);
            showToast('success', 'Budget updated successfully');
        } else {
            await financeService.createBudget(form);
            showToast('success', 'Budget created successfully');
        }
        closeDialog();
        await fetchBudgets();
    } catch (error) {
        console.error('Error saving budget:', error);
        showToast('error', `Failed to ${isEdit.value ? 'update' : 'create'} budget`);
    } finally {
        saving.value = false;
    }
};

const deleteBudget = async (budget) => {
    if (!confirm(`Are you sure you want to delete budget "${budget.name}"?`)) return;

    try {
        await financeService.deleteBudget(budget.id);
        showToast('success', 'Budget deleted successfully');
        await fetchBudgets();
    } catch (error) {
        console.error('Error deleting budget:', error);
        showToast('error', 'Failed to delete budget');
    }
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const resetForm = () => {
    Object.assign(form, {
        name: '',
        start_date: new Date(),
        end_date: new Date(),
        description: '',
        total_amount: 0,
        status: 'draft'
    });
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'secondary',
        active: 'success',
        completed: 'info',
        cancelled: 'danger'
    };
    return severityMap[status] || 'info';
};

// Lifecycle
onMounted(() => {
    fetchBudgets();
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Budget Management</h1>
                <p class="text-gray-600">Create and manage financial budgets</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
                <Button icon="pi pi-plus" label="Create Budget" @click="openCreate" class="p-button-primary" />
                <Button icon="pi pi-refresh" label="Refresh" @click="fetchBudgets" :loading="loading" severity="secondary" />
            </div>
        </div>

        <!-- Budgets Table -->
        <Card>
            <template #content>
                <DataTable :value="budgets" :loading="loading" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50]" class="p-datatable-sm" stripedRows responsiveLayout="scroll">
                    <Column field="name" header="Budget Name" sortable>
                        <template #body="{ data }">
                            <div class="font-medium text-gray-900">{{ data.name }}</div>
                            <div class="text-sm text-gray-500">{{ data.description }}</div>
                        </template>
                    </Column>

                    <Column field="start_date" header="Start Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.start_date) }}
                        </template>
                    </Column>

                    <Column field="end_date" header="End Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.end_date) }}
                        </template>
                    </Column>

                    <Column field="total_amount" header="Total Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-medium">{{ formatCurrency(data.total_amount) }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="flex space-x-2">
                                <Button icon="pi pi-eye" severity="info" size="small" @click="viewBudget(data)" v-tooltip.top="'View Details'" />
                                <Button icon="pi pi-pencil" severity="secondary" size="small" @click="editBudget(data)" v-tooltip.top="'Edit Budget'" />
                                <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteBudget(data)" v-tooltip.top="'Delete Budget'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Budget Dialog -->
        <Dialog v-model:visible="showDialog" :modal="true" :header="isEdit ? 'Edit Budget' : 'Create New Budget'" :style="{ width: '40rem' }" @update:visible="closeDialog">
            <form @submit.prevent="saveBudget" class="space-y-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Budget Name <span class="text-red-500">*</span> </label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter budget name" required />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700"> Start Date <span class="text-red-500">*</span> </label>
                        <Calendar v-model="form.start_date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" required />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700"> End Date <span class="text-red-500">*</span> </label>
                        <Calendar v-model="form.end_date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" required />
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                    <InputNumber v-model="form.total_amount" class="w-full" mode="currency" currency="KES" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select status" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea v-model="form.description" class="w-full" rows="3" placeholder="Enter budget description" />
                </div>
            </form>

            <template #footer>
                <div class="flex justify-end space-x-3">
                    <Button label="Cancel" severity="secondary" @click="closeDialog" />
                    <Button :label="isEdit ? 'Update' : 'Create'" @click="saveBudget" :loading="saving" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
