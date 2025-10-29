<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-semibold">Contracts</h2>
      <Button label="New Contract" icon="pi pi-plus" @click="openCreate" />
    </div>
    <DataTable :value="contracts" :loading="loading" dataKey="id" class="w-full">
      <Column field="title" header="Title" />
      <Column field="supplier" header="Supplier" :body="supplierCell" />
      <Column field="start_date" header="Start" />
      <Column field="end_date" header="End" />
      <Column field="value" header="Value" />
      <Column field="status" header="Status" />
      <Column header="Actions" :body="actions" />
    </DataTable>

    <Dialog v-model:visible="showDialog" header="Create Contract" :modal="true" :style="{ width: '36rem' }">
      <div class="space-y-3">
        <div>
          <label class="block mb-1">Title</label>
          <InputText v-model="form.title" class="w-full" />
        </div>
        <div>
          <label class="block mb-1">Supplier (ID)</label>
          <InputText v-model="form.supplier" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1">Start Date</label>
            <InputText v-model="form.start_date" placeholder="YYYY-MM-DD" class="w-full" />
          </div>
          <div>
            <label class="block mb-1">End Date</label>
            <InputText v-model="form.end_date" placeholder="YYYY-MM-DD" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block mb-1">Value</label>
          <InputText v-model="form.value" class="w-full" />
        </div>
        <div>
          <label class="block mb-1">Terms</label>
          <InputText v-model="form.terms" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" class="p-button-text" @click="showDialog=false" />
        <Button label="Create" @click="createContract" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import procurementService from '@/services/procurement/procurementService';

const contracts = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ title: '', supplier: '', start_date: '', end_date: '', value: '', terms: '' });

const fetchContracts = async () => {
  loading.value = true;
  try {
    const { data } = await procurementService.listContracts();
    contracts.value = data.results || data;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  form.value = { title: '', supplier: '', start_date: '', end_date: '', value: '', terms: '' };
  showDialog.value = true;
};

const createContract = async () => {
  saving.value = true;
  try {
    await procurementService.createContract(form.value);
    showDialog.value = false;
    await fetchContracts();
  } finally {
    saving.value = false;
  }
};

const supplierCell = (row) => row.supplier;

const actions = (row) => {
  return h('div', { class: 'flex gap-2' }, [
    h(Button, {
      label: 'Activate',
      size: 'small',
      onClick: () => changeStatus(row.id, 'activate')
    }),
    h(Button, {
      label: 'Terminate',
      size: 'small',
      severity: 'danger',
      onClick: () => changeStatus(row.id, 'terminate')
    })
  ]);
};

const changeStatus = async (id, action) => {
  if (action === 'activate') await procurementService.activateContract(id);
  if (action === 'terminate') await procurementService.terminateContract(id);
  await fetchContracts();
};

onMounted(fetchContracts);
</script>

<style scoped>
</style>


