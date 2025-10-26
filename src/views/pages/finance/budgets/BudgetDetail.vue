<template>
    <div class="space-y-6">
        <!-- Breadcrumb -->
        <PageBreadcrumb
            :customBreadcrumbs="[
                { label: 'Finance', to: '/finance' },
                { label: 'Budget Management', to: '/finance/budgets' },
                { label: budget?.name || 'Budget Details' }
            ]"
        />

        <!-- Header -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ budget?.name || 'Budget Details' }}</h1>
                <p class="text-gray-600">Manage budget lines and track spending</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
                <Button
                    icon="pi pi-plus"
                    label="Add Budget Line"
                    @click="openLineDialog"
                    class="p-button-primary"
                />
                <Button
                    icon="pi pi-arrow-left"
                    label="Back to Budgets"
                    @click="goBack"
                    severity="secondary"
                />
            </div>
        </div>

        <!-- Budget Summary -->
        <Card v-if="budget">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ formatDate(budget.start_date) }}</div>
                        <div class="text-sm text-gray-600">Start Date</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">{{ formatDate(budget.end_date) }}</div>
                        <div class="text-sm text-gray-600">End Date</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">{{ budget.lines?.length || lines.length }}</div>
                        <div class="text-sm text-gray-600">Budget Lines</div>
                    </div>
                    <div class="text-center">
                        <Tag
                            :value="budget.status"
                            :severity="getStatusSeverity(budget.status)"
                            class="text-lg"
                        />
                        <div class="text-sm text-gray-600 mt-1">Status</div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Budget Lines Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="lines"
                    :loading="loadingLines"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[10, 20, 50]"
                    class="p-datatable-sm"
                    stripedRows
                    responsiveLayout="scroll"
                >
                    <Column field="category" header="Category" sortable>
                        <template #body="{ data }">
                            <span class="font-medium">{{ data.category }}</span>
                        </template>
                    </Column>

                    <Column field="name" header="Name" sortable>
                        <template #body="{ data }">
                            <div class="font-medium text-gray-900">{{ data.name }}</div>
                            <div class="text-sm text-gray-500">{{ data.notes }}</div>
                        </template>
                    </Column>

                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-bold text-lg">{{ formatCurrency(data.amount) }}</span>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="flex space-x-2">
                                <Button
                                    icon="pi pi-pencil"
                                    severity="secondary"
                                    size="small"
                                    @click="editLine(data)"
                                    v-tooltip.top="'Edit Line'"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    size="small"
                                    @click="deleteLine(data.id)"
                                    v-tooltip.top="'Delete Line'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Add/Edit Budget Line Dialog -->
        <Dialog
            v-model:visible="showLineDialog"
            :modal="true"
            :header="isEditLine ? 'Edit Budget Line' : 'Add Budget Line'"
            :style="{ width: '40rem' }"
            @update:visible="closeLineDialog"
        >
            <form @submit.prevent="saveLine" class="space-y-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">
                        Category <span class="text-red-500">*</span>
                    </label>
                    <InputText
                        v-model="lineForm.category"
                        class="w-full"
                        placeholder="Enter category"
                        required
                    />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">
                        Name <span class="text-red-500">*</span>
                    </label>
                    <InputText
                        v-model="lineForm.name"
                        class="w-full"
                        placeholder="Enter line name"
                        required
                    />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Amount</label>
                    <InputNumber
                        v-model="lineForm.amount"
                        class="w-full"
                        mode="currency"
                        currency="KES"
                        :minFractionDigits="2"
                        :maxFractionDigits="2"
                        placeholder="0.00"
                    />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Notes</label>
                    <Textarea
                        v-model="lineForm.notes"
                        class="w-full"
                        rows="3"
                        placeholder="Enter additional notes"
                    />
                </div>
            </form>

            <template #footer>
                <div class="flex justify-end space-x-3">
                    <Button label="Cancel" severity="secondary" @click="closeLineDialog" />
                    <Button
                        :label="isEditLine ? 'Update' : 'Create'"
                        @click="saveLine"
                        :loading="savingLine"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

// State
const budget = ref(null);
const lines = ref([]);
const loading = ref(false);
const loadingLines = ref(false);
const showLineDialog = ref(false);
const savingLine = ref(false);
const isEditLine = ref(false);
const editingLineId = ref(null);

// Form data
const lineForm = reactive({
    category: '',
    name: '',
    amount: 0,
    notes: ''
});

// Methods
const fetchBudget = async () => {
    loading.value = true;
    try {
        const response = await financeService.getBudget(id);
        budget.value = response.data;
    } catch (error) {
        console.error('Error fetching budget:', error);
        showToast('error', 'Failed to load budget details');
    } finally {
        loading.value = false;
    }
};

const fetchLines = async () => {
    loadingLines.value = true;
    try {
        // Note: This endpoint might need to be implemented in the backend
        // For now, we'll use a placeholder or handle the case where it doesn't exist
        const response = await financeService.getBudgetLines ? 
            financeService.getBudgetLines({ budget: id }) : 
            Promise.resolve({ data: [] });
        lines.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error fetching budget lines:', error);
        showToast('error', 'Failed to load budget lines');
        lines.value = [];
    } finally {
        loadingLines.value = false;
    }
};

const openLineDialog = () => {
    isEditLine.value = false;
    editingLineId.value = null;
    resetLineForm();
    showLineDialog.value = true;
};

const editLine = (line) => {
    isEditLine.value = true;
    editingLineId.value = line.id;
    Object.assign(lineForm, {
        category: line.category || '',
        name: line.name || '',
        amount: line.amount || 0,
        notes: line.notes || ''
    });
    showLineDialog.value = true;
};

const saveLine = async () => {
    if (!lineForm.category.trim() || !lineForm.name.trim()) {
        showToast('error', 'Category and name are required');
        return;
    }

    savingLine.value = true;
    try {
        if (isEditLine.value) {
            // Note: This endpoint might need to be implemented in the backend
            if (financeService.updateBudgetLine) {
                await financeService.updateBudgetLine(editingLineId.value, lineForm);
                showToast('success', 'Budget line updated successfully');
            } else {
                showToast('info', 'Update functionality not yet implemented');
            }
        } else {
            // Note: This endpoint might need to be implemented in the backend
            if (financeService.createBudgetLine) {
                await financeService.createBudgetLine({ ...lineForm, budget: id });
                showToast('success', 'Budget line created successfully');
            } else {
                showToast('info', 'Create functionality not yet implemented');
            }
        }
        closeLineDialog();
        await fetchLines();
    } catch (error) {
        console.error('Error saving budget line:', error);
        showToast('error', `Failed to ${isEditLine.value ? 'update' : 'create'} budget line`);
    } finally {
        savingLine.value = false;
    }
};

const deleteLine = async (lineId) => {
    if (!confirm('Are you sure you want to delete this budget line?')) return;

    try {
        // Note: This endpoint might need to be implemented in the backend
        if (financeService.deleteBudgetLine) {
            await financeService.deleteBudgetLine(lineId);
            showToast('success', 'Budget line deleted successfully');
        } else {
            showToast('info', 'Delete functionality not yet implemented');
        }
        await fetchLines();
    } catch (error) {
        console.error('Error deleting budget line:', error);
        showToast('error', 'Failed to delete budget line');
    }
};

const closeLineDialog = () => {
    showLineDialog.value = false;
    resetLineForm();
};

const resetLineForm = () => {
    Object.assign(lineForm, {
        category: '',
        name: '',
        amount: 0,
        notes: ''
    });
};

const goBack = () => {
    router.push('/finance/budgets');
};

// Utility functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount || 0);
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
onMounted(async () => {
    await fetchBudget();
    await fetchLines();
});
</script>

<style scoped></style>


