/**
 * Standardized Response Handler for BengoBox ERP
 * Handles the standardized backend response format:
 * {
 *   "count": <number>,
 *   "next": <url|null>,
 *   "previous": <url|null>,
 *   "results": <array>
 * }
 */

/**
 * Extract data from standardized paginated response
 * @param {Object} response - Axios response object
 * @returns {Object} Normalized response with data and pagination info
 */
export function extractPaginatedData(response) {
    if (!response || !response.data) {
        return {
            results: [],
            count: 0,
            next: null,
            previous: null,
            page: 1,
            page_size: 100,
            total_pages: 0
        }
    }

    const data = response.data

    // Check if response is already in paginated format
    if (data.results !== undefined) {
        return {
            results: data.results || [],
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
            page: data.page || 1,
            page_size: data.page_size || 100,
            total_pages: data.total_pages || Math.ceil((data.count || 0) / (data.page_size || 100))
        }
    }

    // Handle legacy array responses
    if (Array.isArray(data)) {
        return {
            results: data,
            count: data.length,
            next: null,
            previous: null,
            page: 1,
            page_size: data.length,
            total_pages: 1
        }
    }

    // Handle single object response
    return {
        results: [data],
        count: 1,
        next: null,
        previous: null,
        page: 1,
        page_size: 1,
        total_pages: 1
    }
}

/**
 * Check if response is in paginated format
 * @param {Object} data - Response data
 * @returns {boolean}
 */
export function isPaginatedResponse(data) {
    return data && typeof data === 'object' && 'results' in data && 'count' in data
}

/**
 * Normalize response to always return paginated format
 * @param {*} data - Response data
 * @returns {Object} Paginated format
 */
export function normalizeToPaginatedFormat(data) {
    if (isPaginatedResponse(data)) {
        return data
    }

    if (Array.isArray(data)) {
        return {
            count: data.length,
            next: null,
            previous: null,
            results: data
        }
    }

    if (data && typeof data === 'object') {
        return {
            count: 1,
            next: null,
            previous: null,
            results: [data]
        }
    }

    return {
        count: 0,
        next: null,
        previous: null,
        results: []
    }
}

/**
 * Extract just the results array from response
 * @param {Object} response - Axios response or data object
 * @returns {Array} Results array
 */
export function extractResults(response) {
    const data = response?.data || response
    
    if (isPaginatedResponse(data)) {
        return data.results || []
    }
    
    if (Array.isArray(data)) {
        return data
    }
    
    if (data && typeof data === 'object') {
        return [data]
    }
    
    return []
}

/**
 * Get pagination metadata from response
 * @param {Object} response - Axios response
 * @returns {Object} Pagination metadata
 */
export function getPaginationMeta(response) {
    const data = response?.data || response
    
    if (isPaginatedResponse(data)) {
        return {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
            page: data.page || 1,
            page_size: data.page_size || 100,
            total_pages: data.total_pages || Math.ceil((data.count || 0) / (data.page_size || 100)),
            hasNext: !!data.next,
            hasPrevious: !!data.previous
        }
    }
    
    const results = extractResults(response)
    return {
        count: results.length,
        next: null,
        previous: null,
        page: 1,
        page_size: results.length,
        total_pages: 1,
        hasNext: false,
        hasPrevious: false
    }
}

/**
 * Merge paginated responses (for data accumulation)
 * @param {Object} existing - Existing paginated response
 * @param {Object} newData - New paginated response to merge
 * @returns {Object} Merged paginated response
 */
export function mergePaginatedResponses(existing, newData) {
    const existingData = normalizeToPaginatedFormat(existing)
    const newDataNormalized = normalizeToPaginatedFormat(newData)
    
    // Avoid duplicates by tracking IDs
    const existingIds = new Set(
        existingData.results
            .filter(item => item.id)
            .map(item => item.id)
    )
    
    const newResults = newDataNormalized.results.filter(
        item => !item.id || !existingIds.has(item.id)
    )
    
    return {
        count: newDataNormalized.count, // Use latest count
        next: newDataNormalized.next,
        previous: newDataNormalized.previous,
        page: newDataNormalized.page,
        page_size: newDataNormalized.page_size,
        total_pages: newDataNormalized.total_pages,
        results: [...existingData.results, ...newResults]
    }
}

/**
 * Create paginated request parameters
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Object} Request parameters
 */
export function createPaginatedParams(page = 1, pageSize = 100, additionalParams = {}) {
    return {
        page,
        page_size: pageSize,
        ...additionalParams
    }
}

export default {
    extractPaginatedData,
    isPaginatedResponse,
    normalizeToPaginatedFormat,
    extractResults,
    getPaginationMeta,
    mergePaginatedResponses,
    createPaginatedParams
}

