<script setup>
import { formatCurrency } from '@/components/hrm/payroll/payslipGenerator';
import Spinner from '@/components/ui/Spinner.vue';
import { posService } from '@/services/ecommerce/posService';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { defineEmits, onMounted, ref } from 'vue';

const emit = defineEmits(['resumeSale', 'cancel']);
const toast = useToast();
const confirm = useConfirm();

// Data
const suspendedSales = ref([]);
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: 'contains' }
});

// Methods
const fetchSuspendedSales = async () => {
    loading.value = true;
    try {
        const response = await posService.getSuspendedSales();
        suspendedSales.value = response.data.suspended_sales.map((sale) => ({
            ...sale,
            customerName: sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name}` : 'Walk-in Customer',
            items_count: sale.items.length
        }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch suspended sales',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const resumeSale = (sale) => {
    emit('resumeSale', sale);
};

const confirmDelete = (sale) => {
    confirm.require({
        message: `Are you sure you want to delete the suspended sale "${sale.reference_number}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => {
            deleteSuspendedSale(sale.id);
        }
    });
};

const deleteSuspendedSale = async (id) => {
    loading.value = true;
    try {
        await posService.deleteSuspendedSale(id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Suspended sale deleted successfully',
            life: 3000
        });
        fetchSuspendedSales(); // Refresh the list
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to delete suspended sale',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Lifecycle hooks
onMounted(() => {
    fetchSuspendedSales();
});
</script>

<template>
    <div class="h-full flex flex-col">
        <DataTable
            :value="suspendedSales"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            responsiveLayout="scroll"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            stripedRows
            class="p-datatable-sm flex-grow"
        >
            <template #empty>
                <div class="text-center p-4">No suspended sales found.</div>
            </template>

            <template #loading>
                <div class="text-center p-4">Loading suspended sales...</div>
            </template>

            <Column field="reference_number" header="Reference" sortable>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Search by reference" />
                </template>
            </Column>

            <Column field="customerName" header="Customer" sortable>
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Search by customer" />
                </template>
            </Column>

            <Column field="created_at" header="Date" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                </template>
                <template #filter="{ filterModel, filterCallback }">
                    <Calendar v-model="filterModel.value" dateFormat="dd/mm/yy" @date-select="filterCallback()" placeholder="Search by date" />
                </template>
            </Column>

            <Column field="total_amount" header="Amount" sortable>
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.total_amount) }}
                </template>
            </Column>

            <Column field="items_count" header="Items" sortable />

            <Column field="note" header="Note">
                <template #body="slotProps">
                    <span :title="slotProps.data.note">{{ truncateText(slotProps.data.note, 30) }}</span>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-shopping-cart" class="p-button-sm p-button-rounded p-button-success" @click="resumeSale(slotProps.data)" title="Resume Sale" />
                        <Button icon="pi pi-trash" class="p-button-sm p-button-rounded p-button-danger" @click="confirmDelete(slotProps.data)" title="Delete" />
                    </div>
                </template>
            </Column>
        </DataTable>
        <Spinner :isLoading="loading" title="Loading suspended sales..." />
    </div>
</template>

<style scoped>
.h-full {
    height: 100%;
}

.flex-grow {
    flex-grow: 1;
}

:deep(.p-datatable) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.p-datatable-wrapper) {
    flex-grow: 1;
    overflow: auto;
}
</style>
