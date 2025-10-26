/**
 * Centralized Chart Options Composable
 * Provides consistent chart configurations across all dashboards
 * Eliminates duplicate chart option setup and ensures UI consistency
 */

import { computed } from 'vue';

export const useChartOptions = () => {
    /**
     * Default chart options for all charts
     */
    const defaultChartOptions = computed(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            }
        }
    }));

    /**
     * Options for line charts with percentage Y-axis
     */
    const lineChartOptionsWithPercent = computed(() => ({
        ...defaultChartOptions.value,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                }
            }
        }
    }));

    /**
     * Options for charts with currency Y-axis (KES)
     */
    const currencyChartOptions = computed(() => ({
        ...defaultChartOptions.value,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES'
                        }).format(value);
                    }
                }
            }
        }
    }));

    /**
     * Simple bar chart options
     */
    const barChartOptions = computed(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }));

    /**
     * Doughnut/Pie chart options (no scales)
     */
    const pieChartOptions = computed(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            }
        }
    }));

    /**
     * Stacked bar chart options
     */
    const stackedChartOptions = computed(() => ({
        responsive: true,
        maintainAspectRatio: false,
        stacked: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true
            },
            x: {
                stacked: true
            }
        }
    }));

    return {
        defaultChartOptions,
        lineChartOptionsWithPercent,
        currencyChartOptions,
        barChartOptions,
        pieChartOptions,
        stackedChartOptions
    };
};
