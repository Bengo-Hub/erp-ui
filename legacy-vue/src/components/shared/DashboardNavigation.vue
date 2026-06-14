<template>
    <Card>
        <template #title>
            <div class="flex items-center gap-2">
                <i class="pi pi-bolt text-primary"></i>
                {{ title }}
            </div>
        </template>
        <template #content>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Button
                    v-for="action in actions"
                    :key="action.id"
                    :label="action.label"
                    :icon="action.icon"
                    class="p-button-outlined"
                    @click="handleAction(action)"
                />
            </div>
        </template>
    </Card>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
    title: {
        type: String,
        default: 'Quick Actions'
    },
    actions: {
        type: Array,
        required: true,
        validator: (value) => {
            return value.every((action) => action.id && action.label && action.icon && (action.route || action.callback));
        }
    }
});

const emit = defineEmits(['action']);

const handleAction = (action) => {
    if (action.route) {
        router.push(action.route);
    } else if (action.callback && typeof action.callback === 'function') {
        action.callback();
    }
    emit('action', action.id);
};
</script>

<style scoped>
:deep(.p-button) {
    white-space: nowrap;
}

@media (max-width: 640px) {
    :deep(.grid) {
        grid-template-columns: 1fr;
    }
}
</style>
