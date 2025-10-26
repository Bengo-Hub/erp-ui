<script setup>
import { useToast } from '@/composables/useToast';
import { ref, onMounted } from 'vue';
import { financeService } from '@/services/finance/financeService';

const { showToast } = useToast();
const loading = ref(false);
const taxes = ref([]);
const dialogVisible = ref(false);
const edit = ref(false);
const form = ref({ id: null, name: '', rate: 0, code: '' });

const fetchTaxes = async () => {
    loading.value = true;
    try {
        const { data } = await financeService.getTaxRates();
        taxes.value = data.results || data;
    } catch (error) {
        console.error('Error fetching taxes:', error);
        showToast('error', 'Failed to fetch tax rates');
    } finally {
        loading.value = false;
    }
};

const openNew = () => {
    form.value = { id: null, name: '', rate: 0, code: '' };
    edit.value = false;
    dialogVisible.value = true;
};

const openEdit = (row) => {
    form.value = { id: row.id, name: row.name, rate: row.rate, code: row.code };
    edit.value = true;
    dialogVisible.value = true;
};

const save = async () => {
    if (!form.value.name.trim() || !form.value.code.trim()) {
        showToast('error', 'Name and code are required');
        return;
    }

    loading.value = true;
    try {
        if (edit.value && form.value.id) {
            await financeService.updateTaxRate(form.value.id, { 
                name: form.value.name, 
                rate: form.value.rate, 
                code: form.value.code 
            });
            showToast('success', 'Tax rate updated successfully');
        } else {
            await financeService.createTaxRate({ 
                name: form.value.name, 
                rate: form.value.rate, 
                code: form.value.code 
            });
            showToast('success', 'Tax rate created successfully');
        }
        dialogVisible.value = false;
        await fetchTaxes();
    } catch (error) {
        console.error('Error saving tax rate:', error);
        showToast('error', error?.response?.data?.message || 'Failed to save tax rate');
    } finally {
        loading.value = false;
    }
};

const deleteTax = async (tax) => {
    if (!confirm(`Are you sure you want to delete tax "${tax.name}"?`)) return;

    try {
        await financeService.deleteTaxRate(tax.id);
        showToast('success', 'Tax rate deleted successfully');
        await fetchTaxes();
    } catch (error) {
        console.error('Error deleting tax rate:', error);
        showToast('error', 'Failed to delete tax rate');
    }
};

onMounted(fetchTaxes);
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Tax Management</h1>
                <p class="text-gray-600">Manage tax rates and configurations</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
                <Button label="New Tax Rate" icon="pi pi-plus" @click="openNew" class="p-button-primary" />
                <Button icon="pi pi-refresh" label="Refresh" @click="fetchTaxes" :loading="loading" severity="secondary" />
            </div>
        </div>

        <!-- Tax Rates Table -->
        <Card>
            <template #content>
                <DataTable 
                    :value="taxes" 
                    :loading="loading" 
                    dataKey="id" 
                    class="w-full"
                    stripedRows
                    responsiveLayout="scroll"
                    :scrollable="true"
                    scrollHeight="400px"
                >
                    <Column field="name" header="Name" sortable>
                        <template #body="{ data }">
                            <div class="font-medium text-gray-900">{{ data.name }}</div>
                        </template>
                    </Column>
                    <Column field="code" header="Code" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.code" severity="info" />
                        </template>
                    </Column>
                    <Column field="rate" header="Rate (%)" sortable>
                        <template #body="{ data }">
                            <div class="text-right">
                                <span class="font-bold text-lg text-purple-600">{{ data.rate }}%</span>
                            </div>
                        </template>
                    </Column>
                    <Column header="Actions" :exportable="false" style="min-width: 10rem">
                        <template #body="{ data }">
                            <div class="flex space-x-2">
                                <Button icon="pi pi-pencil" severity="secondary" size="small" @click="openEdit(data)" v-tooltip.top="'Edit Tax Rate'" />
                                <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteTax(data)" v-tooltip.top="'Delete Tax Rate'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Tax Form Dialog -->
        <Dialog :visible="dialogVisible" :header="edit ? 'Edit Tax Rate' : 'New Tax Rate'" :modal="true" :style="{ width: '28rem' }" @update:visible="dialogVisible = $event">
            <form @submit.prevent="save" class="space-y-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Tax Name <span class="text-red-500">*</span></label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter tax name" required />
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Tax Code <span class="text-red-500">*</span></label>
                    <InputText v-model="form.code" class="w-full" placeholder="Enter tax code" required />
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Rate (%) <span class="text-red-500">*</span></label>
                    <InputNumber v-model="form.rate" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="4" class="w-full" placeholder="0.00" required />
                </div>
            </form>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <Button label="Cancel" severity="secondary" @click="dialogVisible = false" />
                    <Button :label="edit ? 'Update' : 'Create'" :loading="loading" icon="pi pi-check" @click="save" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>


