<script setup>
import { appraisalService } from '@/services/hrm/appraisalService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const loading = ref(false);
const config = ref({});
const ratingScales = ref([]);
const statusOptions = ref([]);

const fetchConfig = async () => {
    loading.value = true;
    try {
        const { data } = await appraisalService.getConfiguration();
        config.value = data;
        const [scalesRes, statusRes] = await Promise.all([appraisalService.getRatingScales(), appraisalService.getStatusOptions()]);
        ratingScales.value = scalesRes.data?.results || scalesRes.data || [];
        statusOptions.value = statusRes.data?.results || statusRes.data || [];
    } finally {
        loading.value = false;
    }
};

const saveConfig = async () => {
    loading.value = true;
    try {
        await appraisalService.updateConfiguration(config.value);
        toast.add({ severity: 'success', summary: 'Saved', detail: 'Configuration updated' });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e?.message || 'Save failed' });
    } finally {
        loading.value = false;
    }
};

onMounted(fetchConfig);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-semibold mb-3">HRM Appraisal Configuration</h2>
        <Card>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-1">Default Cycle Length (months)</label>
                        <InputNumber v-model="config.default_cycle_months" :min="1" :max="24" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-1">Require Self Review</label>
                        <InputSwitch v-model="config.require_self_review" />
                    </div>
                    <div>
                        <label class="block mb-1">Enable Goals</label>
                        <InputSwitch v-model="config.enable_goals" />
                    </div>
                    <div>
                        <label class="block mb-1">Default Rating Scale</label>
                        <InputText v-model="config.default_rating_scale" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block mb-1">Available Rating Scales</label>
                        <DataTable :value="ratingScales" dataKey="id" class="w-full">
                            <Column field="name" header="Name" />
                            <Column field="min" header="Min" />
                            <Column field="max" header="Max" />
                        </DataTable>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block mb-1">Status Options</label>
                        <div class="flex flex-wrap gap-2">
                            <Tag v-for="s in statusOptions" :key="s" :value="s" />
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <Button label="Save" :loading="loading" icon="pi pi-check" @click="saveConfig" />
            </template>
        </Card>
    </div>
</template>

<style scoped></style>
