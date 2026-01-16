<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { authService } from '@/services/auth/authService';

const router = useRouter();
const { showToast } = useToast();

// State
const email = ref('');
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

// Validation
const isValidEmail = computed(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.value);
});

const canSubmit = computed(() => {
    return email.value && isValidEmail.value && !loading.value;
});

// Methods
const handleSubmit = async () => {
    if (!canSubmit.value) return;

    loading.value = true;
    error.value = '';

    try {
        await authService.forgotPassword(email.value);
        submitted.value = true;
        showToast('success', 'Success', 'If an account exists with that email, you will receive a password reset link.');
    } catch (err) {
        // Still show success message to prevent email enumeration
        submitted.value = true;
    } finally {
        loading.value = false;
    }
};

const goToLogin = () => {
    router.push('/auth/login');
};

const resetForm = () => {
    submitted.value = false;
    email.value = '';
    error.value = '';
};
</script>

<template>
    <div class="forgot-password-page">
        <div class="forgot-password-container">
            <!-- Logo/Branding -->
            <div class="brand-section">
                <div class="brand-icon">
                    <i class="pi pi-lock"></i>
                </div>
                <h1 class="brand-title">Password Reset</h1>
                <p class="brand-subtitle">BengoBox ERP</p>
            </div>

            <!-- Success State -->
            <div v-if="submitted" class="success-card">
                <div class="success-icon">
                    <i class="pi pi-envelope"></i>
                </div>
                <h2>Check Your Email</h2>
                <p>
                    If an account exists for <strong>{{ email }}</strong>, you will receive
                    a password reset link shortly.
                </p>
                <p class="hint-text">
                    Don't see the email? Check your spam folder or try again.
                </p>
                <div class="action-buttons">
                    <Button
                        label="Back to Login"
                        icon="pi pi-arrow-left"
                        class="p-button-primary"
                        @click="goToLogin"
                    />
                    <Button
                        label="Try Again"
                        icon="pi pi-refresh"
                        class="p-button-text"
                        @click="resetForm"
                    />
                </div>
            </div>

            <!-- Form State -->
            <div v-else class="form-card">
                <h2>Forgot Password?</h2>
                <p class="form-description">
                    No worries! Enter your email address and we'll send you a link to reset your password.
                </p>

                <form @submit.prevent="handleSubmit" class="forgot-form">
                    <!-- Error Message -->
                    <div v-if="error" class="error-message">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>{{ error }}</span>
                    </div>

                    <!-- Email Field -->
                    <div class="form-field">
                        <label for="email">Email Address</label>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-envelope" />
                            <InputText
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="Enter your email"
                                :class="{ 'p-invalid': email && !isValidEmail }"
                                :disabled="loading"
                                autocomplete="email"
                            />
                        </IconField>
                        <small v-if="email && !isValidEmail" class="p-error">
                            Please enter a valid email address
                        </small>
                    </div>

                    <!-- Submit Button -->
                    <Button
                        type="submit"
                        label="Send Reset Link"
                        icon="pi pi-send"
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
.forgot-password-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.forgot-password-container {
    width: 100%;
    max-width: 420px;
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

/* Form Card */
.form-card,
.success-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.form-card h2,
.success-card h2 {
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
.success-card {
    text-align: center;
}

.success-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.success-icon i {
    font-size: 36px;
    color: white;
}

.success-card p {
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
.forgot-form {
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

.form-field :deep(.p-inputtext) {
    width: 100%;
    padding: 12px 12px 12px 40px;
}

.form-field :deep(.p-icon-field) {
    width: 100%;
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
    .forgot-password-page {
        padding: 16px;
    }

    .form-card,
    .success-card {
        padding: 24px;
    }

    .brand-title {
        font-size: 24px;
    }

    .form-card h2,
    .success-card h2 {
        font-size: 20px;
    }
}
</style>
