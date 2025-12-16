<script setup>
import { useToast } from '@/composables/useToast';
import { customerService } from '@/services/crm/customerService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const stages = ref([]);
const deals = ref([]);
const loading = ref(false);
const columns = 4;

// Fetch data from backend
const fetchData = async () => {
    loading.value = true;
    try {
        const [stagesResponse, dealsResponse] = await Promise.all([customerService.listStages(), customerService.listDeals()]);

        stages.value = stagesResponse.results || stagesResponse || [];
        deals.value = dealsResponse.results || dealsResponse || [];

        // Sort stages by order
        stages.value.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('Error fetching pipeline data:', error);
        showToast('error', 'Failed to load pipeline data');
        stages.value = [];
        deals.value = [];
    } finally {
        loading.value = false;
    }
};

// Group deals by stage
const groupedDeals = computed(() => {
    const map = {};
    stages.value.forEach((stage) => {
        map[stage.id] = [];
    });

    deals.value.forEach((deal) => {
        const stageId = deal.stage?.id || deal.stage;
        if (map[stageId]) {
            map[stageId].push(deal);
        }
    });

    return map;
});

// Move deal to next stage
const moveDeal = async (deal) => {
    try {
        const currentStage = stages.value.find((s) => s.id === (deal.stage?.id || deal.stage));
        if (!currentStage) return;

        const nextStage = stages.value.find((s) => s.order > currentStage.order);
        if (!nextStage) {
            showToast('info', 'Deal is already at the final stage');
            return;
        }

        await customerService.moveDeal(deal.id, nextStage.id);

        showToast('success', `Deal moved to ${nextStage.name}`);

        await fetchData();
    } catch (error) {
        console.error('Error moving deal:', error);
        showToast('error', 'Failed to move deal');
    }
};

// Get stage color
const getStageColor = (stage) => {
    if (stage.is_won) return 'success';
    if (stage.is_lost) return 'danger';
    return 'info';
};

onMounted(fetchData);
</script>

<template>
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Sales Pipeline</h2>
            <Button icon="pi pi-refresh" label="Refresh" @click="fetchData" :loading="loading" class="p-button-outlined" />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <span class="ml-3 text-lg text-muted-color">Loading pipeline data...</span>
        </div>

        <!-- Pipeline Board -->
        <div v-else-if="stages.length > 0" class="grid gap-6" :class="`grid-cols-${Math.min(columns, stages.length)}`">
            <Card v-for="stage in stages" :key="stage.id" class="pipeline-stage">
                <template #title>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Tag :value="stage.name" :severity="getStageColor(stage)" class="font-semibold" />
                            <span class="text-sm text-muted-color"> ({{ groupedDeals[stage.id]?.length || 0 }}) </span>
                        </div>
                    </div>
                </template>

                <template #content>
                    <div class="space-y-3">
                        <div v-if="!groupedDeals[stage.id] || groupedDeals[stage.id].length === 0" class="text-center py-8 text-muted-color">No deals in this stage</div>

                        <div v-for="deal in groupedDeals[stage.id] || []" :key="deal.id" class="border rounded-lg p-4 bg-surface-50 dark:bg-surface-800 hover:shadow-md transition-shadow">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="font-medium text-surface-900 dark:text-surface-0">
                                        {{ deal.title }}
                                    </div>
                                    <div class="text-sm font-semibold text-green-600">
                                        {{ formatCurrency(deal.amount) }}
                                    </div>
                                </div>

                                <div class="text-xs text-muted-color">
                                    <div>Contact: {{ deal.contact?.user?.first_name }} {{ deal.contact?.user?.last_name }}</div>
                                    <div>Close: {{ formatDate(deal.close_date) }}</div>
                                </div>

                                <div class="flex gap-2 pt-2">
                                    <Button label="Move Next" size="small" @click="moveDeal(deal)" :disabled="stage.order >= stages.length" class="p-button-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
            <div class="text-6xl text-muted-color mb-4">
                <i class="pi pi-sitemap"></i>
            </div>
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Pipeline Stages Found</h3>
            <p class="text-muted-color mb-4">Create pipeline stages to start managing your sales deals</p>
            <Button label="Create Stage" icon="pi pi-plus" @click="$router.push('/crm/pipeline/stages')" class="p-button-primary" />
        </div>
    </div>
</template>

<style scoped>
.pipeline-stage {
    min-height: 400px;
}

.pipeline-stage :deep(.p-card-content) {
    padding: 1rem;
}
</style>
