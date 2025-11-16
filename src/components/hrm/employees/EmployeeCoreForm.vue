<template>
    <div class="space-y-6">
        <!-- Core -->
        <Card>
            <template #header>
                <div class="p-4">
                    <h3 class="text-xl font-semibold">Employee Information</h3>
                </div>
            </template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">National ID</label>
                        <InputText v-model="employeeForm.national_id" class="w-full" />
                    </div>
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">KRA PIN</label>
                        <InputText v-model="employeeForm.pin_no" class="w-full" />
                    </div>
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">SHIF/NHIF No.</label>
                        <InputText v-model="employeeForm.shif_or_nhif_number" class="w-full" />
                    </div>
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">NSSF No.</label>
                        <InputText v-model="employeeForm.nssf_no" class="w-full" />
                    </div>
                    <div class="field">
                        <label class="block text-sm font-medium mb-2">Date of Birth</label>
                        <Calendar v-model="employeeForm.date_of_birth" class="w-full" dateFormat="yy-mm-dd" showIcon />
                        <small class="text-surface-500">Age: {{ ageYears || '—' }}</small>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Contact and Kin -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <template #header>
                    <div class="p-4">
                        <h3 class="text-xl font-semibold">Contact Details</h3>
                    </div>
                </template>
                <template #content>
                    <EmployeeContactForm v-model="contactForm" />
                </template>
            </Card>
            <Card>
                <template #header>
                    <div class="p-4">
                        <h3 class="text-xl font-semibold">Next of Kin</h3>
                    </div>
                </template>
                <template #content>
                    <EmployeeKinForm v-model="kinForm" />
                </template>
            </Card>
        </div>

        <!-- Bank -->
        <Card>
            <template #header>
                <div class="p-4">
                    <h3 class="text-xl font-semibold">Bank Details</h3>
                </div>
            </template>
            <template #content>
                <EmployeeBankForm
                    v-model="bankForm"
                    :banks="banks"
                    :branches="branches"
                    @create-bank="handleCreateBank"
                    @create-branch="handleCreateBranch"
                    @bank-changed="handleBankChanged"
                />
            </template>
        </Card>

        <div class="flex justify-end">
            <Button :disabled="!employeeId || saving" :label="saving ? 'Saving...' : 'Save Profile'" icon="pi pi-check" @click="saveAll" />
        </div>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { computed, onMounted, reactive, ref } from 'vue';
import EmployeeBankForm from './EmployeeBankForm.vue';
import EmployeeContactForm from './EmployeeContactForm.vue';
import EmployeeKinForm from './EmployeeKinForm.vue';

const props = defineProps({
    employeeId: { type: Number, default: null }
});

const { showToast } = useToast();
const employeeId = computed(() => props.employeeId);

const employeeForm = reactive({
    id: null,
    national_id: '',
    pin_no: '',
    shif_or_nhif_number: '',
    nssf_no: '',
    date_of_birth: ''
});
const contactForm = reactive({
    id: null,
    personal_email: '',
    mobile_phone: ''
});
const kinForm = reactive({
    id: null,
    name: '',
    relation: '',
    phone: '',
    email: ''
});
const bankForm = reactive({
    id: null,
    bank_institution: null,
    bank_branch: null,
    account_number: '',
    is_primary: true
});
const banks = ref([]);
const branches = ref([]);
const salaryDetails = ref(null);
const saving = ref(false);

const ageYears = computed(() => {
    const dob = employeeForm.date_of_birth ? new Date(employeeForm.date_of_birth) : null;
    if (!dob || Number.isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
});

async function loadBanks() {
    const res = await systemConfigService.getBanks();
    banks.value = res?.data || [];
    if (bankForm.bank_institution) {
        const br = await systemConfigService.getBankBranches({ bank: bankForm.bank_institution });
        branches.value = br?.data || [];
    }
}

async function loadAll() {
    try {
        if (!employeeId.value) return;
        // Core
        const empCore = await employeeService.getEmployeeById(employeeId.value);
        if (empCore) {
            employeeForm.id = empCore.id;
            employeeForm.national_id = empCore.national_id || '';
            employeeForm.pin_no = empCore.pin_no || '';
            employeeForm.shif_or_nhif_number = empCore.shif_or_nhif_number || '';
            employeeForm.nssf_no = empCore.nssf_no || '';
            employeeForm.date_of_birth = empCore.date_of_birth || '';
        }
        // Contacts
        const contacts = await employeeService.getEmployeeContacts(employeeId.value);
        const primaryContact = (Array.isArray(contacts?.results) ? contacts.results : contacts || [])[0] || null;
        if (primaryContact) {
            contactForm.id = primaryContact.id;
            contactForm.personal_email = primaryContact.personal_email || '';
            contactForm.mobile_phone = primaryContact.mobile_phone || '';
        }
        // Kin
        const kins = await employeeService.getEmployeeNextOfKins(employeeId.value);
        const firstKin = (Array.isArray(kins?.results) ? kins.results : kins || [])[0] || null;
        if (firstKin) {
            kinForm.id = firstKin.id;
            kinForm.name = firstKin.name || '';
            kinForm.relation = firstKin.relation || '';
            kinForm.phone = firstKin.phone || '';
            kinForm.email = firstKin.email || '';
        }
        // Salary & bank
        salaryDetails.value = await employeeService.getEmployeeSalaryDetails(employeeId.value);
        const bankAccounts = await employeeService.listEmployeeBankAccounts(employeeId.value);
        const list = Array.isArray(bankAccounts?.results) ? bankAccounts.results : (bankAccounts || []);
        const primary = list.find(a => a.is_primary) || list[0];
        if (primary) {
            bankForm.id = primary.id;
            bankForm.bank_institution = primary.bank_institution || null;
            bankForm.bank_branch = primary.bank_branch || null;
            bankForm.account_number = primary.account_number || '';
            bankForm.is_primary = true;
        }
        await loadBanks();
    } catch (e) {
        // Non-fatal
    }
}

async function handleCreateBank(payload) {
    try {
        const res = await systemConfigService.createBank(payload);
        if (res?.success) {
            await loadBanks();
            const created = banks.value.find(b =>
                (payload.code && String(b.code).toUpperCase() === String(payload.code).toUpperCase()) ||
                (payload.name && String(b.name).toLowerCase() === String(payload.name).toLowerCase())
            );
            if (created) {
                bankForm.bank_institution = created.id;
                const br = await systemConfigService.getBankBranches({ bank: created.id });
                branches.value = br?.data || [];
            }
            showToast('success', 'Bank added', 'Bank saved successfully');
        }
    } catch (e) {
        showToast('error', 'Bank add failed', (e?.message || e)?.toString());
    }
}

async function handleCreateBranch(payload) {
    try {
        const res = await systemConfigService.createBankBranch(payload);
        if (res?.success) {
            const br = await systemConfigService.getBankBranches({ bank: payload.bank });
            branches.value = br?.data || [];
            const created = branches.value.find(b =>
                (payload.code && String(b.code).toUpperCase() === String(payload.code).toUpperCase()) ||
                (payload.name && String(b.name).toLowerCase() === String(payload.name).toLowerCase())
            );
            if (created) {
                bankForm.bank_branch = created.id;
            }
            showToast('success', 'Branch added', 'Bank branch saved successfully');
        }
    } catch (e) {
        showToast('error', 'Branch add failed', (e?.message || e)?.toString());
    }
}

async function handleBankChanged(bankId) {
    if (!bankId) {
        branches.value = [];
        bankForm.bank_branch = null;
        return;
    }
    const br = await systemConfigService.getBankBranches({ bank: bankId });
    branches.value = br?.data || [];
    bankForm.bank_branch = null;
}

async function saveAll() {
    if (!employeeId.value) return;
    try {
        saving.value = true;
        // Core
        await employeeService.updateEmployee(employeeId.value, {
            national_id: employeeForm.national_id || null,
            pin_no: employeeForm.pin_no || null,
            shif_or_nhif_number: employeeForm.shif_or_nhif_number || null,
            nssf_no: employeeForm.nssf_no || null,
            date_of_birth: employeeForm.date_of_birth || null
        });
        // Contact
        if (contactForm.id) {
            await employeeService.updateEmployeeContact(employeeId.value, contactForm.id, {
                personal_email: contactForm.personal_email || null,
                mobile_phone: contactForm.mobile_phone || null
            });
        } else if (contactForm.personal_email || contactForm.mobile_phone) {
            await employeeService.addEmployeeContact(employeeId.value, {
                personal_email: contactForm.personal_email || null,
                mobile_phone: contactForm.mobile_phone || null,
                country: 'KE'
            });
        }
        // Kin
        if (kinForm.id) {
            await employeeService.updateEmployeeNextOfKin(employeeId.value, kinForm.id, {
                name: kinForm.name || null,
                relation: kinForm.relation || null,
                phone: kinForm.phone || null,
                email: kinForm.email || null
            });
        } else if (kinForm.name) {
            await employeeService.addEmployeeNextOfKin(employeeId.value, {
                name: kinForm.name,
                relation: kinForm.relation || '',
                phone: kinForm.phone || '',
                email: kinForm.email || ''
            });
        }
        // Bank
        if (bankForm.account_number && bankForm.bank_institution && bankForm.bank_branch) {
            let bankAccountId = bankForm.id;
            if (bankAccountId) {
                await employeeService.updateEmployeeBankAccount(employeeId.value, bankAccountId, {
                    bank_institution: bankForm.bank_institution,
                    bank_branch: bankForm.bank_branch,
                    account_number: bankForm.account_number,
                    is_primary: true
                });
            } else {
                const created = await employeeService.addEmployeeBankAccount(employeeId.value, {
                    bank_institution: bankForm.bank_institution,
                    bank_branch: bankForm.bank_branch,
                    account_number: bankForm.account_number,
                    is_primary: true
                });
                bankAccountId = created?.id;
                bankForm.id = bankAccountId || bankForm.id;
            }
            // Link to salary details
            if (bankForm.id && salaryDetails.value) {
                await employeeService.updateEmployeeSalary(employeeId.value, {
                    bank_account: bankForm.id,
                    payment_type: 'bank',
                    mobile_number: contactForm.mobile_phone || null
                });
            }
        }
        showToast('success', 'Saved', 'Employee profile updated successfully');
    } catch (e) {
        showToast('error', 'Save failed', (e?.message || e)?.toString());
    } finally {
        await loadAll();
        saving.value = false;
    }
}

onMounted(async () => {
    await loadAll();
});
</script>

<style scoped>
</style>

