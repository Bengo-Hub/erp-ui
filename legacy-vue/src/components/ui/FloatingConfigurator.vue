<script setup>
import { useTheme } from '@/composables/useTheme';
import AppConfigurator from '@/layout/AppConfigurator.vue';
import { onMounted } from 'vue';

const { toggleDarkMode, isDarkMode, initializeTheme } = useTheme();

// Initialize theme on component mount
onMounted(() => {
    initializeTheme();
});
</script>

<template>
    <div class="fixed flex gap-4 top-8 right-8">
        <Button type="button" @click="toggleDarkMode" rounded :icon="isDarkMode ? 'pi pi-moon' : 'pi pi-sun'" severity="secondary" />
        <div class="relative">
            <Button
                icon="pi pi-palette"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                type="button"
                rounded
            />
            <AppConfigurator />
        </div>
    </div>
</template>
