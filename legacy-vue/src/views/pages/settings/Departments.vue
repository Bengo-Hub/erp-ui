<template>
    <div class="departments-container min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Departments & Regions</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage organizational structure</p>
            </div>
            <div class="flex gap-3">
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    severity="secondary"
                    outlined
                    @click="loadData"
                    :loading="loading"
                />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Departments Section -->
            <Card>
                <template #header>
                    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="pi pi-building text-2xl text-primary-500"></i>
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Departments</h2>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ departments.length }} departments</p>
                                </div>
                            </div>
                            <Button
                                icon="pi pi-plus"
                                label="Add"
                                size="small"
                                @click="showAddDepartmentDialog"
                            />
                        </div>
                    </div>
                </template>
                <template #content>
                    <div v-if="loadingDepartments" class="text-center py-8">
                        <ProgressSpinner style="width:50px;height:50px" />
                    </div>
                    <div v-else>
                        <!-- Search -->
                        <div class="mb-4">
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-search" />
                                <InputText
                                    v-model="departmentSearch"
                                    placeholder="Search departments..."
                                    class="w-full"
                                />
                            </IconField>
                        </div>

                        <!-- Departments List -->
                        <div class="space-y-2 max-h-[600px] overflow-y-auto">
                            <div
                                v-for="dept in filteredDepartments"
                                :key="dept.id"
                                class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <i class="pi pi-briefcase text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-900 dark:text-gray-100">{{ dept.name }}</p>
                                        <p v-if="dept.manager" class="text-sm text-gray-600 dark:text-gray-400">
                                            Manager: {{ dept.manager.first_name }} {{ dept.manager.last_name }}
                                        </p>
                                        <p v-else class="text-sm text-gray-500">No manager assigned</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <Button
                                        icon="pi pi-pencil"
                                        rounded
                                        text
                                        severity="secondary"
                                        @click="editDepartment(dept)"
                                        v-tooltip.top="'Edit'"
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        text
                                        severity="danger"
                                        @click="confirmDeleteDepartment(dept)"
                                        v-tooltip.top="'Delete'"
                                    />
                                </div>
                            </div>

                            <div v-if="filteredDepartments.length === 0" class="text-center py-8">
                                <i class="pi pi-building text-4xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600 dark:text-gray-400">No departments found</p>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Regions Section -->
            <Card>
                <template #header>
                    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="pi pi-map-marker text-2xl text-primary-500"></i>
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Regions</h2>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ regions.length }} regions</p>
                                </div>
                            </div>
                            <Button
                                icon="pi pi-plus"
                                label="Add"
                                size="small"
                                @click="showAddRegionDialog"
                            />
                        </div>
                    </div>
                </template>
                <template #content>
                    <div v-if="loadingRegions" class="text-center py-8">
                        <ProgressSpinner style="width:50px;height:50px" />
                    </div>
                    <div v-else>
                        <!-- Search -->
                        <div class="mb-4">
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-search" />
                                <InputText
                                    v-model="regionSearch"
                                    placeholder="Search regions..."
                                    class="w-full"
                                />
                            </IconField>
                        </div>

                        <!-- Regions List -->
                        <div class="space-y-2 max-h-[600px] overflow-y-auto">
                            <div
                                v-for="region in filteredRegions"
                                :key="region.id"
                                class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                        <i class="pi pi-map text-green-600 dark:text-green-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-900 dark:text-gray-100">{{ region.name }}</p>
                                        <p v-if="region.code" class="text-sm text-gray-600 dark:text-gray-400">Code: {{ region.code }}</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <Button
                                        icon="pi pi-pencil"
                                        rounded
                                        text
                                        severity="secondary"
                                        @click="editRegion(region)"
                                        v-tooltip.top="'Edit'"
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        text
                                        severity="danger"
                                        @click="confirmDeleteRegion(region)"
                                        v-tooltip.top="'Delete'"
                                    />
                                </div>
                            </div>

                            <div v-if="filteredRegions.length === 0" class="text-center py-8">
                                <i class="pi pi-map-marker text-4xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600 dark:text-gray-400">No regions found</p>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Department Dialog -->
        <Dialog
            v-model:visible="departmentDialog"
            :header="editingDepartment ? 'Edit Department' : 'Add Department'"
            :modal="true"
            class="w-full md:w-1/2"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department Name *
                    </label>
                    <InputText
                        v-model="departmentForm.name"
                        placeholder="Enter department name"
                        class="w-full"
                        :invalid="submitted && !departmentForm.name"
                    />
                    <small v-if="submitted && !departmentForm.name" class="text-red-500">Name is required</small>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department Manager
                    </label>
                    <Dropdown
                        v-model="departmentForm.manager"
                        :options="users"
                        optionLabel="full_name"
                        optionValue="id"
                        placeholder="Select manager"
                        class="w-full"
                        showClear
                        filter
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                    </label>
                    <Textarea
                        v-model="departmentForm.description"
                        placeholder="Enter department description"
                        rows="3"
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="departmentDialog = false"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    @click="saveDepartment"
                    :loading="savingDepartment"
                />
            </template>
        </Dialog>

        <!-- Region Dialog -->
        <Dialog
            v-model:visible="regionDialog"
            :header="editingRegion ? 'Edit Region' : 'Add Region'"
            :modal="true"
            class="w-full md:w-1/2"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Region Name *
                    </label>
                    <InputText
                        v-model="regionForm.name"
                        placeholder="Enter region name"
                        class="w-full"
                        :invalid="submitted && !regionForm.name"
                    />
                    <small v-if="submitted && !regionForm.name" class="text-red-500">Name is required</small>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Region Code
                    </label>
                    <InputText
                        v-model="regionForm.code"
                        placeholder="Enter region code (e.g., NBI, MSA)"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                    </label>
                    <Textarea
                        v-model="regionForm.description"
                        placeholder="Enter region description"
                        rows="3"
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="regionDialog = false"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    @click="saveRegion"
                    :loading="savingRegion"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { systemConfigService } from '@/services/shared/systemConfigService';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();

// State
const loading = ref(false);
const loadingDepartments = ref(false);
const loadingRegions = ref(false);
const savingDepartment = ref(false);
const savingRegion = ref(false);
const submitted = ref(false);

const departments = ref([]);
const regions = ref([]);
const users = ref([]);

// Search
const departmentSearch = ref('');
const regionSearch = ref('');

// Dialogs
const departmentDialog = ref(false);
const regionDialog = ref(false);
const editingDepartment = ref(false);
const editingRegion = ref(false);

// Forms
const departmentForm = ref({
    name: '',
    manager: null,
    description: ''
});

const regionForm = ref({
    name: '',
    code: '',
    description: ''
});

// Computed
const filteredDepartments = computed(() => {
    if (!departmentSearch.value) return departments.value;
    const search = departmentSearch.value.toLowerCase();
    return departments.value.filter(dept =>
        dept.name?.toLowerCase().includes(search) ||
        dept.manager?.first_name?.toLowerCase().includes(search) ||
        dept.manager?.last_name?.toLowerCase().includes(search)
    );
});

const filteredRegions = computed(() => {
    if (!regionSearch.value) return regions.value;
    const search = regionSearch.value.toLowerCase();
    return regions.value.filter(region =>
        region.name?.toLowerCase().includes(search) ||
        region.code?.toLowerCase().includes(search)
    );
});

// Methods
const loadData = async () => {
    loading.value = true;
    loadingDepartments.value = true;
    loadingRegions.value = true;

    try {
        const [deptsRes, regionsRes, usersRes] = await Promise.all([
            systemConfigService.getDepartments(),
            systemConfigService.getRegions(),
            userManagementService.getUsers()
        ]);

        departments.value = deptsRes.data?.results || deptsRes.data || [];
        regions.value = regionsRes.data?.results || regionsRes.data || [];
        users.value = (usersRes.data?.results || usersRes.data || []).map(user => ({
            ...user,
            full_name: `${user.first_name} ${user.last_name}`
        }));
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('error', 'Failed to load data', 'Error');
    } finally {
        loading.value = false;
        loadingDepartments.value = false;
        loadingRegions.value = false;
    }
};

// Department Methods
const showAddDepartmentDialog = () => {
    departmentForm.value = {
        name: '',
        manager: null,
        description: ''
    };
    editingDepartment.value = false;
    submitted.value = false;
    departmentDialog.value = true;
};

const editDepartment = (dept) => {
    departmentForm.value = {
        ...dept,
        manager: dept.manager?.id || null
    };
    editingDepartment.value = true;
    submitted.value = false;
    departmentDialog.value = true;
};

const saveDepartment = async () => {
    submitted.value = true;

    if (!departmentForm.value.name) {
        showToast('warn', 'Please enter department name', 'Validation Error');
        return;
    }

    savingDepartment.value = true;
    try {
        if (editingDepartment.value && departmentForm.value.id) {
            const response = await systemConfigService.updateDepartment(departmentForm.value.id, departmentForm.value);
            if (response.success) {
                showToast('success', 'Department updated successfully', 'Success');
            }
        } else {
            const response = await systemConfigService.createDepartment(departmentForm.value);
            if (response.success) {
                showToast('success', 'Department created successfully', 'Success');
            }
        }
        
        departmentDialog.value = false;
        await loadData();
    } catch (error) {
        console.error('Error saving department:', error);
        showToast('error', 'Failed to save department', 'Error');
    } finally {
        savingDepartment.value = false;
    }
};

const confirmDeleteDepartment = (dept) => {
    confirm.require({
        message: `Are you sure you want to delete "${dept.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteDepartment(dept.id)
    });
};

const deleteDepartment = async (id) => {
    try {
        const response = await systemConfigService.deleteDepartment(id);
        if (response.success) {
            showToast('success', 'Department deleted successfully', 'Success');
            await loadData();
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        showToast('error', 'Failed to delete department', 'Error');
    }
};

// Region Methods
const showAddRegionDialog = () => {
    regionForm.value = {
        name: '',
        code: '',
        description: ''
    };
    editingRegion.value = false;
    submitted.value = false;
    regionDialog.value = true;
};

const editRegion = (region) => {
    regionForm.value = { ...region };
    editingRegion.value = true;
    submitted.value = false;
    regionDialog.value = true;
};

const saveRegion = async () => {
    submitted.value = true;

    if (!regionForm.value.name) {
        showToast('warn', 'Please enter region name', 'Validation Error');
        return;
    }

    savingRegion.value = true;
    try {
        if (editingRegion.value && regionForm.value.id) {
            const response = await systemConfigService.updateRegion(regionForm.value.id, regionForm.value);
            if (response.success) {
                showToast('success', 'Region updated successfully', 'Success');
            }
        } else {
            const response = await systemConfigService.createRegion(regionForm.value);
            if (response.success) {
                showToast('success', 'Region created successfully', 'Success');
            }
        }
        
        regionDialog.value = false;
        await loadData();
    } catch (error) {
        console.error('Error saving region:', error);
        showToast('error', 'Failed to save region', 'Error');
    } finally {
        savingRegion.value = false;
    }
};

const confirmDeleteRegion = (region) => {
    confirm.require({
        message: `Are you sure you want to delete "${region.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteRegion(region.id)
    });
};

const deleteRegion = async (id) => {
    try {
        const response = await systemConfigService.deleteRegion(id);
        if (response.success) {
            showToast('success', 'Region deleted successfully', 'Success');
            await loadData();
        }
    } catch (error) {
        console.error('Error deleting region:', error);
        showToast('error', 'Failed to delete region', 'Error');
    }
};

// Lifecycle
onMounted(() => {
    loadData();
});
</script>

<style scoped>
.departments-container {
    max-width: 1400px;
    margin: 0 auto;
}
</style>

