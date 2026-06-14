import { appraisalService } from '@/services/hrm/appraisalService';
import { employeeService } from '@/services/hrm/employeeService';
import { computed, ref } from 'vue';

export function useAppraisalData() {
    const cycles = ref([]);
    const templates = ref([]);
    const questions = ref([]);
    const employees = ref([]);
    const loading = ref(false);

    // Status options based on backend model choices
    const statusOptions = ref([
        { value: 'draft', label: 'Draft' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
    ]);

    // Cycle status options based on backend model choices
    const cycleStatusOptions = ref([
        { value: 'created', label: 'Created' },
        { value: 'activated', label: 'Activated' },
        { value: 'closed', label: 'Closed' },
        { value: 'reopened', label: 'Reopened' }
    ]);

    // Question type options based on backend model choices
    const questionTypeOptions = ref([
        { value: 'text', label: 'Text' },
        { value: 'rating', label: 'Rating' },
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'yes_no', label: 'Yes/No' }
    ]);

    // Goal status options based on backend model choices
    const goalStatusOptions = ref([
        { value: 'not_started', label: 'Not Started' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ]);

    // Load all basic data for appraisals
    const loadBasics = async () => {
        loading.value = true;
        try {
            const [cyclesRes, templatesRes, questionsRes, employeesRes] = await Promise.all([
                appraisalService.getCycles(),
                appraisalService.getTemplates(),
                appraisalService.getQuestions(),
                employeeService.getEmployees()
            ]);

            cycles.value = cyclesRes.data?.results || cyclesRes.data || [];
            templates.value = templatesRes.data?.results || templatesRes.data || [];
            questions.value = questionsRes.data?.results || questionsRes.data || [];
            employees.value = employeesRes.data?.results || employeesRes.data || [];
        } catch (error) {
            console.error('Error loading appraisal basics:', error);
        } finally {
            loading.value = false;
        }
    };

    // Computed properties for filtered data
    const activeCycles = computed(() => cycles.value.filter((cycle) => cycle.status === 'activated'));

    const activeTemplates = computed(() => templates.value.filter((template) => template.is_active));

    const requiredQuestions = computed(() => questions.value.filter((question) => question.is_required));

    // Helper functions
    const getStatusDisplay = (status) => {
        const option = statusOptions.value.find((opt) => opt.value === status);
        return option ? option.label : status;
    };

    const getCycleStatusDisplay = (status) => {
        const option = cycleStatusOptions.value.find((opt) => opt.value === status);
        return option ? option.label : status;
    };

    const getQuestionTypeDisplay = (type) => {
        const option = questionTypeOptions.value.find((opt) => opt.value === type);
        return option ? option.label : type;
    };

    const getGoalStatusDisplay = (status) => {
        const option = goalStatusOptions.value.find((opt) => opt.value === status);
        return option ? option.label : status;
    };

    return {
        cycles,
        templates,
        questions,
        employees,
        statusOptions,
        cycleStatusOptions,
        questionTypeOptions,
        goalStatusOptions,
        loading,
        loadBasics,
        activeCycles,
        activeTemplates,
        requiredQuestions,
        getStatusDisplay,
        getCycleStatusDisplay,
        getQuestionTypeDisplay,
        getGoalStatusDisplay
    };
}
