<template>
    <div class="space-y-4">
        <div class="field">
            <label class="block text-sm font-medium mb-2">Name</label>
            <InputText v-model="localValue.name" class="w-full" @input="emitChange" />
        </div>
        <div class="field">
            <label class="block text-sm font-medium mb-2">Relation</label>
            <InputText v-model="localValue.relation" class="w-full" @input="emitChange" />
        </div>
        <div class="field">
            <label class="block text-sm font-medium mb-2">Phone</label>
            <InputText v-model="localValue.phone" class="w-full" @input="emitChange" />
        </div>
        <div class="field">
            <label class="block text-sm font-medium mb-2">Email</label>
            <InputText v-model="localValue.email" type="email" class="w-full" @input="emitChange" />
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({})
    }
});
const emit = defineEmits(['update:modelValue']);

const localValue = reactive({ ...props.modelValue });

watch(() => props.modelValue, (nv) => {
    Object.assign(localValue, nv || {});
});

function emitChange() {
    emit('update:modelValue', { ...localValue });
}
</script>

<style scoped>
</style>


