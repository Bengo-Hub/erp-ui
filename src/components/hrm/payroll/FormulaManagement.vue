<template>
    <div class="formula-management">
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Payroll Formula Management</h2>
                <div class="flex gap-2">
                    <Button 
                        icon="pi pi-refresh" 
                        @click="refreshFormulas" 
                        :loading="isLoading"
                        label="Refresh"
                        severity="secondary"
                    />
                    <Button 
                        icon="pi pi-calendar" 
                        @click="showDatePicker = true"
                        label="Set Date"
                        severity="info"
                    />
                </div>
            </div>

            <!-- Date Picker Dialog -->
            <Dialog v-model:visible="showDatePicker" modal header="Select Payroll Date" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <Calendar 
                        v-model="selectedPayrollDate" 
                        dateFormat="yy-mm-dd"
                        placeholder="Select payroll date"
                        showIcon
                    />
                    <div class="text-sm text-gray-600">
                        This will determine which formulas are effective for the selected date.
                    </div>
                </div>
                <template #footer>
                    <Button label="Cancel" @click="showDatePicker = false" severity="secondary" />
                    <Button label="Apply" @click="applyPayrollDate" severity="primary" />
                </template>
            </Dialog>

            <!-- Formula Status Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="p-4 border rounded-lg bg-blue-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-blue-800">PAYE Formula</h3>
                            <p class="text-sm text-blue-600">{{ currentFormulas.income?.title || 'Not set' }}</p>
                        </div>
                        <i class="pi pi-dollar text-blue-500 text-xl"></i>
                    </div>
                </div>
                
                <div class="p-4 border rounded-lg bg-green-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-green-800">NSSF Formula</h3>
                            <p class="text-sm text-green-600">{{ currentFormulas.nssf?.title || 'Not set' }}</p>
                        </div>
                        <i class="pi pi-shield text-green-500 text-xl"></i>
                    </div>
                </div>
                
                <div class="p-4 border rounded-lg bg-purple-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-purple-800">SHIF Formula</h3>
                            <p class="text-sm text-purple-600">{{ currentFormulas.shif?.title || 'Not set' }}</p>
                        </div>
                        <i class="pi pi-heart text-purple-500 text-xl"></i>
                    </div>
                </div>
                
                <div class="p-4 border rounded-lg bg-orange-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-orange-800">Housing Levy</h3>
                            <p class="text-sm text-orange-600">{{ currentFormulas.housing_levy?.title || 'Not set' }}</p>
                        </div>
                        <i class="pi pi-home text-orange-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Relief Status -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3">Relief Status</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-3 border rounded-lg" :class="reliefStatus.personal.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium">Personal Relief</h4>
                                <p class="text-sm" :class="reliefStatus.personal.active ? 'text-green-600' : 'text-red-600'">
                                    {{ reliefStatus.personal.active ? `KES ${reliefStatus.personal.amount}` : reliefStatus.personal.reason }}
                                </p>
                            </div>
                            <i :class="reliefStatus.personal.active ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
                        </div>
                    </div>
                    
                    <div class="p-3 border rounded-lg" :class="reliefStatus.shif.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium">SHIF Relief</h4>
                                <p class="text-sm" :class="reliefStatus.shif.active ? 'text-green-600' : 'text-red-600'">
                                    {{ reliefStatus.shif.active ? `KES ${reliefStatus.shif.amount}` : reliefStatus.shif.reason }}
                                </p>
                            </div>
                            <i :class="reliefStatus.shif.active ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
                        </div>
                    </div>
                    
                    <div class="p-3 border rounded-lg" :class="reliefStatus.housing_levy.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium">Housing Levy Relief</h4>
                                <p class="text-sm" :class="reliefStatus.housing_levy.active ? 'text-green-600' : 'text-red-600'">
                                    {{ reliefStatus.housing_levy.active ? `KES ${reliefStatus.housing_levy.amount}` : reliefStatus.housing_levy.reason }}
                                </p>
                            </div>
                            <i :class="reliefStatus.housing_levy.active ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formula Selection Tabs -->
            <TabView>
                <TabPanel header="PAYE Formulas">
                    <FormulaSelector 
                        :formulas="formulas.income"
                        :current-formula="currentFormulas.income"
                        formula-type="income"
                        @formula-selected="handleFormulaSelection"
                    />
                </TabPanel>
                
                <TabPanel header="NSSF Formulas">
                    <FormulaSelector 
                        :formulas="formulas.nssf"
                        :current-formula="currentFormulas.nssf"
                        formula-type="nssf"
                        @formula-selected="handleFormulaSelection"
                    />
                </TabPanel>
                
                <TabPanel header="SHIF Formulas">
                    <FormulaSelector 
                        :formulas="formulas.shif"
                        :current-formula="currentFormulas.shif"
                        formula-type="shif"
                        @formula-selected="handleFormulaSelection"
                    />
                </TabPanel>
                
                <TabPanel header="Housing Levy">
                    <FormulaSelector 
                        :formulas="formulas.housing_levy"
                        :current-formula="currentFormulas.housing_levy"
                        formula-type="housing_levy"
                        @formula-selected="handleFormulaSelection"
                    />
                </TabPanel>
            </TabView>

            <!-- Formula History -->
            <div class="mt-6">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold">Formula History</h3>
                    <div class="flex gap-2">
                        <Dropdown 
                            v-model="selectedHistoryType" 
                            :options="historyTypeOptions" 
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select formula type"
                            class="w-48"
                        />
                        <Button 
                            icon="pi pi-history" 
                            @click="loadHistory"
                            :loading="isLoadingHistory"
                            label="Load History"
                            severity="secondary"
                        />
                    </div>
                </div>
                
                <DataTable 
                    :value="formulaHistory" 
                    :loading="isLoadingHistory"
                    class="p-datatable-sm"
                >
                    <Column field="title" header="Formula Title"></Column>
                    <Column field="version" header="Version"></Column>
                    <Column field="effective_from" header="Effective From">
                        <template #body="{ data }">
                            {{ formatDate(data.effective_from) }}
                        </template>
                    </Column>
                    <Column field="effective_to" header="Effective To">
                        <template #body="{ data }">
                            {{ data.effective_to ? formatDate(data.effective_to) : 'Current' }}
                        </template>
                    </Column>
                    <Column field="is_current" header="Status">
                        <template #body="{ data }">
                            <Tag :value="data.is_current ? 'Current' : 'Historical'" :severity="data.is_current ? 'success' : 'secondary'" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useFormulaManagement } from '@/composables/useFormulaManagement';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import FormulaSelector from './parts/FormulaSelector.vue';

// Composables
const {
    formulas,
    currentFormulas,
    reliefStatus,
    formulaHistory,
    isLoading,
    isInitialized,
    initializeFormulas,
    loadFormulaHistory,
    refreshFormulas
} = useFormulaManagement();

// Local state
const showDatePicker = ref(false);
const selectedPayrollDate = ref(new Date());
const selectedHistoryType = ref('income');
const isLoadingHistory = ref(false);

// Computed
const historyTypeOptions = computed(() => [
    { label: 'PAYE Formulas', value: 'income' },
    { label: 'NSSF Formulas', value: 'nssf' },
    { label: 'SHIF Formulas', value: 'shif' },
    { label: 'Housing Levy', value: 'housing_levy' }
]);

// Methods
const handleFormulaSelection = (formulaType, formula) => {
    // Update the current formula for the selected type
    currentFormulas.value[formulaType] = formula;
};

const applyPayrollDate = async () => {
    showDatePicker.value = false;
    await refreshFormulas(selectedPayrollDate.value);
};

const loadHistory = async () => {
    if (!selectedHistoryType.value) return;
    
    isLoadingHistory.value = true;
    try {
        await loadFormulaHistory(selectedHistoryType.value);
    } finally {
        isLoadingHistory.value = false;
    }
};

// Lifecycle
onMounted(async () => {
    await initializeFormulas();
});
</script>

<style scoped>
@reference '@/assets/tailwind.css';

.formula-management {
    @apply space-y-4;
}
</style>
