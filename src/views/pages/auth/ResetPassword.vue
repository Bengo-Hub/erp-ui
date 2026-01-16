<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { authService } from '@/services/auth/authService';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

// State
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const validating = ref(true);
const tokenValid = ref(false);
const submitted = ref(false);
const error = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Get token from URL
const uid = computed(() => route.params.uid);
const token = computed(() => route.params.token);

// Password validation
const passwordStrength = computed(() => {
    const pwd = newPassword.value;
    if (!pwd) return { score: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#dc2626' };
    if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
    return { score, label: 'Strong', color: '#22c55e' };
});

const passwordsMatch = computed(() => {
    return newPassword.value === confirmPassword.value;
});

const isValidPassword = computed(() => {
    return newPassword.value.length >= 8;
});

const canSubmit = computed(() => {
    return (
        isValidPassword.value &&
        passwordsMatch.value &&
        newPassword.value &&
        confirmPassword.value &&
        !loading.value
    );
});

// Password requirements
const requirements = computed(() => [
    { met: newPassword.value.length >= 8, text: 'At least 8 characters' },
    { met: /[a-z]/.test(newPassword.value), text: 'One lowercase letter' },
    { met: /[A-Z]/.test(newPassword.value), text: 'One uppercase letter' },
    { met: /[0-9]/.test(newPassword.value), text: 'One number' },
    { met: /[^a-zA-Z0-9]/.test(newPassword.value), text: 'One special character' },
]);

// Methods
const validateToken = async () => {
    validating.value = true;
    try {
        const result = await authService.validateResetToken(uid.value, token.value);
        tokenValid.value = result.valid;
        if (!result.valid) {
            error.value = result.detail || 'Invalid or expired reset link';
        }
    } catch (err) {
        tokenValid.value = false;
        error.value = 'Unable to validate reset link';
    } finally {
        validating.value = false;
    }
};

const handleSubmit = async () => {
    if (!canSubmit.value) return;

    loading.value = true;
    error.value = '';

    try {
        await authService.resetPassword(
            uid.value,
            token.value,
            newPassword.value,
            confirmPassword.value
        );
        submitted.value = true;
        showToast('success', 'Success', 'Your password has been reset successfully!');
    } catch (err) {
        error.value = err.detail || 'Failed to reset password. Please try again.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const goToLogin = () => {
    router.push('/auth/login');
};

const requestNewLink = () => {
    router.push('/auth/forgot-password');
};

// Lifecycle
onMounted(() => {
    if (uid.value && token.value) {
        // Token validation is done on submit to avoid revealing token validity
        validating.value = false;
        tokenValid.value = true;
    } else {
        validating.value = false;
        tokenValid.value = false;
        error.value = 'Invalid reset link. Please request a new one.';
    }
});
</script>

<template>
    <div class="reset-password-page">
        <div class="reset-password-container">
            <!-- Logo/Branding -->
            <div class="brand-section">
                <div class="brand-icon">
                    <i class="pi pi-key"></i>
                </div>
                <h1 class="brand-title">Reset Password</h1>
                <p class="brand-subtitle">BengoBox ERP</p>
            </div>

            <!-- Loading State -->
            <div v-if="validating" class="loading-card">
                <ProgressSpinner style="width: 50px; height: 50px" />
                <p>Validating reset link...</p>
            </div>

            <!-- Invalid Token State -->
            <div v-else-if="!tokenValid && !submitted" class="error-card">
                <div class="error-icon">
                    <i class="pi pi-times-circle"></i>
                </div>
                <h2>Invalid Reset Link</h2>
                <p>{{ error || 'This password reset link is invalid or has expired.' }}</p>
                <p class="hint-text">
                    Reset links expire after 24 hours for security. Please request a new one.
                </p>
                <div class="action-buttons">
                    <Button
                        label="Request New Link"
                        icon="pi pi-envelope"
                        class="p-button-primary"
                        @click="requestNewLink"
                    />
                    <Button
                        label="Back to Login"
                        icon="pi pi-arrow-left"
                        class="p-button-text"
                        @click="goToLogin"
                    />
                </div>
            </div>

            <!-- Success State -->
            <div v-else-if="submitted" class="success-card">
                <div class="success-icon">
                    <i class="pi pi-check-circle"></i>
                </div>
                <h2>Password Reset Complete!</h2>
                <p>
                    Your password has been successfully reset. You can now log in with your new password.
                </p>
                <div class="action-buttons">
                    <Button
                        label="Go to Login"
                        icon="pi pi-sign-in"
                        class="p-button-primary"
                        @click="goToLogin"
                    />
                </div>
            </div>

            <!-- Form State -->
            <div v-else class="form-card">
                <h2>Create New Password</h2>
                <p class="form-description">
                    Enter a new password for your account. Make sure it's strong and unique.
                </p>

                <form @submit.prevent="handleSubmit" class="reset-form">
                    <!-- Error Message -->
                    <div v-if="error" class="error-message">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>{{ error }}</span>
                    </div>

                    <!-- New Password Field -->
                    <div class="form-field">
                        <label for="newPassword">New Password</label>
                        <div class="password-input-wrapper">
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-lock" />
                                <InputText
                                    id="newPassword"
                                    v-model="newPassword"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="Enter new password"
                                    :disabled="loading"
                                    autocomplete="new-password"
                                />
                            </IconField>
                            <button
                                type="button"
                                class="toggle-password"
                                @click="showPassword = !showPassword"
                            >
                                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                            </button>
                        </div>

                        <!-- Password Strength -->
                        <div v-if="newPassword" class="password-strength">
                            <div class="strength-bar">
                                <div
                                    class="strength-fill"
                                    :style="{
                                        width: `${(passwordStrength.score / 6) * 100}%`,
                                        backgroundColor: passwordStrength.color
                                    }"
                                ></div>
                            </div>
                            <span class="strength-label" :style="{ color: passwordStrength.color }">
                                {{ passwordStrength.label }}
                            </span>
                        </div>
                    </div>

                    <!-- Confirm Password Field -->
                    <div class="form-field">
                        <label for="confirmPassword">Confirm Password</label>
                        <div class="password-input-wrapper">
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-lock" />
                                <InputText
                                    id="confirmPassword"
                                    v-model="confirmPassword"
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    placeholder="Confirm new password"
                                    :class="{ 'p-invalid': confirmPassword && !passwordsMatch }"
                                    :disabled="loading"
                                    autocomplete="new-password"
                                />
                            </IconField>
                            <button
                                type="button"
                                class="toggle-password"
                                @click="showConfirmPassword = !showConfirmPassword"
                            >
                                <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                            </button>
                        </div>
                        <small v-if="confirmPassword && !passwordsMatch" class="p-error">
                            Passwords do not match
                        </small>
                        <small v-else-if="confirmPassword && passwordsMatch" class="p-success">
                            <i class="pi pi-check"></i> Passwords match
                        </small>
                    </div>

                    <!-- Password Requirements -->
                    <div class="requirements-list">
                        <p class="requirements-title">Password Requirements:</p>
                        <ul>
                            <li
                                v-for="(req, index) in requirements"
                                :key="index"
                                :class="{ met: req.met }"
                            >
                                <i :class="req.met ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                                {{ req.text }}
                            </li>
                        </ul>
                    </div>

                    <!-- Submit Button -->
                    <Button
                        type="submit"
                        label="Reset Password"
                        icon="pi pi-check"
                        class="submit-button"
                        :loading="loading"
                        :disabled="!canSubmit"
                    />

                    <!-- Back to Login -->
                    <div class="back-link">
                        <Button
                            label="Back to Login"
                            icon="pi pi-arrow-left"
                            class="p-button-text p-button-plain"
                            @click="goToLogin"
                        />
                    </div>
                </form>
            </div>

            <!-- Help Section -->
            <div class="help-section">
                <p>
                    Need help? Contact
                    <a href="mailto:support@bengobox.com">support@bengobox.com</a>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.reset-password-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.reset-password-container {
    width: 100%;
    max-width: 440px;
}

/* Brand Section */
.brand-section {
    text-align: center;
    margin-bottom: 32px;
}

.brand-icon {
    width: 72px;
    height: 72px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}

.brand-icon i {
    font-size: 32px;
    color: white;
}

.brand-title {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin: 0 0 4px;
}

.brand-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin: 0;
}

/* Cards */
.form-card,
.success-card,
.error-card,
.loading-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.loading-card {
    text-align: center;
    padding: 48px 32px;
}

.loading-card p {
    color: #6b7280;
    margin-top: 16px;
}

.form-card h2,
.success-card h2,
.error-card h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px;
    text-align: center;
}

.form-description {
    color: #6b7280;
    text-align: center;
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.5;
}

/* Success Card */
.success-card,
.error-card {
    text-align: center;
}

.success-icon,
.error-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.success-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.error-icon {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.success-icon i,
.error-icon i {
    font-size: 36px;
    color: white;
}

.success-card p,
.error-card p {
    color: #4b5563;
    margin: 0 0 16px;
    line-height: 1.6;
}

.hint-text {
    font-size: 13px;
    color: #9ca3af;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
}

/* Form */
.reset-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-field label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

.password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.password-input-wrapper :deep(.p-inputtext) {
    width: 100%;
    padding: 12px 40px 12px 40px;
    padding-right: 44px;
}

.password-input-wrapper :deep(.p-icon-field) {
    width: 100%;
}

.toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: #6b7280;
    z-index: 1;
}

.toggle-password:hover {
    color: #374151;
}

.p-success {
    color: #22c55e;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Password Strength */
.password-strength {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
}

.strength-bar {
    flex: 1;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    transition: width 0.3s, background-color 0.3s;
    border-radius: 2px;
}

.strength-label {
    font-size: 12px;
    font-weight: 600;
    min-width: 50px;
}

/* Requirements List */
.requirements-list {
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
}

.requirements-title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px;
}

.requirements-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}

.requirements-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #9ca3af;
    transition: color 0.2s;
}

.requirements-list li.met {
    color: #22c55e;
}

.requirements-list li i {
    font-size: 14px;
}

/* Error Message */
.error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 14px;
}

.error-message i {
    font-size: 18px;
}

/* Submit Button */
.submit-button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
}

.submit-button:enabled:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

/* Back Link */
.back-link {
    text-align: center;
}

.back-link :deep(.p-button) {
    color: #6b7280;
}

/* Help Section */
.help-section {
    text-align: center;
    margin-top: 24px;
}

.help-section p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    margin: 0;
}

.help-section a {
    color: white;
    text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
    .reset-password-page {
        padding: 16px;
    }

    .form-card,
    .success-card,
    .error-card {
        padding: 24px;
    }

    .brand-title {
        font-size: 24px;
    }

    .form-card h2,
    .success-card h2,
    .error-card h2 {
        font-size: 20px;
    }
}
</style>
