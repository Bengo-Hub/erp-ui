<template>
    <Card class="trend-chart shadow-md">
        <template #header>
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-lg">{{ title }}</h3>
            </div>
        </template>
        <template #content>
            <div class="chart-container">
                <Chart 
                    v-if="chartData" 
                    :type="chartType" 
                    :data="chartData" 
                    :options="chartOptions"
                    class="w-full"
                />
                <div v-else class="text-center py-8 text-gray-500">
                    No data available
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
    data: {
        type: Array,
        required: true
    },
    labels: {
        type: Array,
        required: true
    },
    chartType: {
        type: String,
        default: 'line',
        validator: (val) => ['line', 'area'].includes(val)
    },
    colors: {
        type: Object,
        default: () => ({ border: '#3b82f6', background: '#3b82f620' })
    }
});

const chartData = computed(() => ({
    labels: props.labels,
    datasets: [
        {
            label: props.title,
            data: props.data,
            borderColor: props.colors.border,
            backgroundColor: props.colors.background,
            tension: 0.4,
            fill: props.chartType === 'area',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
        }
    ]
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};
</script>

<style scoped>
.trend-chart {
    height: 100%;
}

.chart-container {
    position: relative;
    height: 300px;
}
</style>
