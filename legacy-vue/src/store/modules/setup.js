///state objects
const state = {
    theme_color: '',
    is_theme_set: false
};

//mutation functions
const mutations = {
    SET_THEME(state, theme_color) {
        state.theme_color = theme_color;
    },
    SET_IS_THEME_SET(state, is_theme_set) {
        state.is_theme_set = is_theme_set;
    }
};
//actions
const actions = {
    async setTheme({ commit }, payload) {
        //api service - response
        commit('SET_THEME', payload.theme_color);
    }
};
//getters

export default {
    namespaced: true,
    state,
    mutations,
    actions
};
