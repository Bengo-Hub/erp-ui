/**
 * Global Currency Plugin for Vue 3
 *
 * Provides global currency formatting and conversion functionality.
 * Integrates with useCurrency composable for automatic currency switching.
 *
 * Usage in templates:
 *   {{ $formatCurrency(amount, 'USD') }}
 *   {{ $formatCurrency(amount) }} // Uses selected currency
 *
 * Usage in script:
 *   const { $formatCurrency, $convertCurrency } = getCurrentInstance().appContext.config.globalProperties;
 */

import { useCurrency } from '@/composables/useCurrency';
import { formatCurrency as baseFormatCurrency, getCurrencySymbol, getCurrencyDecimals } from '@/utils/formatters';

export default {
    install(app) {
        // Get currency composable instance
        const currency = useCurrency();

        /**
         * Format amount with currency symbol and conversion
         * @param {number} amount - Amount to format
         * @param {string} sourceCurrency - Original currency of the amount (default: selected currency)
         * @param {object} options - Formatting options
         * @param {boolean} options.convert - Whether to convert to selected currency (default: true)
         * @param {boolean} options.showSymbol - Show currency symbol (default: true)
         * @param {boolean} options.showCode - Show currency code (default: false)
         * @returns {string} Formatted currency string
         */
        app.config.globalProperties.$formatCurrency = async (amount, sourceCurrency = null, options = {}) => {
            const {
                convert = true,
                showSymbol = true,
                showCode = false
            } = options;

            // Ensure we have a valid amount
            const num = Number(amount);
            if (!Number.isFinite(num)) {
                return baseFormatCurrency(0, currency.selectedCurrency.value, { showSymbol, showCode });
            }

            // Determine source and target currencies
            const fromCurrency = sourceCurrency || currency.selectedCurrency.value;
            const toCurrency = currency.selectedCurrency.value;

            // Convert if needed and requested
            let finalAmount = num;
            if (convert && fromCurrency !== toCurrency) {
                try {
                    finalAmount = await currency.convertAmount(num, fromCurrency, toCurrency);
                } catch (error) {
                    console.warn('Currency conversion failed, using original amount:', error);
                }
            }

            // Format the final amount
            return baseFormatCurrency(finalAmount, toCurrency, { showSymbol, showCode });
        };

        /**
         * Synchronous format (no conversion) - useful for amounts already in selected currency
         * @param {number} amount - Amount to format
         * @param {string} currencyCode - Currency code (default: selected currency)
         * @param {object} options - Formatting options
         * @returns {string} Formatted currency string
         */
        app.config.globalProperties.$formatCurrencySync = (amount, currencyCode = null, options = {}) => {
            const code = currencyCode || currency.selectedCurrency.value;
            return baseFormatCurrency(amount, code, options);
        };

        /**
         * Convert amount between currencies
         * @param {number} amount - Amount to convert
         * @param {string} fromCurrency - Source currency code
         * @param {string} toCurrency - Target currency code (default: selected currency)
         * @returns {Promise<number>} Converted amount
         */
        app.config.globalProperties.$convertCurrency = async (amount, fromCurrency, toCurrency = null) => {
            const targetCurrency = toCurrency || currency.selectedCurrency.value;
            return await currency.convertAmount(amount, fromCurrency, targetCurrency);
        };

        /**
         * Get current selected currency code
         * @returns {string} Currency code (e.g., 'KES', 'USD')
         */
        app.config.globalProperties.$currentCurrency = () => {
            return currency.selectedCurrency.value;
        };

        /**
         * Get currency symbol
         * @param {string} currencyCode - Currency code (default: selected currency)
         * @returns {string} Currency symbol
         */
        app.config.globalProperties.$currencySymbol = (currencyCode = null) => {
            const code = currencyCode || currency.selectedCurrency.value;
            return getCurrencySymbol(code);
        };

        /**
         * Get decimal places for currency
         * @param {string} currencyCode - Currency code (default: selected currency)
         * @returns {number} Decimal places
         */
        app.config.globalProperties.$currencyDecimals = (currencyCode = null) => {
            const code = currencyCode || currency.selectedCurrency.value;
            return getCurrencyDecimals(code);
        };

        /**
         * Format multiple amounts with optional conversion
         * Useful for formatting arrays of financial data
         * @param {Array<{amount: number, currency: string}>} items - Array of amount objects
         * @param {boolean} convert - Whether to convert to selected currency
         * @returns {Promise<Array<{amount: number, formatted: string}>>}
         */
        app.config.globalProperties.$formatCurrencyBatch = async (items, convert = true) => {
            return await Promise.all(
                items.map(async (item) => {
                    const formatted = await app.config.globalProperties.$formatCurrency(
                        item.amount,
                        item.currency,
                        { convert }
                    );
                    return {
                        ...item,
                        formatted
                    };
                })
            );
        };
    }
};
