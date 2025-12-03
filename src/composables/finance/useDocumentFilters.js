/**
 * useDocumentFilters Composable
 * Shared filter logic for all finance document views
 * (Invoices, Quotations, Expenses, etc.)
 */
import { ref, computed } from 'vue';

export function useDocumentFilters(initialFilters = {}) {
    const filters = ref({
        status_filter: '',
        customer: '',
        date_from: null,
        date_to: null,
        search: '',
        ...initialFilters
    });

    const currentPage = ref(1);
    const perPage = ref(25);
    const totalRecords = ref(0);

    const resetFilters = () => {
        filters.value = {
            status_filter: '',
            customer: '',
            date_from: null,
            date_to: null,
            search: '',
            ...initialFilters
        };
        currentPage.value = 1;
    };

    const onFilter = (fetchCallback) => {
        currentPage.value = 1;
        if (fetchCallback) fetchCallback();
    };

    const onPage = (event, fetchCallback) => {
        currentPage.value = event.page + 1;
        perPage.value = event.rows;
        if (fetchCallback) fetchCallback();
    };

    const getFilterParams = () => {
        const params = {
            page: currentPage.value,
            page_size: perPage.value,
            ...filters.value
        };

        // Format dates if present
        if (filters.value.date_from) {
            params.date_from = filters.value.date_from instanceof Date
                ? filters.value.date_from.toISOString().split('T')[0]
                : filters.value.date_from;
        }
        if (filters.value.date_to) {
            params.date_to = filters.value.date_to instanceof Date
                ? filters.value.date_to.toISOString().split('T')[0]
                : filters.value.date_to;
        }

        return params;
    };

    return {
        filters,
        currentPage,
        perPage,
        totalRecords,
        resetFilters,
        onFilter,
        onPage,
        getFilterParams
    };
}

