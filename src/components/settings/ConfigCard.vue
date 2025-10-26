<template>
    <Card 
        :class="['config-card hover:shadow-lg transition-all', clickable ? 'cursor-pointer' : '']"
        @click="handleClick"
    >
        <template #header>
            <div :class="['p-6', headerGradient || 'bg-gradient-to-r from-primary-500 to-primary-700']">
                <i :class="['text-white text-4xl', icon]"></i>
            </div>
        </template>
        <template #title>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
        </template>
        <template #content>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {{ description }}
            </p>
            <div v-if="badges && badges.length > 0" class="flex flex-wrap gap-2">
                <Badge v-for="badge in badges" :key="badge" :value="badge" severity="info" />
            </div>
            <slot></slot>
        </template>
        <template #footer v-if="clickable">
            <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                <span>{{ actionLabel }}</span>
                <i class="pi pi-arrow-right ml-2"></i>
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
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    headerGradient: {
        type: String,
        default: ''
    },
    badges: {
        type: Array,
        default: () => []
    },
    clickable: {
        type: Boolean,
        default: false
    },
    routePath: {
        type: String,
        default: ''
    },
    actionLabel: {
        type: String,
        default: 'Configure'
    }
});

const emit = defineEmits(['click']);

const handleClick = () => {
    if (props.clickable) {
        if (props.routePath) {
            router.push(props.routePath);
        }
        emit('click');
    }
};
</script>

<style scoped>
.config-card {
    height: 100%;
}
</style>

