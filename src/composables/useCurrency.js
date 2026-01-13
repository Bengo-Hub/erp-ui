/**
 * useCurrency Composable
 *
 * Provides centralized currency management for the ERP application.
 * Features:
 * - Fetch and cache available currencies from backend
 * - Format amounts with proper currency symbols
 * - Convert between currencies
 * - Manage default/selected currency state
 */

import { ref, computed, readonly } from 'vue';
import { coreService } from '@/services/shared/coreService';

// Singleton state (shared across all component instances)
const currencies = ref([]);
const priorityCurrencies = ref([]);
const defaultCurrency = ref('KES');
const selectedCurrency = ref('KES');
const exchangeRates = ref({});
const isLoading = ref(false);
const isInitialized = ref(false);
const error = ref(null);

// Currency symbol map for client-side formatting
const CURRENCY_SYMBOLS = {
    KES: 'KSh',
    USD: '$',
    EUR: '€',
    GBP: '£',
    UGX: 'USh',
    TZS: 'TSh',
    ZAR: 'R',
    NGN: '₦',
    GHS: 'GH₵',
    RWF: 'FRw',
    ETB: 'Br',
    AED: 'د.إ',
    INR: '₹',
    CNY: '¥',
    JPY: '¥'
};

// Decimal places per currency
const DECIMAL_PLACES = {
    KES: 2,
    USD: 2,
    EUR: 2,
    GBP: 2,
    UGX: 0,
    TZS: 0,
    ZAR: 2,
    NGN: 2,
    GHS: 2,
    RWF: 0,
    ETB: 2,
    AED: 2,
    INR: 2,
    CNY: 2,
    JPY: 0
};

export function useCurrency() {
    /**
     * Initialize currency data from backend
     */
    async function initialize() {
        if (isInitialized.value || isLoading.value) return;

        isLoading.value = true;
        error.value = null;

        try {
            const response = await coreService.getCurrencies();
            currencies.value = response.currencies || [];
            priorityCurrencies.value = response.priority_currencies || [];
            defaultCurrency.value = response.default_currency || 'KES';

            // Set selected currency from localStorage or default
            const storedCurrency = localStorage.getItem('selectedCurrency');
            selectedCurrency.value = storedCurrency || defaultCurrency.value;

            isInitialized.value = true;
        } catch (err) {
            console.error('Failed to initialize currencies:', err);
            error.value = err.message || 'Failed to load currencies';

            // Fallback to hardcoded values
            currencies.value = Object.keys(CURRENCY_SYMBOLS).map((code, index) => ({
                code,
                name: code,
                symbol: CURRENCY_SYMBOLS[code],
                decimal_places: DECIMAL_PLACES[code] || 2,
                priority: index + 1
            }));
            priorityCurrencies.value = currencies.value.slice(0, 3);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Set the selected currency and persist to localStorage
     */
    function setSelectedCurrency(currencyCode) {
        selectedCurrency.value = currencyCode;
        localStorage.setItem('selectedCurrency', currencyCode);
    }

    /**
     * Get currency symbol for a currency code
     */
    function getSymbol(currencyCode) {
        const code = currencyCode?.toUpperCase() || defaultCurrency.value;
        const currency = currencies.value.find(c => c.code === code);
        return currency?.symbol || CURRENCY_SYMBOLS[code] || code;
    }

    /**
     * Get decimal places for a currency
     */
    function getDecimalPlaces(currencyCode) {
        const code = currencyCode?.toUpperCase() || defaultCurrency.value;
        const currency = currencies.value.find(c => c.code === code);
        return currency?.decimal_places ?? DECIMAL_PLACES[code] ?? 2;
    }

    /**
     * Format amount with currency (client-side formatting)
     */
    function formatAmount(amount, currencyCode = null) {
        const code = currencyCode?.toUpperCase() || selectedCurrency.value;
        const num = Number(amount);
        const value = Number.isFinite(num) ? num : 0;
        const decimals = getDecimalPlaces(code);
        const symbol = getSymbol(code);

        try {
            // Use Intl.NumberFormat for proper locale formatting
            const formatted = new Intl.NumberFormat('en-KE', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value);

            // Symbol placement: $, £, € before, others after with space
            if (['USD', 'GBP', 'EUR'].includes(code)) {
                return `${symbol}${formatted}`;
            }
            return `${symbol} ${formatted}`;
        } catch {
            return `${symbol} ${value.toFixed(decimals)}`;
        }
    }

    /**
     * Convert amount between currencies
     */
    async function convert(amount, fromCurrency, toCurrency, rate = null) {
        if (fromCurrency === toCurrency) {
            return {
                original_amount: amount,
                converted_amount: amount,
                from_currency: fromCurrency,
                to_currency: toCurrency,
                rate_used: 1,
                formatted_original: formatAmount(amount, fromCurrency),
                formatted_converted: formatAmount(amount, toCurrency)
            };
        }

        try {
            const result = await coreService.convertCurrency(amount, fromCurrency, toCurrency, rate);
            return result;
        } catch (err) {
            console.error('Currency conversion failed:', err);
            // Fallback: return original amount (no conversion)
            return {
                original_amount: amount,
                converted_amount: amount,
                from_currency: fromCurrency,
                to_currency: toCurrency,
                rate_used: 1,
                formatted_original: formatAmount(amount, fromCurrency),
                formatted_converted: formatAmount(amount, toCurrency),
                error: 'Conversion failed, using original amount'
            };
        }
    }

    /**
     * Fetch latest exchange rate for a currency pair
     */
    async function getExchangeRate(fromCurrency, toCurrency) {
        const cacheKey = `${fromCurrency}_${toCurrency}`;

        // Check cache first
        if (exchangeRates.value[cacheKey]) {
            return exchangeRates.value[cacheKey];
        }

        try {
            const result = await coreService.getLatestExchangeRate(fromCurrency, toCurrency);
            exchangeRates.value[cacheKey] = result.rate;
            return result.rate;
        } catch {
            return null;
        }
    }

    /**
     * Convert a single amount using cached or fetched exchange rate
     * Returns the converted value directly (not a promise result object)
     */
    async function convertAmount(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const num = Number(amount);
        if (!Number.isFinite(num) || num === 0) {
            return 0;
        }

        try {
            const rate = await getExchangeRate(fromCurrency, toCurrency);
            if (rate && rate > 0) {
                return num * rate;
            }
            // If no rate found, try the backend conversion
            const result = await coreService.convertCurrency(num, fromCurrency, toCurrency);
            return result.converted_amount || num;
        } catch (err) {
            console.error('Amount conversion failed:', err);
            return num; // Return original on error
        }
    }

    /**
     * Convert multiple amounts in an object when switching currencies
     * @param {Object} data - Object containing amounts to convert
     * @param {Array<string>} amountFields - Array of field names that contain amounts
     * @param {string} fromCurrency - Source currency code
     * @param {string} toCurrency - Target currency code
     * @returns {Object} Object with converted amounts
     */
    async function convertFormAmounts(data, amountFields, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return data;
        }

        const rate = await getExchangeRate(fromCurrency, toCurrency);
        if (!rate || rate <= 0) {
            console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
            return data;
        }

        const converted = { ...data };

        for (const field of amountFields) {
            if (field.includes('.')) {
                // Handle nested fields like 'items.unit_price'
                const parts = field.split('.');
                if (parts[0] === 'items' && Array.isArray(converted.items)) {
                    // Special handling for items array
                    const itemField = parts[1];
                    converted.items = converted.items.map(item => ({
                        ...item,
                        [itemField]: Number.isFinite(Number(item[itemField]))
                            ? Number(item[itemField]) * rate
                            : item[itemField]
                    }));
                }
            } else if (converted[field] !== undefined && converted[field] !== null) {
                const num = Number(converted[field]);
                if (Number.isFinite(num)) {
                    converted[field] = num * rate;
                }
            }
        }

        return converted;
    }

    /**
     * Convert billing/invoice items when currency changes
     * @param {Array} items - Array of billing items
     * @param {string} fromCurrency - Source currency code
     * @param {string} toCurrency - Target currency code
     * @returns {Array} Array with converted amounts
     */
    async function convertBillingItems(items, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency || !Array.isArray(items)) {
            return items;
        }

        const rate = await getExchangeRate(fromCurrency, toCurrency);
        if (!rate || rate <= 0) {
            console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
            return items;
        }

        return items.map(item => ({
            ...item,
            unit_price: Number.isFinite(Number(item.unit_price))
                ? Number(item.unit_price) * rate
                : item.unit_price
        }));
    }

    /**
     * Clear cached exchange rates (useful when rates are updated)
     */
    function clearRateCache() {
        exchangeRates.value = {};
    }

    /**
     * Preload exchange rates for common currency pairs
     * Call this after rates are fetched to warm the cache
     */
    async function preloadCommonRates() {
        const commonPairs = [
            ['USD', 'KES'],
            ['KES', 'USD'],
            ['USD', 'EUR'],
            ['EUR', 'USD'],
            ['USD', 'GBP'],
            ['GBP', 'USD'],
            ['KES', 'EUR'],
            ['EUR', 'KES'],
        ];

        const promises = commonPairs.map(([from, to]) =>
            getExchangeRate(from, to).catch(() => null)
        );

        await Promise.allSettled(promises);
    }

    /**
     * Currency options for dropdowns (formatted for PrimeVue Select)
     */
    const currencyOptions = computed(() => {
        return currencies.value.map(c => ({
            label: `${c.symbol} - ${c.name} (${c.code})`,
            value: c.code,
            symbol: c.symbol,
            name: c.name
        }));
    });

    /**
     * Priority currency options (KES, USD, EUR)
     */
    const priorityCurrencyOptions = computed(() => {
        return priorityCurrencies.value.map(c => ({
            label: `${c.symbol} - ${c.name} (${c.code})`,
            value: c.code,
            symbol: c.symbol,
            name: c.name
        }));
    });

    return {
        // State (readonly to prevent external mutation)
        currencies: readonly(currencies),
        priorityCurrencies: readonly(priorityCurrencies),
        defaultCurrency: readonly(defaultCurrency),
        selectedCurrency,
        isLoading: readonly(isLoading),
        isInitialized: readonly(isInitialized),
        error: readonly(error),

        // Computed
        currencyOptions,
        priorityCurrencyOptions,

        // Methods
        initialize,
        setSelectedCurrency,
        getSymbol,
        getDecimalPlaces,
        formatAmount,
        convert,
        getExchangeRate,
        // New conversion methods
        convertAmount,
        convertFormAmounts,
        convertBillingItems,
        clearRateCache,
        preloadCommonRates
    };
}

export default useCurrency;
