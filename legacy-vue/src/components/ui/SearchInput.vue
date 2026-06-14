<script>
export default {
    name: 'SearchInput',
    emits: ['update:modelValue', 'search'],
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: 'Search...' }
    },
    methods: {
        onInput(event) {
            this.$emit('update:modelValue', event.target.value);
        },
        onEnter() {
            this.$emit('search', this.modelValue);
        }
    }
};
</script>

<template>
    <div class="flex items-center gap-2">
        <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <input
                :value="modelValue"
                type="text"
                class="p-inputtext p-component w-full"
                :placeholder="placeholder"
                @input="onInput"
                @keyup.enter="onEnter"
            />
        </span>
        <Button label="Search" icon="pi pi-search" @click="onEnter" />
    </div>
    
</template>

<style scoped>
</style>


