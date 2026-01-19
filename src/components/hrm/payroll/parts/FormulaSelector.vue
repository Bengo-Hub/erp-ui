<script setup>
import { useFormulaManagement } from '@/composables/useFormulaManagement';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { formatDate } from '@/utils/formatters';
import { computed, ref, watch } from 'vue';

// Props
const props = defineProps({
    formulas: {
        type: Array,
        default: () => []
    },
    currentFormula: {
        type: Object,
        default: null
    },
    formulaType: {
        type: String,
        required: true
    }
});

// Emits
const emit = defineEmits(['formula-selected']);

// Composables
const { loadFormulaHistory } = useFormulaManagement();
const { formatCurrencySync } = useGlobalCurrency();

// Helper function for formatting currency
const formatFormulaAmount = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

// Local state
const selectedFormulaId = ref(null);
const showFormulaDetails = ref(false);
const showHistory = ref(false);
const showComparison = ref(false);
const isLoadingHistory = ref(false);
const formulaHistory = ref([]);
const historyStartDate = ref(null);
const historyEndDate = ref(null);

// Computed
const formulaOptions = computed(() => {
    return props.formulas.map((formula) => ({
        label: `${formula.title} (${formula.version || 'N/A'})`,
        value: formula.id
    }));
});

// Methods
const getFormulaTypeLabel = (type) => {
    const labels = {
        income: 'PAYE',
        nssf: 'NSSF',
        shif: 'SHIF',
        housing_levy: 'Housing Levy'
    };
    return labels[type] || type;
};

const handleFormulaChange = () => {
    const selectedFormula = props.formulas.find((f) => f.id === selectedFormulaId.value);
    if (selectedFormula) {
        emit('formula-selected', props.formulaType, selectedFormula);
    }
};

const selectFormula = (formula) => {
    selectedFormulaId.value = formula.id;
    emit('formula-selected', props.formulaType, formula);
};

const fetchFormulaHistory = async () => {
    isLoadingHistory.value = true;
    try {
        const startDate = historyStartDate.value;
        const endDate = historyEndDate.value;
        const history = await loadFormulaHistory(props.formulaType, null, startDate, endDate);
        formulaHistory.value = history;
    } finally {
        isLoadingHistory.value = false;
    }
};

// Watchers
watch(
    () => props.currentFormula,
    (newFormula) => {
        if (newFormula) {
            selectedFormulaId.value = newFormula.id;
        }
    },
    { immediate: true }
);
</script>

<template>
    <div class="formula-selector">
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-medium">{{ getFormulaTypeLabel(formulaType) }} Formulas</h4>
            <div class="flex gap-2">
                <Button icon="pi pi-eye" @click="showFormulaDetails = true" :disabled="!currentFormula" label="View Details" severity="info" size="small" />
                <Button icon="pi pi-history" @click="showHistory = true" label="History" severity="secondary" size="small" />
            </div>
        </div>

        <!-- Current Formula Display -->
        <div v-if="currentFormula" class="mb-4 p-4 border rounded-lg bg-blue-50">
            <div class="flex items-center justify-between">
                <div>
                    <h5 class="font-semibold text-blue-800">{{ currentFormula.title }}</h5>
                    <p class="text-sm text-blue-600">
                        Version: {{ currentFormula.version || 'N/A' }} | Effective: {{ formatDate(currentFormula.effective_from) }}
                        <span v-if="currentFormula.effective_to"> - {{ formatDate(currentFormula.effective_to) }}</span>
                    </p>
                    <p v-if="currentFormula.regulatory_source" class="text-xs text-blue-500 mt-1">Source: {{ currentFormula.regulatory_source }}</p>
                </div>
                <Tag value="Current" severity="success" />
            </div>
        </div>

        <!-- Formula Selection -->
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Select {{ getFormulaTypeLabel(formulaType) }} Formula </label>
            <Dropdown v-model="selectedFormulaId" :options="formulaOptions" optionLabel="label" optionValue="value" placeholder="Choose a formula" class="w-full" @change="handleFormulaChange" />
        </div>

        <!-- Formula Comparison -->
        <div v-if="showComparison && formulas.length > 1" class="mt-4">
            <h5 class="font-medium mb-2">Formula Comparison</h5>
            <DataTable :value="formulas" class="p-datatable-sm" :rows="5" paginator>
                <Column field="title" header="Formula"></Column>
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
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button icon="pi pi-check" @click="selectFormula(data)" :disabled="data.id === currentFormula?.id" size="small" severity="success" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Formula Details Dialog -->
        <Dialog v-model:visible="showFormulaDetails" modal :header="currentFormula?.title" :style="{ width: '800px' }">
            <div v-if="currentFormula" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Title</label>
                        <p class="text-sm text-gray-900">{{ currentFormula.title }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Version</label>
                        <p class="text-sm text-gray-900">{{ currentFormula.version || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Effective From</label>
                        <p class="text-sm text-gray-900">{{ formatDate(currentFormula.effective_from) }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Effective To</label>
                        <p class="text-sm text-gray-900">{{ currentFormula.effective_to ? formatDate(currentFormula.effective_to) : 'Current' }}</p>
                    </div>
                    <div v-if="currentFormula.regulatory_source">
                        <label class="block text-sm font-medium text-gray-700">Regulatory Source</label>
                        <p class="text-sm text-gray-900">{{ currentFormula.regulatory_source }}</p>
                    </div>
                    <div v-if="currentFormula.notes">
                        <label class="block text-sm font-medium text-gray-700">Notes</label>
                        <p class="text-sm text-gray-900">{{ currentFormula.notes }}</p>
                    </div>
                </div>

                <!-- Formula Items -->
                <div v-if="currentFormula.formulaitems && currentFormula.formulaitems.length > 0">
                    <h6 class="font-medium mb-2">Formula Items</h6>
                    <DataTable :value="currentFormula.formulaitems" class="p-datatable-sm">
                        <Column field="amount_from" header="From Amount">
                            <template #body="{ data }">
                                {{ formatFormulaAmount(data.amount_from) }}
                            </template>
                        </Column>
                        <Column field="amount_to" header="To Amount">
                            <template #body="{ data }">
                                {{ data.amount_to ? formatFormulaAmount(data.amount_to) : '∞' }}
                            </template>
                        </Column>
                        <Column field="deduct_percentage" header="Rate (%)">
                            <template #body="{ data }"> {{ data.deduct_percentage }}% </template>
                        </Column>
                        <Column field="deduct_amount" header="Fixed Amount">
                            <template #body="{ data }">
                                {{ data.deduct_amount ? formatFormulaAmount(data.deduct_amount) : 'N/A' }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </Dialog>

        <!-- History Dialog -->
        <Dialog v-model:visible="showHistory" modal header="Formula History" :style="{ width: '900px' }">
            <div class="space-y-4">
                <div class="flex gap-2 mb-4">
                    <Calendar v-model="historyStartDate" dateFormat="yy-mm-dd" placeholder="Start Date" showIcon />
                    <Calendar v-model="historyEndDate" dateFormat="yy-mm-dd" placeholder="End Date" showIcon />
                    <Button icon="pi pi-search" @click="fetchFormulaHistory" :loading="isLoadingHistory" label="Search" severity="primary" />
                </div>

                <DataTable :value="formulaHistory" :loading="isLoadingHistory" class="p-datatable-sm">
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
        </Dialog>
    </div>
</template>

<style scoped>
.formula-selector {
    @apply space-y-4;
}
</style>
