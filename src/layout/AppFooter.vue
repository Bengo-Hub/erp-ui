<script setup></script>

<script setup>
import { ref } from 'vue';
const year_now = ref(new Date().getFullYear());
</script>
<template>
    <div class="layout-footer">
        Copyright &copy; {{ year_now }}
        <a href="https://codevertexitsolutions.com" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Codevertex Africa Limited. All Rights reserved.</a>
    </div>
</template>
