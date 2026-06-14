<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div class="text-center">
            <div class="mb-8">
                <i class="pi pi-ban text-8xl text-red-500 mb-4"></i>
                <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-2">Access Denied</h1>
                <p class="text-lg text-surface-600 dark:text-surface-400 mb-8">
                    You don't have permission to access this resource.
                </p>
            </div>
            
            <div class="space-y-4">
                <Button 
                    label="Go Back" 
                    @click="goBack" 
                    icon="pi pi-arrow-left"
                    class="mr-2"
                />
                <Button 
                    label="Go to Dashboard" 
                    @click="goToDashboard" 
                    icon="pi pi-home"
                    severity="secondary"
                />
            </div>
            
            <div class="mt-8 text-sm text-surface-500 dark:text-surface-400">
                <p>If you believe this is an error, please contact your administrator.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        router.push('/');
    }
};

const goToDashboard = () => {
    router.push('/');
};
</script>