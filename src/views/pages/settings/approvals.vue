<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Loading states
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const savingStep = ref(false);
const deletingStep = ref(false);
const loadingWorkflow = ref(false);

// Data
const workflows = ref([]);
const users = ref([]);
const selectedWorkflow = ref(null);
const dt = ref();

// Dialogs
const workflowDialog = ref(false);
const deleteDialog = ref(false);
const stepDialog = ref(false);
const viewDialog = ref(false);
const deleteStepDialog = ref(false);
const workflowToDelete = ref(null);
const stepToDelete = ref(null);

// Form data
const workflowForm = ref({
    id: null,
    name: '',
    workflow_type: 'general',
    description: '',
    requires_multiple_approvals: false,
    approval_order_matters: true,
    auto_approve_on_threshold: false,
    approval_threshold: null,
    is_active: true
});

const stepForm = ref({
    id: null,
    workflow: null,
    step_number: 1,
    name: '',
    approver_type: 'user',
    approver_user: null,
    approver_role: '',
    approver_department: '',
    is_required: true,
    can_delegate: false,
    auto_approve: false
});

// Options
const workflowTypeOptions = [
    { label: 'Purchase Order', value: 'purchase_order', icon: 'pi pi-shopping-cart' },
    { label: 'Expense', value: 'expense', icon: 'pi pi-wallet' },
    { label: 'Invoice', value: 'invoice', icon: 'pi pi-file' },
    { label: 'Leave Request', value: 'leave_request', icon: 'pi pi-calendar' },
    { label: 'Overtime', value: 'overtime', icon: 'pi pi-clock' },
    { label: 'Payroll', value: 'payroll', icon: 'pi pi-money-bill' },
    { label: 'Contract', value: 'contract', icon: 'pi pi-file-edit' },
    { label: 'Requisition', value: 'requisition', icon: 'pi pi-list' },
    { label: 'General', value: 'general', icon: 'pi pi-cog' }
];

const approverTypeOptions = [
    { label: 'Specific User', value: 'user', icon: 'pi pi-user' },
    { label: 'Role', value: 'role', icon: 'pi pi-users' },
    { label: 'Department Head', value: 'department_head', icon: 'pi pi-building' },
    { label: 'Manager', value: 'manager', icon: 'pi pi-briefcase' },
    { label: 'Business Owner', value: 'owner', icon: 'pi pi-crown' }
];

const roleOptions = [
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'HR Manager', value: 'hr_manager' },
    { label: 'Finance Manager', value: 'finance_manager' },
    { label: 'Director', value: 'director' },
    { label: 'CEO', value: 'ceo' },
    { label: 'CFO', value: 'cfo' },
    { label: 'COO', value: 'coo' }
];

// Filters
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    workflow_type: { value: null, matchMode: 'equals' },
    is_active: { value: null, matchMode: 'equals' }
});

// Computed
const activeWorkflows = computed(() => workflows.value.filter(w => w.is_active));
const inactiveWorkflows = computed(() => workflows.value.filter(w => !w.is_active));

// Methods
onMounted(async () => {
    await Promise.all([fetchWorkflows(), fetchUsers()]);
    loading.value = false;
});

async function fetchWorkflows() {
    try {
        const response = await systemConfigService.getApprovalSettings();
        workflows.value = response.results || response || [];
    } catch (error) {
        showToast('error', 'Failed to load approval workflows');
        console.error('Error fetching workflows:', error);
    }
}

async function fetchUsers() {
    try {
        const response = await systemConfigService.getHodUsers();
        users.value = (response.results || response || []).map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim() || user.username,
            email: user.email,
            label: `${user.first_name} ${user.last_name}`.trim() || user.username
        }));
    } catch (error) {
        showToast('error', 'Failed to load users');
        console.error('Error fetching users:', error);
    }
}

function openNewWorkflow() {
    workflowForm.value = {
        id: null,
        name: '',
        workflow_type: 'general',
        description: '',
        requires_multiple_approvals: false,
        approval_order_matters: true,
        auto_approve_on_threshold: false,
        approval_threshold: null,
        is_active: true
    };
    workflowDialog.value = true;
}

function editWorkflow(workflow) {
    workflowForm.value = {
        id: workflow.id,
        name: workflow.name,
        workflow_type: workflow.workflow_type,
        description: workflow.description || '',
        requires_multiple_approvals: workflow.requires_multiple_approvals,
        approval_order_matters: workflow.approval_order_matters,
        auto_approve_on_threshold: workflow.auto_approve_on_threshold,
        approval_threshold: workflow.approval_threshold,
        is_active: workflow.is_active
    };
    workflowDialog.value = true;
}

async function viewWorkflow(workflow) {
    viewDialog.value = true;
    loadingWorkflow.value = true;
    selectedWorkflow.value = null;

    try {
        // Fetch full workflow details including steps
        const response = await systemConfigService.getApprovalById(workflow.id);
        selectedWorkflow.value = response.data || response;
    } catch (error) {
        console.error('Error fetching workflow details:', error);
        // Fallback to the list data if fetch fails
        selectedWorkflow.value = workflow;
        showToast('warn', 'Could not load full workflow details');
    } finally {
        loadingWorkflow.value = false;
    }
}

async function saveWorkflow() {
    if (!workflowForm.value.name) {
        showToast('warn', 'Please enter a workflow name');
        return;
    }

    saving.value = true;
    try {
        const payload = {
            name: workflowForm.value.name,
            workflow_type: workflowForm.value.workflow_type,
            description: workflowForm.value.description,
            requires_multiple_approvals: workflowForm.value.requires_multiple_approvals,
            approval_order_matters: workflowForm.value.approval_order_matters,
            auto_approve_on_threshold: workflowForm.value.auto_approve_on_threshold,
            approval_threshold: workflowForm.value.approval_threshold,
            is_active: workflowForm.value.is_active
        };

        if (workflowForm.value.id) {
            await systemConfigService.updateApprovalSetting(workflowForm.value.id, payload);
            showToast('success', 'Workflow updated successfully');
        } else {
            await systemConfigService.createApprovalSetting(payload);
            showToast('success', 'Workflow created successfully');
        }

        workflowDialog.value = false;
        await fetchWorkflows();
    } catch (error) {
        showToast('error', 'Failed to save workflow');
        console.error('Error saving workflow:', error);
    } finally {
        saving.value = false;
    }
}

function confirmDelete(workflow) {
    workflowToDelete.value = workflow;
    deleteDialog.value = true;
}

async function deleteWorkflow() {
    if (!workflowToDelete.value) return;

    deleting.value = true;
    try {
        await systemConfigService.deleteApprovalSetting(workflowToDelete.value.id);
        showToast('success', 'Workflow deleted successfully');
        deleteDialog.value = false;
        workflowToDelete.value = null;
        await fetchWorkflows();
    } catch (error) {
        showToast('error', 'Failed to delete workflow');
        console.error('Error deleting workflow:', error);
    } finally {
        deleting.value = false;
    }
}

async function toggleWorkflowStatus(workflow) {
    try {
        await systemConfigService.updateApprovalSetting(workflow.id, {
            is_active: !workflow.is_active
        });
        showToast('success', `Workflow ${workflow.is_active ? 'deactivated' : 'activated'} successfully`);
        await fetchWorkflows();
    } catch (error) {
        showToast('error', 'Failed to update workflow status');
    }
}

function getWorkflowTypeIcon(type) {
    const option = workflowTypeOptions.find(o => o.value === type);
    return option?.icon || 'pi pi-cog';
}

function getWorkflowTypeLabel(type) {
    const option = workflowTypeOptions.find(o => o.value === type);
    return option?.label || type;
}

function getApproverTypeLabel(type) {
    const option = approverTypeOptions.find(o => o.value === type);
    return option?.label || type;
}

function getStatusSeverity(isActive) {
    return isActive ? 'success' : 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(dateString));
}

function exportCSV() {
    dt.value.exportCSV();
}

function refreshData() {
    loading.value = true;
    fetchWorkflows().finally(() => {
        loading.value = false;
    });
}

// Step Management Functions
function openAddStep(workflow) {
    selectedWorkflow.value = workflow;
    const maxStep = workflow.steps?.length ? Math.max(...workflow.steps.map(s => s.step_number)) : 0;
    stepForm.value = {
        id: null,
        workflow: workflow.id,
        step_number: maxStep + 1,
        name: '',
        approver_type: 'user',
        approver_user: null,
        approver_role: '',
        approver_department: '',
        is_required: true,
        can_delegate: false,
        auto_approve: false
    };
    stepDialog.value = true;
}

function editStep(step) {
    stepForm.value = {
        id: step.id,
        workflow: step.workflow,
        step_number: step.step_number,
        name: step.name,
        approver_type: step.approver_type || 'user',
        approver_user: step.approver_user,
        approver_role: step.approver_role || '',
        approver_department: step.approver_department || '',
        is_required: step.is_required,
        can_delegate: step.can_delegate,
        auto_approve: step.auto_approve
    };
    stepDialog.value = true;
}

async function saveStep() {
    if (!stepForm.value.name) {
        showToast('warn', 'Please enter a step name');
        return;
    }

    if (stepForm.value.approver_type === 'user' && !stepForm.value.approver_user) {
        showToast('warn', 'Please select an approver');
        return;
    }

    if (stepForm.value.approver_type === 'role' && !stepForm.value.approver_role) {
        showToast('warn', 'Please select a role');
        return;
    }

    savingStep.value = true;
    try {
        const payload = {
            workflow: stepForm.value.workflow,
            step_number: stepForm.value.step_number,
            name: stepForm.value.name,
            approver_type: stepForm.value.approver_type,
            approver_user: stepForm.value.approver_type === 'user' ? stepForm.value.approver_user : null,
            approver_role: stepForm.value.approver_type === 'role' ? stepForm.value.approver_role : '',
            approver_department: stepForm.value.approver_department || '',
            is_required: stepForm.value.is_required,
            can_delegate: stepForm.value.can_delegate,
            auto_approve: stepForm.value.auto_approve
        };

        if (stepForm.value.id) {
            await systemConfigService.updateApprovalStep(stepForm.value.id, payload);
            showToast('success', 'Step updated successfully');
        } else {
            await systemConfigService.createApprovalStep(payload);
            showToast('success', 'Step added successfully');
        }

        stepDialog.value = false;
        await fetchWorkflows();

        // Refresh the selected workflow in view dialog if open (need to re-fetch full details with steps)
        if (viewDialog.value && selectedWorkflow.value) {
            try {
                const response = await systemConfigService.getApprovalById(selectedWorkflow.value.id);
                selectedWorkflow.value = response.data || response;
            } catch (err) {
                console.error('Error refreshing workflow:', err);
            }
        }
    } catch (error) {
        showToast('error', 'Failed to save step');
        console.error('Error saving step:', error);
    } finally {
        savingStep.value = false;
    }
}

function confirmDeleteStep(step) {
    stepToDelete.value = step;
    deleteStepDialog.value = true;
}

async function deleteStep() {
    if (!stepToDelete.value) return;

    deletingStep.value = true;
    try {
        await systemConfigService.deleteApprovalStep(stepToDelete.value.id);
        showToast('success', 'Step deleted successfully');
        deleteStepDialog.value = false;
        stepToDelete.value = null;
        await fetchWorkflows();

        // Refresh the selected workflow in view dialog if open (need to re-fetch full details with steps)
        if (viewDialog.value && selectedWorkflow.value) {
            try {
                const response = await systemConfigService.getApprovalById(selectedWorkflow.value.id);
                selectedWorkflow.value = response.data || response;
            } catch (err) {
                console.error('Error refreshing workflow:', err);
            }
        }
    } catch (error) {
        showToast('error', 'Failed to delete step');
        console.error('Error deleting step:', error);
    } finally {
        deletingStep.value = false;
    }
}

function getUserName(userId) {
    const user = users.value.find(u => u.id === userId);
    return user?.name || user?.label || 'Unknown';
}
</script>

<template>
    <div class="approval-settings">
        <!-- Header -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Approval Workflows</h1>
                <p class="text-surface-600 dark:text-surface-400 mt-1 mb-0">
                    Configure approval workflows for different business processes
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <Button
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    @click="refreshData"
                    :loading="loading"
                    v-tooltip.bottom="'Refresh'"
                />
                <Button
                    icon="pi pi-download"
                    label="Export"
                    severity="secondary"
                    outlined
                    @click="exportCSV"
                />
                <Button
                    icon="pi pi-plus"
                    label="New Workflow"
                    @click="openNewWorkflow"
                />
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <i class="pi pi-check-circle text-xl text-primary"></i>
                    </div>
                    <div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm mb-1">Total Workflows</p>
                        <p class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ workflows.length }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <i class="pi pi-play text-xl text-green-500"></i>
                    </div>
                    <div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm mb-1">Active</p>
                        <p class="text-2xl font-bold text-green-500 m-0">{{ activeWorkflows.length }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-surface-500/10 flex items-center justify-center">
                        <i class="pi pi-pause text-xl text-surface-500"></i>
                    </div>
                    <div>
                        <p class="text-surface-600 dark:text-surface-400 text-sm mb-1">Inactive</p>
                        <p class="text-2xl font-bold text-surface-500 m-0">{{ inactiveWorkflows.length }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <div class="card">
            <DataTable
                ref="dt"
                :value="workflows"
                :loading="loading"
                v-model:filters="filters"
                filterDisplay="menu"
                :globalFilterFields="['name', 'workflow_type', 'description']"
                paginator
                :rows="10"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} workflows"
                responsiveLayout="scroll"
                stripedRows
                showGridlines
                class="p-datatable-sm"
            >
                <template #header>
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="Search workflows..." class="w-full md:w-80" />
                        </IconField>
                        <div class="flex gap-2">
                            <Select
                                v-model="filters['workflow_type'].value"
                                :options="workflowTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Types"
                                class="w-full md:w-48"
                                showClear
                            />
                            <Select
                                v-model="filters['is_active'].value"
                                :options="[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Status"
                                class="w-full md:w-36"
                                showClear
                            />
                        </div>
                    </div>
                </template>

                <template #empty>
                    <div class="text-center py-8">
                        <i class="pi pi-inbox text-4xl text-surface-400 mb-4"></i>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">No approval workflows found</p>
                        <Button icon="pi pi-plus" label="Create First Workflow" @click="openNewWorkflow" />
                    </div>
                </template>

                <Column field="name" header="Workflow Name" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <i :class="getWorkflowTypeIcon(data.workflow_type)" class="text-primary"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-surface-900 dark:text-surface-0 m-0">{{ data.name }}</p>
                                <p class="text-xs text-surface-500 m-0">{{ getWorkflowTypeLabel(data.workflow_type) }}</p>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="total_steps" header="Steps" sortable style="min-width: 80px">
                    <template #body="{ data }">
                        <Badge :value="data.total_steps || data.steps?.length || 0" severity="info" />
                    </template>
                </Column>

                <Column field="requires_multiple_approvals" header="Multi-Approval" style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag
                            :value="data.requires_multiple_approvals ? 'Yes' : 'No'"
                            :severity="data.requires_multiple_approvals ? 'success' : 'secondary'"
                        />
                    </template>
                </Column>

                <Column field="is_active" header="Status" sortable style="min-width: 100px">
                    <template #body="{ data }">
                        <Tag
                            :value="data.is_active ? 'Active' : 'Inactive'"
                            :severity="getStatusSeverity(data.is_active)"
                        />
                    </template>
                </Column>

                <Column field="created_at" header="Created" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <span class="text-sm text-surface-600 dark:text-surface-400">{{ formatDate(data.created_at) }}</span>
                    </template>
                </Column>

                <Column header="Actions" style="min-width: 180px" frozen alignFrozen="right">
                    <template #body="{ data }">
                        <div class="flex gap-1">
                            <Button
                                icon="pi pi-eye"
                                severity="info"
                                text
                                rounded
                                @click="viewWorkflow(data)"
                                v-tooltip.bottom="'View Details'"
                            />
                            <Button
                                icon="pi pi-pencil"
                                severity="secondary"
                                text
                                rounded
                                @click="editWorkflow(data)"
                                v-tooltip.bottom="'Edit'"
                            />
                            <Button
                                :icon="data.is_active ? 'pi pi-pause' : 'pi pi-play'"
                                :severity="data.is_active ? 'warn' : 'success'"
                                text
                                rounded
                                @click="toggleWorkflowStatus(data)"
                                v-tooltip.bottom="data.is_active ? 'Deactivate' : 'Activate'"
                            />
                            <Button
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                rounded
                                @click="confirmDelete(data)"
                                v-tooltip.bottom="'Delete'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Create/Edit Workflow Dialog -->
        <Dialog
            v-model:visible="workflowDialog"
            :header="workflowForm.id ? 'Edit Workflow' : 'Create New Workflow'"
            modal
            :style="{ width: '600px' }"
            :breakpoints="{ '768px': '95vw' }"
            class="p-fluid"
        >
            <div class="grid gap-4">
                <div class="col-12">
                    <label for="name" class="font-semibold mb-2 block">Workflow Name *</label>
                    <InputText
                        id="name"
                        v-model="workflowForm.name"
                        placeholder="e.g., Purchase Order Approval"
                        class="w-full"
                        :invalid="!workflowForm.name && saving"
                    />
                </div>

                <div class="col-12">
                    <label for="workflow_type" class="font-semibold mb-2 block">Workflow Type *</label>
                    <Select
                        id="workflow_type"
                        v-model="workflowForm.workflow_type"
                        :options="workflowTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select type"
                        class="w-full"
                    >
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i :class="option.icon"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="col-12">
                    <label for="description" class="font-semibold mb-2 block">Description</label>
                    <Textarea
                        id="description"
                        v-model="workflowForm.description"
                        rows="3"
                        placeholder="Describe the purpose of this workflow..."
                        class="w-full"
                    />
                </div>

                <div class="col-12">
                    <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg space-y-3">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-3">Workflow Settings</h4>

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Multiple Approvals Required</p>
                                <p class="text-sm text-surface-500 m-0">Require all steps to be approved</p>
                            </div>
                            <ToggleSwitch v-model="workflowForm.requires_multiple_approvals" />
                        </div>

                        <Divider />

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Approval Order Matters</p>
                                <p class="text-sm text-surface-500 m-0">Steps must be approved in sequence</p>
                            </div>
                            <ToggleSwitch v-model="workflowForm.approval_order_matters" />
                        </div>

                        <Divider />

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Auto-Approve Below Threshold</p>
                                <p class="text-sm text-surface-500 m-0">Skip approval for amounts below threshold</p>
                            </div>
                            <ToggleSwitch v-model="workflowForm.auto_approve_on_threshold" />
                        </div>

                        <div v-if="workflowForm.auto_approve_on_threshold" class="mt-3">
                            <label class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Threshold Amount (KES)</label>
                            <InputNumber
                                v-model="workflowForm.approval_threshold"
                                mode="currency"
                                currency="KES"
                                locale="en-KE"
                                class="w-full"
                            />
                        </div>

                        <Divider />

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Active</p>
                                <p class="text-sm text-surface-500 m-0">Enable this workflow</p>
                            </div>
                            <ToggleSwitch v-model="workflowForm.is_active" />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" outlined @click="workflowDialog = false" :disabled="saving" />
                    <Button label="Save Workflow" icon="pi pi-check" @click="saveWorkflow" :loading="saving" />
                </div>
            </template>
        </Dialog>

        <!-- View Workflow Dialog -->
        <Dialog
            v-model:visible="viewDialog"
            :header="selectedWorkflow?.name || 'Workflow Details'"
            modal
            :style="{ width: '700px' }"
            :breakpoints="{ '768px': '95vw' }"
        >
            <div v-if="loadingWorkflow" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>
            <div v-else-if="selectedWorkflow" class="space-y-6">
                <!-- Workflow Info -->
                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-surface-500 mb-1">Type</p>
                            <div class="flex items-center gap-2">
                                <i :class="getWorkflowTypeIcon(selectedWorkflow.workflow_type)" class="text-primary"></i>
                                <span class="font-medium">{{ getWorkflowTypeLabel(selectedWorkflow.workflow_type) }}</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-surface-500 mb-1">Status</p>
                            <Tag
                                :value="selectedWorkflow.is_active ? 'Active' : 'Inactive'"
                                :severity="getStatusSeverity(selectedWorkflow.is_active)"
                            />
                        </div>
                        <div>
                            <p class="text-sm text-surface-500 mb-1">Multiple Approvals</p>
                            <span class="font-medium">{{ selectedWorkflow.requires_multiple_approvals ? 'Yes' : 'No' }}</span>
                        </div>
                        <div>
                            <p class="text-sm text-surface-500 mb-1">Order Matters</p>
                            <span class="font-medium">{{ selectedWorkflow.approval_order_matters ? 'Yes' : 'No' }}</span>
                        </div>
                    </div>
                    <div v-if="selectedWorkflow.description" class="mt-4">
                        <p class="text-sm text-surface-500 mb-1">Description</p>
                        <p class="text-surface-900 dark:text-surface-0 m-0">{{ selectedWorkflow.description }}</p>
                    </div>
                </div>

                <!-- Approval Steps -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-2">
                            <i class="pi pi-list"></i>
                            Approval Steps ({{ selectedWorkflow.steps?.length || 0 }})
                        </h4>
                        <Button
                            icon="pi pi-plus"
                            label="Add Step"
                            size="small"
                            outlined
                            @click="openAddStep(selectedWorkflow)"
                        />
                    </div>
                    <div v-if="selectedWorkflow.steps?.length" class="space-y-2">
                        <div
                            v-for="step in selectedWorkflow.steps"
                            :key="step.id"
                            class="flex items-center gap-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg group"
                        >
                            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {{ step.step_number }}
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">{{ step.name }}</p>
                                <p class="text-sm text-surface-500 m-0">
                                    {{ getApproverTypeLabel(step.approver_type) }}
                                    <span v-if="step.approver_role"> - {{ step.approver_role }}</span>
                                    <span v-if="step.approver_user_detail"> - {{ step.approver_user_detail.name }}</span>
                                    <span v-else-if="step.approver_user"> - {{ getUserName(step.approver_user) }}</span>
                                </p>
                            </div>
                            <div class="flex gap-2 items-center">
                                <Tag v-if="step.is_required" value="Required" severity="danger" />
                                <Tag v-if="step.can_delegate" value="Delegable" severity="info" />
                                <Tag v-if="step.auto_approve" value="Auto" severity="success" />
                                <div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        icon="pi pi-pencil"
                                        severity="secondary"
                                        text
                                        rounded
                                        size="small"
                                        @click="editStep(step)"
                                        v-tooltip.bottom="'Edit Step'"
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        rounded
                                        size="small"
                                        @click="confirmDeleteStep(step)"
                                        v-tooltip.bottom="'Delete Step'"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-6 text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <i class="pi pi-info-circle text-2xl mb-2"></i>
                        <p class="m-0 mb-3">No approval steps configured</p>
                        <Button
                            icon="pi pi-plus"
                            label="Add First Step"
                            size="small"
                            @click="openAddStep(selectedWorkflow)"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Close" severity="secondary" outlined @click="viewDialog = false" />
                    <Button label="Edit Workflow" icon="pi pi-pencil" @click="editWorkflow(selectedWorkflow); viewDialog = false" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Confirm Deletion"
            modal
            :style="{ width: '450px' }"
        >
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <div>
                    <p class="font-medium text-surface-900 dark:text-surface-0 mb-2">Delete "{{ workflowToDelete?.name }}"?</p>
                    <p class="text-sm text-surface-600 dark:text-surface-400 m-0">
                        This will permanently delete the workflow and all its approval steps.
                        This action cannot be undone.
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" outlined @click="deleteDialog = false" :disabled="deleting" />
                    <Button label="Delete" severity="danger" icon="pi pi-trash" @click="deleteWorkflow" :loading="deleting" />
                </div>
            </template>
        </Dialog>

        <!-- Add/Edit Step Dialog -->
        <Dialog
            v-model:visible="stepDialog"
            :header="stepForm.id ? 'Edit Approval Step' : 'Add Approval Step'"
            modal
            :style="{ width: '550px' }"
            :breakpoints="{ '768px': '95vw' }"
            class="p-fluid"
        >
            <div class="grid gap-4">
                <div class="col-12">
                    <label for="step_name" class="font-semibold mb-2 block">Step Name *</label>
                    <InputText
                        id="step_name"
                        v-model="stepForm.name"
                        placeholder="e.g., Manager Approval"
                        class="w-full"
                        :invalid="!stepForm.name && savingStep"
                    />
                </div>

                <div class="col-12 md:col-6">
                    <label for="step_number" class="font-semibold mb-2 block">Step Number</label>
                    <InputNumber
                        id="step_number"
                        v-model="stepForm.step_number"
                        :min="1"
                        class="w-full"
                    />
                </div>

                <div class="col-12 md:col-6">
                    <label for="approver_type" class="font-semibold mb-2 block">Approver Type *</label>
                    <Select
                        id="approver_type"
                        v-model="stepForm.approver_type"
                        :options="approverTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select type"
                        class="w-full"
                    >
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i :class="option.icon"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <div v-if="stepForm.approver_type === 'user'" class="col-12">
                    <label for="approver_user" class="font-semibold mb-2 block">Select Approver *</label>
                    <Select
                        id="approver_user"
                        v-model="stepForm.approver_user"
                        :options="users"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select a user"
                        class="w-full"
                        filter
                        :invalid="!stepForm.approver_user && savingStep"
                    />
                </div>

                <div v-if="stepForm.approver_type === 'role'" class="col-12">
                    <label for="approver_role" class="font-semibold mb-2 block">Select Role *</label>
                    <Select
                        id="approver_role"
                        v-model="stepForm.approver_role"
                        :options="roleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select a role"
                        class="w-full"
                        :invalid="!stepForm.approver_role && savingStep"
                    />
                </div>

                <div class="col-12">
                    <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg space-y-3">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-3">Step Options</h4>

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Required</p>
                                <p class="text-sm text-surface-500 m-0">This step must be completed</p>
                            </div>
                            <ToggleSwitch v-model="stepForm.is_required" />
                        </div>

                        <Divider />

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Can Delegate</p>
                                <p class="text-sm text-surface-500 m-0">Approver can delegate to another user</p>
                            </div>
                            <ToggleSwitch v-model="stepForm.can_delegate" />
                        </div>

                        <Divider />

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0 m-0">Auto Approve</p>
                                <p class="text-sm text-surface-500 m-0">Automatically approve after timeout</p>
                            </div>
                            <ToggleSwitch v-model="stepForm.auto_approve" />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" outlined @click="stepDialog = false" :disabled="savingStep" />
                    <Button :label="stepForm.id ? 'Update Step' : 'Add Step'" icon="pi pi-check" @click="saveStep" :loading="savingStep" />
                </div>
            </template>
        </Dialog>

        <!-- Delete Step Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteStepDialog"
            header="Confirm Deletion"
            modal
            :style="{ width: '450px' }"
        >
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <div>
                    <p class="font-medium text-surface-900 dark:text-surface-0 mb-2">Delete step "{{ stepToDelete?.name }}"?</p>
                    <p class="text-sm text-surface-600 dark:text-surface-400 m-0">
                        This will remove the approval step from the workflow.
                        Existing pending approvals may be affected.
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" outlined @click="deleteStepDialog = false" :disabled="deletingStep" />
                    <Button label="Delete" severity="danger" icon="pi pi-trash" @click="deleteStep" :loading="deletingStep" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.approval-settings {
    padding: 1.5rem;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
}

@media (max-width: 768px) {
    .approval-settings {
        padding: 1rem;
    }
}
</style>
