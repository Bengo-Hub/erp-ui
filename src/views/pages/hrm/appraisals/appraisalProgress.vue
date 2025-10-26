<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { format } from 'date-fns';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const router = useRouter();

const loading = ref(true);
const appraisals = ref([]);
const timelineEvents = ref([]);

const statusCounts = computed(() => {
    const counts = {
        draft: { count: 0, label: 'Draft' },
        in_progress: { count: 0, label: 'In Progress' },
        submitted: { count: 0, label: 'Submitted' },
        under_review: { count: 0, label: 'Under Review' },
        approved: { count: 0, label: 'Approved' },
        rejected: { count: 0, label: 'Rejected' }
    };

    appraisals.value.forEach((appraisal) => {
        counts[appraisal.status].count++;
    });

    return counts;
});

const totalAppraisals = computed(() => {
    return appraisals.value.length;
});

onMounted(async () => {
    await Promise.all([fetchAppraisals(), fetchTimelineEvents()]);
});

const fetchAppraisals = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getAppraisals();
        appraisals.value = response.data;
    } catch (error) {
        console.error('Error fetching appraisals:', error);
        showToast('error', 'Error', 'Failed to fetch appraisals', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchTimelineEvents = async () => {
    try {
        const response = await appraisalService.getTimelineEvents();
        timelineEvents.value = response.data;
    } catch (error) {
        console.error('Failed to fetch timeline events:', error);
        showToast('error', 'Error', 'Failed to fetch timeline events', 3000);
    }
};

const calculateProgress = (appraisal) => {
    if (!appraisal.responses?.length) return 0;

    const totalQuestions = appraisal.template?.questions?.length || 0;
    const answeredQuestions = appraisal.responses.filter((r) => r.response || r.rating).length;

    return (answeredQuestions / totalQuestions) * 100;
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
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/appraisals')" />
                    <Button label="Appraisal Progress" severity="primary" text />
                </template>
            </Toolbar>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Progress Overview -->
            <Card>
                <template #title>Progress Overview</template>
                <template #content>
                    <div class="grid grid-cols-4 gap-4">
                        <div v-for="(status, key) in statusCounts" :key="key" class="p-4 border rounded">
                            <div class="text-2xl font-bold">{{ status.count }}</div>
                            <div class="text-sm text-gray-500">{{ status.label }}</div>
                            <ProgressBar :value="(status.count / totalAppraisals) * 100" :showValue="false" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Appraisal Progress -->
            <Card>
                <template #title>Appraisal Progress</template>
                <template #content>
                    <DataTable :value="appraisals" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm">
                        <Column field="employee.name" header="Employee" sortable />
                        <Column field="cycle.name" header="Cycle" sortable />
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                            </template>
                        </Column>
                        <Column field="progress" header="Progress">
                            <template #body="{ data }">
                                <ProgressBar :value="calculateProgress(data)" :showValue="true" />
                            </template>
                        </Column>
                        <Column field="due_date" header="Due Date" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.due_date) }}
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

            <!-- Timeline -->
            <Card>
                <template #title>Timeline</template>
                <template #content>
                    <Timeline :value="timelineEvents">
                        <template #content="{ item }">
                            <div class="mb-2">
                                <div class="font-bold">{{ item.title }}</div>
                                <div class="text-sm text-gray-500">{{ formatDate(item.date) }}</div>
                                <p>{{ item.description }}</p>
                            </div>
                        </template>
                    </Timeline>
                </template>
            </Card>
        </div>
    </div>
</template>
