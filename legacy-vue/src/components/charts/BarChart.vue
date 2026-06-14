<template>
    <Card class="bar-chart shadow-md">
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
    labels: {
        type: Array,
        required: true
    },
    datasets: {
        type: Array,
        required: true
    },
    chartType: {
        type: String,
        default: 'bar',
        validator: (val) => ['bar', 'column'].includes(val)
    },
    colors: {
        type: Array,
        default: () => ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']
    }
});

const chartData = computed(() => ({
    labels: props.labels,
    datasets: props.datasets.map((dataset, idx) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: props.colors[idx % props.colors.length],
        borderColor: props.colors[idx % props.colors.length],
        borderWidth: 1
    }))
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: props.chartType === 'bar' ? 'y' : 'x',
    plugins: {
        legend: {
            display: props.datasets.length > 1
        }
    },
    scales: {
        x: {
            beginAtZero: true
        },
        y: {
            beginAtZero: true
        }
    }
};
</script>

<style scoped>
.bar-chart {
    height: 100%;
}

.chart-container {
    position: relative;
    height: 300px;
}
</style>
