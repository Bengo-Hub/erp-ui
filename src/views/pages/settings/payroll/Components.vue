<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const category = ref(null);
const categories = [
    { label: 'Earnings', value: 'Earnings' },
    { label: 'Benefits', value: 'Benefits' },
    { label: 'Deductions', value: 'Deductions' },
    { label: 'Loans', value: 'Loans' },
    { label: 'BasicPay', value: 'BasicPay' }
];

const items = ref([]);

const fetchComponents = async () => {
    if (!category.value) {
        items.value = [];
        showToast('info', 'Please select a category', 'Select a category to view components');
        return;
    }
    
    loading.value = true;
    try {
        const response = await payrollService.listPayrollComponents({ category: category.value });
        // Backend returns array directly
        items.value = response.data.results || response.data || [];
        
        if (items.value.length === 0) {
            showToast('info', 'No components found', `No components found for category: ${category.value}`);
        }
    } catch (error) {
        console.error('Error fetching payroll components:', error);
        showToast('error', 'Failed to load components', error?.response?.data?.detail || error.message);
        items.value = [];
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="payroll-components-container">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll Components</h2>
                <p class="text-gray-600 dark:text-gray-400">View payroll components by category</p>
            </div>
            <div class="flex gap-3">
                <Dropdown 
                    v-model="category" 
                    :options="categories" 
                    optionLabel="label" 
                    optionValue="value" 
                    placeholder="Select Category" 
                    class="w-64"
                    @change="fetchComponents"
                />
                <Button 
                    label="Refresh" 
                    icon="pi pi-refresh" 
                    severity="secondary"
                    outlined
                    @click="fetchComponents" 
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Components Table -->
        <Card>
            <template #content>
                <DataTable 
                    :value="items" 
                    :loading="loading"
                    :paginator="true" 
                    :rows="10" 
                    :rowsPerPageOptions="[10, 25, 50]"
                    responsiveLayout="scroll"
                >
                    <template #empty>
                        <div class="text-center py-12">
                            <i class="pi pi-calculator text-6xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600 dark:text-gray-400 text-lg">
                                {{ category ? 'No components found for this category' : 'Select a category to view components' }}
                            </p>
                        </div>
                    </template>

                    <Column header="#" style="width: 60px">
                        <template #body="{ index }">
                            <span class="text-gray-600 dark:text-gray-400">{{ index + 1 }}</span>
                        </template>
                    </Column>
                    
                    <Column field="title" header="Component Title" sortable>
                        <template #body="{ data }">
                            <div class="font-semibold text-gray-900 dark:text-gray-100">
                                {{ data.title }}
                            </div>
                        </template>
                    </Column>
                    
                    <Column field="mode" header="Mode" sortable>
                        <template #body="{ data }">
                            <Badge :value="data.mode" severity="info" />
                        </template>
                    </Column>
                    
                    <Column field="checkoff" header="Checkoff" sortable>
                        <template #body="{ data }">
                            <Badge 
                                :value="data.checkoff ? 'Yes' : 'No'" 
                                :severity="data.checkoff ? 'success' : 'secondary'"
                            />
                        </template>
                    </Column>
                    
                    <Column field="statutory" header="Statutory" sortable>
                        <template #body="{ data }">
                            <Badge 
                                :value="data.statutory ? 'Yes' : 'No'" 
                                :severity="data.statutory ? 'warning' : 'secondary'"
                            />
                        </template>
                    </Column>

                    <Column field="wb_code" header="WB Code">
                        <template #body="{ data }">
                            <code class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                {{ data.wb_code || 'N/A' }}
                            </code>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>
