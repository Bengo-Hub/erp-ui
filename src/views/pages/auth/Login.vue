<script setup>
import logoImage from '@/assets/images/logos/logo.png';
import FloatingConfigurator from '@/components/ui/FloatingConfigurator.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useTheme } from '@/composables/useTheme';
import { authService } from '@/services/auth/authService';
import { getDashboardRedirectPath as getDashboardPath } from '@/services/auth/permissionService';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { loadPublicBranding, businessBranding, isDarkMode } = useTheme();

const logo = ref(logoImage);
const businessName = ref('BengoBox ERP');
const businessLogo = ref(null);

const form = ref({
    email: '',
    password: '',
    two_fa_code: '',
    remember: false
});

const isLoading = ref(false);
const spinner_title = ref('Authenticating...');
const errorMessage = ref('');
const requires2FA = ref(false);
const accountLocked = ref(false);
const lockoutInfo = ref(null);
const activeStep = ref(0);

const store = useStore();
const router = useRouter();

// Load public branding on mount (no auth required)
onMounted(async () => {
    // Load public branding first
    const publicBranding = await loadPublicBranding();
    
    if (publicBranding) {
        businessName.value = publicBranding.business__name || publicBranding.name || 'BengoBox ERP';
        businessLogo.value = publicBranding.business__logo || publicBranding.logo;
        document.title = businessName.value;
    }

    // Also check session storage for existing business data
    const storedBusinessData = sessionStorage.getItem('business');
    if (storedBusinessData) {
        try {
            const business = JSON.parse(storedBusinessData);
            if (business.business__name) {
                businessName.value = business.business__name;
            }
            if (business.business__logo) {
                businessLogo.value = business.business__logo;
            }
        } catch (error) {
            console.error('Error parsing business data:', error);
        }
    }
});

const appLogoSrc = computed(() => {
    return businessLogo.value || logo.value;
});

const handleLogin = async () => {
    if (!form.value.email || !form.value.password) {
        errorMessage.value = 'Please enter both email and password';
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const { email, password, two_fa_code } = form.value;

        const response = await authService.login({
            email,
            password,
            two_fa_code: two_fa_code || null
        });

        if (response && response.requires_2fa) {
            requires2FA.value = true;
            activeStep.value = 1;
            // Save email for 2FA step
            localStorage.setItem('lastLoginEmail', email);
        } else if (response && response.success) {
            // Force password change flow
            if (response.password_change_required) {
                router.push('/users/account');
                return;
            }
            // Login successful (store hydrated by authService.login)
            localStorage.setItem('lastLoginEmail', email);

            // Redirect based on user role
            const user = store.state.auth.user;
            const redirectPath = getDashboardPath(user);
            router.push(redirectPath);
        } else {
            // Handle error cases
            errorMessage.value = 'Login failed. Please check your credentials.';
        }
    } catch (error) {
        console.error(error);
        errorMessage.value = 'Login failed. Please check your credentials.';
    } finally {
        isLoading.value = false;
    }
};

const handle2FAVerification = async () => {
    if (!form.value.two_fa_code) {
        errorMessage.value = 'Please enter the 2FA code';
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const response = await authService.login({
            email: form.value.email,
            password: form.value.password,
            two_fa_code: form.value.two_fa_code
        });

        if (response && response.success) {
            // Login successful with 2FA (store hydrated by authService.login)
            localStorage.setItem('lastLoginEmail', form.value.email);

            // Redirect based on user role
            const user = store.state.auth.user;
            const redirectPath = getDashboardPath(user);
            router.push(redirectPath);
        } else {
            errorMessage.value = 'Invalid 2FA code';
            form.value.two_fa_code = '';
        }
    } catch (error) {
        console.error(error);
        errorMessage.value = 'Invalid 2FA code';
        form.value.two_fa_code = '';
    } finally {
        isLoading.value = false;
    }
};

const formatTimeRemaining = (minutes) => {
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
};

const handleBackupCode = () => {
    errorMessage.value = 'Backup code functionality is not yet implemented. Please contact your administrator.';
};

// Function to determine dashboard redirect based on user role
const getDashboardRedirectPathForUser = (user) => {
    return getDashboardPath(user);
};
</script>

<template>
    <FloatingConfigurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
                            <router-link to="/" class="layout-topbar-logo flex items-center justify-center space-x-2">
                                <img :src="appLogoSrc" alt="Logo" class="h-20 w-30 object-contain" />
                            </router-link>
                            <h3>Welcome to {{ businessName }}!</h3>
                        </div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                        <div v-if="businessBranding && (businessBranding.business__address || businessBranding.address)" class="mt-2 text-sm text-muted-color">
                            {{ businessBranding.business__address || businessBranding.address }}
                            <div v-if="businessBranding.website" class="mt-1">
                                <a :href="businessBranding.website ? `https://${businessBranding.website}` : '#'" target="_blank" class="text-primary hover:underline">{{ businessBranding.website }}</a>
                            </div>
                        </div>
                    </div>

                    <div v-if="!requires2FA && !accountLocked">
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-2" v-model="form.email" />
                        <div v-if="errorMessage" class="text-red-600 mb-4">{{ errorMessage }}</div>

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="form.password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="form.remember" id="rememberme1" class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <router-link to="/auth/forgot-password" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary hover:underline">Forgot password?</router-link>
                        </div>
                        <Button label="Sign In" @click="handleLogin" class="w-full"></Button>
                    </div>

                    <!-- 2FA Step -->
                    <div v-if="requires2FA">
                        <h3 class="text-center mb-4">Two-Factor Authentication</h3>
                        <p class="text-center text-muted-color mb-4">Enter the 6-digit code from your authenticator app</p>

                        <label for="twofa" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">2FA Code</label>
                        <InputText id="twofa" v-model="form.two_fa_code" placeholder="000000" maxlength="6" class="w-full md:w-[30rem] mb-4 text-center text-2xl tracking-widest" />
                        <div v-if="errorMessage" class="text-red-600 mb-4">{{ errorMessage }}</div>

                        <div class="flex gap-4 mb-4">
                            <Button
                                label="Back"
                                @click="
                                    requires2FA = false;
                                    activeStep = 0;
                                "
                                class="flex-1"
                                severity="secondary"
                            ></Button>
                            <Button label="Verify" @click="handle2FAVerification" class="flex-1"></Button>
                        </div>

                        <div class="text-center">
                            <span class="text-sm text-muted-color cursor-pointer hover:text-primary" @click="handleBackupCode"> Lost access to your authenticator? </span>
                        </div>
                    </div>

                    <!-- Account Locked -->
                    <div v-if="accountLocked" class="text-center">
                        <div class="text-6xl text-warning mb-4">⏰</div>
                        <h3 class="mb-4">Account Temporarily Locked</h3>
                        <p class="text-muted-color mb-4">Your account has been locked due to multiple failed login attempts.</p>

                        <div v-if="lockoutInfo" class="bg-warning-50 dark:bg-warning-900 p-4 rounded-lg mb-4">
                            <p class="text-sm"><strong>Time remaining:</strong> {{ formatTimeRemaining(lockoutInfo.remaining_minutes) }}</p>
                            <p class="text-sm"><strong>Locked until:</strong> {{ new Date(lockoutInfo.locked_until).toLocaleString() }}</p>
                        </div>

                        <p class="text-sm text-muted-color">Please wait for the lockout period to expire or contact your administrator for assistance.</p>
                    </div>
                </div>
            </div>
        </div>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
