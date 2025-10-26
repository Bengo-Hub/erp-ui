import store from '@/store/index';

export const authService = {
    async login(payload) {
        // Delegate hydration to the store's login action for a single source of truth
        const resp = await store.dispatch('auth/login', payload);
        return resp;
    }
};
