<template>
    <div class="currency-selector flex items-center gap-3">
        <label v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</label>
        <Select
            v-model="selectedValue"
            :options="displayOptions"
            option-label="label"
            option-value="value"
            :placeholder="placeholder"
            :class="selectorClass"
            :disabled="disabled || isLoading"
            :loading="isLoading"
            @change="handleChange"
        >
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <span class="font-semibold">{{ getSymbolForValue(slotProps.value) }}</span>
                    <span>{{ slotProps.value }}</span>
                </div>
                <span v-else>{{ placeholder }}</span>
            </template>
            <template #option="slotProps">
                <div class="flex items-center gap-2">
                    <span class="font-semibold w-8">{{ slotProps.option.symbol }}</span>
                    <span>{{ slotProps.option.name }}</span>
                    <span class="text-gray-400 text-sm">({{ slotProps.option.value }})</span>
                </div>
            </template>
        </Select>
        <div v-if="showExchangeRate && exchangeRateDisplay" class="text-sm text-gray-500">
            {{ exchangeRateDisplay }}
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useCurrency } from '@/composables/useCurrency';

const props = defineProps({
    modelValue: {
        type: String,
        default: 'KES'
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Select Currency'
    },
    priorityOnly: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    showExchangeRate: {
        type: Boolean,
        default: false
    },
    baseCurrency: {
        type: String,
        default: 'KES'
    },
    size: {
        type: String,
        default: 'normal',
        validator: (v) => ['small', 'normal', 'large'].includes(v)
    }
});

const emit = defineEmits(['update:modelValue', 'change', 'exchange-rate-loaded']);

const {
    currencyOptions,
    priorityCurrencyOptions,
    isLoading,
    isInitialized,
    initialize,
    getSymbol,
    getExchangeRate
} = useCurrency();

// Initialize currencies on mount
onMounted(async () => {
    if (!isInitialized.value) {
        await initialize();
    }
});

// Computed options based on priorityOnly prop
const displayOptions = computed(() => {
    return props.priorityOnly ? priorityCurrencyOptions.value : currencyOptions.value;
});

// v-model binding
const selectedValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// Dynamic class based on size
const selectorClass = computed(() => {
    const sizes = {
        small: 'w-24',
        normal: 'w-36',
        large: 'w-48'
    };
    return sizes[props.size] || sizes.normal;
});

// Get symbol for display
function getSymbolForValue(code) {
    return getSymbol(code);
}

// Exchange rate display
const exchangeRate = computed(() => null); // Will be fetched async
const exchangeRateDisplay = computed(() => {
    if (!props.showExchangeRate || props.modelValue === props.baseCurrency) {
        return null;
    }
    // This would show the exchange rate if fetched
    return null;
});

// Handle change event
function handleChange() {
    emit('change', selectedValue.value);

    // Fetch exchange rate if needed
    if (props.showExchangeRate && selectedValue.value !== props.baseCurrency) {
        fetchExchangeRate();
    }
}

// Fetch exchange rate
async function fetchExchangeRate() {
    if (!props.showExchangeRate) return;

    try {
        const rate = await getExchangeRate(props.baseCurrency, selectedValue.value);
        emit('exchange-rate-loaded', {
            from: props.baseCurrency,
            to: selectedValue.value,
            rate
        });
    } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
    }
}

// Watch for external changes to model value
watch(() => props.modelValue, (newVal) => {
    if (props.showExchangeRate && newVal !== props.baseCurrency) {
        fetchExchangeRate();
    }
});
</script>

<style scoped>
.currency-selector {
    padding: 0.25rem 0;
}
</style>
