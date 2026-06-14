<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const candidates = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ first_name: '', last_name: '', email: '' });

const fetchCandidates = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listCandidates();
        candidates.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load candidates', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { first_name: '', last_name: '', email: '' };
    showDialog.value = true;
};

const createCandidate = async () => {
    if (!form.value.first_name?.trim() || !form.value.last_name?.trim() || !form.value.email?.trim()) {
        showToast('warning', 'Warning', 'First name, last name, and email are required', 3000);
        return;
    }
    
    saving.value = true;
    try {
        await employeeService.createCandidate(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Candidate created successfully', 3000);
        await fetchCandidates();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create candidate', 3000);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchCandidates();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Candidates</h2>
            <Button label="New Candidate" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="candidates" :loading="loading" dataKey="id" class="w-full">
            <Column field="first_name" header="First Name" />
            <Column field="last_name" header="Last Name" />
            <Column field="email" header="Email" />
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Create Candidate" :modal="true" :style="{ width: '32rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">First Name</label>
                    <InputText v-model="form.first_name" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Last Name</label>
                    <InputText v-model="form.last_name" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Email</label>
                    <InputText v-model="form.email" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createCandidate" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
