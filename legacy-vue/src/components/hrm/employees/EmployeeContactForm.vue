<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
                <label class="block text-sm font-medium mb-2">Personal Email</label>
                <InputText v-model="localValue.personal_email" type="email" class="w-full" @input="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Mobile Phone</label>
                <InputText v-model="localValue.mobile_phone" class="w-full" @input="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Official Phone</label>
                <InputText v-model="localValue.official_phone" class="w-full" @input="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Country</label>
                <Dropdown v-model="localValue.country" :options="countries" optionLabel="name" optionValue="code" placeholder="Select Country" class="w-full" @change="emitChange" filter />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">County/State</label>
                <InputText v-model="localValue.county" class="w-full" @input="emitChange" placeholder="e.g., Nairobi" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">City</label>
                <InputText v-model="localValue.city" class="w-full" @input="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">ZIP/Postal Code</label>
                <InputText v-model="localValue.zip" class="w-full" @input="emitChange" />
            </div>
            <div class="field md:col-span-2">
                <label class="block text-sm font-medium mb-2">Physical Address</label>
                <Textarea v-model="localValue.address" rows="2" class="w-full" @input="emitChange" placeholder="Street address, building, etc." />
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

// Common countries for East Africa region
const countries = ref([
    { name: 'Kenya', code: 'KE' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Burundi', code: 'BI' },
    { name: 'South Sudan', code: 'SS' },
    { name: 'Ethiopia', code: 'ET' },
    { name: 'Somalia', code: 'SO' },
    { name: 'Democratic Republic of Congo', code: 'CD' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Egypt', code: 'EG' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'United States', code: 'US' },
    { name: 'India', code: 'IN' },
    { name: 'China', code: 'CN' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Other', code: 'XX' }
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


