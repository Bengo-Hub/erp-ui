<template>
    <div class="process-payroll-steps">
        <!-- Progress Steps -->
        <div class="progress-section mb-8">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-4">
                        <div 
                            v-for="step in totalSteps" 
                            :key="step"
                            class="flex items-center"
                        >
                            <div 
                                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 cursor-pointer"
                                :class="{
                                    'bg-blue-600 border-blue-600 text-white': step === currentStep,
                                    'bg-green-500 border-green-500 text-white': step < currentStep && stepValidation[`step${step}`],
                                    'bg-gray-200 border-gray-300 text-gray-500': step > currentStep || !stepValidation[`step${step}`]
                                }"
                                @click="$emit('go-to-step', step)"
                            >
                                <i v-if="step < currentStep && stepValidation[`step${step}`]" class="pi pi-check text-sm"></i>
                                <span v-else class="text-sm font-semibold">{{ step }}</span>
                            </div>
                            <div 
                                v-if="step < totalSteps"
                                class="w-16 h-1 mx-2 transition-all duration-200"
                                :class="{
                                    'bg-green-500': step < currentStep && stepValidation[`step${step}`],
                                    'bg-blue-600': step === currentStep,
                                    'bg-gray-300': step > currentStep || !stepValidation[`step${step}`]
                                }"
                            ></div>
                        </div>
                    </div>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Step {{ currentStep }} of {{ totalSteps }}
                </div>
            </div>
            
            <!-- Step Labels -->
            <div class="flex justify-between mt-4">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Payroll Period</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Employee Selection</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Data Verification</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Process Payroll</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    currentStep: {
        type: Number,
        required: true
    },
    totalSteps: {
        type: Number,
        required: true
    },
    stepValidation: {
        type: Object,
        required: true
    }
});

defineEmits(['go-to-step']);
</script>

<style scoped>
@reference '@/assets/tailwind.css';

.process-payroll-steps {
    @apply w-full;
}

.progress-section {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700;
}
</style>
