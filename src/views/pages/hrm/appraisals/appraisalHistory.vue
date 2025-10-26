<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { format } from 'date-fns';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const router = useRouter();

const loading = ref(true);
const appraisals = ref([]);
const employees = ref([]);
const cycles = ref([]);

const filters = reactive({
    employee: null,
    cycle: null,
    dateRange: null
});

const chartData = computed(() => {
    const labels = appraisals.value.map((a) => format(new Date(a.from_date), 'MMM yyyy'));
    const ratings = appraisals.value.map((a) => a.final_rating || 0);

    return {
        labels,
        datasets: [
            {
                label: 'Performance Rating',
                data: ratings,
                fill: false,
                borderColor: '#42A5F5',
                tension: 0.4
            }
        ]
    };
});

const chartOptions = {
    plugins: {
        legend: {
            labels: {
                color: '#495057'
            }
        }
    },
    scales: {
        x: {
            ticks: {
                color: '#495057'
            },
            grid: {
                color: '#ebedef'
            }
        },
        y: {
            ticks: {
                color: '#495057'
            },
            grid: {
                color: '#ebedef'
            }
        }
    }
};

onMounted(async () => {
    await Promise.all([fetchAppraisals(), fetchEmployees(), fetchCycles()]);
});

const fetchAppraisals = async () => {
    try {
        loading.value = true;
        const params = {
            employee_id: filters.employee?.id,
            cycle_id: filters.cycle?.id,
            from_date: filters.dateRange?.[0],
            to_date: filters.dateRange?.[1]
        };
        const response = await appraisalService.getAppraisals(params);
        appraisals.value = response.data;
    } catch (error) {
        console.error('Error fetching appraisal history:', error);
        showToast('error', 'Error', 'Failed to fetch appraisal history', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchEmployees = async () => {
    try {
        const response = await appraisalService.getEmployees();
        employees.value = response.data;
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
    }
};

const fetchCycles = async () => {
    try {
        const response = await appraisalService.getCycles();
        cycles.value = response.data;
    } catch (error) {
        console.error('Failed to fetch cycles:', error);
    }
};

const loadAppraisals = () => {
    fetchAppraisals();
};

const resetFilters = () => {
    filters.employee = null;
    filters.cycle = null;
    filters.dateRange = null;
    loadAppraisals();
};

const getStatusSeverity = (status) => {
    const severityMap = {
        draft: 'info',
        in_progress: 'warning',
        submitted: 'info',
        under_review: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return severityMap[status] || 'info';
};

const viewAppraisal = (appraisal) => {
    router.push(`/hrm/appraisals/${appraisal.id}`);
};

const exportHistory = async () => {
    try {
        const response = await appraisalService.exportHistory(filters);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'appraisal_history.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        showToast('error', 'Error', 'Failed to export appraisal history', 3000);
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/appraisals')" />
                    <Button label="Appraisal History" severity="primary" text />
                </template>
                <template #end>
                    <Button icon="pi pi-download" label="Export" class="mr-2" @click="exportHistory" />
                </template>
            </Toolbar>
        </div>

        <!-- Filters -->
        <div class="mb-4 p-4 bg-white rounded-lg shadow-sm">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="field">
                    <label class="block mb-2">Employee</label>
                    <Dropdown v-model="filters.employee" :options="employees" optionLabel="name" placeholder="Select employee" class="w-full" />
                </div>
                <div class="field">
                    <label class="block mb-2">Cycle</label>
                    <Dropdown v-model="filters.cycle" :options="cycles" optionLabel="name" placeholder="Select cycle" class="w-full" />
                </div>
                <div class="field">
                    <label class="block mb-2">Date Range</label>
                    <Calendar v-model="filters.dateRange" selectionMode="range" :showIcon="true" placeholder="Select date range" class="w-full" />
                </div>
                <div class="flex items-end">
                    <Button icon="pi pi-filter" label="Apply Filters" class="p-button-sm mr-2" @click="loadAppraisals" />
                    <Button icon="pi pi-refresh" label="Reset" class="p-button-sm p-button-outlined" @click="resetFilters" />
                </div>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Appraisal History -->
            <Card>
                <template #title>Appraisal History</template>
                <template #content>
                    <DataTable :value="appraisals" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm">
                        <Column field="employee.name" header="Employee" sortable />
                        <Column field="cycle.name" header="Cycle" sortable />
                        <Column field="from_date" header="From" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.from_date) }}
                            </template>
                        </Column>
                        <Column field="to_date" header="To" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.to_date) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                            </template>
                        </Column>
                        <Column field="final_rating" header="Rating" sortable>
                            <template #body="{ data }">
                                <Rating v-if="data.final_rating" :modelValue="data.final_rating" :readonly="true" :cancel="false" />
                                <span v-else>-</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-text" @click="viewAppraisal(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Performance Trends -->
            <Card>
                <template #title>Performance Trends</template>
                <template #content>
                    <Chart type="line" :data="chartData" :options="chartOptions" />
                </template>
            </Card>
        </div>
    </div>
</template>
