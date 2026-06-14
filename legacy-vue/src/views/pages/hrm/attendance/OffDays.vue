<script setup>
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const items = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ employee: '', date: '', reason: '' });

const fetchItems = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listOffDays();
        items.value = data.results || data;
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { employee: '', date: '', reason: '' };
    showDialog.value = true;
};

const createItem = async () => {
    saving.value = true;
    try {
        await employeeService.createOffDay(form.value);
        showDialog.value = false;
        await fetchItems();
    } finally {
        saving.value = false;
    }
};

onMounted(fetchItems);
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Off Days</h2>
            <Button label="New Off Day" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="items" :loading="loading" dataKey="id" class="w-full">
            <Column field="employee" header="Employee" />
            <Column field="date" header="Date" />
            <Column field="reason" header="Reason" />
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Create Off Day" :modal="true" :style="{ width: '28rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Employee ID</label>
                    <InputText v-model="form.employee" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Date</label>
                    <InputText v-model="form.date" placeholder="YYYY-MM-DD" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Reason</label>
                    <InputText v-model="form.reason" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createItem" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
