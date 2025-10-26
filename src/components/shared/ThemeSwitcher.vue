<template>
    <div class="theme-switcher">
        <Button
            :icon="isDarkMode ? 'pi pi-moon' : 'pi pi-sun'"
            :label="showLabel ? (isDarkMode ? 'Dark' : 'Light') : undefined"
            :rounded="!showLabel"
            :text="!showLabel"
            :severity="isDarkMode ? 'secondary' : 'warning'"
            @click="toggleDarkMode"
            v-tooltip.bottom="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        />
    </div>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme';
defineProps({
    showLabel: {
        type: Boolean,
        default: false
    }
});

const { isDarkMode, toggleDarkMode } = useTheme();
</script>

<style scoped>
.theme-switcher {
    @apply inline-flex;
}
</style>

