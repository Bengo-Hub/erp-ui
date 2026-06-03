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
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';

const { formatCurrencySync } = useGlobalCurrency();
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

const router = useRouter();
const { canRead, canUpdate, canCreate, canDelete } = usePermissions();
const { showToast } = useToast();
const confirm = useConfirm();

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

const deleteEmployee = async (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this employee? This action cannot be undone.',
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await employeeService.deleteEmployee(id);
                showToast('success', 'Success', 'Employee deleted successfully');
                await loadEmployees();
                await loadStats();
            } catch (error) {
                console.error('Error deleting employee:', error);
                showToast('error', 'Error', 'Failed to delete employee');
            }
        }
    });
};

const exportEmployees = async () => {
    try {
        // Export employees as CSV
        const response = await employeeService.getEmployees({ format: 'csv' });
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Success', 'Employees exported successfully');
    } catch (error) {
        console.error('Error exporting employees:', error);
        showToast('error', 'Error', 'Failed to export employees');
    }
};

const importEmployees = () => {
    router.push('/hrm/employees/import');
};

const refreshData = () => {
    loadEmployees();
    loadStats();
};

const loadStats = async () => {
    try {
        const response = await employeeService.getEmployeeStatus();
        const statusData = response.data || response;
        stats.value = {
            totalEmployees: statusData.total || 0,
            activeEmployees: statusData.active || 0,
            onLeave: statusData.on_leave || 0,
            newThisMonth: statusData.new_this_month || 0
        };
    } catch (error) {
        console.error('Error loading employee stats:', error);
        // Set defaults on error
        stats.value = {
            totalEmployees: employees.value.length,
            activeEmployees: employees.value.filter(e => e.status === 'active').length,
            onLeave: employees.value.filter(e => e.status === 'on_leave').length,
            newThisMonth: 0
        };
    }
};

const loadEmployees = async () => {
    isLoading.value = true;
    try {
        const response = await employeeService.getEmployees();
        const data = response.data || response;
        // Handle paginated or direct response
        const employeeList = data.results || data;
        employees.value = employeeList.map(emp => ({
            id: emp.id,
            employee_id: emp.employee_id || emp.job_or_staff_number || `EMP${emp.id}`,
            name: `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim() || emp.name || 'N/A',
            email: emp.user?.email || emp.email || 'N/A',
            department: emp.department?.name || emp.department_name || emp.department || 'N/A',
            position: emp.job_title || emp.position || 'N/A',
            status: emp.status || 'active',
            salary: emp.salary || emp.monthly_salary || 0,
            avatar: emp.user?.pic || emp.passport_photo || null
        }));
    } catch (error) {
        console.error('Error loading employees:', error);
        showToast('error', 'Error', 'Failed to load employees');
        employees.value = [];
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
@reference '@/assets/tailwind.css';

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
