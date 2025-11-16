<script setup>
import PayrollData from '@/components/hrm/payroll/payrollData.vue';
import ApprovalWorkflow from '@/components/shared/ApprovalWorkflow.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useEmployeeFilters } from '@/composables/useEmployeeFilters';
import { useFormulaManagement } from '@/composables/useFormulaManagement';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useTaskManager } from '@/composables/useTaskManager';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { formatCurrency, formatMonthForAPI, getMonthDateRange } from '@/utils/formatters';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Router and state
const route = useRoute();
const router = useRouter();
const routeParams = ref(null);
const { showToast } = useToast();
const { subscribeToTask, unsubscribeFromTask, taskHistory } = useTaskManager();

// Processing states
const isProcessing = ref(false);
const isLoading = ref(false);
const spinnerTitle = ref('Processing payroll...');

// Workflow step management
const currentStep = ref(1);
const totalSteps = 4;
const stepValidation = reactive({
    step1: false, // Payroll Period
    step2: false, // Employee Selection
    step3: false, // Data Verification
    step4: false // Process Payroll
});

// Payroll configuration
const selectedMonth = ref('');
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const DEFAULT_EMPLOYMENT_TYPES = ['regular-open', 'regular-fixed', 'intern', 'probationary'];
const selectedEmploymentTypes = ref([...DEFAULT_EMPLOYMENT_TYPES]); // Default to include regular employees
const lockedEmploymentType = ref(null);
const employmentTypeLocked = computed(() => !!lockedEmploymentType.value);
const currentPayrollMode = computed(() => lockedEmploymentType.value || 'regular');
const EMPLOYMENT_TYPE_LABELS = {
    'regular-open': 'Regular (Open-ended)',
    'regular-fixed': 'Regular (Fixed-term)',
    intern: 'Intern',
    probationary: 'Probationary',
    casual: 'Casual',
    consultant: 'Consultant'
};
const recoverAdvances = ref(true);
const showPayrollData = ref(false);

// Employee data
const runInBackground = ref(false);
const activeProcessingTaskId = ref(null);
const activeProcessingMode = ref('regular');

const employees = ref([]);
const filteredEmployees = ref([]);
const selectedEmployees = ref([]);
const employeeSearch = ref('');
const statusFilter = ref('');

// Formula management - Updated for latest Kenyan tax updates
const { formulas, currentFormulas, reliefStatus, initializeFormulas } = useFormulaManagement();

// Formula overrides
const selectedIncomeFormula = ref(null);
const selectedNssfFormula = ref(null);
const selectedShifFormula = ref(null);
const selectedLevyFormula = ref(null);

// Remove unused variables
// const payslips = ref([]);
// const totalRecords = ref(0);
// const filters = ref({...});
// const pagination = reactive({...});

// Status management
const statusTabs = computed(() => [
    {
        label: `All (${employees.value.length})`,
        value: 'all',
        count: employees.value.length
    },
    {
        label: `Active (${countStatus('active')})`,
        value: 'active',
        count: countStatus('active')
    },
    {
        label: `Pending (${countStatus('pending')})`,
        value: 'pending',
        count: countStatus('pending')
    },
    {
        label: `Complete (${countStatus('complete')})`,
        value: 'complete',
        count: countStatus('complete')
    }
]);

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();
const { buildEmployeeFilterParams } = useEmployeeFilters();

// Lifecycle
onMounted(() => {
    routeParams.value = route.params;
    loadFilters();
    fetchFormulas();
    initializeWorkflow();
});

// Workflow initialization
const initializeWorkflow = () => {
    currentStep.value = 1;
    validateCurrentStep();
};

// Step validation
const validateCurrentStep = () => {
    switch (currentStep.value) {
        case 1:
            stepValidation.step1 = !!selectedMonth.value;
            break;
        case 2:
            stepValidation.step2 = selectedEmployees.value.length > 0;
            break;
        case 3:
            stepValidation.step3 = true; // Data verification is always available
            break;
        case 4:
            // Allow processing if we have employees and month, even without custom formulas
            stepValidation.step4 = selectedEmployees.value.length > 0 && !!selectedMonth.value;
            break;
    }
};

const enforceEmploymentTypeLock = (type) => {
    if (['casual', 'consultant'].includes(type)) {
        lockedEmploymentType.value = type;
        selectedEmploymentTypes.value = [type];
    } else {
        lockedEmploymentType.value = null;
        selectedEmploymentTypes.value = [...DEFAULT_EMPLOYMENT_TYPES];
    }
};

watch(
    () => route.params?.employment_type,
    (type) => {
        enforceEmploymentTypeLock(type || 'regular');
    },
    { immediate: true }
);

// Navigation methods
const nextStep = () => {
    if (currentStep.value < totalSteps && stepValidation[`step${currentStep.value}`]) {
        currentStep.value++;
        validateCurrentStep();
        if (currentStep.value === 2) {
            fetchEmployees();
        }
    }
};

const prevStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--;
        validateCurrentStep();
    }
};

const goToStep = (step) => {
    if (step <= totalSteps && step >= 1) {
        currentStep.value = step;
        validateCurrentStep();
        if (step === 2) {
            fetchEmployees();
        }
    }
};

// Data fetching methods
const fetchFormulas = async () => {
    try {
        await initializeFormulas();

        // Set current formulas as defaults if available
        if (currentFormulas.value.income) {
            selectedIncomeFormula.value = currentFormulas.value.income;
        }
        if (currentFormulas.value.nssf) {
            selectedNssfFormula.value = currentFormulas.value.nssf;
        }
        if (currentFormulas.value.shif) {
            selectedShifFormula.value = currentFormulas.value.shif;
        }
        if (currentFormulas.value.housing_levy) {
            selectedLevyFormula.value = currentFormulas.value.housing_levy;
        }
    } catch (error) {
        console.error('Error fetching formulas:', error);
        showToast('error', 'Error', 'Failed to fetch payroll formulas', 3000);
    }
};

const fetchEmployees = async () => {
    if (!selectedMonth.value) return;

    isLoading.value = true;
    try {
    // Get the date range for the selected month (first and last day)
    const dateRange = getMonthDateRange(selectedMonth.value);

    // Centralized filter params (auto-add employee if mapped, otherwise omit)
    const params = buildEmployeeFilterParams({
        includeEmployeeFromStore: true,
        department: selectedDepartment.value,
        region: selectedRegion.value ? [selectedRegion.value] : null,
        project: selectedProject.value ? [selectedProject.value] : null,
        extra: {
            fromdate: dateRange.fromdate,
            todate: dateRange.todate,
            employment_type: selectedEmploymentTypes.value && selectedEmploymentTypes.value.length > 0
                ? selectedEmploymentTypes.value
                : undefined
        }
    });

        // Fetch employees with active contracts for the selected period
        const response = await payrollService.getPayrollEmployees(params);

        const list = response?.data?.results || response?.data || [];
        // Transform the data to match our frontend structure
        employees.value = list.map((emp) => {
            const first = emp?.user?.first_name || emp?.first_name || '';
            const last = emp?.user?.last_name || emp?.last_name || '';
            const hr0 = Array.isArray(emp?.hr_details) ? emp.hr_details[0] : null;
            const fallbackName = hr0?.employee_name || emp?.name;
            const fullName = `${first} ${last}`.trim() || fallbackName || `Employee ${emp?.id}`;

            const department = emp?.department || hr0?.department || null;
            const region = emp?.region || hr0?.region || null;
            const project = emp?.project || hr0?.project || null;
            const staffNo =
                emp?.staffNo ||
                emp?.staff_no ||
                hr0?.job_or_staff_number ||
                emp?.salary_details?.[0]?.employee?.staffNo ||
                null;
            const employmentType =
                emp?.employment_type ||
                hr0?.employment_type ||
                emp?.salary_details?.[0]?.employment_type ||
                'regular-open';

            const basicSalary =
                emp?.basic_salary ??
                emp?.salary ??
                Number(emp?.salary_details?.[0]?.monthly_salary) ??
                0;

            return {
                id: emp.id,
                staffNo,
                name: fullName,
                department,
                region,
                project,
                employmentType,
                employmentTypeLabel: getEmploymentTypeLabel(employmentType),
                basicSalary: Number(basicSalary) || 0,
                status: 'active',
                benefits: emp?.benefits || [],
                deductions: emp?.deductions || [],
                advances: emp?.advances || [],
                earnings: emp?.earnings || [],
                loans: emp?.loans || []
            };
        });

        filteredEmployees.value = [...employees.value];
        selectedEmployees.value = [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees for payroll', 3000);
    } finally {
        isLoading.value = false;
    }
};

// Filtering and search
const applyFilters = () => {
    let filtered = [...employees.value];

    // Apply department filter using actual department IDs from useHrmFilters
    if (selectedDepartment.value.length > 0) {
        filtered = filtered.filter((emp) => emp.department && selectedDepartment.value.includes(emp.department.id));
    }

    // Apply region filter using actual region ID from useHrmFilters
    if (selectedRegion.value) {
        filtered = filtered.filter((emp) => emp.region && emp.region.id === selectedRegion.value);
    }

    // Apply project filter using actual project ID from useHrmFilters
    if (selectedProject.value) {
        filtered = filtered.filter((emp) => emp.project && emp.project.id === selectedProject.value);
    }

    // Apply search filter
    if (employeeSearch.value) {
        const searchTerm = employeeSearch.value.toLowerCase();
        filtered = filtered.filter((emp) => emp.name?.toLowerCase().includes(searchTerm) || emp.staffNo?.toLowerCase().includes(searchTerm));
    }

    // Apply status filter
    if (statusFilter.value && statusFilter.value !== 'all') {
        filtered = filtered.filter((emp) => emp.status === statusFilter.value);
    }

    filteredEmployees.value = filtered;
};

// Computed date range for PayrollData component
const dateRange = computed(() => {
    if (!selectedMonth.value) {
        return { fromdate: null, todate: null };
    }
    return getMonthDateRange(selectedMonth.value);
});

// Status counting
const countStatus = (status) => {
    if (status === 'all') return employees.value.length;
    return employees.value.filter((emp) => emp.status === status).length;
};

// Employee selection
const selectAllEmployees = () => {
    selectedEmployees.value = [...filteredEmployees.value];
    validateCurrentStep();
};

// const clearEmployeeSelection = () => {
//     selectedEmployees.value = [];
//     validateCurrentStep();
// };

const clearFilters = () => {
    selectedDepartment.value = [];
    selectedRegion.value = null;
    selectedProject.value = null;
    selectedEmploymentTypes.value = employmentTypeLocked.value
        ? [lockedEmploymentType.value]
        : [...DEFAULT_EMPLOYMENT_TYPES];
    employeeSearch.value = '';
    statusFilter.value = '';
    applyFilters();
};

// Data verification
const verifyPayrollData = () => {
    showPayrollData.value = true;
};

const processSpecializedPayroll = async (mode) => {
    const handler = mode === 'casual' ? payrollService.generateCasualVoucher : payrollService.generateConsultantVoucher;
    const paymentPeriod = formatMonthForAPI(selectedMonth.value);
    const employeeIds = selectedEmployees.value.map((employee) => employee.id);

    spinnerTitle.value =
        mode === 'casual' ? 'Queueing casual voucher generation...' : 'Queueing consultant voucher generation...';
    isProcessing.value = true;
    try {
        const response = await handler(employeeIds, paymentPeriod, {
            recover_advances: recoverAdvances.value
        });

        const taskId = response?.data?.task_id;
        if (taskId) {
            handleTaskSubscription(taskId, mode);
        } else if (!runInBackground.value) {
            redirectToPayslips(mode);
        }

        showToast(
            'success',
            'Processing Started',
            response?.data?.message ||
                `Queued ${mode} payroll processing for ${selectedEmployees.value.length} employee(s).`,
            6000
        );

        if (currentStep.value < totalSteps) {
            nextStep();
        }
    } catch (error) {
        const detail = error?.response?.data?.detail || error.message || `Failed to process ${mode} payroll.`;
        showToast('error', 'Error', detail, 10000);
    } finally {
        isProcessing.value = false;
    }
};

// Payroll processing
const processPayroll = async () => {
    // Only validate that we have the minimum required data
    if (!selectedMonth.value || selectedEmployees.value.length === 0) {
        showToast('error', 'Validation Error', 'Please select a payroll month and at least one employee', 5000);
        return;
    }

    const payrollMode = currentPayrollMode.value;
    if (['casual', 'consultant'].includes(payrollMode)) {
        await processSpecializedPayroll(payrollMode);
        return;
    }

    isProcessing.value = true;
    spinnerTitle.value = `Processing payroll for ${selectedEmployees.value.length} employees...`;

    try {
        // Format the selected month to YYYY-MM-DD format for the first day of the month
        const formattedDate = formatMonthForAPI(selectedMonth.value);

        // Only include formula overrides if they are actually selected
        const formulaOverrides = {};
        if (selectedIncomeFormula.value) formulaOverrides.income = selectedIncomeFormula.value;
        if (selectedNssfFormula.value) formulaOverrides.nssf = selectedNssfFormula.value;
        if (selectedShifFormula.value) formulaOverrides.shif = selectedShifFormula.value;
        if (selectedLevyFormula.value) formulaOverrides.levy = selectedLevyFormula.value;

        const payload = {
            project: selectedProject.value,
            department: selectedDepartment.value,
            region: selectedRegion.value,
            payment_period: formattedDate,
            employee_ids: selectedEmployees.value.map((emp) => emp.id),
            recover_advances: recoverAdvances.value,
            command: 'process',
            formula_overrides: Object.keys(formulaOverrides).length > 0 ? formulaOverrides : undefined
        };

        // Use the new event-driven payroll processing
        const response = await payrollService.postPayrollCommand(payload);
        const taskId = response?.data?.task_id;

        if (response.data.success) {
            // Subscribe to task updates if task_id is provided
            if (taskId) {
                handleTaskSubscription(taskId, payrollMode);

                showToast(
                    'success',
                    'Task Queued',
                    `Payroll processing queued for ${selectedEmployees.value.length} employees. You'll receive real-time updates.`,
                    5000
                );
            } else {
                // Fallback for synchronous processing
                showToast(
                    'success',
                    'Success',
                    `Payroll processed successfully for ${selectedEmployees.value.length} employees`,
                    5000
                );
                if (!runInBackground.value) {
                    redirectToPayslips(payrollMode);
                }
            }

            // Move to next step or complete
            if (currentStep.value < totalSteps) {
                nextStep();
            }
        } else {
            showToast('error', 'Error', response.data.detail || 'Failed to process payroll', 10000);
        }
    } catch (error) {
        showToast('error', 'Error', error.message || 'Failed to process payroll', 10000);
    } finally {
        isProcessing.value = false;
    }
};

const SUCCESS_EVENTS = ['payroll_processing_completed', 'task_completed'];
const FAILURE_EVENTS = ['task_failed', 'error'];

const handleTaskSubscription = (taskId, mode) => {
    if (!taskId) return;
    if (activeProcessingTaskId.value && activeProcessingTaskId.value !== taskId) {
        cleanupTaskSubscription();
    }
    activeProcessingTaskId.value = taskId;
    activeProcessingMode.value = mode || 'regular';
    subscribeToTask(taskId);

    if (runInBackground.value) {
        showToast(
            'info',
            'Running in background',
            'Payroll processing will continue in the background. We will notify you when it completes.',
            5000
        );
    }
};

const cleanupTaskSubscription = () => {
    if (activeProcessingTaskId.value) {
        unsubscribeFromTask(activeProcessingTaskId.value);
        activeProcessingTaskId.value = null;
    }
};

const redirectToPayslips = (mode = 'regular') => {
    const routeMap = {
        casual: { name: 'casualEmployees' },
        consultant: { name: 'consultants' },
        regular: { name: 'regular-payslips' }
    };
    const target = routeMap[mode] || routeMap.regular;
    router.push(target).catch(() => {});
};

const handleProcessingEvent = (event) => {
    if (!event || !activeProcessingTaskId.value) {
        return;
    }

    if (SUCCESS_EVENTS.includes(event.type)) {
        if (!runInBackground.value) {
            redirectToPayslips(activeProcessingMode.value);
        }
        showToast('success', 'Payroll Completed', event.message || 'Payroll processing completed successfully.', 6000);
        cleanupTaskSubscription();
    } else if (FAILURE_EVENTS.includes(event.type)) {
        showToast('error', 'Payroll Failed', event.message || 'Payroll processing failed.', 8000);
        cleanupTaskSubscription();
    }
};

// Formula change handlers
const onFormulaChange = (type, value) => {
    console.log(`${type} formula changed to:`, value);
};

const getFormulaDetails = (formulaId, formulas) => {
    const formula = formulas.find((f) => f.id === formulaId);
    return formula ? formula.title : 'Unknown';
};

const getEmploymentTypeSeverity = (type) => {
    const severityMap = {
        'regular-open': 'success',
        'regular-fixed': 'info',
        intern: 'warning',
        probationary: 'warning',
        casual: 'secondary',
        consultant: 'info'
    };
    return severityMap[type] || 'info';
};

const getEmploymentTypeLabel = (type) => {
    if (!type) return 'Unknown';
    return EMPLOYMENT_TYPE_LABELS[type] || type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusSeverity = (status) => {
    const severityMap = {
        active: 'success',
        pending: 'warning',
        complete: 'info',
        expired: 'danger'
    };
    return severityMap[status] || 'info';
};

// Watchers
watch(
    taskHistory,
    (history) => {
        if (!activeProcessingTaskId.value || !Array.isArray(history) || history.length === 0) {
            return;
        }
        const matchingEvent = history.find(
            (event) =>
                event.task_id === activeProcessingTaskId.value &&
                (SUCCESS_EVENTS.includes(event.type) || FAILURE_EVENTS.includes(event.type))
        );
        if (matchingEvent) {
            handleProcessingEvent(matchingEvent);
        }
    },
    { deep: true }
);

watch(
    [selectedMonth, selectedDepartment, selectedRegion, selectedProject, selectedEmploymentTypes],
    () => {
        if (currentStep.value >= 2) {
            fetchEmployees();
        }
        validateCurrentStep();
    },
    { deep: true }
);

watch([employeeSearch, statusFilter], () => {
    applyFilters();
});

watch(selectedEmployees, () => {
    validateCurrentStep();
});

// Watch for changes in useHrmFilters data
watch(
    [departments, regions, projects],
    () => {
        // Re-apply filters when filter data changes
        if (employees.value.length > 0) {
            applyFilters();
        }
    },
    { deep: true }
);

onUnmounted(() => {
    cleanupTaskSubscription();
});

// Export functionality
const exportCSV = () => {
    // Implementation for CSV export
    console.log('Exporting CSV...');
};

// Approval workflow
const approvalSteps = ref([]);
const currentStage = ref('');
const userRole = ref('');

const handleApproval = (action) => {
    console.log('Approval action:', action);
};
</script>

<template>
    <div class="payroll-processor">
        <!-- Header -->
        <div class="header-section">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Payroll Processing</h1>
                    <p class="text-gray-600 mt-2">Process payroll for employees with active contracts</p>
                </div>
                <div class="flex items-center space-x-3">
                    <TaskStatusIndicator />
                    <router-link :to="{ name: 'formula-management' }">
                        <Button label="Formula Management" icon="pi pi-sliders-h" class="p-button-outlined p-button-info" />
                    </router-link>
                    <Button label="Help" icon="pi pi-question-circle" class="p-button-outlined p-button-secondary" @click="() => {}" />
                    <Button label="Export" icon="pi pi-download" class="p-button-outlined" @click="exportCSV" />
                </div>
            </div>
        </div>

        <!-- Progress Steps -->
        <div class="progress-section mb-8">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-4">
                        <div v-for="step in totalSteps" :key="step" class="flex items-center">
                            <div
                                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 cursor-pointer"
                                :class="{
                                    'bg-blue-600 border-blue-600 text-white': step === currentStep,
                                    'bg-green-500 border-green-500 text-white': step < currentStep && stepValidation[`step${step}`],
                                    'bg-gray-200 border-gray-300 text-gray-500': step > currentStep || !stepValidation[`step${step}`]
                                }"
                                @click="goToStep(step)"
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
                <div class="text-sm text-gray-600">Step {{ currentStep }} of {{ totalSteps }}</div>
            </div>

            <!-- Step Labels -->
            <div class="flex justify-between mt-4">
                <span class="text-sm font-medium text-gray-700">Payroll Period</span>
                <span class="text-sm font-medium text-gray-700">Employee Selection</span>
                <span class="text-sm font-medium text-gray-700">Data Verification</span>
                <span class="text-sm font-medium text-gray-700">Process Payroll</span>
            </div>
        </div>

        <!-- Step Content -->
        <div class="step-content">
            <!-- Step 1: Payroll Period -->
            <div v-if="currentStep === 1" class="step-card">
                <div class="step-header">
                    <h2 class="text-xl font-semibold text-gray-900">1. Configure Payroll Period</h2>
                    <p class="text-gray-600">Select the payroll month and basic configuration</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="form-group">
                        <label class="form-label">Payroll Month *</label>
                        <Calendar v-model="selectedMonth" view="month" dateFormat="mm/yy" placeholder="Select Month" class="w-full" :showIcon="true" @date-select="validateCurrentStep" />
                        <small class="text-gray-500">Select the month for payroll processing</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <MultiSelect v-model="selectedDepartment" :options="departments" optionLabel="title" optionValue="id" placeholder="All Departments" class="w-full" :filter="true" filterPlaceholder="Search departments" :disabled="disableDepartment" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Region</label>
                        <Dropdown v-model="selectedRegion" :options="regions" optionLabel="title" optionValue="id" placeholder="All Regions" class="w-full" :filter="true" filterPlaceholder="Search regions" :disabled="disableRegion" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Project</label>
                        <Dropdown v-model="selectedProject" :options="projects" optionLabel="name" optionValue="id" placeholder="All Projects" class="w-full" :filter="true" filterPlaceholder="Search projects" :disabled="disableProject" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Employment Types</label>
                        <MultiSelect
                            v-model="selectedEmploymentTypes"
                            :options="[
                                { value: 'regular-open', label: 'Regular (Open-ended)' },
                                { value: 'regular-fixed', label: 'Regular (Fixed-term)' },
                                { value: 'intern', label: 'Intern' },
                                { value: 'probationary', label: 'Probationary' },
                                { value: 'casual', label: 'Casual' },
                                { value: 'consultant', label: 'Consultant' }
                            ]"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Employment Types"
                            class="w-full"
                            :filter="true"
                            filterPlaceholder="Search employment types"
                            :disabled="employmentTypeLocked"
                        />
                        <small class="text-gray-500">Select which employment types to include in payroll</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Recover Advances</label>
                        <div class="flex items-center space-x-3">
                            <InputSwitch v-model="recoverAdvances" />
                            <span class="text-sm text-gray-600"> Automatically recover employee advances </span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <Button label="Next Step" icon="pi pi-arrow-right" class="p-button-primary" :disabled="!stepValidation.step1" @click="nextStep" />
                </div>
            </div>

            <!-- Step 2: Employee Selection -->
            <div v-if="currentStep === 2" class="step-card">
                <div class="step-header">
                    <h2 class="text-xl font-semibold text-gray-900">2. Select Employees</h2>
                    <p class="text-gray-600">Choose employees to include in payroll processing</p>
                </div>

                <!-- Filters Toolbar -->
                <div class="filters-toolbar mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="form-group">
                            <label class="form-label">Search Employees</label>
                            <InputText v-model="employeeSearch" placeholder="Search by name or staff number" class="w-full" :prefix="'pi pi-search'" />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <Dropdown v-model="statusFilter" :options="statusTabs" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-full" />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Actions</label>
                            <div class="flex space-x-2">
                                <Button label="Select All" icon="pi pi-check-square" class="p-button-outlined p-button-sm" @click="selectAllEmployees" />
                                <Button label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined p-button-sm" @click="clearFilters" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Refresh</label>
                            <Button label="Refresh" icon="pi pi-refresh" class="p-button-outlined w-full" @click="fetchEmployees" :loading="isLoading" />
                        </div>
                    </div>
                </div>

                <!-- Employee Selection Table -->
                <div class="employee-table-container">
                    <DataTable
                        :value="filteredEmployees"
                        v-model:selection="selectedEmployees"
                        dataKey="id"
                        :loading="isLoading"
                        :paginator="true"
                        :rows="10"
                        :rowsPerPageOptions="[10, 25, 50, 100]"
                        class="p-datatable-sm"
                        responsiveLayout="scroll"
                        selectionMode="multiple"
                        @selection-change="validateCurrentStep"
                    >
                        <template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-users text-4xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500">No employees found matching the current filters</p>
                            </div>
                        </template>

                        <template #loading>
                            <div class="text-center py-8">
                                <i class="pi pi-spinner pi-spin text-2xl text-blue-500"></i>
                                <p class="text-gray-500 mt-2">Loading employees...</p>
                            </div>
                        </template>

                        <Column selectionMode="multiple" headerStyle="width: 3rem" />

                        <Column field="staffNo" header="Staff No." sortable>
                            <template #body="{ data }">
                                <span class="font-mono text-sm">{{ data.staffNo }}</span>
                            </template>
                        </Column>

                        <Column field="name" header="Employee Name" sortable>
                            <template #body="{ data }">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <i class="pi pi-user text-blue-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">{{ data.name }}</div>
                                        <div class="text-sm text-gray-500">
                                            {{ data.department?.title || 'No Department' }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="employmentType" header="Employment Type" sortable>
                            <template #body="{ data }">
                                <Tag
                                    :value="data.employmentTypeLabel"
                                    :severity="getEmploymentTypeSeverity(data.employmentType)"
                                />
                            </template>
                        </Column>

                        <Column field="basicSalary" header="Basic Salary" sortable>
                            <template #body="{ data }">
                                <span class="font-mono text-sm"> KES {{ formatCurrency(data.basicSalary || 0) }} </span>
                            </template>
                        </Column>

                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Selection Summary -->
                <div class="selection-summary mt-4 p-4 bg-blue-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <span class="text-sm font-medium text-blue-900"> Selected: {{ selectedEmployees.length }} of {{ filteredEmployees.length }} employees </span>
                            <span class="text-sm text-blue-700">
                                Total Payroll: KES
                                {{ formatCurrency(selectedEmployees.reduce((sum, emp) => sum + (emp.basicSalary || 0), 0)) }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <Button label="Previous Step" icon="pi pi-arrow-left" class="p-button-outlined" @click="prevStep" />
                    <Button label="Next Step" icon="pi pi-arrow-right" class="p-button-primary" :disabled="!stepValidation.step2" @click="nextStep" />
                </div>
            </div>

            <!-- Step 3: Data Verification -->
            <div v-if="currentStep === 3" class="step-card">
                <div class="step-header">
                    <h2 class="text-xl font-semibold text-gray-900">3. Verify Payroll Data</h2>
                    <p class="text-gray-600">Review and verify employee payroll components before processing</p>
                </div>

                <div class="verification-content">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="verification-card">
                            <div class="card-header">
                                <i class="pi pi-users text-2xl text-blue-500"></i>
                                <h3 class="text-lg font-semibold">Employee Summary</h3>
                            </div>
                            <div class="card-content">
                                <div class="stat-item">
                                    <span class="label">Total Selected:</span>
                                    <span class="value">{{ selectedEmployees.length }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Departments:</span>
                                    <span class="value">{{ new Set(selectedEmployees.map((emp) => emp.department?.title)).size }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Total Basic Pay:</span>
                                    <span class="value">KES {{ formatCurrency(selectedEmployees.reduce((sum, emp) => sum + (emp.basicSalary || 0), 0)) }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="verification-card">
                            <div class="card-header">
                                <i class="pi pi-calculator text-2xl text-green-500"></i>
                                <h3 class="text-lg font-semibold">Payroll Components</h3>
                            </div>
                            <div class="card-content">
                                <div class="stat-item">
                                    <span class="label">Benefits:</span>
                                    <span class="value">{{ selectedEmployees.filter((emp) => emp.benefits?.length > 0).length }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Deductions:</span>
                                    <span class="value">{{ selectedEmployees.filter((emp) => emp.deductions?.length > 0).length }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Advances:</span>
                                    <span class="value">{{ selectedEmployees.filter((emp) => emp.advances?.length > 0).length }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Earnings:</span>
                                    <span class="value">{{ selectedEmployees.filter((emp) => emp.earnings?.length > 0).length }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">Loans:</span>
                                    <span class="value">{{ selectedEmployees.filter((emp) => emp.loans?.length > 0).length }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="verification-card">
                            <div class="card-header">
                                <i class="pi pi-sliders-h text-2xl text-purple-500"></i>
                                <h3 class="text-lg font-semibold">Formulas</h3>
                            </div>
                            <div class="card-content">
                                <div class="stat-item">
                                    <span class="label">Income Tax:</span>
                                    <span class="value">{{ selectedIncomeFormula ? 'Custom' : 'Default' }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">NSSF:</span>
                                    <span class="value">{{ selectedNssfFormula ? 'Custom' : 'Default' }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="label">SHIF:</span>
                                    <span class="value">{{ selectedShifFormula ? 'Custom' : 'Default' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="verification-actions mt-6">
                        <Button label="Verify Employee Data" icon="pi pi-search" class="p-button-outlined" @click="verifyPayrollData" />
                        <Button label="Generate Preview" icon="pi pi-eye" class="p-button-outlined" @click="() => {}" />
                    </div>
                </div>

                <div class="step-actions">
                    <Button label="Previous Step" icon="pi pi-arrow-left" class="p-button-outlined" @click="prevStep" />
                    <Button label="Next Step" icon="pi pi-arrow-right" class="p-button-primary" :disabled="!stepValidation.step3" @click="nextStep" />
                </div>
            </div>

            <!-- Step 4: Process Payroll -->
            <div v-if="currentStep === 4" class="step-card">
                <div class="step-header">
                    <h2 class="text-xl font-semibold text-gray-900">4. Process Payroll</h2>
                    <p class="text-gray-600">Configure final settings and process payroll for selected employees</p>
                </div>

                <div class="flex items-center space-x-3 mb-6">
                    <InputSwitch v-model="runInBackground" />
                    <span class="text-sm text-gray-600">
                        Run in background and notify me when payroll processing finishes.
                    </span>
                </div>

                <div class="processing-config">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Formula Overrides -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Formula Overrides</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Income Tax Formula</label>
                                    <Dropdown
                                        v-model="selectedIncomeFormula"
                                        :options="formulas.income"
                                        optionLabel="title"
                                        optionValue="id"
                                        placeholder="Use Default Formula"
                                        class="w-full"
                                        @change="onFormulaChange('income', selectedIncomeFormula)"
                                    />
                                    <small class="text-gray-500">
                                        {{ selectedIncomeFormula ? getFormulaDetails(selectedIncomeFormula, formulas.income) : 'Using system default' }}
                                    </small>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">NSSF Formula</label>
                                    <Dropdown v-model="selectedNssfFormula" :options="formulas.nssf" optionLabel="title" optionValue="id" placeholder="Use Default Formula" class="w-full" @change="onFormulaChange('nssf', selectedNssfFormula)" />
                                    <small class="text-gray-500">
                                        {{ selectedNssfFormula ? getFormulaDetails(selectedNssfFormula, formulas.nssf) : 'Using system default' }}
                                    </small>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">SHIF Formula</label>
                                    <Dropdown v-model="selectedShifFormula" :options="formulas.shif" optionLabel="title" optionValue="id" placeholder="Use Default Formula" class="w-full" @change="onFormulaChange('shif', selectedShifFormula)" />
                                    <small class="text-gray-500">
                                        {{ selectedShifFormula ? getFormulaDetails(selectedShifFormula, formulas.shif) : 'Using system default' }}
                                    </small>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Housing Levy Formula</label>
                                    <Dropdown
                                        v-model="selectedLevyFormula"
                                        :options="formulas.housing_levy"
                                        optionLabel="title"
                                        optionValue="id"
                                        placeholder="Use Default Formula"
                                        class="w-full"
                                        @change="onFormulaChange('levy', selectedLevyFormula)"
                                    />
                                    <small class="text-gray-500">
                                        {{ selectedLevyFormula ? getFormulaDetails(selectedLevyFormula, formulas.housing_levy) : 'Using system default' }}
                                    </small>
                                </div>
                            </div>
                        </div>

                        <!-- Relief Status Display -->
                        <div class="mt-6 p-4 border rounded-lg bg-gray-50">
                            <h4 class="text-md font-medium text-gray-900 mb-3">Relief Status</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div class="flex items-center justify-between p-2 rounded" :class="reliefStatus.personal.active ? 'bg-green-100' : 'bg-red-100'">
                                    <span class="text-sm font-medium">Personal Relief</span>
                                    <span class="text-sm" :class="reliefStatus.personal.active ? 'text-green-700' : 'text-red-700'">
                                        {{ reliefStatus.personal.active ? `KES ${reliefStatus.personal.amount}` : 'Repealed' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between p-2 rounded" :class="reliefStatus.shif.active ? 'bg-green-100' : 'bg-red-100'">
                                    <span class="text-sm font-medium">SHIF Relief</span>
                                    <span class="text-sm" :class="reliefStatus.shif.active ? 'text-green-700' : 'text-red-700'">
                                        {{ reliefStatus.shif.active ? `KES ${reliefStatus.shif.amount}` : 'Repealed' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between p-2 rounded" :class="reliefStatus.housing_levy.active ? 'bg-green-100' : 'bg-red-100'">
                                    <span class="text-sm font-medium">Housing Levy Relief</span>
                                    <span class="text-sm" :class="reliefStatus.housing_levy.active ? 'text-green-700' : 'text-red-700'">
                                        {{ reliefStatus.housing_levy.active ? `KES ${reliefStatus.housing_levy.amount}` : 'Repealed' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Processing Summary -->
                        <div class="summary-section">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Processing Summary</h3>
                            <div class="summary-card bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Payroll Month:</span>
                                        <span class="font-medium">{{
                                            selectedMonth
                                                ? new Date(selectedMonth).toLocaleDateString('en-US', {
                                                      month: 'long',
                                                      year: 'numeric'
                                                  })
                                                : 'Not selected'
                                        }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Employees:</span>
                                        <span class="font-medium">{{ selectedEmployees.length }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Total Basic Pay:</span>
                                        <span class="font-medium">KES {{ formatCurrency(selectedEmployees.reduce((sum, emp) => sum + (emp.basicSalary || 0), 0)) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Recover Advances:</span>
                                        <span class="font-medium">{{ recoverAdvances ? 'Yes' : 'No' }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Custom Formulas:</span>
                                        <span class="font-medium">{{ [selectedIncomeFormula, selectedNssfFormula, selectedShifFormula, selectedLevyFormula].filter(Boolean).length }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <Button label="Previous Step" icon="pi pi-arrow-left" class="p-button-outlined" @click="prevStep" />
                    <Button
                        :label="isProcessing ? (runInBackground ? 'Processing in background...' : 'Processing...') : 'Process Payroll'"
                        icon="pi pi-check-circle"
                        class="p-button-success"
                        :disabled="!stepValidation.step4 || isProcessing"
                        :loading="isProcessing"
                        @click="processPayroll"
                    />
                </div>
            </div>
        </div>

        <!-- Data Verification Dialog -->
        <Dialog v-model:visible="showPayrollData" :style="{ width: '90vw', maxWidth: '1200px' }" header="Verify Employee Payroll Data" :modal="true" :closable="true">
            <PayrollData
                :parentEmployees="employees"
                :filters="{
                    fromdate: dateRange.fromdate,
                    todate: dateRange.todate,
                    employment_type: selectedEmploymentTypes
                }"
            />
        </Dialog>

        <!-- Processing Spinner -->
        <Spinner :isLoading="isProcessing" :title="spinnerTitle" />

        <!-- Approval Workflow -->
        <ApprovalWorkflow :approvalSteps="approvalSteps" :currentStage="currentStage" :userRole="userRole" @approve="handleApproval" />
    </div>
</template>

<style scoped>
.payroll-processor {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-6;
}

.header-section {
    @apply mb-8;
}

.progress-section {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700;
}

.step-content {
    @apply space-y-6;
}

.step-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700;
}

.step-header {
    @apply mb-6 pb-4 border-b border-gray-200 dark:border-gray-600;
}

.step-header h2 {
    @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.step-header p {
    @apply text-gray-600 dark:text-gray-400;
}

.form-group {
    @apply space-y-2;
}

.form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.step-actions {
    @apply flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-600;
}

.filters-toolbar {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

.employee-table-container {
    @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden;
}

.selection-summary {
    @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800;
}

.verification-content {
    @apply space-y-6;
}

.verification-card {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4;
}

.card-header {
    @apply flex items-center space-x-3 mb-4;
}

.card-header h3 {
    @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.card-content {
    @apply space-y-3;
}

.stat-item {
    @apply flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0;
}

.stat-item .label {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat-item .value {
    @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}

.verification-actions {
    @apply flex space-x-4;
}

.processing-config {
    @apply space-y-6;
}

.formula-section,
.summary-section {
    @apply space-y-4;
}

.summary-card {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

/* Responsive Design */
@media (max-width: 768px) {
    .payroll-processor {
        @apply p-4;
    }

    .step-card {
        @apply p-4;
    }

    .filters-toolbar {
        @apply p-3;
    }

    .step-actions {
        @apply flex-col space-y-3;
    }

    .step-actions button {
        @apply w-full;
    }
}

/* PrimeVue Theme Integration */
:deep(.p-button) {
    @apply transition-all duration-200;
}

:deep(.p-inputtext) {
    @apply dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100;
}

:deep(.p-dropdown) {
    @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-multiselect) {
    @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-calendar) {
    @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-datatable) {
    @apply dark:bg-gray-800;
}

:deep(.p-datatable .p-datatable-header) {
    @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    @apply dark:bg-gray-800 dark:border-gray-600;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    @apply dark:border-gray-600 dark:text-gray-100;
}

:deep(.p-tag) {
    @apply dark:bg-opacity-80;
}

:deep(.p-inputswitch) {
    @apply dark:bg-gray-600;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
    @apply dark:bg-green-500;
}
</style>
