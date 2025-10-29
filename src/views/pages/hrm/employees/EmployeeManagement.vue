<template>
    <div class="employee-management">
        <div class="page-header mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Employee Management</h1>
                    <p class="text-gray-600 mt-2">Manage employee information, payroll, and HR records</p>
                </div>
                <PermissionButton 
                    permission="add_employee"
                    label="Add Employee" 
                    icon="pi pi-plus" 
                    @click="addEmployee"
                />
            </div>
        </div>

        <!-- Employee Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <PermissionWrapper permission="view_employee">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Employees</p>
                                <p class="text-2xl font-bold text-blue-600">{{ stats.totalEmployees }}</p>
                            </div>
                            <i class="pi pi-users text-3xl text-blue-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_employee">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Active</p>
                                <p class="text-2xl font-bold text-green-600">{{ stats.activeEmployees }}</p>
                            </div>
                            <i class="pi pi-check-circle text-3xl text-green-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_employee">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">On Leave</p>
                                <p class="text-2xl font-bold text-orange-600">{{ stats.onLeave }}</p>
                            </div>
                            <i class="pi pi-calendar text-3xl text-orange-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_employee">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">New This Month</p>
                                <p class="text-2xl font-bold text-purple-600">{{ stats.newThisMonth }}</p>
                            </div>
                            <i class="pi pi-user-plus text-3xl text-purple-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>
        </div>

        <!-- Employee Table -->
        <PermissionWrapper permission="view_employee">
            <Card>
                <template #title>
                    <div class="flex justify-between items-center">
                        <span>Employees</span>
                        <div class="flex gap-2">
                            <PermissionButton 
                                permission="view_employee"
                                icon="pi pi-download" 
                                size="small" 
                                severity="secondary"
                                @click="exportEmployees"
                            />
                            <PermissionButton 
                                permission="add_employee"
                                icon="pi pi-upload" 
                                size="small" 
                                severity="info"
                                @click="importEmployees"
                            />
                        </div>
                    </div>
                </template>
                <template #content>
                    <DataTable 
                        :value="employees" 
                        :paginator="true" 
                        :rows="10"
                        :loading="isLoading"
                        :filters="filters"
                        filterDisplay="menu"
                        class="p-datatable-sm"
                    >
                        <template #header>
                            <div class="flex justify-between items-center">
                                <InputText 
                                    v-model="filters['global']" 
                                    placeholder="Search employees..." 
                                    class="w-64"
                                />
                                <div class="flex gap-2">
                                    <PermissionButton 
                                        permission="view_employee"
                                        icon="pi pi-refresh" 
                                        size="small" 
                                        severity="secondary"
                                        @click="refreshData"
                                    />
                                </div>
                            </div>
                        </template>

                        <Column field="employee_id" header="ID" sortable>
                            <template #body="slotProps">
                                <span class="font-mono text-sm">{{ slotProps.data.employee_id }}</span>
                            </template>
                        </Column>

                        <Column field="name" header="Name" sortable>
                            <template #body="slotProps">
                                <div class="flex items-center">
                                    <Avatar 
                                        :image="slotProps.data.avatar" 
                                        :label="slotProps.data.name.charAt(0)" 
                                        class="mr-3"
                                        size="small"
                                    />
                                    <div>
                                        <div class="font-medium">{{ slotProps.data.name }}</div>
                                        <div class="text-sm text-gray-500">{{ slotProps.data.email }}</div>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="department" header="Department" sortable>
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.department" severity="info" />
                            </template>
                        </Column>

                        <Column field="position" header="Position" sortable></Column>

                        <Column field="status" header="Status" sortable>
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.status" 
                                    :severity="getStatusSeverity(slotProps.data.status)"
                                />
                            </template>
                        </Column>

                        <Column field="salary" header="Salary" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.salary) }}
                            </template>
                        </Column>

                        <Column header="Actions" :exportable="false">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <PermissionButton 
                                        permission="view_employee"
                                        icon="pi pi-eye" 
                                        size="small" 
                                        @click="viewEmployee(slotProps.data.id)"
                                    />
                                    <PermissionButton 
                                        permission="change_employee"
                                        icon="pi pi-pencil" 
                                        size="small" 
                                        severity="info"
                                        @click="editEmployee(slotProps.data.id)"
                                    />
                                    <PermissionButton 
                                        permission="view_payslip"
                                        icon="pi pi-file" 
                                        size="small" 
                                        severity="success"
                                        @click="viewPayslips(slotProps.data.id)"
                                    />
                                    <PermissionButton 
                                        permission="delete_employee"
                                        icon="pi pi-trash" 
                                        size="small" 
                                        severity="danger"
                                        @click="deleteEmployee(slotProps.data.id)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </PermissionWrapper>
    </div>
</template>

<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import { usePermissions } from '@/composables/usePermissions';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { canRead, canUpdate, canCreate, canDelete } = usePermissions();

const isLoading = ref(false);
const filters = ref({ global: null });

const stats = ref({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    newThisMonth: 0
});

const employees = ref([]);



const getStatusSeverity = (status) => {
    const statusMap = {
        'active': 'success',
        'inactive': 'secondary',
        'on_leave': 'warning',
        'terminated': 'danger'
    };
    return statusMap[status] || 'secondary';
};

const addEmployee = () => {
    router.push('/hrm/employees/create');
};

const viewEmployee = (id) => {
    router.push(`/hrm/employees/${id}`);
};

const editEmployee = (id) => {
    router.push(`/hrm/employees/${id}/edit`);
};

const viewPayslips = (id) => {
    router.push(`/hrm/employees/${id}/payslips`);
};

const deleteEmployee = (id) => {
    // Implement delete logic
    console.log('Delete employee:', id);
};

const exportEmployees = () => {
    // Implement export logic
    console.log('Export employees');
};

const importEmployees = () => {
    // Implement import logic
import { formatCurrency, formatDate } from '@/utils/formatters';
    console.log('Import employees');
};

const refreshData = () => {
    loadEmployees();
    loadStats();
};

const loadStats = async () => {
    // Load employee statistics
    stats.value = {
        totalEmployees: 150,
        activeEmployees: 140,
        onLeave: 8,
        newThisMonth: 5
    };
};

const loadEmployees = async () => {
    isLoading.value = true;
    try {
        // Load employees from API
        employees.value = [
            {
                id: 1,
                employee_id: 'EMP001',
                name: 'John Doe',
                email: 'john.doe@company.com',
                department: 'IT',
                position: 'Software Developer',
                status: 'active',
                salary: 75000,
                avatar: null
            },
            {
                id: 2,
                employee_id: 'EMP002',
                name: 'Jane Smith',
                email: 'jane.smith@company.com',
                department: 'HR',
                position: 'HR Manager',
                status: 'active',
                salary: 85000,
                avatar: null
            }
        ];
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadEmployees();
    loadStats();
});
</script>

<style scoped>
.employee-management {
    @apply max-w-7xl mx-auto p-6;
}

.stat-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.page-header {
    @apply border-b border-gray-200 pb-4;
}
</style>
