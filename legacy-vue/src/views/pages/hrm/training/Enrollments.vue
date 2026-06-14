<script setup>
import { useToast } from '@/composables/useToast';
import { trainingService } from '@/services/hrm/trainingService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();
const enrollments = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ employee: '', course: '', enrollment_date: '' });

const fetchEnrollments = async () => {
    loading.value = true;
    try {
        const { data } = await trainingService.listEnrollments();
        enrollments.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load enrollments', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { employee: '', course: '', enrollment_date: '' };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const isFormValid = () => {
    if (!form.value.employee || !form.value.course) {
        showToast('warning', 'Warning', 'Employee and Course are required', 3000);
        return false;
    }
    return true;
};

const saveEnrollment = async () => {
    saving.value = true;
    try {
        if (!isFormValid()) return;
        await trainingService.createEnrollment(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Enrollment created successfully', 3000);
        await fetchEnrollments();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create enrollment', 5000);
    } finally {
        saving.value = false;
    }
};

const removeEnrollment = async (id) => {
    try {
        await trainingService.deleteEnrollment(id);
        await fetchEnrollments();
        showToast('success', 'Success', 'Enrollment deleted successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to delete enrollment', 5000);
    }
};

const confirmDelete = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this enrollment?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => removeEnrollment(id)
    });
};

const setEnrollmentStatus = async (enrollment, action) => {
    try {
        if (action === 'complete') await trainingService.completeEnrollment(enrollment.id);
        else await trainingService.cancelEnrollment(enrollment.id);
        await fetchEnrollments();
        showToast('success', 'Success', `Enrollment ${action === 'complete' ? 'completed' : 'cancelled'}`, 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || `Failed to ${action} enrollment`, 5000);
    }
};

const statusSeverity = (s) => ({ enrolled: 'info', completed: 'success', cancelled: 'danger' }[s] || 'secondary');

onMounted(() => {
    fetchEnrollments();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Training Enrollments</h2>
            <Button label="New Enrollment" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="enrollments" :loading="loading" dataKey="id" class="w-full">
            <Column field="employee.name" header="Employee" />
            <Column field="course.title" header="Course" />
            <Column field="enrollment_date" header="Enrollment Date" />
            <Column header="Status">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="statusSeverity(data.status)" />
                </template>
            </Column>
            <Column header="Actions">
                <template #body="{ data }">
                    <Button v-if="data.status === 'enrolled'" label="Complete" size="small" text severity="success" @click="setEnrollmentStatus(data, 'complete')" />
                    <Button v-if="data.status === 'enrolled'" label="Cancel" size="small" text severity="warning" @click="setEnrollmentStatus(data, 'cancel')" />
                    <Button label="Delete" size="small" text severity="danger" @click="confirmDelete(data.id)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Enrollment" :modal="true" :style="{ width: '28rem' }">
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
                    <label class="block mb-1">Enrollment Date (YYYY-MM-DD)</label>
                    <InputText v-model="form.enrollment_date" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                <Button label="Create" @click="saveEnrollment" :loading="saving" />
            </template>
        </Dialog>
    </div>
    <Toast />
    <ConfirmDialog />
</template>

<style scoped></style>
