<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { employeeService } from '@/services/hrm/employeeService';
import { useVuelidate } from '@vuelidate/core';
import { helpers, minValue, required } from '@vuelidate/validators';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const loading = ref(false);

// Category Management
const categories = ref([]);
const selectedCategory = ref(null);
const categoryFilter = ref('');
const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const category = ref({
    name: '',
    description: '',
    order: 0,
    is_active: true
});

// Metric Management
const selectedMetric = ref(null);
const metricDialog = ref(false);
const deleteMetricDialog = ref(false);
const metric = ref({
    name: '',
    description: '',
    metric_type: '',
    unit: '',
    min_value: null,
    max_value: null,
    target_value: null,
    is_active: true
});

const metricTypes = [
    { label: 'Numeric', value: 'numeric' },
    { label: 'Percentage', value: 'percentage' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Rating', value: 'rating' },
    { label: 'Text', value: 'text' }
];

// Computed Properties
const filteredCategories = computed(() => {
    if (!categoryFilter.value) return categories.value;
    const search = categoryFilter.value.toLowerCase();
    return categories.value.filter((category) => category.name.toLowerCase().includes(search) || category.description.toLowerCase().includes(search));
});

const activeCategoriesCount = computed(() => {
    return categories.value.filter((c) => c.is_active).length;
});

const totalMetricsCount = computed(() => {
    return categories.value.reduce((total, category) => total + (category.metrics?.length || 0), 0);
});

const activeMetricsCount = computed(() => {
    return categories.value.reduce((total, category) => total + (category.metrics?.filter((m) => m.is_active).length || 0), 0);
});

const employeeCoverage = computed(() => {
    // Calculate actual employee coverage based on metrics
    const totalEmployees = ref(0);
    const employeesWithMetrics = ref(0);

    const calculateCoverage = async () => {
        try {
            const [employeesResponse, metricsResponse] = await Promise.all([
                employeeService.getEmployees(),
                appraisalService.getPerformanceMetrics()
            ]);

            totalEmployees.value = employeesResponse.data.length;
            const uniqueEmployees = new Set(metricsResponse.data.map((m) => m.employee));
            employeesWithMetrics.value = uniqueEmployees.size;
        } catch (error) {
            console.error('Error calculating employee coverage:', error);
            return 0;
        }
    };

    calculateCoverage();
    return totalEmployees.value > 0 ? Math.round((employeesWithMetrics.value / totalEmployees.value) * 100) : 0;
});

// Validation Rules
const categoryRules = {
    name: { required, minLength: minValue(3) },
    description: { required },
    order: { required, minValue: minValue(0) },
    is_active: { required }
};

const metricRules = {
    name: { required, minLength: minValue(3) },
    description: { required },
    metric_type: { required },
    unit: {
        required: helpers.withMessage('Unit is required for numeric and percentage metrics', (value) => !['numeric', 'percentage'].includes(metric.value.metric_type) || value)
    },
    min_value: {
        required: helpers.withMessage('Minimum value is required for numeric, percentage, and rating metrics', (value) => !['numeric', 'percentage', 'rating'].includes(metric.value.metric_type) || value !== null)
    },
    max_value: {
        required: helpers.withMessage('Maximum value is required for numeric, percentage, and rating metrics', (value) => !['numeric', 'percentage', 'rating'].includes(metric.value.metric_type) || value !== null)
    },
    target_value: {
        required: helpers.withMessage('Target value is required for numeric, percentage, and rating metrics', (value) => !['numeric', 'percentage', 'rating'].includes(metric.value.metric_type) || value !== null)
    },
    is_active: { required }
};

const v$ = useVuelidate({
    category: categoryRules,
    metric: metricRules
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        const response = await appraisalService.getMetricCategories();
        categories.value = response.data;

        // Load metrics for each category
        for (const category of categories.value) {
            try {
                const metricsResponse = await appraisalService.getMetricsByCategory(category.id);
                category.metrics = metricsResponse.data;
            } catch (error) {
                console.error(`Error loading metrics for category ${category.id}:`, error);
                category.metrics = [];
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('error', 'Error', 'Failed to load data. Please try again later.');
    } finally {
        loading.value = false;
    }
};

const showCategoryDialog = () => {
    category.value = {
        name: '',
        description: '',
        order: categories.value.length,
        is_active: true
    };
    categoryDialog.value = true;
};

const editCategory = (data) => {
    category.value = { ...data };
    categoryDialog.value = true;
};

const saveCategory = async () => {
    const isValid = await v$.value.category.$validate();
    if (!isValid) return;

    loading.value = true;
    try {
        if (category.value.id) {
            await appraisalService.updateMetricCategory(category.value.id, category.value);
        } else {
            await appraisalService.createMetricCategory(category.value);
        }
        categoryDialog.value = false;
        await loadData();
        showToast('success', 'Success', 'Category saved successfully');
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to save category');
    } finally {
        loading.value = false;
    }
};

const confirmDeleteCategory = (data) => {
    selectedCategory.value = data;
    deleteCategoryDialog.value = true;
};

const deleteCategory = async () => {
    loading.value = true;
    try {
        await appraisalService.deleteMetricCategory(selectedCategory.value.id);
        deleteCategoryDialog.value = false;
        await loadData();
        showToast('success', 'Success', 'Category deleted successfully');
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to delete category');
    } finally {
        loading.value = false;
    }
};

const manageMetrics = (data) => {
    selectedCategory.value = data;
};

const showMetricDialog = () => {
    metric.value = {
        name: '',
        description: '',
        metric_type: '',
        unit: '',
        min_value: null,
        max_value: null,
        target_value: null,
        is_active: true
    };
    metricDialog.value = true;
};

const editMetric = (data) => {
    metric.value = { ...data };
    metricDialog.value = true;
};

const saveMetric = async () => {
    const isValid = await v$.value.metric.$validate();
    if (!isValid) return;

    loading.value = true;
    try {
        if (metric.value.id) {
            await appraisalService.updatePerformanceMetric(metric.value.id, metric.value);
        } else {
            await appraisalService.createPerformanceMetric({
                ...metric.value,
                category: selectedCategory.value.id
            });
        }
        metricDialog.value = false;
        await loadData();
        showToast('success', 'Success', 'Metric saved successfully');
    } catch (error) {
        console.error('Error saving metric:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to save metric');
    } finally {
        loading.value = false;
    }
};

const confirmDeleteMetric = (data) => {
    selectedMetric.value = data;
    deleteMetricDialog.value = true;
};

const deleteMetric = async () => {
    loading.value = true;
    try {
        await appraisalService.deletePerformanceMetric(selectedMetric.value.id);
        deleteMetricDialog.value = false;
        await loadData();
        showToast('success', 'Success', 'Metric deleted successfully');
    } catch (error) {
        console.error('Error deleting metric:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to delete metric');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="performance-metrics">
        <!-- Dashboard Overview -->
        <div class="grid mb-4">
            <div class="col-12 md:col-6 lg:col-3">
                <Card class="dashboard-card">
                    <template #header>
                        <div class="flex align-items-center">
                            <i class="pi pi-chart-bar text-xl mr-2"></i>
                            <span>Total Categories</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ categories.length }}</div>
                        <div class="text-sm text-500">Active Categories: {{ activeCategoriesCount }}</div>
                    </template>
                </Card>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <Card class="dashboard-card">
                    <template #header>
                        <div class="flex align-items-center">
                            <i class="pi pi-list text-xl mr-2"></i>
                            <span>Total Metrics</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ totalMetricsCount }}</div>
                        <div class="text-sm text-500">Active Metrics: {{ activeMetricsCount }}</div>
                    </template>
                </Card>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <Card class="dashboard-card">
                    <template #header>
                        <div class="flex align-items-center">
                            <i class="pi pi-check-circle text-xl mr-2"></i>
                            <span>Metric Types</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ metricTypes.length }}</div>
                        <div class="text-sm text-500">Different Types Available</div>
                    </template>
                </Card>
            </div>
            <div class="col-12 md:col-6 lg:col-3">
                <Card class="dashboard-card">
                    <template #header>
                        <div class="flex align-items-center">
                            <i class="pi pi-users text-xl mr-2"></i>
                            <span>Employee Coverage</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ employeeCoverage }}%</div>
                        <div class="text-sm text-500">Employees with Metrics</div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid">
            <!-- Metric Categories -->
            <div class="col-12">
                <Card>
                    <template #header>
                        <div class="flex justify-content-between align-items-center">
                            <div class="flex align-items-center">
                                <i class="pi pi-folder text-xl mr-2"></i>
                                <span>Metric Categories</span>
                            </div>
                            <div class="flex gap-2">
                                <Button label="New Category" icon="pi pi-plus" @click="showCategoryDialog" :loading="loading" />
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search" />
                                    <InputText v-model="categoryFilter" placeholder="Search categories..." class="p-inputtext-sm" />
                                </span>
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <DataTable :value="filteredCategories" :paginator="true" :rows="10" v-model:selection="selectedCategory" selectionMode="single" dataKey="id" :loading="loading" stripedRows class="p-datatable-sm">
                            <template #empty>
                                <div class="text-center p-4">
                                    <i class="pi pi-inbox text-4xl text-500 mb-2"></i>
                                    <p class="text-500">No categories found</p>
                                </div>
                            </template>

                            <Column field="name" header="Name" sortable>
                                <template #body="{ data }">
                                    <div class="flex align-items-center">
                                        <i class="pi pi-folder mr-2"></i>
                                        <span>{{ data.name }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="description" header="Description" sortable>
                                <template #body="{ data }">
                                    <div class="text-500">{{ data.description || 'No description' }}</div>
                                </template>
                            </Column>
                            <Column field="metrics_count" header="Metrics" sortable>
                                <template #body="{ data }">
                                    <Badge :value="data.metrics_count.toString()" severity="info" />
                                </template>
                            </Column>
                            <Column field="order" header="Order" sortable>
                                <template #body="{ data }">
                                    <div class="flex align-items-center">
                                        <i class="pi pi-sort mr-2"></i>
                                        <span>{{ data.order }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="is_active" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" @click="editCategory(data)" v-tooltip="'Edit Category'" />
                                        <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDeleteCategory(data)" v-tooltip="'Delete Category'" />
                                        <Button icon="pi pi-list" class="p-button-rounded p-button-text" @click="manageMetrics(data)" v-tooltip="'Manage Metrics'" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Metrics Management -->
            <div class="col-12" v-if="selectedCategory">
                <Card>
                    <template #header>
                        <div class="flex justify-content-between align-items-center">
                            <div class="flex align-items-center">
                                <i class="pi pi-chart-line text-xl mr-2"></i>
                                <span>{{ selectedCategory.name }} - Metrics</span>
                            </div>
                            <div class="flex gap-2">
                                <Button label="Add Metric" icon="pi pi-plus" @click="showMetricDialog" :loading="loading" />
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <DataTable :value="selectedCategory.metrics" :paginator="true" :rows="10" v-model:selection="selectedMetric" selectionMode="single" dataKey="id" :loading="loading" stripedRows class="p-datatable-sm">
                            <template #empty>
                                <div class="text-center p-4">
                                    <i class="pi pi-chart-bar text-4xl text-500 mb-2"></i>
                                    <p class="text-500">No metrics found in this category</p>
                                </div>
                            </template>

                            <Column field="name" header="Name" sortable>
                                <template #body="{ data }">
                                    <div class="flex align-items-center">
                                        <i class="pi pi-chart-line mr-2"></i>
                                        <span>{{ data.name }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="description" header="Description" sortable>
                                <template #body="{ data }">
                                    <div class="text-500">{{ data.description || 'No description' }}</div>
                                </template>
                            </Column>
                            <Column field="metric_type_display" header="Type" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.metric_type_display" severity="info" />
                                </template>
                            </Column>
                            <Column field="unit" header="Unit" sortable>
                                <template #body="{ data }">
                                    <div class="text-500">{{ data.unit || '-' }}</div>
                                </template>
                            </Column>
                            <Column field="target_value" header="Target" sortable>
                                <template #body="{ data }">
                                    <div class="flex align-items-center">
                                        <i class="pi pi-bullseye mr-2"></i>
                                        <span>{{ data.target_value || '-' }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="is_active" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" @click="editMetric(data)" v-tooltip="'Edit Metric'" />
                                        <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDeleteMetric(data)" v-tooltip="'Delete Metric'" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Category Dialog -->
            <Dialog v-model:visible="categoryDialog" :style="{ width: '450px' }" header="Category Details" :modal="true" :closable="!loading" :closeOnEscape="!loading" :closeOnMaskClick="!loading">
                <form @submit.prevent="saveCategory" class="p-fluid">
                    <div class="field">
                        <label for="categoryName">Name</label>
                        <InputText id="categoryName" v-model="category.name" required :class="{ 'p-invalid': v$.category.name.$error }" @blur="v$.category.name.$touch()" />
                        <small class="p-error" v-if="v$.category.name.$error">
                            {{ v$.category.name.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field">
                        <label for="categoryDescription">Description</label>
                        <Textarea id="categoryDescription" v-model="category.description" rows="3" :class="{ 'p-invalid': v$.category.description.$error }" @blur="v$.category.description.$touch()" />
                        <small class="p-error" v-if="v$.category.description.$error">
                            {{ v$.category.description.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field">
                        <label for="order">Order</label>
                        <InputNumber id="order" v-model="category.order" :min="0" required :class="{ 'p-invalid': v$.category.order.$error }" @blur="v$.category.order.$touch()" />
                        <small class="p-error" v-if="v$.category.order.$error">
                            {{ v$.category.order.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="is_active" v-model="category.is_active" :binary="true" :class="{ 'p-invalid': v$.category.is_active.$error }" @blur="v$.category.is_active.$touch()" />
                        <label for="is_active">Active</label>
                        <small class="p-error" v-if="v$.category.is_active.$error">
                            {{ v$.category.is_active.$errors[0].$message }}
                        </small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="categoryDialog = false" :disabled="loading" />
                        <Button type="submit" label="Save" icon="pi pi-check" :loading="loading" />
                    </template>
                </form>
            </Dialog>

            <!-- Metric Dialog -->
            <Dialog v-model:visible="metricDialog" :style="{ width: '450px' }" header="Metric Details" :modal="true" :closable="!loading" :closeOnEscape="!loading" :closeOnMaskClick="!loading">
                <form @submit.prevent="saveMetric" class="p-fluid">
                    <div class="field">
                        <label for="metricName">Name</label>
                        <InputText id="metricName" v-model="metric.name" required :class="{ 'p-invalid': v$.metric.name.$error }" @blur="v$.metric.name.$touch()" />
                        <small class="p-error" v-if="v$.metric.name.$error">
                            {{ v$.metric.name.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field">
                        <label for="metricDescription">Description</label>
                        <Textarea id="metricDescription" v-model="metric.description" rows="3" :class="{ 'p-invalid': v$.metric.description.$error }" @blur="v$.metric.description.$touch()" />
                        <small class="p-error" v-if="v$.metric.description.$error">
                            {{ v$.metric.description.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field">
                        <label for="metricType">Type</label>
                        <Dropdown
                            id="metricType"
                            v-model="metric.metric_type"
                            :options="metricTypes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Type"
                            :class="{ 'p-invalid': v$.metric.metric_type.$error }"
                            @blur="v$.metric.metric_type.$touch()"
                        />
                        <small class="p-error" v-if="v$.metric.metric_type.$error">
                            {{ v$.metric.metric_type.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field" v-if="['numeric', 'percentage'].includes(metric.metric_type)">
                        <label for="unit">Unit</label>
                        <InputText id="unit" v-model="metric.unit" :class="{ 'p-invalid': v$.metric.unit.$error }" @blur="v$.metric.unit.$touch()" />
                        <small class="p-error" v-if="v$.metric.unit.$error">
                            {{ v$.metric.unit.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field" v-if="['numeric', 'percentage', 'rating'].includes(metric.metric_type)">
                        <label for="minValue">Minimum Value</label>
                        <InputNumber id="minValue" v-model="metric.min_value" :minFractionDigits="2" :class="{ 'p-invalid': v$.metric.min_value.$error }" @blur="v$.metric.min_value.$touch()" />
                        <small class="p-error" v-if="v$.metric.min_value.$error">
                            {{ v$.metric.min_value.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field" v-if="['numeric', 'percentage', 'rating'].includes(metric.metric_type)">
                        <label for="maxValue">Maximum Value</label>
                        <InputNumber id="maxValue" v-model="metric.max_value" :minFractionDigits="2" :class="{ 'p-invalid': v$.metric.max_value.$error }" @blur="v$.metric.max_value.$touch()" />
                        <small class="p-error" v-if="v$.metric.max_value.$error">
                            {{ v$.metric.max_value.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field" v-if="['numeric', 'percentage', 'rating'].includes(metric.metric_type)">
                        <label for="targetValue">Target Value</label>
                        <InputNumber id="targetValue" v-model="metric.target_value" :minFractionDigits="2" :class="{ 'p-invalid': v$.metric.target_value.$error }" @blur="v$.metric.target_value.$touch()" />
                        <small class="p-error" v-if="v$.metric.target_value.$error">
                            {{ v$.metric.target_value.$errors[0].$message }}
                        </small>
                    </div>
                    <div class="field-checkbox">
                        <Checkbox id="is_active" v-model="metric.is_active" :binary="true" :class="{ 'p-invalid': v$.metric.is_active.$error }" @blur="v$.metric.is_active.$touch()" />
                        <label for="is_active">Active</label>
                        <small class="p-error" v-if="v$.metric.is_active.$error">
                            {{ v$.metric.is_active.$errors[0].$message }}
                        </small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="metricDialog = false" :disabled="loading" />
                        <Button type="submit" label="Save" icon="pi pi-check" :loading="loading" />
                    </template>
                </form>
            </Dialog>

            <!-- Delete Dialogs -->
            <Dialog v-model:visible="deleteCategoryDialog" :style="{ width: '450px' }" header="Confirm" :modal="true" :closable="!loading" :closeOnEscape="!loading" :closeOnMaskClick="!loading">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="selectedCategory">Are you sure you want to delete this category?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteCategoryDialog = false" :disabled="loading" />
                    <Button label="Yes" icon="pi pi-check" class="p-button-danger" :loading="loading" @click="deleteCategory" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deleteMetricDialog" :style="{ width: '450px' }" header="Confirm" :modal="true" :closable="!loading" :closeOnEscape="!loading" :closeOnMaskClick="!loading">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="selectedMetric">Are you sure you want to delete this metric?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteMetricDialog = false" :disabled="loading" />
                    <Button label="Yes" icon="pi pi-check" class="p-button-danger" :loading="loading" @click="deleteMetric" />
                </template>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
.performance-metrics {
    padding: 1rem;
}

.dashboard-card {
    transition: transform 0.2s;
}

.dashboard-card:hover {
    transform: translateY(-5px);
}

.field {
    margin-bottom: 1rem;
}

.field-checkbox {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.field-checkbox label {
    margin-left: 0.5rem;
}

:deep(.p-datatable) {
    box-shadow: none;
}

:deep(.p-datatable .p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-100);
    color: var(--text-color);
    font-weight: 600;
    padding: 0.75rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.75rem;
}

:deep(.p-dialog-content) {
    padding-top: 1rem;
}

:deep(.p-dialog-footer) {
    padding-top: 1rem;
    border-top: 1px solid var(--surface-200);
}

:deep(.p-button.p-button-text) {
    padding: 0.5rem;
}

:deep(.p-button.p-button-text:hover) {
    background: var(--surface-100);
}

:deep(.p-inputtext.p-invalid) {
    border-color: var(--red-500);
}

:deep(.p-dropdown.p-invalid) {
    border-color: var(--red-500);
}

:deep(.p-inputnumber.p-invalid) {
    border-color: var(--red-500);
}

:deep(.p-checkbox.p-invalid) {
    border-color: var(--red-500);
}

.p-error {
    color: var(--red-500);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
</style>
