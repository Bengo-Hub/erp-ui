<script setup>
import { useToast } from '@/composables/useToast';
import { trainingService } from '@/services/hrm/trainingService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();
const evaluations = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ employee: '', course: '', score: '', feedback: '' });

const fetchEvaluations = async () => {
    loading.value = true;
    try {
        const { data } = await trainingService.listEvaluations();
        evaluations.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load evaluations', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { employee: '', course: '', score: '', feedback: '' };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const isFormValid = () => {
    if (!form.value.employee || !form.value.course || !form.value.score) {
        showToast('warning', 'Warning', 'Employee, Course and Score are required', 3000);
        return false;
    }
    return true;
};

const saveEvaluation = async () => {
    saving.value = true;
    try {
        if (!isFormValid()) return;
        await trainingService.createEvaluation(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Evaluation created successfully', 3000);
        await fetchEvaluations();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create evaluation', 5000);
    } finally {
        saving.value = false;
    }
};

const removeEvaluation = async (id) => {
    try {
        await trainingService.deleteEvaluation(id);
        await fetchEvaluations();
        showToast('success', 'Success', 'Evaluation deleted successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to delete evaluation', 5000);
    }
};

const confirmDelete = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this evaluation?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => removeEvaluation(id)
    });
};

onMounted(() => {
    fetchEvaluations();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Training Evaluations</h2>
            <Button label="New Evaluation" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="evaluations" :loading="loading" dataKey="id" class="w-full">
            <Column field="employee.name" header="Employee" />
            <Column field="course.title" header="Course" />
            <Column field="score" header="Score" />
            <Column field="feedback" header="Feedback" />
            <Column header="Actions">
                <template #body="{ data }">
                    <Button label="Delete" size="small" severity="danger" @click="confirmDelete(data.id)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Evaluation" :modal="true" :style="{ width: '32rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Employee ID</label>
                    <InputText v-model="form.employee" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Course ID</label>
                    <InputText v-model="form.course" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Score</label>
                    <InputText v-model="form.score" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Feedback</label>
                    <InputText v-model="form.feedback" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                <Button label="Create" @click="saveEvaluation" :loading="saving" />
            </template>
        </Dialog>
    </div>
    <Toast />
    <ConfirmDialog />
</template>

<style scoped></style>
