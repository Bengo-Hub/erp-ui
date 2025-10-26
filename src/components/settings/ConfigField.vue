<template>
    <div class="config-field">
        <label 
            v-if="label"
            :for="inputId"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        
        <slot></slot>
        
        <small v-if="help" class="block mt-1 text-gray-600 dark:text-gray-400 text-xs">
            {{ help }}
        </small>
        
        <small v-if="error" class="block mt-1 text-red-500 text-xs">
            {{ error }}
        </small>
    </div>
</template>

<script setup>
defineProps({
    label: {
        type: String,
        default: ''
    },
    inputId: {
        type: String,
        default: ''
    },
    required: {
        type: Boolean,
        default: false
    },
    help: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    }
});
</script>

<style scoped>
.config-field {
    margin-bottom: 1rem;
}
</style>

