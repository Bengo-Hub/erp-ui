/**
 * Global Currency Composable
 *
 * Provides reactive currency formatting that automatically updates when
 * the global currency selection changes.
 *
 * Usage:
 *   const { formatCurrency, convertAndFormat, currentCurrency } = useGlobalCurrency();
 *   const formatted = formatCurrency(1000, 'USD'); // Reactive!
 */

import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useCurrency } from '@/composables/useCurrency';
import { formatCurrency as baseFormatCurrency } from '@/utils/formatters';

export function useGlobalCurrency() {
    const currency = useCurrency();
    const forceUpdate = ref(0);

    // Listen for global currency change events
    const handleCurrencyChange = () => {
        forceUpdate.value++;
    };

    onMounted(() => {
        window.addEventListener('currency-changed', handleCurrencyChange);
    });

    onUnmounted(() => {
        window.removeEventListener('currency-changed', handleCurrencyChange);
    });

    /**
     * Format amount with current selected currency
     * This is reactive - updates when currency changes
     *
     * @param {number|Ref<number>} amount - Amount to format (can be reactive)
     * @param {string} sourceCurrency - Original currency (default: current selected)
     * @param {object} options - Formatting options
     * @returns {ComputedRef<string>} Reactive formatted string
     */
    const formatCurrency = (amount, sourceCurrency = null, options = {}) => {
        return computed(() => {
            // Force reactivity trigger
            forceUpdate.value;

            const num = typeof amount === 'object' && amount.value !== undefined ? amount.value : amount;
            const finalAmount = Number(num);

            if (!Number.isFinite(finalAmount)) {
                return baseFormatCurrency(0, currency.selectedCurrency.value, options);
            }

            return baseFormatCurrency(finalAmount, currency.selectedCurrency.value, options);
        });
    };

    /**
     * Convert and format amount from source currency to selected currency
     * This is async and reactive
     *
     * @param {number|Ref<number>} amount - Amount to convert and format
     * @param {string} sourceCurrency - Original currency code
     * @param {object} options - Formatting options
     * @returns {Ref<string>} Reactive formatted string
     */
    const convertAndFormat = (amount, sourceCurrency, options = {}) => {
        const formatted = ref('...');

        const updateFormatted = async () => {
            const num = typeof amount === 'object' && amount.value !== undefined ? amount.value : amount;
            const finalAmount = Number(num);

            if (!Number.isFinite(finalAmount)) {
                formatted.value = baseFormatCurrency(0, currency.selectedCurrency.value, options);
                return;
            }

            if (sourceCurrency === currency.selectedCurrency.value) {
                formatted.value = baseFormatCurrency(finalAmount, currency.selectedCurrency.value, options);
                return;
            }

            try {
                const converted = await currency.convertAmount(finalAmount, sourceCurrency, currency.selectedCurrency.value);
                formatted.value = baseFormatCurrency(converted, currency.selectedCurrency.value, options);
            } catch (error) {
                console.warn('Conversion failed:', error);
                formatted.value = baseFormatCurrency(finalAmount, sourceCurrency, { ...options, showCode: true });
            }
        };

        // Initial format
        updateFormatted();

        // Watch for currency changes
        watch(() => forceUpdate.value, updateFormatted);

        // Watch for amount changes if it's reactive
        if (typeof amount === 'object' && amount.value !== undefined) {
            watch(amount, updateFormatted);
        }

        return formatted;
    };

    /**
     * Get reactive current currency code
     */
    const currentCurrency = computed(() => {
        forceUpdate.value; // Force reactivity
        return currency.selectedCurrency.value;
    });

    /**
     * Get reactive currency symbol
     */
    const currentSymbol = computed(() => {
        forceUpdate.value; // Force reactivity
        return currency.getSymbol(currency.selectedCurrency.value);
    });

    /**
     * Get reactive decimal places
     */
    const currentDecimals = computed(() => {
        forceUpdate.value; // Force reactivity
        return currency.getDecimalPlaces(currency.selectedCurrency.value);
    });

    /**
     * Synchronous format (no conversion) - for amounts already in selected currency
     * Reactive to currency changes
     */
    const formatCurrencySync = (amount, options = {}) => {
        return computed(() => {
            forceUpdate.value; // Force reactivity

            const num = typeof amount === 'object' && amount.value !== undefined ? amount.value : amount;
            const finalAmount = Number(num);

            if (!Number.isFinite(finalAmount)) {
                return baseFormatCurrency(0, currency.selectedCurrency.value, options);
            }

            return baseFormatCurrency(finalAmount, currency.selectedCurrency.value, options);
        });
    };

    /**
     * Format array of amounts with conversion
     * Returns reactive array of formatted values
     */
    const formatCurrencyArray = (items, options = {}) => {
        const formattedArray = ref([]);

        const updateArray = async () => {
            const results = await Promise.all(
                items.value.map(async (item) => {
                    if (!item || item.amount == null) {
                        return { ...item, formatted: baseFormatCurrency(0, currency.selectedCurrency.value, options) };
                    }

                    const amount = Number(item.amount);
                    if (!Number.isFinite(amount)) {
                        return { ...item, formatted: baseFormatCurrency(0, currency.selectedCurrency.value, options) };
                    }

                    // Convert if source currency is different
                    if (item.currency && item.currency !== currency.selectedCurrency.value) {
                        try {
                            const converted = await currency.convertAmount(amount, item.currency, currency.selectedCurrency.value);
                            return {
                                ...item,
                                convertedAmount: converted,
                                formatted: baseFormatCurrency(converted, currency.selectedCurrency.value, options)
                            };
                        } catch (error) {
                            console.warn('Conversion failed for item:', error);
                            return {
                                ...item,
                                formatted: baseFormatCurrency(amount, item.currency, { ...options, showCode: true })
                            };
                        }
                    }

                    return {
                        ...item,
                        formatted: baseFormatCurrency(amount, currency.selectedCurrency.value, options)
                    };
                })
            );

            formattedArray.value = results;
        };

        // Initial format
        updateArray();

        // Watch for currency changes
        watch(() => forceUpdate.value, updateArray);

        // Watch for items changes
        watch(items, updateArray, { deep: true });

        return formattedArray;
    };

    return {
        // Reactive formatting
        formatCurrency,
        formatCurrencySync,
        convertAndFormat,
        formatCurrencyArray,

        // Reactive currency info
        currentCurrency,
        currentSymbol,
        currentDecimals,

        // Direct access to currency composable
        currency,

        // Manual refresh trigger (if needed)
        refresh: () => forceUpdate.value++
    };
}
