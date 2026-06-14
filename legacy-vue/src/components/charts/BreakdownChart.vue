<template>
    <Card class="breakdown-chart shadow-md">
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

            <!-- Legend with values -->
            <div v-if="items && items.length > 0" class="legend mt-4 space-y-2">
                <div 
                    v-for="(item, index) in items" 
                    :key="index"
                    class="flex items-center justify-between text-sm"
                >
                    <div class="flex items-center gap-2">
                        <div 
                            class="w-3 h-3 rounded-full" 
                            :style="{ backgroundColor: colors[index % colors.length] }"
                        ></div>
                        <span class="text-gray-700">{{ item.label }}</span>
                    </div>
                    <span class="font-semibold" :style="{ color: colors[index % colors.length] }">
                        {{ formatter ? formatter(item.value) : item.value }}
                    </span>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup>
import { computed } from 'vue';

// Note: Card and Chart components are globally registered in main.js

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        required: true
    },
    chartType: {
        type: String,
        default: 'doughnut',
        validator: (val) => ['pie', 'doughnut'].includes(val)
    },
    colors: {
        type: Array,
        default: () => ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
    },
    formatter: {
        type: Function,
        default: null
    }
});

const chartData = computed(() => ({
    labels: props.items.map(item => item.label),
    datasets: [
        {
            data: props.items.map(item => item.value),
            backgroundColor: props.colors,
            borderColor: '#fff',
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
    }
};
</script>

<style scoped>
.breakdown-chart {
    height: 100%;
}

.chart-container {
    position: relative;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.legend {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
}
</style>
