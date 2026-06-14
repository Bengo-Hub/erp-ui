<script>
export default {
    name: 'EmptyState',
    props: {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        icon: { type: String, default: 'pi pi-info-circle' }
    }
};
</script>

<template>
    <div class="flex flex-col items-center justify-center text-center p-8 border rounded-md bg-white">
        <i :class="icon" class="text-3xl text-gray-400 mb-3" />
        <h3 class="text-lg font-medium">{{ title }}</h3>
        <p v-if="description" class="text-gray-500 mt-1">{{ description }}</p>
        <div class="mt-4">
            <slot />
        </div>
    </div>
</template>

<style scoped>
</style>


