<template>
    <Card class="kpi-card shadow-md hover:shadow-lg transition-shadow">
        <template #header>
            <div class="bg-gradient-to-r p-4" :style="{ backgroundImage: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }">
                <div class="flex justify-between items-center text-white">
                    <h3 class="text-sm font-semibold">{{ title }}</h3>
                    <i :class="icon" class="text-2xl opacity-70"></i>
                </div>
            </div>
        </template>
        <template #content>
            <div class="kpi-content">
                <!-- Main Metric Value -->
                <div class="metric-value mb-3">
                    <div class="text-3xl font-bold" :style="{ color: colors.from }">
                        {{ formattedValue }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">{{ subtitle }}</div>
                </div>

                <!-- Trend Indicator -->
                <div v-if="trend !== null" class="trend-indicator mb-3">
                    <span 
                        class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                        :class="trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    >
                        <i :class="trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs"></i>
                        {{ Math.abs(trend) }}%
                    </span>
                    <span class="text-xs text-gray-600 ml-2">{{ trendLabel }}</span>
                </div>

                <!-- Sparkline Chart (if data provided) -->
                <div v-if="sparklineData && sparklineData.length > 0" class="sparkline-container">
                    <Chart type="line" :data="sparklineChartData" :options="sparklineChartOptions" class="h-12" />
                </div>

                <!-- Additional Info -->
                <div v-if="additionalInfo" class="additional-info mt-3 pt-3 border-t border-gray-200">
                    <div class="text-xs text-gray-600">{{ additionalInfo }}</div>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: [Number, String],
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: 'pi pi-chart-bar'
    },
    colors: {
        type: Object,
        default: () => ({ from: '#3b82f6', to: '#1e40af' })
    },
    trend: {
        type: Number,
        default: null
    },
    trendLabel: {
        type: String,
        default: 'vs previous period'
    },
    sparklineData: {
        type: Array,
        default: null
    },
    additionalInfo: {
        type: String,
        default: ''
    },
    formatter: {
        type: Function,
        default: (val) => val
    }
});

const formattedValue = computed(() => props.formatter(props.value));

const sparklineChartData = computed(() => ({
    labels: props.sparklineData?.map((_, i) => i + 1) || [],
    datasets: [
        {
            label: props.title,
            data: props.sparklineData || [],
            borderColor: props.colors.from,
            backgroundColor: `${props.colors.from}20`,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            borderWidth: 2
        }
    ]
}));

const sparklineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: { display: false },
        y: { display: false }
    }
};
</script>

<style scoped>
.kpi-card {
    min-height: 200px;
    display: flex;
    flex-direction: column;
}

.kpi-card :deep(.p-card) {
    display: flex;
    flex-direction: column;
}

.kpi-content {
    flex: 1;
}

.sparkline-container {
    height: 50px;
    margin-top: 8px;
}
</style>
