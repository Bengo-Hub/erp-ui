<script setup>
import { appraisalService } from '@/services/hrm/appraisalService';
import { employeeService } from '@/services/hrm/employeeService';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);

const employees = ref([]);
const appraisals = ref([]);
const assignmentForm = ref({ appraisal: null, evaluator: null });

onMounted(async () => {
    await fetchData();
});

const fetchData = async () => {
    try {
        loading.value = true;
        const [employeesRes, appraisalsRes] = await Promise.all([
            employeeService.getEmployees({ limit: 100 }),
            appraisalService.getAppraisals({ limit: 100 })
        ]);
        employees.value = employeesRes.data?.results || employeesRes.data || [];
        appraisals.value = appraisalsRes.data?.results || appraisalsRes.data || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const saveAssignment = async () => {
    try {
        loading.value = true;
        if (!assignmentForm.value.appraisal || !assignmentForm.value.evaluator) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Select appraisal and evaluator', life: 3000 });
            return;
        }
        await appraisalService.updateAppraisal(assignmentForm.value.appraisal, { evaluator: assignmentForm.value.evaluator });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Evaluator assigned', life: 3000 });
        assignmentForm.value = { appraisal: null, evaluator: null };
        await fetchData();
    } catch (error) {
        console.error('Error saving assignment:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save assignment.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteGroup = (group) => {
    confirm.require({
        message: 'Are you sure you want to delete this group?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteEvaluatorGroup(group.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Group deleted successfully',
                    life: 3000
                });
                await fetchData();
            } catch (error) {
                console.error('Error deleting group:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to delete group. Please try again later.',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        }
    });
};

const confirmDeleteAssignment = (assignment) => {
    confirm.require({
        message: 'Are you sure you want to delete this assignment?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteEvaluatorAssignment(assignment.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Assignment deleted successfully',
                    life: 3000
                });
                await fetchData();
            } catch (error) {
                console.error('Error deleting assignment:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to delete assignment. Please try again later.',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        }
    });
};

const getStatusSeverity = (status) => {
    const severityMap = {
        active: 'success',
        pending: 'warning',
        completed: 'info',
        cancelled: 'danger'
    };
    return severityMap[status] || 'info';
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/appraisals')" />
                    <Button label="Evaluator Configuration" severity="primary" text />
                </template>
            </Toolbar>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Evaluator Groups -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Evaluator Groups</span>
                        <Button icon="pi pi-plus" class="p-button-text" @click="showGroupModal = true" />
                    </div>
                </template>
                <template #content>
                    <DataTable :value="evaluatorGroups" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm" responsiveLayout="scroll">
                        <template #empty>
                            <div class="text-center p-4">
                                <i class="pi pi-info-circle text-2xl mb-2" />
                                <p>No evaluator groups found</p>
                            </div>
                        </template>
                        <Column field="name" header="Name" sortable />
                        <Column field="auto_assign" header="Auto Assign">
                            <template #body="{ data }">
                                <Checkbox v-model="data.auto_assign" binary disabled />
                            </template>
                        </Column>
                        <Column field="required" header="Required">
                            <template #body="{ data }">
                                <Checkbox v-model="data.required" binary disabled />
                            </template>
                        </Column>
                        <Column field="min_evaluators" header="Min" sortable />
                        <Column field="max_evaluators" header="Max" sortable />
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-text" @click="editGroup(data)" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteGroup(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Evaluator Assignments -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Evaluator Assignments</span>
                        <Button icon="pi pi-plus" class="p-button-text" @click="showAssignmentModal = true" />
                    </div>
                </template>
                <template #content>
                    <DataTable :value="evaluatorAssignments" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm" responsiveLayout="scroll">
                        <template #empty>
                            <div class="text-center p-4">
                                <i class="pi pi-info-circle text-2xl mb-2" />
                                <p>No evaluator assignments found</p>
                            </div>
                        </template>
                        <Column field="employee.name" header="Employee" sortable />
                        <Column field="group.name" header="Group" sortable />
                        <Column field="evaluator.name" header="Evaluator" sortable />
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-text" @click="editAssignment(data)" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteAssignment(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- Group Modal -->
        <Dialog v-model:visible="showGroupModal" modal header="Evaluator Group" :style="{ width: '90vw', maxWidth: '500px' }">
            <div class="space-y-4">
                <div class="field">
                    <label class="block mb-2">Name</label>
                    <InputText v-model="groupForm.name" class="w-full" />
                </div>
                <div class="field">
                    <label class="block mb-2">Description</label>
                    <Textarea v-model="groupForm.description" class="w-full" rows="3" />
                </div>
                <div class="field">
                    <Checkbox v-model="groupForm.auto_assign" :binary="true" inputId="auto_assign" />
                    <label for="auto_assign" class="ml-2">Auto Assign</label>
                </div>
                <div class="field">
                    <Checkbox v-model="groupForm.required" :binary="true" inputId="required" />
                    <label for="required" class="ml-2">Required</label>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label class="block mb-2">Min Evaluators</label>
                        <InputNumber v-model="groupForm.min_evaluators" class="w-full" />
                    </div>
                    <div class="field">
                        <label class="block mb-2">Max Evaluators</label>
                        <InputNumber v-model="groupForm.max_evaluators" class="w-full" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showGroupModal = false" />
                <Button label="Save" icon="pi pi-check" @click="saveGroup" />
            </template>
        </Dialog>

        <!-- Assignment Modal -->
        <Dialog v-model:visible="showAssignmentModal" modal header="Evaluator Assignment" :style="{ width: '90vw', maxWidth: '500px' }">
            <div class="space-y-4">
                <div class="field">
                    <label class="block mb-2">Employee</label>
                    <Dropdown v-model="assignmentForm.employee_id" :options="employees" optionLabel="name" optionValue="id" class="w-full" />
                </div>
                <div class="field">
                    <label class="block mb-2">Group</label>
                    <Dropdown v-model="assignmentForm.group_id" :options="evaluatorGroups" optionLabel="name" optionValue="id" class="w-full" />
                </div>
                <div class="field">
                    <label class="block mb-2">Evaluator</label>
                    <Dropdown v-model="assignmentForm.evaluator_id" :options="evaluators" optionLabel="name" optionValue="id" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showAssignmentModal = false" />
                <Button label="Save" icon="pi pi-check" @click="saveAssignment" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}

@media (max-width: 640px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
