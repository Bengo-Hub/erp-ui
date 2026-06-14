<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { appraisalService } from '@/services/hrm/appraisalService';
import { employeeService } from '@/services/hrm/employeeService';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);

const { workflows, loadBasics } = useAppraisalData();
const selectedWorkflow = ref(null);
const workflowDialog = ref(false);
const workflowFilter = ref('');
const workflow = ref({
    name: '',
    description: '',
    is_active: true
});

const stageDialog = ref(false);
const selectedStage = ref(null);
const stage = ref({
    name: '',
    description: '',
    order: 1,
    is_required: true,
    approval_required: false,
    auto_approve: false
});

const approversDialog = ref(false);
const employees = ref([]);
const selectedEmployee = ref(null);
const stageApprovers = ref([]);

const fetchWorkflows = async () => {
    try {
        loading.value = true;
        await loadBasics();
    } catch (error) {
        console.error('Error fetching workflows:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch workflows. Please try again later.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees({ limit: 100 });
        employees.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch employees. Please try again later.', life: 3000 });
    }
};

const showWorkflowDialog = () => {
    workflow.value = {
        name: '',
        description: '',
        is_active: true
    };
    workflowDialog.value = true;
};

const editWorkflow = (workflowData) => {
    workflow.value = { ...workflowData };
    workflowDialog.value = true;
};

const saveWorkflow = async () => {
    try {
        loading.value = true;
        if (workflow.value.id) {
            await appraisalService.updateWorkflow(workflow.value.id, workflow.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Workflow updated successfully',
                life: 3000
            });
        } else {
            await appraisalService.createWorkflow(workflow.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Workflow created successfully',
                life: 3000
            });
        }
        workflowDialog.value = false;
        await fetchWorkflows();
    } catch (error) {
        console.error('Error saving workflow:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save workflow. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteWorkflow = (workflowData) => {
    confirm.require({
        message: 'Are you sure you want to delete this workflow?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteWorkflow(workflowData.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Workflow deleted successfully',
                    life: 3000
                });
                await fetchWorkflows();
            } catch (error) {
                console.error('Error deleting workflow:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to delete workflow. Please try again later.',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        }
    });
};

const showStageDialog = () => {
    stage.value = {
        name: '',
        description: '',
        order: 1,
        is_required: true,
        approval_required: false,
        auto_approve: false
    };
    stageDialog.value = true;
};

const editStage = (stageData) => {
    stage.value = { ...stageData };
    stageDialog.value = true;
};

const saveStage = async () => {
    try {
        loading.value = true;
        if (stage.value.id) {
            await appraisalService.updateStage(selectedWorkflow.value.id, stage.value.id, stage.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage updated successfully',
                life: 3000
            });
        } else {
            await appraisalService.createStage(selectedWorkflow.value.id, stage.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage created successfully',
                life: 3000
            });
        }
        stageDialog.value = false;
        await fetchWorkflows();
    } catch (error) {
        console.error('Error saving stage:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save stage. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteStage = (stageData) => {
    confirm.require({
        message: 'Are you sure you want to delete this stage?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteStage(selectedWorkflow.value.id, stageData.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Stage deleted successfully',
                    life: 3000
                });
                await fetchWorkflows();
            } catch (error) {
                console.error('Error deleting stage:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to delete stage. Please try again later.',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        }
    });
};

const manageApprovers = async (stageData) => {
    selectedStage.value = stageData;
    try {
        loading.value = true;
        const response = await appraisalService.getStageApprovers(selectedWorkflow.value.id, stageData.id);
        stageApprovers.value = response.data;
        approversDialog.value = true;
    } catch (error) {
        console.error('Error fetching approvers:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to fetch approvers. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const addApprover = async () => {
    if (!selectedEmployee.value) return;
    try {
        loading.value = true;
        await appraisalService.addStageApprover(selectedWorkflow.value.id, selectedStage.value.id, {
            employee_id: selectedEmployee.value,
            is_primary: false
        });
        await manageApprovers(selectedStage.value);
        selectedEmployee.value = null;
    } catch (error) {
        console.error('Error adding approver:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to add approver. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const updatePrimaryApprover = async (approverData) => {
    try {
        loading.value = true;
        await appraisalService.updateStageApprover(selectedWorkflow.value.id, selectedStage.value.id, approverData.id, {
            is_primary: approverData.is_primary
        });
        await manageApprovers(selectedStage.value);
    } catch (error) {
        console.error('Error updating approver:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to update approver. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const removeApprover = async (approverData) => {
    try {
        loading.value = true;
        await appraisalService.deleteStageApprover(selectedWorkflow.value.id, selectedStage.value.id, approverData.id);
        await manageApprovers(selectedStage.value);
    } catch (error) {
        console.error('Error removing approver:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to remove approver. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([fetchWorkflows(), fetchEmployees()]);
});
</script>

<template>
    <div class="workflow-management">
        <div class="grid">
            <!-- Workflow List -->
            <div class="col-12">
                <Card>
                    <template #title>Appraisal Workflows</template>
                    <template #content>
                        <DataTable :value="workflows" :paginator="true" :rows="10" v-model:selection="selectedWorkflow" selectionMode="single" dataKey="id" :loading="loading">
                            <template #header>
                                <div class="flex justify-content-between">
                                    <Button label="New Workflow" icon="pi pi-plus" @click="showWorkflowDialog" />
                                    <span class="p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="workflowFilter" placeholder="Search workflows..." />
                                    </span>
                                </div>
                            </template>

                            <Column field="name" header="Name" sortable />
                            <Column field="description" header="Description" sortable />
                            <Column field="is_active" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column field="stages.length" header="Stages" sortable />
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-text" @click="editWorkflow(data)" />
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteWorkflow(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Workflow Dialog -->
            <Dialog v-model:visible="workflowDialog" :style="{ width: '450px' }" header="Workflow Details" :modal="true">
                <form @submit.prevent="saveWorkflow" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="workflow.name" required />
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model="workflow.description" rows="3" />
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="is_active" v-model="workflow.is_active" :binary="true" />
                        <label for="is_active">Active</label>
                    </div>
                </form>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="workflowDialog = false" />
                    <Button type="submit" label="Save" icon="pi pi-check" />
                </template>
            </Dialog>

            <!-- Workflow Stages -->
            <div class="col-12" v-if="selectedWorkflow">
                <Card>
                    <template #title>Workflow Stages</template>
                    <template #content>
                        <DataTable :value="selectedWorkflow.stages" :paginator="true" :rows="10" v-model:selection="selectedStage" selectionMode="single" dataKey="id" :loading="loading">
                            <template #header>
                                <div class="flex justify-content-between">
                                    <Button label="Add Stage" icon="pi pi-plus" @click="showStageDialog" />
                                </div>
                            </template>

                            <Column field="name" header="Name" sortable />
                            <Column field="description" header="Description" sortable />
                            <Column field="order" header="Order" sortable />
                            <Column field="is_required" header="Required" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.is_required ? 'Yes' : 'No'" :severity="data.is_required ? 'success' : 'warning'" />
                                </template>
                            </Column>
                            <Column field="approval_required" header="Approval Required" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.approval_required ? 'Yes' : 'No'" :severity="data.approval_required ? 'success' : 'warning'" />
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-text" @click="editStage(data)" />
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteStage(data)" />
                                    <Button icon="pi pi-users" class="p-button-text" @click="manageApprovers(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Stage Dialog -->
            <Dialog v-model:visible="stageDialog" :style="{ width: '450px' }" header="Stage Details" :modal="true">
                <form @submit.prevent="saveStage" class="p-fluid">
                    <div class="field">
                        <label for="stageName">Name</label>
                        <InputText id="stageName" v-model="stage.name" required />
                    </div>
                    <div class="field">
                        <label for="stageDescription">Description</label>
                        <Textarea id="stageDescription" v-model="stage.description" rows="3" />
                    </div>
                    <div class="field">
                        <label for="order">Order</label>
                        <InputNumber id="order" v-model="stage.order" :min="1" required />
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="is_required" v-model="stage.is_required" :binary="true" />
                        <label for="is_required">Required</label>
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="approval_required" v-model="stage.approval_required" :binary="true" />
                        <label for="approval_required">Approval Required</label>
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="auto_approve" v-model="stage.auto_approve" :binary="true" />
                        <label for="auto_approve">Auto Approve</label>
                    </div>
                </form>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="stageDialog = false" />
                    <Button type="submit" label="Save" icon="pi pi-check" />
                </template>
            </Dialog>

            <!-- Approvers Dialog -->
            <Dialog v-model:visible="approversDialog" :style="{ width: '450px' }" header="Stage Approvers" :modal="true">
                <div class="field">
                    <label>Add Approver</label>
                    <div class="flex gap-2">
                        <Dropdown v-model="selectedEmployee" :options="employees" optionLabel="user.full_name" optionValue="id" placeholder="Select Employee" />
                        <Button icon="pi pi-plus" @click="addApprover" />
                    </div>
                </div>
                <DataTable :value="stageApprovers" class="mt-3">
                    <Column field="approver.user.full_name" header="Approver" />
                    <Column field="is_primary" header="Primary">
                        <template #body="{ data }">
                            <Checkbox v-model="data.is_primary" :binary="true" @change="updatePrimaryApprover(data)" />
                        </template>
                    </Column>
                    <Column :exportable="false" style="min-width: 4rem">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="removeApprover(data)" />
                        </template>
                    </Column>
                </DataTable>
                <template #footer>
                    <Button label="Close" icon="pi pi-times" class="p-button-text" @click="approversDialog = false" />
                </template>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
.workflow-management {
    padding: 1rem;
}

.field {
    margin-bottom: 1rem;
}

.field-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
}

.field-checkbox label {
    margin-left: 0.5rem;
}
</style>
