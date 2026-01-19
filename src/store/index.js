// src/store/index.js
import { createStore } from 'vuex';
import authModule from './modules/auth'; // Import your 'auth' module
import setuModule from './modules/setup';
import currencyModule from './modules/currency'; // Import currency module for multi-currency support

const store = createStore({
    modules: {
        auth: authModule,
        setup: setuModule,
        currency: currencyModule
    }
});

export default store;
