<template>
    <div class="period-selector flex items-center gap-3">
        <label v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</label>
        <Dropdown
            v-model="selectedPeriod"
            :options="periodOptions"
            option-label="label"
            option-value="value"
            placeholder="Select Period"
            class="w-48"
            @change="handlePeriodChange"
        />
        <Button
            v-if="showRefresh"
            icon="pi pi-refresh"
            rounded
            text
            severity="secondary"
            @click="handleRefresh"
            title="Refresh data"
        />
    </div>
</template>

<script setup>
import { PERIOD_OPTIONS } from '@/utils/constants';
import { computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: 'month'
    },
    label: {
        type: String,
        default: 'Period'
    },
    showRefresh: {
        type: Boolean,
        default: false
    },
    customOptions: {
        type: Array,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'change', 'refresh']);

const periodOptions = computed(() => props.customOptions || PERIOD_OPTIONS);

const selectedPeriod = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const handlePeriodChange = () => {
    emit('change', selectedPeriod.value);
};

const handleRefresh = () => {
    emit('refresh');
};
</script>

<style scoped>
.period-selector {
    padding: 0.5rem 0;
}
</style>
