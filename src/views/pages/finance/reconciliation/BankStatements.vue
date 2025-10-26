<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref } from 'vue';

// Composables
const { toast } = useToast();

// Reactive data
const loading = ref(false);
const bankStatements = ref([]);

const summary = reactive({
    total_statements: 0,
    reconciled_count: 0,
    pending_count: 0,
    total_discrepancies: 0
});

// Methods
const loadData = async () => {
    loading.value = true;

    try {
        const response = await financeService.getBankStatements();
        bankStatements.value = response.data || [];
        calculateSummary();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load bank statements',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const calculateSummary = () => {
    const statements = bankStatements.value;
    summary.total_statements = statements.length;
    summary.reconciled_count = statements.filter((s) => s.status === 'reconciled').length;
    summary.pending_count = statements.filter((s) => s.status === 'pending').length;
    summary.total_discrepancies = statements.filter((s) => s.status === 'unreconciled').length;
};

const openNewStatement = () => {
    toast.add({
        severity: 'info',
        summary: 'Add Statement',
        detail: 'Add statement functionality will be implemented soon',
        life: 3000
    });
};

const viewStatement = (statement) => {
    toast.add({
        severity: 'info',
        summary: 'View Statement',
        detail: `Viewing statement for ${statement.bank_name}`,
        life: 3000
    });
};

const editStatement = (statement) => {
    toast.add({
        severity: 'info',
        summary: 'Edit Statement',
        detail: `Editing statement for ${statement.bank_name}`,
        life: 3000
    });
};

const deleteStatement = (statement) => {
    toast.add({
        severity: 'info',
        summary: 'Delete Statement',
        detail: `Deleting statement for ${statement.bank_name}`,
        life: 3000
    });
};

const getStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        reconciled: 'success',
        unreconciled: 'danger'
    };
    return severities[status] || 'info';
};

// Lifecycle
onMounted(async () => {
    await loadData();
});
</script>

<template>
    <div class="bank-reconciliation-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-bank text-primary mr-3"></i>
                        Bank Reconciliation
                    </h1>
                    <p class="page-subtitle">Reconcile your bank statements with internal records</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-plus" label="Add Statement" severity="success" @click="openNewStatement" />
                    <Button icon="pi pi-refresh" label="Refresh" severity="secondary" outlined :loading="loading" @click="loadData" />
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <Card class="summary-card total-card">
                <template #content>
                    <div class="card-content">
                        <div class="card-icon">
                            <i class="pi pi-file-text text-blue-500"></i>
                        </div>
                        <div class="card-details">
                            <h3 class="card-title">Total Statements</h3>
                            <p class="card-amount text-blue-600">
                                {{ summary.total_statements || 0 }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card reconciled-card">
                <template #content>
                    <div class="card-content">
                        <div class="card-icon">
                            <i class="pi pi-check-circle text-green-500"></i>
                        </div>
                        <div class="card-details">
                            <h3 class="card-title">Reconciled</h3>
                            <p class="card-amount text-green-600">
                                {{ summary.reconciled_count || 0 }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card pending-card">
                <template #content>
                    <div class="card-content">
                        <div class="card-icon">
                            <i class="pi pi-clock text-orange-500"></i>
                        </div>
                        <div class="card-details">
                            <h3 class="card-title">Pending</h3>
                            <p class="card-amount text-orange-600">
                                {{ summary.pending_count || 0 }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="summary-card discrepancy-card">
                <template #content>
                    <div class="card-content">
                        <div class="card-icon">
                            <i class="pi pi-exclamation-triangle text-red-500"></i>
                        </div>
                        <div class="card-details">
                            <h3 class="card-title">Discrepancies</h3>
                            <p class="card-amount text-red-600">
                                {{ summary.total_discrepancies || 0 }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Bank Statements Table -->
        <Card class="statements-card">
            <template #title>
                <div class="table-title">
                    <i class="pi pi-table mr-2"></i>
                    Bank Statements
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="bankStatements"
                    :loading="loading"
                    dataKey="id"
                    class="statements-table"
                    stripedRows
                    showGridlines
                    responsiveLayout="scroll"
                    :paginator="true"
                    :rows="20"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                >
                    <Column field="bank_name" header="Bank" sortable>
                        <template #body="{ data }">
                            <div class="bank-cell">
                                <i class="pi pi-bank mr-2 text-blue-500"></i>
                                <span class="bank-name">{{ data.bank_name || data.account_details?.name || 'Unknown Bank' }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="account_details.account_number" header="Account Number" sortable>
                        <template #body="{ data }">
                            <span class="account-number">{{ data.account_details?.account_number || 'N/A' }}</span>
                        </template>
                    </Column>

                    <Column field="statement_date" header="Statement Date" sortable>
                        <template #body="{ data }">
                            <span class="period-text">{{ formatDate(data.statement_date) }}</span>
                        </template>
                    </Column>

                    <Column field="description" header="Description" sortable>
                        <template #body="{ data }">
                            <span class="description-text">{{ data.description }}</span>
                        </template>
                    </Column>

                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="balance-amount" :class="{ 'text-green-600': data.amount > 0, 'text-red-600': data.amount < 0 }">
                                {{ formatCurrency(data.amount) }}
                            </span>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="action-buttons">
                                <Button icon="pi pi-eye" severity="info" text rounded @click="viewStatement(data)" />
                                <Button icon="pi pi-pencil" severity="warning" text rounded @click="editStatement(data)" />
                                <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteStatement(data)" />
                            </div>
                        </template>
                    </Column>

                    <template #empty>
                        <div class="empty-state">
                            <i class="pi pi-bank text-gray-400 text-4xl mb-4"></i>
                            <h3 class="empty-title">No bank statements found</h3>
                            <p class="empty-message">Add your first bank statement to get started</p>
                            <Button icon="pi pi-plus" label="Add Statement" @click="openNewStatement" />
                        </div>
                    </template>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.bank-reconciliation-dashboard {
    @apply p-6 space-y-6;
}

.dashboard-header {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.header-content {
    @apply p-6 flex justify-between items-center;
}

.title-section {
    @apply flex-1;
}

.page-title {
    @apply text-2xl font-bold text-gray-900 flex items-center;
}

.page-subtitle {
    @apply text-gray-600 mt-1;
}

.header-actions {
    @apply flex gap-3;
}

.summary-cards {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.summary-card {
    @apply bg-white shadow-sm border-0;
}

.card-content {
    @apply flex items-center space-x-4;
}

.card-icon {
    @apply text-2xl;
}

.card-details {
    @apply flex-1;
}

.card-title {
    @apply text-sm font-medium text-gray-600 mb-1;
}

.card-amount {
    @apply text-2xl font-bold mb-1;
}

.statements-card {
    @apply bg-white shadow-sm;
}

.table-title {
    @apply flex items-center text-lg font-semibold text-gray-900;
}

.statements-table {
    @apply w-full;
}

.bank-cell {
    @apply flex items-center;
}

.bank-name {
    @apply font-medium;
}

.account-number {
    @apply font-mono text-sm;
}

.period-text {
    @apply text-sm text-gray-600;
}

.balance-amount {
    @apply font-medium text-gray-900;
}

.action-buttons {
    @apply flex gap-1;
}

.empty-state {
    @apply flex flex-col items-center justify-center py-8;
}

.empty-title {
    @apply text-lg font-semibold text-gray-900 mb-2;
}

.empty-message {
    @apply text-gray-600 mb-4;
}

@media (max-width: 768px) {
    .header-content {
        @apply flex-col items-start space-y-4;
    }

    .header-actions {
        @apply w-full justify-end;
    }

    .summary-cards {
        @apply grid-cols-1;
    }
}
</style>
