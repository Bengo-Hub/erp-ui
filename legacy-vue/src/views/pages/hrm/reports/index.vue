<template>
    <div class="hrm-reports-index">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
            <h1 class="text-2xl font-bold text-gray-800">Payroll Reports</h1>
            <p class="text-gray-600 mt-1">Generate statutory and custom payroll reports for compliance and analysis</p>
        </div>

        <!-- Report Categories -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- KRA Reports -->
            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/p9')">
                <template #header>
                    <div class="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                        <i class="pi pi-file-pdf text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">P9 Tax Deduction Card</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Individual employee PAYE tax deduction cards as per KRA requirements</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/p10a')">
                <template #header>
                    <div class="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                        <i class="pi pi-file-pdf text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">P10A Annual PAYE Return</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Annual PAYE return summary for submission to KRA</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/withholding-tax')">
                <template #header>
                    <div class="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                        <i class="pi pi-file-excel text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">KRA Withholding Tax</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Withholding tax report for contractors and consultants</p>
                </template>
            </Card>

            <!-- Statutory Deductions Reports -->
            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/nssf')">
                <template #header>
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                        <i class="pi pi-shield text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">NSSF Contributions</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">National Social Security Fund monthly contributions report</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/nhif')">
                <template #header>
                    <div class="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                        <i class="pi pi-heart text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">NHIF (SHA) Contributions</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Social Health Insurance Fund monthly contributions report</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/nita')">
                <template #header>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                        <i class="pi pi-book text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">NITA Levy</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">National Industrial Training Authority levy report</p>
                </template>
            </Card>

            <!-- Payroll Reports -->
            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/bank-net-pay')">
                <template #header>
                    <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
                        <i class="pi pi-building text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Bank Net Pay Report</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Bank-wise net pay listing for salary disbursement</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/muster-roll')">
                <template #header>
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                        <i class="pi pi-users text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Monthly Muster Roll</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Complete employee payroll register for the month</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/variance')">
                <template #header>
                    <div class="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
                        <i class="pi pi-chart-line text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Payroll Variance</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Month-to-month payroll variance analysis</p>
                </template>
            </Card>

            <!-- Other Reports -->
            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/approvers')">
                <template #header>
                    <div class="bg-gradient-to-r from-pink-500 to-pink-600 p-4 text-white">
                        <i class="pi pi-check-circle text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Approvers Report</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Payroll approval workflow and audit trail</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/cbs')">
                <template #header>
                    <div class="bg-gradient-to-r from-gray-500 to-gray-600 p-4 text-white">
                        <i class="pi pi-chart-bar text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Central Bureau of Statistics</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Employment statistics for CBS reporting</p>
                </template>
            </Card>

            <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/hrm/reports/custom')">
                <template #header>
                    <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 text-white">
                        <i class="pi pi-cog text-3xl"></i>
                    </div>
                </template>
                <template #title>
                    <div class="text-lg font-semibold">Custom Reports</div>
                </template>
                <template #content>
                    <p class="text-gray-600 text-sm">Create and manage custom payroll reports</p>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const home = ref({ icon: 'pi pi-home', to: '/' });
const navigateTo = (path) => {
    router.push(path);
};
</script>

<style scoped>
.hrm-reports-index {
    min-height: 100vh;
}
</style>

