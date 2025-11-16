<template>
    <div class="space-y-4">
        <div class="field">
            <label class="block text-sm font-medium mb-2">Personal Email</label>
            <InputText v-model="localValue.personal_email" type="email" class="w-full" @input="emitChange" />
        </div>
        <div class="field">
            <label class="block text-sm font-medium mb-2">Mobile Phone</label>
            <InputText v-model="localValue.mobile_phone" class="w-full" @input="emitChange" />
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


