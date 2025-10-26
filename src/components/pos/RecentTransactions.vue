<script setup>
import { POSService } from '@/services/ecommerce/posService';
import Receipt from '@/views/pages/ecommerce/pos/printReceipt.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

// Data
const recents = ref([]);
const receiptData = ref(null);
const currentPage = ref(1);
const perPage = ref(10);
const sortBy = ref('id');
const sortDesc = ref(false);
const filters = ref({});
const isLoading = ref(false);

// Computed
const groupedSales = computed(() => {
    const grouped = {};
    recents.value.forEach((sale) => {
        if (!grouped[sale.status]) {
            grouped[sale.status] = [];
        }
        grouped[sale.status].push(sale);
    });
    return grouped;
});

// Methods
const formatNumber = (value) => {
    return new Intl.NumberFormat().format(value);
};

const fetchRecents = async () => {
    isLoading.value = true;
    try {
        const response = await posService.getRecentSales();
        recents.value = response.data.sales || [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch recent sales',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const fetchReceiptData = async (id) => {
    try {
        const response = await posService.getSaleReceiptData({ id });
        receiptData.value = response.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message,
            life: 3000
        });
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
};

const deleteRecord = async (record) => {
    try {
        await posService.deleteSale(record.id);
        recents.value = recents.value.filter((item) => item.id !== record.id);
        toast.add({ severity: 'success', summary: 'Success', detail: `Sale #${record.sale_id} deleted.`, life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
};

const edit = (record) => {
    // Implement edit functionality here
    toast.add({ severity: 'info', summary: 'Edit', detail: `Editing Sale #${record.sale_id}`, life: 3000 });
};

// Lifecycle Hooks
onMounted(() => {
    fetchRecents();
});
</script>

<template>
    <div class="container mx-auto p-4">
        <Card>
            <TabView>
                <TabPanel v-for="(group, status) in groupedSales" :key="status" :header="status" :active="status === 'Final'">
                    <DataTable :value="group" :rows="perPage" :paginator="true" :currentPage="currentPage" :sortField="sortBy" :sortOrder="sortDesc ? -1 : 1" :filters="filters" :loading="isLoading" scrollable scrollHeight="300px">
                        <Column field="id" header="#" sortable>
                            <template #body="{ index }">
                                <span class="text-dark font-bold">{{ index + 1 }}</span>
                            </template>
                        </Column>
                        <Column field="sale_id" header="Sale ID" sortable>
                            <template #body="{ data }">
                                <div class="text-sm">{{ data.sale_id }} ({{ data.customer.name }})</div>
                            </template>
                        </Column>
                        <Column field="grand_total" header="Grand Total" sortable>
                            <template #body="{ data }">
                                <div class="text-sm">KSh.{{ formatNumber(data.grand_total) }}</div>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <div class="flex space-x-2">
                                    <Button icon="pi pi-pencil" class="p-button-text p-button-primary" @click="edit(data)" />
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="deleteRecord(data)" />
                                    <Button icon="pi pi-print" class="p-button-text p-button-secondary" @click="fetchReceiptData(data.id)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabView>
        </Card>

        <!-- Receipt Component -->
        <Receipt :sale="receiptData" @printReceipt="fetchReceiptData" />
    </div>
</template>

<style scoped>
/* Add custom styles here if needed */
</style>
