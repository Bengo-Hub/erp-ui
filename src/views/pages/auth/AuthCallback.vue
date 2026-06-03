<script setup>
import { handleCallback } from '@/services/auth/ssoService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const error = ref('');

onMounted(async () => {
    try {
        const { redirect } = await handleCallback();
        router.replace(redirect || '/');
    } catch (e) {
        console.error('SSO callback failed:', e);
        error.value = e?.message || 'Sign-in failed. Please try again.';
    }
});
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen">
        <div class="text-center">
            <template v-if="!error">
                <i class="pi pi-spin pi-spinner text-4xl text-primary" />
                <p class="mt-3 text-color-secondary">Signing you in…</p>
            </template>
            <template v-else>
                <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
                <p class="mt-3">{{ error }}</p>
                <a href="/" class="text-primary">Return home</a>
            </template>
        </div>
    </div>
</template>
