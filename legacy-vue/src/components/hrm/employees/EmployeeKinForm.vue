<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
                <label class="block text-sm font-medium mb-2">Full Name</label>
                <InputText v-model="localValue.name" class="w-full" @input="emitChange" placeholder="Next of kin's full name" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Relationship</label>
                <Dropdown v-model="localValue.relation" :options="relationOptions" optionLabel="label" optionValue="value" placeholder="Select Relationship" class="w-full" editable @change="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Phone Number</label>
                <InputText v-model="localValue.phone" class="w-full" @input="emitChange" placeholder="+254..." />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Email Address</label>
                <InputText v-model="localValue.email" type="email" class="w-full" @input="emitChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({})
    }
});
const emit = defineEmits(['update:modelValue']);

const localValue = reactive({ ...props.modelValue });

const relationOptions = ref([
    { label: 'Spouse', value: 'Spouse' },
    { label: 'Parent', value: 'Parent' },
    { label: 'Sibling', value: 'Sibling' },
    { label: 'Child', value: 'Child' },
    { label: 'Guardian', value: 'Guardian' },
    { label: 'Friend', value: 'Friend' },
    { label: 'Other', value: 'Other' }
]);

watch(() => props.modelValue, (nv) => {
    Object.assign(localValue, nv || {});
});

function emitChange() {
    emit('update:modelValue', { ...localValue });
}
</script>

<style scoped>
</style>


