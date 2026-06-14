/**
 * Centralized pagination composable for consistent data handling
 * Supports data accumulation while maintaining proper pagination
 */
import { computed, ref, watch } from 'vue'

export function usePagination(options = {}) {
    const {
        pageSize = 100,
        initialPage = 1,
        enableAccumulation = true,
        resetOnRefresh = true
    } = options

    // Pagination state
    const currentPage = ref(initialPage)
    const pageSizeRef = ref(pageSize)
    const totalRecords = ref(0)
    const isLoading = ref(false)
    
    // Data accumulation
    const allData = ref([]) // Accumulated data across all pages
    const currentPageData = ref([]) // Current page data only
    
    // Computed properties
    const totalPages = computed(() => Math.ceil(totalRecords.value / pageSizeRef.value))
    const hasNextPage = computed(() => currentPage.value < totalPages.value)
    const hasPreviousPage = computed(() => currentPage.value > 1)
    
    // Pagination info
    const paginationInfo = computed(() => ({
        currentPage: currentPage.value,
        pageSize: pageSizeRef.value,
        totalRecords: totalRecords.value,
        totalPages: totalPages.value,
        hasNextPage: hasNextPage.value,
        hasPreviousPage: hasPreviousPage.value,
        startRecord: (currentPage.value - 1) * pageSizeRef.value + 1,
        endRecord: Math.min(currentPage.value * pageSizeRef.value, totalRecords.value)
    }))

    /**
     * Update data from API response
     * @param {Object} response - API response with pagination info
     * @param {Array} response.results - Current page data
     * @param {number} response.count - Total records
     * @param {string} response.next - Next page URL
     * @param {string} response.previous - Previous page URL
     */
    const updateData = (response) => {
        const { results = [], count = 0, next, previous } = response
        
        // Update pagination info
        totalRecords.value = count
        currentPageData.value = results || []
        
        // Handle data accumulation
        if (enableAccumulation) {
            if (currentPage.value === 1) {
                // First page - reset accumulated data
                allData.value = [...results]
            } else {
                // Subsequent pages - append to accumulated data
                // Avoid duplicates by checking IDs
                const existingIds = new Set(allData.value.map(item => item.id))
                const newItems = results.filter(item => !existingIds.has(item.id))
                allData.value = [...allData.value, ...newItems]
            }
        } else {
            // No accumulation - just current page data
            allData.value = [...results]
        }
    }

    /**
     * Go to specific page
     * @param {number} page - Page number (1-based)
     */
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page
        }
    }

    /**
     * Go to next page
     */
    const nextPage = () => {
        if (hasNextPage.value) {
            currentPage.value++
        }
    }

    /**
     * Go to previous page
     */
    const previousPage = () => {
        if (hasPreviousPage.value) {
            currentPage.value--
        }
    }

    /**
     * Go to first page
     */
    const firstPage = () => {
        currentPage.value = 1
    }

    /**
     * Go to last page
     */
    const lastPage = () => {
        currentPage.value = totalPages.value
    }

    /**
     * Reset pagination and clear accumulated data
     */
    const reset = () => {
        currentPage.value = initialPage
        totalRecords.value = 0
        allData.value = []
        currentPageData.value = []
        isLoading.value = false
    }

    /**
     * Refresh current page (useful for filters)
     */
    const refresh = () => {
        if (resetOnRefresh) {
            reset()
        }
        // Trigger page change to reload data
        currentPage.value = currentPage.value
    }

    /**
     * Get pagination parameters for API calls
     */
    const getPaginationParams = () => ({
        page: currentPage.value,
        page_size: pageSizeRef.value,
        limit: pageSizeRef.value,
        offset: (currentPage.value - 1) * pageSizeRef.value
    })

    /**
     * Handle PrimeVue DataTable pagination event
     * @param {Object} event - PrimeVue pagination event
     */
    const handleDataTablePagination = (event) => {
        const { page, rows } = event
        currentPage.value = page + 1 // PrimeVue uses 0-based, we use 1-based
        pageSizeRef.value = rows
    }

    /**
     * Handle PrimeVue DataTable lazy loading
     * @param {Object} event - PrimeVue lazy loading event
     */
    const handleLazyLoad = (event) => {
        const { first, rows, sortField, sortOrder } = event
        currentPage.value = Math.floor(first / rows) + 1
        pageSize.value = rows
        
        return {
            page: currentPage.value,
            page_size: pageSize.value,
            sort: sortField ? `${sortOrder === 1 ? '' : '-'}${sortField}` : null
        }
    }

    // Watch for page changes to trigger data loading
    const onPageChange = (callback) => {
        watch(currentPage, callback)
    }

    return {
        // State
        currentPage,
        pageSize,
        totalRecords,
        isLoading,
        allData,
        currentPageData,
        
        // Computed
        totalPages,
        hasNextPage,
        hasPreviousPage,
        paginationInfo,
        
        // Methods
        updateData,
        goToPage,
        nextPage,
        previousPage,
        firstPage,
        lastPage,
        reset,
        refresh,
        getPaginationParams,
        handleDataTablePagination,
        handleLazyLoad,
        onPageChange,
        
        // Loading state
        setLoading: (loading) => { isLoading.value = loading }
    }
}

/**
 * Specialized pagination for HRM modules with filters
 */
export function useHrmPagination(options = {}) {
    const pagination = usePagination(options)
    
    // HRM-specific pagination with filter support
    const getHrmPaginationParams = (filters = {}) => ({
        ...pagination.getPaginationParams(),
        ...filters
    })
    
    return {
        ...pagination,
        getHrmPaginationParams
    }
}

/**
 * Pagination for e-commerce with search and filters
 */
export function useEcommercePagination(options = {}) {
    const pagination = usePagination(options)
    
    const getEcommerceParams = (search = '', filters = {}) => ({
        ...pagination.getPaginationParams(),
        search,
        ...filters
    })
    
    return {
        ...pagination,
        getEcommerceParams
    }
}
