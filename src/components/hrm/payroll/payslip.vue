<script setup>
import logoImage from '@/assets/images/logos/logo.png';
import PermissionButton from '@/components/common/PermissionButton.vue';
// import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { formatCurrency, formattedMonthYear } from './payslipGenerator';
import PayslipPreview from './PayslipPreview.vue';

const { showToast } = useToast();
const confirm = useConfirm();
const { canRead, canUpdate, hasPermission, userPermissions } = usePermissions();
const payslipData = ref(null);
const spinner_title = ref('Please wait! Fetching employee data...');
const isLoading = ref(false);
const isActionLoading = ref(false);
const showPreview = ref(false);
const payslipId = defineProps({
    id: Number,
    payslip: Object,
    showActions: { type: Boolean, default: true },
    approvalStatus: String,
    userPermissions: { type: Array, default: () => [] }
});
const emit = defineEmits(['payslip-info', 'print-payslip', 'email-payslip', 'rerun-payslip', 'approve-payslip', 'reject-payslip', 'submit-approval']);
const business = reactive(JSON.parse(sessionStorage.getItem('business')));

// Business information
const logoUrl = ref(business.business__watermarklogo ? `${business.business__watermarklogo}` : logoImage);
const address = ref(business.address ? business.address : 'Excel Building, 1st Floor, Oginga Road,');
const box = ref(business.addre ? `P.O Box ${business.postal_code}-${business.zip_code} ${business.city},` : 'P.O Box 567-40100 Kisumu,');
const tel1 = business.contact_number ? business.contact_number : '0743 793 901';
const alt_tel = business.alternate_contact_number ? `|${business.alternate_contact_number}` : '|0792 548766';
const tel = ref(tel1 + alt_tel);
const email = ref(business.email ? business.email : 'info@codevertexitsolutions.com');
const website = ref(business.website ? business.website : 'www.codevertexitsolutions.com');

// Computed properties
const isShifEra = computed(() => {
    return payslipData.value?.payment_period && new Date(payslipData.value.payment_period).getFullYear() >= 2025;
});

// Removed unused computed property - now handled in PayslipPreview component

const approvalStatusSeverity = computed(() => {
    const status = payslipData.value?.approval_status;
    switch (status) {
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
            return 'danger';
        case 'draft':
            return 'info';
        default:
            return 'secondary';
    }
});

const canApprove = computed(() => {
    return canUpdate('payslip') && payslipData.value?.approval_status === 'pending';
});

const canSubmitForApproval = computed(() => {
    return canRead('payslip') && payslipData.value?.approval_status === 'draft';
});

const canRerun = computed(() => {
    return canUpdate('payslip');
});

const canEmail = computed(() => {
    return canRead('payslip') && payslipData.value?.approval_status === 'approved';
});

const canPrint = computed(() => {
    return canRead('payslip');
});

// Watch for changes in payslip prop
watch(
    () => payslipId.payslip,
    (newPayslip) => {
        if (newPayslip) {
            payslipData.value = newPayslip;
            emitPayslipInfo(newPayslip);
        }
    },
    { immediate: true }
);

onMounted(() => {
    console.log('Payslip component mounted:', {
        id: payslipId.id,
        payslip: payslipId.payslip,
        showActions: payslipId.showActions
    });

    // Debug: Set some test permissions if none exist
    if (userPermissions.value.length === 0) {
        console.log('No permissions found, setting test permissions...');
        const { setPermissions } = usePermissions();
        setPermissions(['view_payslip', 'change_payslip', 'add_payslip', 'delete_payslip']);
    }

    if (payslipId.payslip == null) {
        console.log('No payslip prop, fetching from API...');
        getPayslip();
    } else {
        console.log('Using payslip prop data');
        payslipData.value = payslipId.payslip;
        emitPayslipInfo(payslipId.payslip);
    }

    window.addEventListener('print-payslip', printPayslip);
    window.addEventListener('email-payslip', emailPayslip);
});

async function getPayslip() {
    console.log('getPayslip called with ID:', payslipId.id);

    if (!payslipId.id) {
        console.error('No payslip ID provided');
        showToast('error', 'Error', 'Payslip ID is required', 3000);
        return;
    }

    isLoading.value = true;
    spinner_title.value = 'Please wait! Fetching employee data...';

    try {
        console.log('Fetching payslip from API...');
        const response = await payrollService.getPayslip(payslipId.id);
        console.log('Payslip response:', response);
        payslipData.value = response.data;
        emitPayslipInfo(response.data);
    } catch (error) {
        console.error('Error fetching payslip:', error);
        showToast('error', 'Error', 'Failed to fetch payslip data', 3000);
    } finally {
        isLoading.value = false;
    }
}

function emitPayslipInfo(payslipData) {
    if (!payslipData || !payslipData.employee) {
        return;
    }

    emit('payslip-info', {
        empid: payslipData.employee.id,
        employee: payslipData.employee.name,
        payroll_period: payslipData.payment_period,
        created_by: payslipData.created_by,
        approval_submitted_by: payslipData.approval_submitted_by,
        approval_submit_date: payslipData.approval_submit_date,
        create_date: payslipData.payroll_date,
        approver: payslipData.approver,
        approval_date: payslipData.approval_date,
        approval_status: payslipData.approval_status
    });
}

// Removed unused computed property

// Action methods
const printPayslip = async () => {
    if (!payslipData.value) {
        showToast('error', 'Error', 'No payslip data available', 3000);
        return;
    }

    // Show preview instead of direct print
    showPreview.value = true;
    emit('print-payslip', payslipData.value);
};

const previewPayslip = () => {
    if (!payslipData.value) {
        showToast('error', 'Error', 'No payslip data available', 3000);
        return;
    }
    showPreview.value = true;
};

const onPayslipDownload = (data) => {
    showToast('success', 'Success', 'Payslip downloaded successfully', 3000);
    console.log('Payslip downloaded:', data);
};

const onPayslipPrint = (data) => {
    showToast('success', 'Success', 'Payslip sent to printer', 3000);
    console.log('Payslip printed:', data);
};

const emailPayslip = async () => {
    if (!payslipData.value) {
        showToast('error', 'Error', 'No payslip data available', 3000);
        return;
    }

    isActionLoading.value = true;
    try {
        // Use the payroll service to send payslips
        const response = await payrollService.sendPayslips({
            payslip_ids: [payslipData.value.id],
            send_email: true
        });

        if (response.data.success) {
            showToast('success', 'Success', response.data.message || 'Payslip email sent successfully', 3000);
            emit('email-payslip', payslipData.value);
        } else {
            showToast('error', 'Error', response.data.detail || 'Failed to send payslip email', 3000);
        }
    } catch (error) {
        console.error('Error sending payslip email:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to send payslip email';
        showToast('error', 'Error', errorMessage, 3000);
    } finally {
        isActionLoading.value = false;
    }
};

const rerunPayslip = () => {
    confirm.require({
        message: 'Are you sure you want to rerun this payslip? This will recalculate all values.',
        header: 'Confirm Rerun',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            isActionLoading.value = true;
            try {
                const response = await payrollService.rerunPayslip(payslipData.value.id);
                console.log('Rerun payslip response:', response);

                if (response.data.success) {
                    showToast('success', 'Success', response.data.message || 'Payslip rerun initiated successfully', 3000);
                    emit('rerun-payslip', payslipData.value);

                    // Wait a moment then refresh payslip data
                    setTimeout(async () => {
                        await getPayslip();
                    }, 2000);
                } else {
                    showToast('error', 'Error', response.data.detail || 'Failed to rerun payslip', 3000);
                }
            } catch (error) {
                console.error('Error rerunning payslip:', error);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to rerun payslip';
                showToast('error', 'Error', errorMessage, 3000);
            } finally {
                isActionLoading.value = false;
            }
        }
    });
};

const approvePayslip = () => {
    confirm.require({
        message: 'Are you sure you want to approve this payslip?',
        header: 'Confirm Approval',
        icon: 'pi pi-check-circle',
        accept: async () => {
            isActionLoading.value = true;
            try {
                const response = await payrollService.approvePayroll(payslipData.value.id);
                if (response.data.success) {
                    showToast('success', 'Success', 'Payslip approved successfully', 3000);
                    emit('approve-payslip', payslipData.value);
                    // Refresh payslip data
                    await getPayslip();
                } else {
                    showToast('error', 'Error', response.data.detail || 'Failed to approve payslip', 3000);
                }
            } catch (error) {
                console.error('Error approving payslip:', error);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve payslip';
                showToast('error', 'Error', errorMessage, 3000);
            } finally {
                isActionLoading.value = false;
            }
        }
    });
};

const rejectPayslip = () => {
    confirm.require({
        message: 'Are you sure you want to reject this payslip?',
        header: 'Confirm Rejection',
        icon: 'pi pi-times-circle',
        accept: async () => {
            isActionLoading.value = true;
            try {
                const response = await payrollService.rejectPayroll(payslipData.value.id, 'Rejected by user');
                if (response.data.success) {
                    showToast('success', 'Success', 'Payslip rejected successfully', 3000);
                    emit('reject-payslip', payslipData.value);
                    // Refresh payslip data
                    await getPayslip();
                } else {
                    showToast('error', 'Error', response.data.detail || 'Failed to reject payslip', 3000);
                }
            } catch (error) {
                console.error('Error rejecting payslip:', error);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject payslip';
                showToast('error', 'Error', errorMessage, 3000);
            } finally {
                isActionLoading.value = false;
            }
        }
    });
};

const submitForApproval = () => {
    confirm.require({
        message: 'Are you sure you want to submit this payslip for approval?',
        header: 'Submit for Approval',
        icon: 'pi pi-send',
        accept: async () => {
            isActionLoading.value = true;
            try {
                const response = await payrollService.submitForApproval(payslipData.value.id);
                if (response.data.success) {
                    showToast('success', 'Success', 'Payslip submitted for approval successfully', 3000);
                    emit('submit-approval', payslipData.value);
                    // Refresh payslip data
                    await getPayslip();
                } else {
                    showToast('error', 'Error', response.data.detail || 'Failed to submit payslip for approval', 3000);
                }
            } catch (error) {
                console.error('Error submitting payslip for approval:', error);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to submit payslip for approval';
                showToast('error', 'Error', errorMessage, 3000);
            } finally {
                isActionLoading.value = false;
            }
        }
    });
};
</script>

<template>
    <div class="payslip-container">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center p-8">
            <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-500">{{ spinner_title }}</p>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="!payslipData || !payslipData.employee" class="flex justify-center items-center p-8">
            <div class="text-center">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-500">No payslip data available</p>
                <p class="text-sm text-gray-400 mt-2">Please check if the payslip exists and try again.</p>
            </div>
        </div>

        <!-- Payslip Container -->
        <div v-else class="payslip-wrapper">
            <div>
                <!-- Action Toolbar -->
                <Toolbar v-if="showActions" class="mb-4">
                    <template #start>
                        <div class="flex items-center gap-2">
                            <Tag :value="payslipData.approval_status?.toUpperCase() || 'DRAFT'" :severity="approvalStatusSeverity" />
                            <span class="text-sm text-gray-600">
                                {{ formattedMonthYear(payslipData.payroll_date) }}
                            </span>
                        </div>
                    </template>
                    <template #end>
                        <div class="flex gap-2">
                            <PermissionButton permission="view_payslip" icon="pi pi-eye" label="Preview" size="small" :loading="isActionLoading" @click="previewPayslip" />
                            <PermissionButton permission="view_payslip" icon="pi pi-print" label="Print" size="small" :loading="isActionLoading" @click="printPayslip" />
                            <PermissionButton permission="view_payslip" icon="pi pi-send" label="Email" size="small" severity="info" :loading="isActionLoading" :disabled="payslipData?.approval_status !== 'approved'" @click="emailPayslip" />
                            <PermissionButton permission="change_payslip" icon="pi pi-sync" label="Rerun" size="small" severity="warning" :loading="isActionLoading" @click="rerunPayslip" />
                            <PermissionButton permission="view_payslip" icon="pi pi-send" label="Submit for Approval" size="small" severity="success" :disabled="payslipData?.approval_status !== 'draft'" @click="submitForApproval" />
                            <PermissionButton permission="change_payslip" icon="pi pi-check" label="Approve" size="small" severity="success" :disabled="payslipData?.approval_status !== 'pending'" @click="approvePayslip" />
                            <PermissionButton permission="change_payslip" icon="pi pi-times" label="Reject" size="small" severity="danger" :disabled="payslipData?.approval_status !== 'pending'" @click="rejectPayslip" />
                        </div>
                    </template>
                </Toolbar>

                <!-- Payslip Header -->
                <Card class="payslip-header mb-4">
                    <template #content>
                        <div class="flex flex-col md:flex-row items-center justify-between">
                            <!-- Company Info -->
                            <div class="flex items-center mb-4 md:mb-0">
                                <img :src="logoUrl" alt="Company Logo" class="h-16 w-20 mr-4" />
                                <div>
                                    <h1 class="text-xl font-bold text-gray-800">{{ business.business__name }}</h1>
                                    <p class="text-sm text-gray-600">{{ address }}</p>
                                    <p class="text-sm text-gray-600">{{ box }}</p>
                                    <p class="text-sm text-gray-600">{{ tel }}</p>
                                    <p class="text-sm text-gray-600">{{ email }} | {{ website }}</p>
                                </div>
                            </div>

                            <!-- Payslip Info -->
                            <div class="text-center md:text-right">
                                <h2 class="text-2xl font-bold text-gray-800 mb-2">PAY SLIP</h2>
                                <p class="text-lg text-gray-600">
                                    {{ formattedMonthYear(payslipData.payroll_date) }}
                                </p>
                                <p class="text-sm text-gray-500">Generated: {{ new Date(payslipData.payroll_date).toLocaleDateString() }}</p>
                            </div>
                        </div>
                    </template>
                </Card>
                <!-- Employee Information -->
                <Card class="mb-4">
                    <template #title>Employee Information</template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Name:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.name || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Staff Number:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.staffNo || 'N/A' }}</span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Job Title:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.job_title || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Department/Region:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.department || 'N/A' }}/{{ payslipData.employee?.region || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Earnings Summary -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(payslipData.employee?.basic_salary || 0) }}</div>
                            <div class="text-sm text-gray-600">Basic Salary</div>
                        </template>
                    </Card>
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(payslipData.gross_pay) }}</div>
                            <div class="text-sm text-gray-600">Gross Pay</div>
                        </template>
                    </Card>
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(payslipData.net_pay) }}</div>
                            <div class="text-sm text-gray-600">Net Pay</div>
                        </template>
                    </Card>
                </div>

                <!-- NSSF Summary -->
                <div v-if="payslipData.nssf_employee_tier_1 > 0 || payslipData.nssf_employee_tier_2 > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-orange-600">{{ formatCurrency(payslipData.nssf_employee_tier_1 || 0) }}</div>
                            <div class="text-sm text-gray-600">NSSF Tier 1</div>
                        </template>
                    </Card>
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-orange-600">{{ formatCurrency(payslipData.nssf_employee_tier_2 || 0) }}</div>
                            <div class="text-sm text-gray-600">NSSF Tier 2</div>
                        </template>
                    </Card>
                    <Card class="text-center">
                        <template #content>
                            <div class="text-2xl font-bold text-orange-700">{{ formatCurrency(Number(payslipData.nssf_employee_tier_1 || 0) + Number(payslipData.nssf_employee_tier_2 || 0)) }}</div>
                            <div class="text-sm text-gray-600">Total NSSF</div>
                        </template>
                    </Card>
                </div>

                <!-- Earnings & Benefits Section -->
                <Card v-if="payslipData.earnings?.length || payslipData.benefits?.length" class="mb-4">
                    <template #title>Earnings & Benefits</template>
                    <template #content>
                        <div class="space-y-2">
                            <div v-for="earning in payslipData.earnings || []" :key="earning.earning.title" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">{{ earning.earning.title }}</span>
                                    <Tag v-if="earning.earning.non_cash" value="Non-cash" severity="info" size="small" />
                                </div>
                                <span class="font-semibold text-green-600">{{ formatCurrency(earning.amount) }}</span>
                            </div>
                            <div v-for="benefit in payslipData.benefits || []" :key="benefit.benefit.title" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">{{ benefit.benefit.title }}</span>
                                    <Tag v-if="benefit.benefit.non_cash" value="Non-cash" severity="info" size="small" />
                                </div>
                                <span class="font-semibold text-green-600">{{ formatCurrency(benefit.amount) }}</span>
                            </div>
                            <Divider />
                            <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span class="font-bold text-lg">Total Earnings & Benefits</span>
                                <span class="font-bold text-lg text-blue-600">{{ formatCurrency(payslipData.total_earnings) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Deductions Before Tax Section -->
                <Card class="mb-4">
                    <template #title>Deductions Before Tax</template>
                    <template #content>
                        <div class="space-y-2">
                            <!-- NSSF Tier 1 -->
                            <div v-if="payslipData.nssf_employee_tier_1 > 0" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">N.S.S.F Tier 1</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(payslipData.nssf_employee_tier_1) }}</span>
                            </div>

                            <!-- NSSF Tier 2 -->
                            <div v-if="payslipData.nssf_employee_tier_2 > 0" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">N.S.S.F Tier 2</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(payslipData.nssf_employee_tier_2) }}</span>
                            </div>

                            <!-- Total NSSF -->
                            <div v-if="payslipData.nssf_employee_tier_1 > 0 || payslipData.nssf_employee_tier_2 > 0" class="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                <span class="font-bold">Total N.S.S.F</span>
                                <span class="font-bold text-orange-700">{{ formatCurrency(Number(payslipData.nssf_employee_tier_1 || 0) + Number(payslipData.nssf_employee_tier_2 || 0)) }}</span>
                            </div>

                            <!-- SHIF/NHIF -->
                            <div v-if="payslipData.shif_or_nhif_contribution > 0" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">{{ isShifEra ? 'S.H.I.F' : 'N.H.I.F' }}</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(payslipData.shif_or_nhif_contribution) }}</span>
                            </div>

                            <!-- Housing Levy -->
                            <div v-if="payslipData.housing_levy > 0" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">Housing Levy</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(payslipData.housing_levy) }}</span>
                            </div>

                            <!-- Other Deductions Before Tax (excluding statutory) -->
                            <div
                                v-for="deduction in (payslipData.deductions || []).filter((x) => x.deduction.deduct_after_taxing === false && !x.deduction.statutory)"
                                :key="deduction.deduction.title"
                                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                                <span class="font-medium">{{ deduction.deduction.title }}</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(deduction.amount) }}</span>
                            </div>

                            <Divider />
                            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span class="font-bold text-lg">Total Deductions Before Tax</span>
                                <span class="font-bold text-lg text-red-600">{{ formatCurrency(payslipData.deductions_before_tax) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Tax and Relief Section -->
                <Card class="mb-4">
                    <template #title>Tax and Relief</template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Taxable Pay and PAYE -->
                            <div class="space-y-2">
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span class="font-medium">Taxable Pay</span>
                                    <span class="font-semibold text-orange-600">{{ formatCurrency(payslipData.taxable_pay) }}</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span class="font-medium">P.A.Y.E</span>
                                    <span class="font-semibold text-orange-600">{{ formatCurrency(payslipData.paye) }}</span>
                                </div>
                            </div>

                            <!-- Personal Reliefs -->
                            <div class="space-y-2">
                                <h4 class="font-bold text-lg text-gray-700">Less Personal Reliefs</h4>
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span class="font-medium">Tax Relief</span>
                                    <span class="font-semibold text-green-600">{{ formatCurrency(payslipData.tax_relief) }}</span>
                                </div>
                                <div v-if="payslipData.ahl_relief > 0" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span class="font-medium">AHL Relief</span>
                                    <span class="font-semibold text-green-600">{{ formatCurrency(payslipData.ahl_relief) }}</span>
                                </div>
                                <Divider />
                                <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span class="font-bold">Total Reliefs</span>
                                    <span class="font-bold text-green-600">{{ formatCurrency(payslipData.reliefs) }}</span>
                                </div>
                            </div>

                            <!-- PAYE After Reliefs -->
                            <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span class="font-bold text-lg">P.A.Y.E After Reliefs</span>
                                <span class="font-bold text-lg text-orange-600">
                                    {{ formatCurrency(parseInt(payslipData.reliefs) <= parseInt(payslipData.paye) ? parseInt(payslipData.paye) - parseInt(payslipData.reliefs) : 0.0) }}
                                </span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Deductions After Tax Section -->
                <Card
                    v-if="
                        (payslipData.deductions || []).filter((x) => x.deduction.deduct_after_taxing === true).length ||
                        (payslipData.loans || []).length ||
                        (payslipData.advances || []).length ||
                        (payslipData.benefits || []).filter((x) => x.benefit.non_cash === true).length
                    "
                    class="mb-4"
                >
                    <template #title>Deductions After Tax</template>
                    <template #content>
                        <div class="space-y-2">
                            <!-- After Tax Deductions -->
                            <div v-for="deduction in (payslipData.deductions || []).filter((x) => x.deduction.deduct_after_taxing === true)" :key="deduction.deduction.title" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">{{ deduction.deduction.title }}</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(deduction.amount) }}</span>
                            </div>

                            <!-- Loans -->
                            <div v-for="loan in payslipData.loans || []" :key="loan.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">{{ loan.loan.title }}</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(loan.monthly_installment) }}</span>
                            </div>

                            <!-- Non-Cash Benefits -->
                            <div v-if="(payslipData.benefits || []).filter((x) => x.benefit.non_cash === true).length" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">Less Non-Cash Benefits</span>
                                <span class="font-semibold text-red-600">{{
                                    formatCurrency(
                                        (payslipData.benefits || []).reduce((total, benefit) => {
                                            if (benefit.benefit.non_cash) {
                                                return total + parseFloat(benefit.amount);
                                            }
                                            return total;
                                        }, 0)
                                    )
                                }}</span>
                            </div>

                            <!-- Advances -->
                            <div v-for="advance in payslipData.advances || []" :key="advance.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium">Advance Pay - ({{ advance.repay_option.amount }})</span>
                                <span class="font-semibold text-red-600">{{ formatCurrency(advance.repay_option.installment_amount) }}</span>
                            </div>

                            <Divider />
                            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span class="font-bold text-lg">Total Deductions After Tax</span>
                                <span class="font-bold text-lg text-red-600">{{ formatCurrency(payslipData.deductions_after_tax) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>
                <!-- Personal Information Footer -->
                <Card class="mb-4">
                    <template #title>Personal Information</template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Payment Mode:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.payment_type || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Bank Name:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.bank?.name || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Bank Account:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.bank?.acc || 'N/A' }}</span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">ID Number:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.id_no || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">PIN:</span>
                                    <span class="font-semibold">{{ payslipData.employee?.pin || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-600">Generated:</span>
                                    <span class="font-semibold">{{ new Date(payslipData.payroll_date).toLocaleDateString() }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Loading Spinner -->
        <Spinner :isLoading="isLoading" :title="spinner_title" />

        <!-- Confirmation Dialog -->
        <ConfirmDialog />

        <!-- Payslip Preview Dialog -->
        <PayslipPreview v-model="showPreview" :payslips="payslipData" :company-name="business.business__name" @download="onPayslipDownload" @print="onPayslipPrint" />
    </div>
</template>

<style scoped>
.payslip-container {
    @apply max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen;
}

.payslip-wrapper {
    @apply space-y-4;
}

.payslip-header {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500;
}

/* Print styles */
@media print {
    .payslip-container {
        @apply bg-white p-0 max-w-none;
        margin: 0;
        padding: 0;
    }

    .payslip-wrapper {
        @apply space-y-2;
        page-break-inside: avoid;
    }

    /* Hide action toolbar when printing */
    .p-primevue-toolbar {
        display: none !important;
    }

    /* Ensure proper page breaks for cards */
    .p-card {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 10px;
    }

    /* Force page breaks for large sections */
    .p-card:nth-child(3n) {
        page-break-before: auto;
    }

    /* Ensure content flows properly */
    .grid {
        page-break-inside: avoid;
    }

    .space-y-2 > * + * {
        margin-top: 8px;
    }

    /* Optimize colors for print */
    .text-red-600 {
        @apply text-gray-800;
    }

    .text-green-600 {
        @apply text-gray-800;
    }

    .text-blue-600 {
        @apply text-gray-800;
    }

    .text-orange-600 {
        @apply text-gray-800;
    }

    .text-purple-600 {
        @apply text-gray-800;
    }

    /* Ensure proper spacing */
    .p-card .p-card-content {
        padding: 12px;
    }

    /* Fix any overflow issues */
    * {
        overflow: visible !important;
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .payslip-container {
        @apply p-2;
    }

    .payslip-header .flex {
        @apply flex-col text-center;
    }

    .payslip-header .flex > div:first-child {
        @apply mb-4;
    }
}

/* Custom card styling */
.p-card .p-card-title {
    @apply text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4;
}

.p-card .p-card-content {
    @apply p-4;
}

/* Status tag styling */
.p-tag {
    @apply font-semibold;
}

/* Button group styling */
.p-toolbar .p-button {
    @apply shadow-sm;
}

/* Loading state */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Hover effects */
.p-card:hover {
    @apply shadow-lg transition-shadow duration-200;
}

/* Focus states for accessibility */
.p-button:focus {
    @apply ring-2 ring-blue-500 ring-offset-2;
}

/* Custom divider styling */
.p-divider {
    @apply my-4;
}

/* Summary cards styling */
.grid .p-card {
    @apply text-center;
}

.grid .p-card .p-card-content {
    @apply py-6;
}
</style>
