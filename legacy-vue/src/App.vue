<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

onMounted(() => {
    // Check authentication state on app startup
    store.dispatch('auth/checkAuthentication');
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>
