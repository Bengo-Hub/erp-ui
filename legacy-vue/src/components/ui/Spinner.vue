<script setup>
import { defineProps } from 'vue';

const spiner = defineProps({
    isLoading: {
        type: Boolean,
        default: false
    },
    title: String
});
</script>
<template>
    <!-- Loading Spinner -->
    <Dialog :visible="spiner.isLoading" modal :closable="true" class="p-d-dialog flex flex-col items-center justify-center" :style="{ width: '300px', maxWidth: '90vw' }">
        <ProgressSpinner />
        <div class="text-center mt-2">{{ spiner.title }}</div>
    </Dialog>
</template>
