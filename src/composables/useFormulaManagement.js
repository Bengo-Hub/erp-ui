import { ref, computed } from 'vue';
import { payrollService } from '@/services/hrm/payrollService';
import { useToast } from '@/composables/useToast';
import { formatDateForAPI } from '@/utils/formatters';

export function useFormulaManagement() {
    const { showToast } = useToast();

    // State
    const formulas = ref({
        income: [],
        nssf: [],
        shif: [],
        housing_levy: []
    });
    
    const currentFormulas = ref({
        income: null,
        nssf: null,
        shif: null,
        housing_levy: null
    });
    
    const reliefStatus = ref({
        personal: { active: true, amount: 2400 },
        shif: { active: false, amount: 0, reason: 'Repealed effective Dec 2024' },
        housing_levy: { active: false, amount: 0, reason: 'Repealed effective Dec 2024' }
    });
    
    const formulaHistory = ref([]);
    const isLoading = ref(false);
    const isInitialized = ref(false);

    // Computed
    const hasCurrentFormulas = computed(() => {
        return Object.values(currentFormulas.value).some(formula => formula !== null);
    });

    const getFormulaByType = (type) => {
        return formulas.value[type] || [];
    };

    const getCurrentFormulaByType = (type) => {
        return currentFormulas.value[type];
    };

    // Methods
    const initializeFormulas = async (payrollDate = null) => {
        if (isInitialized.value) return;
        
        isLoading.value = true;
        try {
            const formattedDate = payrollDate ? formatDateForAPI(payrollDate) : null;
            
            // Fetch all formula types
            const [incomeRes, nssfRes, shifRes, levyRes] = await Promise.all([
                payrollService.getFormulasByType('income'),
                payrollService.getFormulasByType('deduction', { category: 'social_security_fund' }),
                payrollService.getFormulasByType('deduction', { category: 'shif' }),
                payrollService.getFormulasByType('levy')
            ]);

            formulas.value.income = incomeRes.data?.results || incomeRes.data || [];
            formulas.value.nssf = nssfRes.data?.results || nssfRes.data || [];
            formulas.value.shif = shifRes.data?.results || shifRes.data || [];
            formulas.value.housing_levy = levyRes.data?.results || levyRes.data || [];

            // Set current formulas
            currentFormulas.value.income = formulas.value.income.find(f => f.is_current) || formulas.value.income[0] || null;
            currentFormulas.value.nssf = formulas.value.nssf.find(f => f.is_current) || formulas.value.nssf[0] || null;
            currentFormulas.value.shif = formulas.value.shif.find(f => f.is_current) || formulas.value.shif[0] || null;
            currentFormulas.value.housing_levy = formulas.value.housing_levy.find(f => f.is_current) || formulas.value.housing_levy[0] || null;

            // Load relief status
            await loadReliefStatus(formattedDate);
            
            isInitialized.value = true;
        } catch (error) {
            console.error('Error initializing formulas:', error);
            showToast('error', 'Error', 'Failed to initialize payroll formulas');
        } finally {
            isLoading.value = false;
        }
    };

    const getEffectiveFormula = async (type, category = null, payrollDate = null, formulaId = null) => {
        try {
            const formattedDate = payrollDate ? formatDateForAPI(payrollDate) : null;
            const response = await payrollService.getEffectiveFormula(type, category, formattedDate, formulaId);
            return response.data;
        } catch (error) {
            console.error('Error getting effective formula:', error);
            showToast('error', 'Error', `Failed to get effective ${type} formula`);
            return null;
        }
    };

    const loadFormulaHistory = async (type, category = null, startDate = null, endDate = null) => {
        try {
            const formattedStartDate = startDate ? formatDateForAPI(startDate) : null;
            const formattedEndDate = endDate ? formatDateForAPI(endDate) : null;
            
            const response = await payrollService.getFormulaHistory(type, category, formattedStartDate, formattedEndDate);
            formulaHistory.value = response.data?.results || response.data || [];
            return formulaHistory.value;
        } catch (error) {
            console.error('Error loading formula history:', error);
            showToast('error', 'Error', 'Failed to load formula history');
            return [];
        }
    };

    const loadReliefStatus = async (payrollDate = null) => {
        try {
            const reliefTypes = ['Personal Relief', 'SHIF Relief', 'Housing Levy Relief'];
            const formattedDate = payrollDate ? formatDateForAPI(payrollDate) : null;
            
            const reliefPromises = reliefTypes.map(async (reliefType) => {
                const response = await payrollService.getReliefStatus(reliefType, formattedDate);
                return { type: reliefType, status: response.data };
            });
            
            const reliefResults = await Promise.all(reliefPromises);
            
            reliefResults.forEach(({ type, status }) => {
                const key = type.toLowerCase().replace(' relief', '').replace(' ', '_');
                reliefStatus.value[key] = status;
            });
        } catch (error) {
            console.error('Error loading relief status:', error);
            showToast('error', 'Error', 'Failed to load relief status');
        }
    };

    const validateFormulaTransition = async (oldFormulaId, newFormulaId) => {
        try {
            const response = await payrollService.validateFormulaTransition(oldFormulaId, newFormulaId);
            return response.data;
        } catch (error) {
            console.error('Error validating formula transition:', error);
            showToast('error', 'Error', 'Failed to validate formula transition');
            return { compatible: false, issues: [error.message] };
        }
    };

    const applyFormulaTransition = async (oldFormulaId, newFormulaId, transitionDate) => {
        try {
            const formattedDate = formatDateForAPI(transitionDate);
            const response = await payrollService.applyFormulaTransition(oldFormulaId, newFormulaId, formattedDate);
            showToast('success', 'Success', 'Formula transition applied successfully');
            return response.data;
        } catch (error) {
            console.error('Error applying formula transition:', error);
            showToast('error', 'Error', 'Failed to apply formula transition');
            return null;
        }
    };

    const migrateFormulas = async (newVersion, formulaType = null, category = null) => {
        try {
            const response = await payrollService.migrateFormulas(newVersion, formulaType, category);
            showToast('success', 'Success', `Successfully migrated ${response.data.migrated_count} formulas`);
            return response.data;
        } catch (error) {
            console.error('Error migrating formulas:', error);
            showToast('error', 'Error', 'Failed to migrate formulas');
            return null;
        }
    };

    const updateReliefStatus = async (reliefType, isActive, effectiveDate = null) => {
        try {
            const formattedDate = effectiveDate ? formatDateForAPI(effectiveDate) : null;
            const response = await payrollService.updateReliefStatus(reliefType, isActive, formattedDate);
            showToast('success', 'Success', `Relief status updated successfully`);
            return response.data;
        } catch (error) {
            console.error('Error updating relief status:', error);
            showToast('error', 'Error', 'Failed to update relief status');
            return null;
        }
    };

    const getFormulaManagementData = async () => {
        try {
            const response = await payrollService.getFormulaManagementData();
            return response.data;
        } catch (error) {
            console.error('Error getting formula management data:', error);
            showToast('error', 'Error', 'Failed to get formula management data');
            return null;
        }
    };

    const refreshFormulas = async (payrollDate = null) => {
        isInitialized.value = false;
        await initializeFormulas(payrollDate);
    };

    return {
        // State
        formulas,
        currentFormulas,
        reliefStatus,
        formulaHistory,
        isLoading,
        isInitialized,
        
        // Computed
        hasCurrentFormulas,
        getFormulaByType,
        getCurrentFormulaByType,
        
        // Methods
        initializeFormulas,
        getEffectiveFormula,
        loadFormulaHistory,
        loadReliefStatus,
        validateFormulaTransition,
        applyFormulaTransition,
        migrateFormulas,
        updateReliefStatus,
        getFormulaManagementData,
        refreshFormulas
    };
}
