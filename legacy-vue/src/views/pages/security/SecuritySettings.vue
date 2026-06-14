<template>
    <div class="security-settings-container min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Security Settings</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Configure security policies and authentication methods</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Two-Factor Authentication -->
            <Card class="h-fit">
                <template #header>
                    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-shield text-2xl text-primary-500"></i>
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h2>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                            </div>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="text-center py-8">
                        <ProgressSpinner style="width:50px;height:50px" />
                    </div>
                    <div v-else>
                        <!-- 2FA Status Banner -->
                        <div v-if="twoFAStatus.isEnabled" class="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl mt-0.5"></i>
                                <div class="flex-1">
                                    <h3 class="font-semibold text-green-800 dark:text-green-200 mb-1">2FA is Active</h3>
                                    <p class="text-sm text-green-700 dark:text-green-300">Your account is protected with two-factor authentication.</p>
                                </div>
                                <Button
                                    label="Disable"
                                    icon="pi pi-times"
                                    severity="danger"
                                    size="small"
                                    outlined
                                    @click="showDisable2FAConfirm"
                                />
                            </div>
                        </div>

                        <div v-else class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-0.5"></i>
                                <div class="flex-1">
                                    <h3 class="font-semibold text-amber-800 dark:text-amber-200 mb-1">2FA is Not Enabled</h3>
                                    <p class="text-sm text-amber-700 dark:text-amber-300">Enable two-factor authentication to enhance your account security.</p>
                                </div>
                                <Button
                                    label="Enable 2FA"
                                    icon="pi pi-shield"
                                    size="small"
                                    @click="start2FASetup"
                                />
                            </div>
                        </div>

                        <!-- 2FA Information -->
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start gap-2">
                                <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                <p class="text-gray-700 dark:text-gray-300">
                                    Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                                </p>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                <p class="text-gray-700 dark:text-gray-300">
                                    You'll scan a QR code to link your account
                                </p>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                <p class="text-gray-700 dark:text-gray-300">
                                    Save your backup codes in a secure location
                                </p>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Password Policy -->
            <Card class="h-fit">
                <template #header>
                    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-key text-2xl text-primary-500"></i>
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Password Policy</h2>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Set password complexity requirements</p>
                            </div>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="text-center py-8">
                        <ProgressSpinner style="width:50px;height:50px" />
                    </div>
                    <div v-else class="space-y-4">
                        <!-- Minimum Length -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Minimum Password Length
                            </label>
                            <InputNumber
                                v-model="passwordPolicy.min_length"
                                :min="6"
                                :max="32"
                                showButtons
                                class="w-full"
                            />
                            <small class="text-gray-600 dark:text-gray-400">Recommended: 8 or more characters</small>
                        </div>

                        <!-- Complexity Requirements -->
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Complexity Requirements
                            </label>
                            
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="passwordPolicy.require_uppercase" inputId="uppercase" binary />
                                <label for="uppercase" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Require uppercase letters (A-Z)
                                </label>
                            </div>

                            <div class="flex items-center gap-2">
                                <Checkbox v-model="passwordPolicy.require_lowercase" inputId="lowercase" binary />
                                <label for="lowercase" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Require lowercase letters (a-z)
                                </label>
                            </div>

                            <div class="flex items-center gap-2">
                                <Checkbox v-model="passwordPolicy.require_numbers" inputId="numbers" binary />
                                <label for="numbers" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Require numbers (0-9)
                                </label>
                            </div>

                            <div class="flex items-center gap-2">
                                <Checkbox v-model="passwordPolicy.require_special_chars" inputId="special" binary />
                                <label for="special" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Require special characters (!@#$%...)
                                </label>
                            </div>
                        </div>

                        <!-- Security Settings -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password Expiry (days)
                                </label>
                                <InputNumber
                                    v-model="passwordPolicy.password_expiry_days"
                                    :min="0"
                                    :max="365"
                                    showButtons
                                    class="w-full"
                                />
                                <small class="text-gray-600 dark:text-gray-400">0 = never expires</small>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Max Login Attempts
                                </label>
                                <InputNumber
                                    v-model="passwordPolicy.max_login_attempts"
                                    :min="1"
                                    :max="10"
                                    showButtons
                                    class="w-full"
                                />
                                <small class="text-gray-600 dark:text-gray-400">Before account lockout</small>
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Lockout Duration (minutes)
                                </label>
                                <InputNumber
                                    v-model="passwordPolicy.lockout_duration_minutes"
                                    :min="1"
                                    :max="1440"
                                    showButtons
                                    class="w-full"
                                />
                                <small class="text-gray-600 dark:text-gray-400">How long accounts remain locked after max attempts</small>
                            </div>
                        </div>

                        <!-- Save Button -->
                        <div class="pt-4">
                            <Button
                                label="Save Password Policy"
                                icon="pi pi-check"
                                class="w-full"
                                @click="savePasswordPolicy"
                                :loading="saving"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- 2FA Setup Dialog -->
        <Dialog
            v-model:visible="twoFADialog"
            header="Two-Factor Authentication Setup"
            :modal="true"
            class="w-full md:w-2/3 lg:w-1/2"
            :closable="twoFAStep === 3"
        >
            <Steps :model="twoFASteps" :activeStep="twoFAStep" class="mb-6" />

            <!-- Step 0: Welcome -->
            <div v-if="twoFAStep === 0" class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">What is 2FA?</h3>
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        Two-factor authentication adds an extra security step to your login. You'll need both your password and a code from your phone to access your account.
                    </p>
                </div>
                
                <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p class="font-medium">You'll need:</p>
                    <ul class="list-disc list-inside space-y-1 ml-4">
                        <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
                        <li>Your smartphone with camera</li>
                        <li>A secure place to store backup codes</li>
                    </ul>
                </div>
            </div>

            <!-- Step 1: QR Code -->
            <div v-if="twoFAStep === 1" class="space-y-4">
                <div class="text-center">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Scan QR Code</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Open your authenticator app and scan this QR code
                    </p>
                    
                    <div class="flex justify-center mb-4">
                        <img :src="twoFASetup.qrCode" alt="QR Code" class="border-4 border-gray-200 dark:border-gray-700 rounded-lg" />
                    </div>

                    <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">Or enter this code manually:</p>
                        <div class="flex items-center justify-center gap-2">
                            <code class="bg-white dark:bg-gray-900 px-3 py-2 rounded font-mono text-sm">
                                {{ twoFASetup.secretKey }}
                            </code>
                            <Button
                                icon="pi pi-copy"
                                text
                                rounded
                                @click="copySecretKey"
                                v-tooltip.top="'Copy to clipboard'"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 2: Verify Code -->
            <div v-if="twoFAStep === 2" class="space-y-4">
                <div class="text-center mb-4">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Verify Code</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                <div class="flex justify-center">
                    <InputText
                        v-model="verificationCode"
                        placeholder="000000"
                        class="text-center text-2xl tracking-widest font-mono w-48"
                        maxlength="6"
                        @keypress="validateNumeric"
                    />
                </div>

                <div v-if="verificationError" class="text-center text-red-600 dark:text-red-400 text-sm">
                    {{ verificationError }}
                </div>
            </div>

            <!-- Step 3: Backup Codes -->
            <div v-if="twoFAStep === 3" class="space-y-4">
                <div class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-2">
                        <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 mt-0.5"></i>
                        <div>
                            <h3 class="font-semibold text-amber-900 dark:text-amber-100 mb-1">Save Your Backup Codes</h3>
                            <p class="text-sm text-amber-800 dark:text-amber-200">
                                Store these codes in a safe place. You can use them to access your account if you lose your device.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <div class="grid grid-cols-2 gap-2 font-mono text-sm">
                        <div
                            v-for="(code, index) in twoFASetup.backupCodes"
                            :key="index"
                            class="bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-center"
                        >
                            {{ code }}
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <Button
                        label="Download Codes"
                        icon="pi pi-download"
                        severity="secondary"
                        outlined
                        class="flex-1"
                        @click="downloadBackupCodes"
                    />
                    <Button
                        label="Print Codes"
                        icon="pi pi-print"
                        severity="secondary"
                        outlined
                        class="flex-1"
                        @click="printBackupCodes"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button
                        v-if="twoFAStep === 0"
                        label="Cancel"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        @click="twoFADialog = false"
                    />
                    <Button
                        v-if="twoFAStep === 0"
                        label="Start Setup"
                        icon="pi pi-arrow-right"
                        @click="generateQRCode"
                        :loading="generatingQR"
                    />
                    <Button
                        v-if="twoFAStep === 1"
                        label="Back"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        @click="twoFAStep = 0"
                    />
                    <Button
                        v-if="twoFAStep === 1"
                        label="Next"
                        icon="pi pi-arrow-right"
                        @click="twoFAStep = 2"
                    />
                    <Button
                        v-if="twoFAStep === 2"
                        label="Back"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        @click="twoFAStep = 1"
                    />
                    <Button
                        v-if="twoFAStep === 2"
                        label="Verify & Enable"
                        icon="pi pi-check"
                        @click="verify2FACode"
                        :loading="verifying"
                        :disabled="!verificationCode || verificationCode.length !== 6"
                    />
                    <Button
                        v-if="twoFAStep === 3"
                        label="Complete Setup"
                        icon="pi pi-check"
                        @click="complete2FASetup"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();

// State
const loading = ref(false);
const saving = ref(false);
const generatingQR = ref(false);
const verifying = ref(false);

// 2FA State
const twoFADialog = ref(false);
const twoFAStep = ref(0);
const twoFAStatus = ref({ isEnabled: false });
const twoFASetup = ref({
    qrCode: '',
    secretKey: '',
    backupCodes: []
});
const verificationCode = ref('');
const verificationError = ref('');

const twoFASteps = [
    { label: 'Introduction' },
    { label: 'Scan QR Code' },
    { label: 'Verify Code' },
    { label: 'Backup Codes' }
];

// Password Policy State
const passwordPolicy = ref({
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90,
    max_login_attempts: 5,
    lockout_duration_minutes: 30
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        const [policyRes, twoFARes] = await Promise.all([
            userManagementService.getPasswordPolicy(),
            userManagementService.get2FAStatus()
        ]);

        passwordPolicy.value = policyRes.data || passwordPolicy.value;
        twoFAStatus.value.isEnabled = twoFARes.data?.is_enabled || false;
    } catch (error) {
        console.error('Error loading security settings:', error);
        showToast('error', 'Failed to load security settings', 'Error');
    } finally {
        loading.value = false;
    }
};

const savePasswordPolicy = async () => {
    saving.value = true;
    try {
        await userManagementService.updatePasswordPolicy(passwordPolicy.value);
        showToast('success', 'Password policy updated successfully', 'Success');
    } catch (error) {
        console.error('Error saving password policy:', error);
        showToast('error', 'Failed to update password policy', 'Error');
    } finally {
        saving.value = false;
    }
};

// 2FA Methods
const start2FASetup = () => {
    twoFAStep.value = 0;
    twoFADialog.value = true;
};

const generateQRCode = async () => {
    generatingQR.value = true;
    try {
        const response = await userManagementService.setup2FA();
        twoFASetup.value.qrCode = response.data.qr_code;
        twoFASetup.value.secretKey = response.data.secret_key;
        twoFASetup.value.backupCodes = response.data.backup_codes || [];
        twoFAStep.value = 1;
    } catch (error) {
        console.error('Error generating 2FA setup:', error);
        showToast('error', 'Failed to generate 2FA setup', 'Error');
        twoFADialog.value = false;
    } finally {
        generatingQR.value = false;
    }
};

const verify2FACode = async () => {
    if (!verificationCode.value || verificationCode.value.length !== 6) {
        verificationError.value = 'Please enter a valid 6-digit code';
        return;
    }

    verifying.value = true;
    verificationError.value = '';
    
    try {
        await userManagementService.verify2FA(verificationCode.value);
        twoFAStatus.value.isEnabled = true;
        twoFAStep.value = 3;
        showToast('success', '2FA verified successfully!', 'Success');
    } catch (error) {
        console.error('Error verifying 2FA code:', error);
        verificationError.value = 'Invalid code. Please try again.';
        verificationCode.value = '';
    } finally {
        verifying.value = false;
    }
};

const complete2FASetup = () => {
    twoFADialog.value = false;
    twoFAStep.value = 0;
    verificationCode.value = '';
    showToast('success', 'Two-factor authentication enabled successfully', 'Success');
};

const showDisable2FAConfirm = () => {
    confirm.require({
        message: 'Are you sure you want to disable two-factor authentication? This will reduce your account security.',
        header: 'Disable 2FA',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => disable2FA()
    });
};

const disable2FA = async () => {
    try {
        await userManagementService.disable2FA();
        twoFAStatus.value.isEnabled = false;
        showToast('success', 'Two-factor authentication disabled', 'Success');
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        showToast('error', 'Failed to disable 2FA', 'Error');
    }
};

const copySecretKey = () => {
    navigator.clipboard.writeText(twoFASetup.value.secretKey);
    showToast('success', 'Secret key copied to clipboard', 'Success');
};

const downloadBackupCodes = () => {
    const text = `Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${twoFASetup.value.backupCodes.join('\n')}\n\nKeep these codes in a safe place!`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2FA-backup-codes-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const printBackupCodes = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>2FA Backup Codes</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #333; }
                .code { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
                .warning { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; }
            </style>
        </head>
        <body>
            <h1>Two-Factor Authentication Backup Codes</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <div class="warning">
                <strong>⚠️ Important:</strong> Store these codes in a safe place. Each code can only be used once.
            </div>
            ${twoFASetup.value.backupCodes.map(code => `<div class="code">${code}</div>`).join('')}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};

const validateNumeric = (event) => {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
};

// Lifecycle
onMounted(() => {
    loadData();
});
</script>

<style scoped>
.security-settings-container {
    max-width: 1400px;
    margin: 0 auto;
}
</style>

