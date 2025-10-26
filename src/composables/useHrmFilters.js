import { useToast } from '@/composables/useToast';
import { coreService } from '@/services/shared/coreService';
import { computed, ref } from 'vue';

export function useHrmFilters() {
    const { showToast } = useToast();

    // Centralized filter state with better structure (removed branch since it's handled by axios headers)
    const filters = ref({
        global: { value: '' },
        department: null,
        region: null,
        project: null, // Add missing project filter
        employee: null,
        status: null,
        dateRange: null,
        search: '',
        employmentType: null,
        contractStatus: null
    });

    // Common filter options with better data structure (removed branches)
    const departments = ref([]);
    const regions = ref([]);
    const projects = ref([]);
    const employmentTypes = ref([
        { value: 'regular-open', label: 'Regular (Open-ended)' },
        { value: 'regular-fixed', label: 'Regular (Fixed-term)' },
        { value: 'intern', label: 'Intern' },
        { value: 'probationary', label: 'Probationary' },
        { value: 'casual', label: 'Casual' },
        { value: 'consultant', label: 'Consultant' }
    ]);
    const contractStatuses = ref([
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'terminated', label: 'Terminated' },
        { value: 'expired', label: 'Expired' }
    ]);
    const loading = ref(false);
    const filtersLoaded = ref(false);

    // Load all filter options (removed branches)
    const loadFilters = async (forceRefresh = false) => {
        if (filtersLoaded.value && !forceRefresh) return;

        loading.value = true;
        try {
            const [deptRes, regionRes, projectsRes] = await Promise.all([coreService.getDepartmentsV1(), coreService.getRegionsV1(), coreService.getProjectsV1()]);

            // Normalize departments (uses 'title' field)
            departments.value = (deptRes.data?.results || deptRes.data || []).map(dept => ({
                ...dept,
                title: dept.title || dept.name // Fallback to name if title missing
            }));
            
            // Normalize regions (uses 'name' field, normalize to 'title' for consistency)
            regions.value = (regionRes.data?.results || regionRes.data || []).map(region => ({
                ...region,
                title: region.name || region.title, // Map name to title for dropdown consistency
                name: region.name || region.title // Keep original name field
            }));
            
            // Normalize projects (uses 'title' field)
            projects.value = (projectsRes.data?.results || projectsRes.data || []).map(proj => ({
                ...proj,
                title: proj.title || proj.name // Fallback to name if title missing
            }));

            filtersLoaded.value = true;
        } catch (error) {
            console.error('Error loading filters:', error);
            showToast('error', error?.response?.data?.detail || error.message || 'Failed to load filter options');
        } finally {
            loading.value = false;
        }
    };

    // Enhanced filter methods
    const applyFilters = () => {
        return filters.value;
    };

    const resetFilters = () => {
        filters.value = {
            global: { value: '' },
            department: null,
            region: null,
            project: null, // Add missing project filter
            employee: null,
            status: null,
            dateRange: null,
            search: '',
            employmentType: null,
            contractStatus: null
        };
    };

    // Get filter parameters for API calls (removed branch)
    const getFilterParams = () => {
        const params = {};

        if (filters.value.department) params.department = filters.value.department;
        if (filters.value.region) params.region = filters.value.region;
        if (filters.value.employee) params.employee = filters.value.employee;
        if (filters.value.status) params.status = filters.value.status;
        if (filters.value.project) params.project = filters.value.project;
        if (filters.value.employmentType) params.employment_type = filters.value.employmentType;
        if (filters.value.contractStatus) params.contract_status = filters.value.contractStatus;
        if (filters.value.dateRange && filters.value.dateRange.length === 2) {
            params.start_date = filters.value.dateRange[0];
            params.end_date = filters.value.dateRange[1];
        }
        if (filters.value.search) params.search = filters.value.search;
        if (filters.value.global.value) params.global_search = filters.value.global.value;

        return params;
    };

    // Get specific filter values for specific use cases (removed branch)
    const getDepartmentFilter = () => filters.value.department;
    const getRegionFilter = () => filters.value.region;
    const getProjectFilter = () => filters.value.project;
    const getEmploymentTypeFilter = () => filters.value.employmentType;
    const getContractStatusFilter = () => filters.value.contractStatus;
    const getDateRangeFilter = () => filters.value.dateRange;
    const getSearchFilter = () => filters.value.search || filters.value.global.value;

    // Set specific filter values (removed branch)
    const setDepartmentFilter = (value) => {
        filters.value.department = value;
    };
    const setRegionFilter = (value) => {
        filters.value.region = value;
    };
    const setProjectFilter = (value) => {
        filters.value.project = value;
    };
    const setEmploymentTypeFilter = (value) => {
        filters.value.employmentType = value;
    };
    const setContractStatusFilter = (value) => {
        filters.value.contractStatus = value;
    };
    const setDateRangeFilter = (value) => {
        filters.value.dateRange = value;
    };
    const setSearchFilter = (value) => {
        filters.value.search = value;
        filters.value.global.value = value;
    };

    // Computed properties (removed branch)
    const hasActiveFilters = computed(() => {
        return (
            filters.value.department ||
            filters.value.region ||
            filters.value.project ||
            filters.value.employee ||
            filters.value.status ||
            filters.value.dateRange ||
            filters.value.search ||
            filters.value.global.value ||
            filters.value.employmentType ||
            filters.value.contractStatus
        );
    });

    const activeFilterCount = computed(() => {
        let count = 0;
        if (filters.value.department) count++;
        if (filters.value.region) count++;
        if (filters.value.project) count++;
        if (filters.value.employee) count++;
        if (filters.value.status) count++;
        if (filters.value.dateRange) count++;
        if (filters.value.search) count++;
        if (filters.value.global.value) count++;
        if (filters.value.employmentType) count++;
        if (filters.value.contractStatus) count++;
        return count;
    });

    // Watch for filter changes and emit events if needed
    // Commented out to prevent infinite loops - not currently used
    // const watchFilters = (callback) => {
    //     return watch(filters, callback, { deep: true });
    // };

    return {
        // State
        filters,
        departments,
        regions,
        projects,
        employmentTypes,
        contractStatuses,
        loading,
        filtersLoaded,

        // Methods
        loadFilters,
        applyFilters,
        resetFilters,
        getFilterParams,

        // Getter methods
        getDepartmentFilter,
        getRegionFilter,
        getProjectFilter,
        getEmploymentTypeFilter,
        getContractStatusFilter,
        getDateRangeFilter,
        getSearchFilter,

        // Setter methods
        setDepartmentFilter,
        setRegionFilter,
        setProjectFilter,
        setEmploymentTypeFilter,
        setContractStatusFilter,
        setDateRangeFilter,
        setSearchFilter,

        // Computed
        hasActiveFilters,
        activeFilterCount
    };
}
