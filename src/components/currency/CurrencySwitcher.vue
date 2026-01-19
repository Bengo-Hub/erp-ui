<template>
    <div class="currency-switcher-dropdown hidden absolute top-12 right-0 w-64 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg shadow-xl z-50">
        <div class="p-3">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-surface-200 dark:border-surface-700">
                <span class="text-sm font-semibold text-surface-900 dark:text-surface-0">Display Currency</span>
                <i class="pi pi-money-bill text-primary"></i>
            </div>

            <div class="space-y-1">
                <button
                    v-for="curr in displayCurrencies"
                    :key="curr.code"
                    @click="selectCurrency(curr.code)"
                    class="currency-option"
                    :class="{ 'active': selectedCurrency === curr.code }"
                >
                    <div class="flex items-center gap-3 flex-1">
                        <span class="currency-flag">{{ getFlagEmoji(curr.code) }}</span>
                        <div class="flex flex-col flex-1">
                            <div class="flex items-center gap-2">
                                <span class="currency-code">{{ curr.code }}</span>
                                <span class="currency-symbol-badge">{{ curr.symbol }}</span>
                            </div>
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
import { computed, onMounted } from 'vue';
import { useCurrency } from '@/composables/useCurrency';

const {
    currencies,
    priorityCurrencies,
    selectedCurrency,
    setSelectedCurrency,
    initialize,
    isInitialized
} = useCurrency();

// Use priority currencies if available, otherwise fall back to all currencies
const displayCurrencies = computed(() => {
    if (priorityCurrencies.value && priorityCurrencies.value.length > 0) {
        return priorityCurrencies.value;
    }
    // Fallback: show KES, USD, EUR, GBP
    return currencies.value.filter(c => ['KES', 'USD', 'EUR', 'GBP'].includes(c.code));
});

const lastUpdated = computed(() => {
    const stored = localStorage.getItem('exchangeRatesLastUpdated');
    if (!stored) return 'Not synced';
    return new Date(stored).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
});

const selectCurrency = (code) => {
    setSelectedCurrency(code);
    // Emit custom event for components to react to currency change
    window.dispatchEvent(new CustomEvent('currency-changed', {
        detail: { currency: code }
    }));
};

// Map currency codes to flag emojis
const getFlagEmoji = (currencyCode) => {
    const flagMap = {
        'KES': '🇰🇪', // Kenya
        'USD': '🇺🇸', // United States
        'EUR': '🇪🇺', // European Union
        'GBP': '🇬🇧', // United Kingdom
        'UGX': '🇺🇬', // Uganda
        'TZS': '🇹🇿', // Tanzania
        'ZAR': '🇿🇦', // South Africa
        'NGN': '🇳🇬', // Nigeria
        'GHS': '🇬🇭', // Ghana
        'RWF': '🇷🇼', // Rwanda
        'ETB': '🇪🇹', // Ethiopia
        'AED': '🇦🇪', // UAE
        'INR': '🇮🇳', // India
        'CNY': '🇨🇳', // China
        'JPY': '🇯🇵'  // Japan
    };
    return flagMap[currencyCode] || '🌍';
};

// Initialize on mount if not already done
onMounted(async () => {
    if (!isInitialized.value) {
        await initialize();
    }
});
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

.currency-flag {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
}

.currency-code {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.025em;
}

.currency-symbol-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    background: var(--surface-100);
    border-radius: 0.25rem;
    color: var(--text-color-secondary);
}

.dark .currency-symbol-badge {
    background: var(--surface-800);
}

.currency-option.active .currency-symbol-badge {
    background: var(--primary-100);
    color: var(--primary);
}

.dark .currency-option.active .currency-symbol-badge {
    background: var(--primary-800);
    color: var(--primary-300);
}

.currency-name {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.125rem;
}

.currency-option.active .currency-name {
    color: var(--primary);
}
</style>
