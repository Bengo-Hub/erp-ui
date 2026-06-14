<template>
    <Card class="performance-gauge shadow-md">
        <template #header>
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-lg">{{ title }}</h3>
            </div>
        </template>
        <template #content>
            <div class="gauge-container">
                <Chart 
                    v-if="chartData" 
                    type="doughnut" 
                    :data="chartData" 
                    :options="chartOptions"
                    class="w-full"
                />
            </div>

            <!-- Metrics -->
            <div class="metrics-container mt-4 text-center">
                <div class="text-3xl font-bold mb-1" :style="{ color: gaugeColor }">
                    {{ value }}%
                </div>
                <div class="text-sm text-gray-600">{{ label }}</div>
                
                <div v-if="benchmark" class="text-xs text-gray-500 mt-2">
                    Target: {{ benchmark }}%
                </div>
            </div>

            <!-- Status Indicator -->
            <div class="status-bar mt-4">
                <div class="flex items-center gap-2 text-xs">
                    <i :class="statusIcon" :style="{ color: gaugeColor }"></i>
                    <span>{{ statusText }}</span>
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
        type: Number,
        required: true
    },
    label: {
        type: String,
        default: 'Performance'
    },
    benchmark: {
        type: Number,
        default: null
    },
    maxValue: {
        type: Number,
        default: 100
    },
    thresholds: {
        type: Object,
        default: () => ({
            poor: 30,
            fair: 60,
            good: 80,
            excellent: 100
        })
    }
});

const gaugeColor = computed(() => {
    if (props.value >= props.thresholds.excellent) return '#10b981';
    if (props.value >= props.thresholds.good) return '#3b82f6';
    if (props.value >= props.thresholds.fair) return '#f59e0b';
    return '#ef4444';
});

const statusText = computed(() => {
    if (props.value >= props.thresholds.excellent) return 'Excellent';
    if (props.value >= props.thresholds.good) return 'Good';
    if (props.value >= props.thresholds.fair) return 'Fair';
    return 'Needs Improvement';
});

const statusIcon = computed(() => {
    if (props.value >= props.thresholds.excellent) return 'pi pi-check-circle text-lg';
    if (props.value >= props.thresholds.good) return 'pi pi-circle-fill text-lg';
    if (props.value >= props.thresholds.fair) return 'pi pi-exclamation-circle text-lg';
    return 'pi pi-times-circle text-lg';
});

const chartData = computed(() => ({
    datasets: [
        {
            data: [props.value, props.maxValue - props.value],
            backgroundColor: [gaugeColor.value, '#e5e7eb'],
            borderColor: '#fff',
            borderWidth: 2,
            circumference: 180,
            rotation: 270
        }
    ]
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            enabled: false
        }
    }
};
</script>

<style scoped>
.performance-gauge {
    height: 100%;
}

.gauge-container {
    position: relative;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.metrics-container {
    padding: 1rem 0;
}

.status-bar {
    padding: 0.75rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
}
</style>
