<script setup>
import procurementService from '@/services/procurement/procurementService';
import { onMounted, ref } from 'vue';

const filters = ref({ supplier: '', start_date: '', end_date: '' });
const records = ref([]);
const loading = ref(false);
const loadingCompute = ref(false);

const fetchList = async () => {
    loading.value = true;
    try {
        const { data } = await procurementService.listSupplierPerformance();
        records.value = data.results || data;
    } finally {
        loading.value = false;
    }
};

const compute = async () => {
    loadingCompute.value = true;
    try {
        const { supplier, start_date, end_date } = filters.value;
        await procurementService.computeSupplierPerformance(supplier, start_date, end_date);
        await fetchList();
    } finally {
        loadingCompute.value = false;
    }
};

onMounted(fetchList);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-semibold mb-4">Supplier Performance</h2>
        <div class="grid grid-cols-4 gap-3 mb-4">
            <div>
                <label class="block mb-1">Supplier ID</label>
                <InputText v-model="filters.supplier" class="w-full" />
            </div>
            <div>
                <label class="block mb-1">Start Date</label>
                <InputText v-model="filters.start_date" placeholder="YYYY-MM-DD" class="w-full" />
            </div>
            <div>
                <label class="block mb-1">End Date</label>
                <InputText v-model="filters.end_date" placeholder="YYYY-MM-DD" class="w-full" />
            </div>
            <div class="flex items-end">
                <Button label="Compute" icon="pi pi-refresh" @click="compute" :loading="loadingCompute" />
            </div>
        </div>

        <DataTable :value="records" :loading="loading" dataKey="id" class="w-full">
            <Column field="supplier" header="Supplier" />
            <Column field="period_start" header="Start" />
            <Column field="period_end" header="End" />
            <Column field="on_time_delivery_rate" header="On-time %" />
            <Column field="total_spend" header="Total Spend" />
        </DataTable>
    </div>
</template>

<style scoped></style>
