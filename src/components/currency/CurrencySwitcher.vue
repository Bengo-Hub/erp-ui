<template>
    <div class="currency-switcher-dropdown hidden absolute top-12 right-0 w-64 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg shadow-xl z-50">
        <div class="p-3">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-surface-200 dark:border-surface-700">
                <span class="text-sm font-semibold text-surface-900 dark:text-surface-0">Display Currency</span>
                <i class="pi pi-money-bill text-primary"></i>
            </div>

            <div class="space-y-1">
                <button
                    v-for="curr in currencies"
                    :key="curr.code"
                    @click="selectCurrency(curr.code)"
                    class="currency-option"
                    :class="{ 'active': selectedCurrency === curr.code }"
                >
                    <div class="flex items-center gap-2 flex-1">
                        <span class="currency-symbol">{{ curr.symbol }}</span>
                        <div class="flex flex-col">
                            <span class="currency-code">{{ curr.code }}</span>
                            <span class="currency-name">{{ curr.name }}</span>
                        </div>
                    </div>
                    <i v-if="selectedCurrency === curr.code" class="pi pi-check text-primary"></i>
                </button>
            </div>

            <div class="mt-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                <p class="text-xs text-surface-500 dark:text-surface-400">
                    <i class="pi pi-info-circle mr-1"></i>
                    Rates updated: {{ lastUpdated }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Available currencies (from store)
const currencies = computed(() => store.state.currency.availableCurrencies);

const selectedCurrency = computed(() => store.state.currency.currentCurrency);

const lastUpdated = computed(() => {
    const date = store.state.currency.lastRateUpdate;
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
});

const selectCurrency = (code) => {
    store.dispatch('currency/setCurrentCurrency', code);
};
</script>

<style scoped>
.currency-switcher-dropdown {
    animation: fadeIn 0.15s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.currency-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    transition: all 0.15s ease;
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
}

.currency-option:hover {
    background: var(--surface-100);
}

.dark .currency-option:hover {
    background: var(--surface-800);
}

.currency-option.active {
    background: var(--primary-50);
    color: var(--primary);
}

.dark .currency-option.active {
    background: var(--primary-900);
    color: var(--primary-300);
}

.currency-symbol {
    font-size: 1.25rem;
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
}

.currency-code {
    font-size: 0.875rem;
    font-weight: 600;
}

.currency-name {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.currency-option.active .currency-name {
    color: var(--primary);
}
</style>
