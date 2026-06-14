<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const jobs = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ title: '', department: '', status: 'open' });

const fetchJobs = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listJobs();
        jobs.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load jobs', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { title: '', department: '', status: 'open' };
    showDialog.value = true;
};

const createJob = async () => {
    if (!form.value.title?.trim()) {
        showToast('warning', 'Warning', 'Job title is required', 3000);
        return;
    }
    
    saving.value = true;
    try {
        await employeeService.createJob(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Job created successfully', 3000);
        await fetchJobs();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create job', 3000);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchJobs();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Job Postings</h2>
            <Button label="New Job" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="jobs" :loading="loading" dataKey="id" class="w-full">
            <Column field="title" header="Title" />
            <Column field="department" header="Department" />
            <Column field="status" header="Status" />
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Create Job" :modal="true" :style="{ width: '32rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Title</label>
                    <InputText v-model="form.title" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Department</label>
                    <InputText v-model="form.department" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Status</label>
                    <InputText v-model="form.status" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createJob" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
