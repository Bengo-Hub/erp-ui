<script setup>
import FormulaManagement from '@/components/hrm/payroll/FormulaManagement.vue';
import { useToast } from '@/composables/useToast';
import { ref } from 'vue';

// Composables
const { showToast } = useToast();

// Local state
const showHelp = ref(false);

// Methods
const exportFormulas = () => {
    // TODO: Implement formula export functionality
    showToast('info', 'Info', 'Formula export functionality coming soon');
};
</script>

<template>
    <div class="formula-management-page">
        <div class="header-section mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Payroll Formula Management</h1>
                    <p class="text-gray-600 mt-2">Manage payroll formulas and reliefs for the latest Kenyan tax regulations</p>
                </div>
                <div class="flex items-center space-x-3">
                    <Button label="Help" icon="pi pi-question-circle" class="p-button-outlined p-button-secondary" @click="showHelp = true" />
                    <Button label="Export" icon="pi pi-download" class="p-button-outlined" @click="exportFormulas" />
                </div>
            </div>
        </div>

        <!-- Formula Management Component -->
        <FormulaManagement />

        <!-- Help Dialog -->
        <Dialog v-model:visible="showHelp" modal header="Formula Management Help" :style="{ width: '600px' }">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-lg mb-2">How to Use Formula Management</h4>
                    <p class="text-gray-600">This page allows you to manage payroll formulas and reliefs for different tax periods.</p>
                </div>

                <div>
                    <h5 class="font-medium mb-2">Key Features:</h5>
                    <ul class="list-disc list-inside space-y-1 text-gray-600">
                        <li><strong>Date-based Formula Selection:</strong> Set a specific date to see which formulas are effective</li>
                        <li><strong>Formula History:</strong> View historical changes to tax formulas</li>
                        <li><strong>Relief Status:</strong> Check which reliefs are active or repealed</li>
                        <li><strong>Formula Comparison:</strong> Compare different formula versions</li>
                    </ul>
                </div>

                <div>
                    <h5 class="font-medium mb-2">Latest Updates (2025):</h5>
                    <ul class="list-disc list-inside space-y-1 text-gray-600">
                        <li>PAYE brackets updated for February 2025</li>
                        <li>NSSF contribution limits increased</li>
                        <li>SHIF relief repealed effective December 2024</li>
                        <li>Housing Levy relief repealed effective December 2024</li>
                    </ul>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.formula-management-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-6;
}

.header-section {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700;
}
</style>
