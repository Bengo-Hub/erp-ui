<template>
    <div class="config-form-section">
        <div v-if="title || $slots.header" class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <slot name="header">
                <div class="flex items-center gap-3">
                    <i v-if="icon" :class="[icon, 'text-2xl text-primary-500']"></i>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
                        <p v-if="subtitle" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ subtitle }}</p>
                    </div>
                </div>
            </slot>
        </div>

        <div class="config-form-content">
            <slot></slot>
        </div>

        <div v-if="$slots.footer || showActions" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <slot name="footer">
                <div class="flex justify-end gap-3">
                    <Button
                        v-if="showCancel"
                        label="Cancel"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        @click="$emit('cancel')"
                    />
                    <Button
                        v-if="showReset"
                        label="Reset"
                        icon="pi pi-refresh"
                        severity="secondary"
                        outlined
                        @click="$emit('reset')"
                    />
                    <Button
                        label="Save"
                        icon="pi pi-check"
                        @click="$emit('save')"
                        :loading="saving"
                    />
                </div>
            </slot>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        default: ''
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    showActions: {
        type: Boolean,
        default: true
    },
    showCancel: {
        type: Boolean,
        default: false
    },
    showReset: {
        type: Boolean,
        default: false
    },
    saving: {
        type: Boolean,
        default: false
    }
});

defineEmits(['save', 'cancel', 'reset']);
</script>

<style scoped>
.config-form-section {
    padding: 1.5rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid rgb(229, 231, 235);
}

.dark .config-form-section {
    background: rgb(31, 41, 55);
    border-color: rgb(55, 65, 81);
}
</style>

