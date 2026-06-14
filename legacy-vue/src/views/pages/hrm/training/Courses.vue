<script setup>
import { useToast } from '@/composables/useToast';
import { trainingService } from '@/services/hrm/trainingService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();
const courses = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const editing = ref(false);
const currentId = ref(null);
const form = ref({ title: '', description: '', start_date: '', end_date: '' });

const fetchCourses = async () => {
    loading.value = true;
    try {
        const { data } = await trainingService.listCourses();
        courses.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load courses', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    editing.value = false;
    currentId.value = null;
    form.value = { title: '', description: '', start_date: '', end_date: '' };
    showDialog.value = true;
};

const openEdit = (row) => {
    editing.value = true;
    currentId.value = row.id;
    form.value = { title: row.title, description: row.description, start_date: row.start_date, end_date: row.end_date };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const isFormValid = () => {
    if (!form.value.title?.trim()) {
        showToast('warning', 'Warning', 'Title is required', 3000);
        return false;
    }
    return true;
};

const saveCourse = async () => {
    saving.value = true;
    try {
        if (!isFormValid()) return;
        if (editing.value && currentId.value) {
            await trainingService.updateCourse(currentId.value, form.value);
            showToast('success', 'Success', 'Course updated successfully', 3000);
        } else {
            await trainingService.createCourse(form.value);
            showToast('success', 'Success', 'Course created successfully', 3000);
        }
        showDialog.value = false;
        await fetchCourses();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to save course', 5000);
    } finally {
        saving.value = false;
    }
};

const removeCourse = async (id) => {
    try {
        await trainingService.deleteCourse(id);
        await fetchCourses();
        showToast('success', 'Success', 'Course deleted successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to delete course', 5000);
    }
};

const confirmDelete = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this course?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => removeCourse(id)
    });
};

onMounted(() => {
    fetchCourses();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Training Courses</h2>
            <Button label="New Course" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="courses" :loading="loading" dataKey="id" class="w-full">
            <Column field="title" header="Title" />
            <Column field="description" header="Description" />
            <Column field="start_date" header="Start" />
            <Column field="end_date" header="End" />
            <Column header="Actions">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button label="Edit" size="small" @click="openEdit(data)" />
                        <Button label="Delete" size="small" severity="danger" @click="confirmDelete(data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Course" :modal="true" :style="{ width: '32rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Title</label>
                    <InputText v-model="form.title" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Description</label>
                    <InputText v-model="form.description" class="w-full" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block mb-1">Start Date (YYYY-MM-DD)</label>
                        <InputText v-model="form.start_date" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-1">End Date (YYYY-MM-DD)</label>
                        <InputText v-model="form.end_date" class="w-full" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                <Button :label="editing ? 'Update' : 'Create'" @click="saveCourse" :loading="saving" />
            </template>
        </Dialog>
        <Toast />
        <ConfirmDialog />
    </div>
</template>

<style scoped></style>
