/**
 * Currency Vuex Module
 *
 * Manages global currency selection and conversion for multi-currency support.
 * Integrates with backend exchange rates API for accurate conversions.
 */

import apiClient from '@/services/api/axiosConfig';

const state = {
    // Current display currency (user selection)
    currentCurrency: localStorage.getItem('preferredCurrency') || 'KES',

    // Exchange rates cache (base: KES)
    exchangeRates: JSON.parse(localStorage.getItem('exchangeRates') || '{}'),

    // Last time rates were fetched
    lastRateUpdate: localStorage.getItem('lastRateUpdate') || null,

    // Available currencies
    availableCurrencies: [
        { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh', decimal_places: 2 },
        { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
        { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
        { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2 }
    ]
};

const getters = {
    currentSymbol: (state) => {
        const curr = state.availableCurrencies.find(c => c.code === state.currentCurrency);
        return curr?.symbol || state.currentCurrency;
    },

    currentDecimalPlaces: (state) => {
        const curr = state.availableCurrencies.find(c => c.code === state.currentCurrency);
        return curr?.decimal_places || 2;
    },

    ratesAreFresh: (state) => {
        if (!state.lastRateUpdate) return false;
        const lastUpdate = new Date(state.lastRateUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        return hoursSinceUpdate < 24;
    }
};

const mutations = {
    SET_CURRENT_CURRENCY(state, currencyCode) {
        state.currentCurrency = currencyCode.toUpperCase();
        localStorage.setItem('preferredCurrency', state.currentCurrency);
    },

    SET_EXCHANGE_RATES(state, rates) {
        state.exchangeRates = rates;
        state.lastRateUpdate = new Date().toISOString();
        localStorage.setItem('exchangeRates', JSON.stringify(rates));
        localStorage.setItem('lastRateUpdate', state.lastRateUpdate);
    }
};

const actions = {
    setCurrentCurrency({ commit }, currencyCode) {
        commit('SET_CURRENT_CURRENCY', currencyCode);

        // Emit event for components to react to currency change
        window.dispatchEvent(new CustomEvent('currency-changed', {
            detail: { currency: currencyCode }
        }));
    },

    async fetchExchangeRates({ commit, state }) {
        try {
            const response = await apiClient.get('/api/exchange-rates/latest/');

            if (response.data && response.data.rates) {
                commit('SET_EXCHANGE_RATES', response.data.rates);
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            // Cached rates already loaded from localStorage in state
        }
    },

    convert({ state, getters }, { amount, fromCurrency, toCurrency = null }) {
        if (!amount || amount === 0) return 0;

        const targetCurrency = toCurrency || state.currentCurrency;

        // No conversion needed if currencies match
        if (fromCurrency === targetCurrency) return amount;

        // Get exchange rate
        const rate = getExchangeRate(state, fromCurrency, targetCurrency);
        const converted = amount * rate;

        // Round to appropriate decimal places
        const decimals = getters.currentDecimalPlaces;
        return Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },

    format({ state, getters }, { amount, currencyCode = null, includeSymbol = true }) {
        const currency = currencyCode || state.currentCurrency;
        const currInfo = state.availableCurrencies.find(c => c.code === currency);
        const decimals = currInfo?.decimal_places || 2;
        const symbol = currInfo?.symbol || currency;

        // Format with thousand separators and decimal places
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);

        if (!includeSymbol) return formatted;

        // Add symbol based on currency convention
        if (currency === 'USD' || currency === 'GBP' || currency === 'EUR') {
            return `${symbol}${formatted}`;
        } else {
            return `${symbol} ${formatted}`;
        }
    },

    async initialize({ dispatch, state, getters }) {
        // Fetch fresh rates if cache is stale or empty
        if (!getters.ratesAreFresh || Object.keys(state.exchangeRates).length === 0) {
            await dispatch('fetchExchangeRates');
        }
    }
};

// Helper function to get exchange rate
function getExchangeRate(state, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;

    const fromRate = state.exchangeRates[fromCurrency] || 1.0;
    const toRate = state.exchangeRates[toCurrency] || 1.0;

    if (fromCurrency === 'KES') {
        return toRate;
    } else if (toCurrency === 'KES') {
        return fromRate;
    } else {
        return fromRate / toRate;
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};
