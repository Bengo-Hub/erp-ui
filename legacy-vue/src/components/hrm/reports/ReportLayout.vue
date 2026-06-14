<template>
    <div class="report-layout">
        <!-- Report Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">{{ title }}</h1>
                    <p v-if="description" class="text-gray-600 mt-1">{{ description }}</p>
                </div>
                <slot name="header-actions"></slot>
            </div>
        </div>

        <!-- Filters Section -->
        <div v-if="showFilters" class="bg-white rounded-lg shadow-md p-6 mb-4">
            <slot name="filters"></slot>
        </div>

        <!-- Main Content -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <slot name="content"></slot>
        </div>

        <!-- Loading Overlay -->
        <Spinner v-if="loading" :title="loadingMessage" />
    </div>
</template>

<script setup>
import Spinner from '@/components/ui/Spinner.vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    showFilters: {
        type: Boolean,
        default: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    loadingMessage: {
        type: String,
        default: 'Loading report data...'
    }
});
</script>

<style scoped>
.report-layout {
    min-height: 100vh;
}
</style>

