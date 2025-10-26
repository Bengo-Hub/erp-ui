/**
 * Debounce composable for input optimization
 */
import { ref, watch } from 'vue';

export function useDebounce(value, delay = 300) {
    const debounced = ref(value.value || value);
    let timeout = null;

    watch(value, (newValue) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            debounced.value = newValue;
        }, delay);
    });

    return { debounced };
}

