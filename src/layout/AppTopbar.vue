<script setup>
import NotificationPanel from '@/components/notification/NotificationPanel.vue';
import { useTheme } from '@/composables/useTheme';
import { useLayout } from '@/layout/composables/layout';
import { getDashboardRedirectPath, hasAnyPermission } from '@/services/auth/permissionService';
import { notificationService } from '@/services/notifications/notificationService';
import { getUserAvatarUrl } from '@/utils/avatarHelper';
import { getBusinessDetails } from '@/utils/businessBranding';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppConfigurator from './AppConfigurator.vue';

const store = useStore();
const router = useRouter();
const { isDarkMode, toggleDarkMode: toggleTheme, initializeTheme } = useTheme();
const businessDetails = ref(null);
const notificationPanelRef = ref(null);
const unreadNotificationCount = ref(0);

// Get current user
const currentUser = computed(() => store.state.auth.user);
const userFullName = computed(() => {
    if (!currentUser.value) return 'User';
    return `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim() || currentUser.value.email || 'User';
});

const userAvatar = computed(() => {
    return getUserAvatarUrl(currentUser.value, 128);
});

// Check if user has system settings permissions
const hasSystemSettingsAccess = computed(() => {
    if (!currentUser.value?.permissions) return false;
    return hasAnyPermission(currentUser.value.permissions, [
        'view_appsettings',
        'change_appsettings',
        'view_brandingsettings',
        'change_brandingsettings',
        'view_bussiness',
        'change_bussiness'
    ]);
});

onMounted(async () => {
    // Initialize theme system
    initializeTheme();
    
    // Get business details from session storage
    businessDetails.value = getBusinessDetails();
    
    // Fetch unread notification count
    if (currentUser.value) {
        fetchUnreadNotificationCount();
        // Poll for new notifications every 60 seconds
        setInterval(fetchUnreadNotificationCount, 60000);
    }
});

const fetchUnreadNotificationCount = async () => {
    try {
        unreadNotificationCount.value = await notificationService.getUnreadCount();
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
    }
};

const refreshNotifications = () => {
    if (notificationPanelRef.value) {
        notificationPanelRef.value.fetchNotifications();
        fetchUnreadNotificationCount();
    }
};

// Computed property for business logo
const businessLogo = computed(() => {
    return businessDetails.value?.business__logo || '/logo.png';
});

const businessName = computed(() => {
    return businessDetails.value?.name || 'BengoERP';
});

// Computed properties for dynamic styling
const topbarStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        backgroundColor: businessDetails.value.business__background_color || '#ffffff',
        color: businessDetails.value.business__text_color || '#212121',
        borderBottom: `1px solid ${businessDetails.value.business__primary_color || '#1976D2'}30`
    };
});

const actionButtonStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        color: businessDetails.value.business__text_color || '#212121'
    };
});

const highlightButtonStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        backgroundColor: `${businessDetails.value.business__primary_color || '#1976D2'}15`,
        color: businessDetails.value.business__primary_color || '#1976D2'
    };
});

// Logout function
const logout = async () => {
    await store.dispatch('auth/logout');
    router.push({ name: 'login' });
};

const navigateToAccount = () => {
    router.push('/users/account');
};

const navigateToSettings = () => {
    router.push('/settings');
};

const navigateToDashboard = () => {
    // Navigate to user's appropriate dashboard based on role/permissions
    const redirectPath = getDashboardRedirectPath(currentUser.value);
    router.push(redirectPath);
};

const profileItems = computed(() => {
    const items = [
        {
            label: userFullName.value,
        items: [
            {
                    label: 'My Account',
                    icon: 'pi pi-fw pi-user',
                    command: navigateToAccount
            }
        ]
    },
    {
        separator: true
    },
    {
        label: 'Log Out',
        icon: 'pi pi-fw pi-sign-out',
        command: logout
    }
    ];
    
    // Add System Settings only if user has permissions
    if (hasSystemSettingsAccess.value) {
        items[0].items.push({
            label: 'System Settings',
            icon: 'pi pi-fw pi-cog',
            command: navigateToSettings
        });
    }
    
    return items;
});

const { onMenuToggle } = useLayout();
</script>

<template>
    <div class="layout-topbar" :style="topbarStyle">
        <!-- Left Section: Menu + Logo/Branch -->
        <div class="layout-topbar-left">
            <button 
                class="layout-menu-button" 
                @click="onMenuToggle" 
                :style="actionButtonStyle"
                aria-label="Toggle menu"
            >
                <i class="pi pi-bars text-xl"></i>
            </button>
            
            <a @click.prevent="navigateToDashboard" class="layout-topbar-logo cursor-pointer">
                <img 
                    v-if="businessLogo" 
                    :src="businessLogo" 
                    :alt="businessName" 
                    class="topbar-logo-img" 
                />
                <div class="logo-text">
                    <span class="business-name">{{ businessName }}</span>
                    <span class="branch-name hidden sm:block">Main Branch</span>
                </div>
            </a>
        </div>

        <!-- Right Section: Actions -->
        <div class="layout-topbar-right">
            <!-- Notifications (Always visible) -->
            <div class="relative">
                <button
                    v-styleclass="{
                        selector: '@next',
                        enterFromClass: 'hidden',
                        enterActiveClass: 'animate-scalein',
                        leaveToClass: 'hidden',
                        leaveActiveClass: 'animate-fadeout',
                        hideOnOutsideClick: true
                    }"
                    type="button"
                    class="topbar-icon-btn"
                    :style="actionButtonStyle"
                    @click="refreshNotifications"
                    aria-label="Notifications"
                >
                    <i class="pi pi-bell"></i>
                    <span v-if="unreadNotificationCount > 0" class="notification-badge">
                        {{ unreadNotificationCount > 9 ? '9+' : unreadNotificationCount }}
                    </span>
                </button>
                <NotificationPanel ref="notificationPanelRef" />
            </div>

            <!-- Theme Configurator (Always visible) -->
                <div class="relative">
                    <button
                        v-styleclass="{
                            selector: '@next',
                            enterFromClass: 'hidden',
                            enterActiveClass: 'animate-scalein',
                            leaveToClass: 'hidden',
                            leaveActiveClass: 'animate-fadeout',
                            hideOnOutsideClick: true
                        }"
                        type="button"
                    class="topbar-icon-btn theme-btn"
                        :style="highlightButtonStyle"
                    aria-label="Theme"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
            </div>

            <!-- Mobile More Menu (Visible on mobile only) -->
            <div class="relative lg:hidden">
            <button
                v-styleclass="{
                    selector: '@next',
                    enterFromClass: 'hidden',
                    enterActiveClass: 'animate-scalein',
                    leaveToClass: 'hidden',
                    leaveActiveClass: 'animate-fadeout',
                    hideOnOutsideClick: true
                }"
                    class="topbar-icon-btn"
                :style="actionButtonStyle"
                    aria-label="More options"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

                <!-- Mobile Dropdown Menu -->
                <div class="mobile-menu-dropdown hidden absolute top-12 right-0 w-72 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg shadow-xl z-50">
                    <div class="p-2">
                        <!-- User Profile Section -->
                        <div class="p-3 mb-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <div class="flex items-center gap-3">
                                <Avatar 
                                    :image="userAvatar" 
                                    shape="circle" 
                                    size="large"
                                />
                                <div class="flex flex-col flex-1 min-w-0">
                                    <span class="text-sm font-semibold truncate text-surface-900 dark:text-surface-0">{{ userFullName }}</span>
                                    <span class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ currentUser?.email }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="space-y-1">
                            <!-- Calendar -->
                            <button 
                                @click="router.push('/calendar')" 
                                class="menu-item"
                            >
                                <i class="pi pi-calendar text-lg"></i>
                                <span>Calendar</span>
                            </button>
                            
                            <!-- Messages -->
                            <button 
                                @click="router.push('/messages')" 
                                class="menu-item"
                            >
                                <i class="pi pi-inbox text-lg"></i>
                                <span>Messages</span>
                            </button>

                            <!-- Theme Toggle -->
                            <button 
                                @click="toggleTheme" 
                                class="menu-item"
                            >
                                <i :class="['pi text-lg', { 'pi-moon': isDarkMode, 'pi-sun': !isDarkMode }]"></i>
                                <span>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
                            </button>
                        </div>

                        <div class="border-t border-surface my-2"></div>

                        <!-- User Menu -->
                        <div class="space-y-1">
                            <button 
                                @click="navigateToAccount" 
                                class="menu-item"
                            >
                                <i class="pi pi-user text-lg"></i>
                                <span>My Account</span>
                            </button>

                            <button 
                                v-if="hasSystemSettingsAccess"
                                @click="navigateToSettings" 
                                class="menu-item"
                            >
                                <i class="pi pi-cog text-lg"></i>
                                <span>System Settings</span>
                            </button>
                        </div>

                        <div class="border-t border-surface my-2"></div>

                        <!-- Logout -->
                        <button 
                            @click="logout" 
                            class="menu-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <i class="pi pi-sign-out text-lg"></i>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Desktop User Section (Hidden on mobile) -->
            <div class="desktop-user-section hidden lg:flex items-center gap-2 ml-2">
                <!-- Dark Mode Toggle -->
                <button 
                    type="button" 
                    class="topbar-icon-btn" 
                    @click="toggleTheme" 
                    :style="actionButtonStyle" 
                    aria-label="Toggle theme"
                >
                    <i :class="['pi', { 'pi-moon': isDarkMode, 'pi-sun': !isDarkMode }]"></i>
                </button>

                <!-- Calendar -->
                <button 
                    type="button" 
                    class="topbar-icon-btn" 
                    :style="actionButtonStyle"
                    @click="router.push('/calendar')"
                    aria-label="Calendar"
                >
                    <i class="pi pi-calendar"></i>
                </button>

                <!-- Messages -->
                <button 
                    type="button" 
                    class="topbar-icon-btn" 
                    :style="actionButtonStyle"
                    @click="router.push('/messages')"
                    aria-label="Messages"
                >
                    <i class="pi pi-inbox"></i>
                </button>

                <!-- User Profile Dropdown -->
                <div class="ml-2 user-profile-wrapper">
                    <Avatar 
                        :image="userAvatar" 
                        shape="circle" 
                        size="large"
                        class="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        @click="navigateToAccount"
                    />
                    <SplitButton 
                        :label="userFullName" 
                        :model="profileItems" 
                        class="p-button-text user-profile-btn" 
                        :style="highlightButtonStyle"
                    ></SplitButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* Global body padding for fixed topbar */
body {
    padding-top: 60px;
}

@media (min-width: 640px) {
    body {
        padding-top: 70px;
    }
}

@media (min-width: 1024px) {
    body {
        padding-top: 80px;
    }
}
</style>

<style scoped>
/* ====================
   Base Topbar Styles
   ==================== */
.layout-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    height: 60px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--surface-0);
}

/* Mobile: 60px height */
@media (min-width: 640px) {
    .layout-topbar {
        height: 70px;
        padding: 0.875rem 1.5rem;
    }
}

/* Desktop: 80px height */
@media (min-width: 1024px) {
    .layout-topbar {
    height: 80px;
        padding: 1rem 2rem;
    }
}

/* ====================
   Left Section
   ==================== */
.layout-topbar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0; /* Allow shrinking */
}

@media (min-width: 640px) {
    .layout-topbar-left {
        gap: 1rem;
    }
}

.layout-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    border: none;
}

.layout-menu-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.layout-menu-button:active {
    transform: scale(0.95);
}

.layout-topbar-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    min-width: 0; /* Allow shrinking */
    transition: opacity 0.2s ease;
}

.layout-topbar-logo:hover {
    opacity: 0.85;
}

.layout-topbar-logo:active {
    opacity: 0.7;
}

.topbar-logo-img {
    height: 44px;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
}

@media (min-width: 640px) {
    .topbar-logo-img {
        height: 52px;
    }
}

@media (min-width: 1024px) {
    .topbar-logo-img {
        height: 60px;
    }
}

.logo-text {
    display: flex;
    flex-direction: column;
    min-width: 0; /* Allow text truncation */
}

.business-name {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (min-width: 640px) {
    .business-name {
        font-size: 1rem;
    }
}

@media (min-width: 1024px) {
    .business-name {
        font-size: 1.125rem;
    }
}

.branch-name {
    font-size: 0.75rem;
    color: var(--text-color-secondary, #64748b);
    line-height: 1;
}

/* ====================
   Right Section
   ==================== */
.layout-topbar-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

@media (min-width: 640px) {
    .layout-topbar-right {
        gap: 0.5rem;
    }
}

.topbar-icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    border: none;
}

@media (min-width: 640px) {
    .topbar-icon-btn {
        width: 40px;
        height: 40px;
    }
}

.topbar-icon-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.topbar-icon-btn:active {
    transform: scale(0.95);
}

.topbar-icon-btn i {
    font-size: 1.125rem;
}

@media (min-width: 640px) {
    .topbar-icon-btn i {
        font-size: 1.25rem;
    }
}

.topbar-icon-btn.theme-btn {
    background-color: var(--primary-color, #3B82F6);
    color: white;
}

.topbar-icon-btn.theme-btn:hover {
    opacity: 0.9;
    transform: scale(1.05);
}

/* Notification Badge */
.notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--surface-0);
}

/* ====================
   Mobile Menu Dropdown
   ==================== */
.mobile-menu-dropdown {
    animation: slideDown 0.2s ease-out;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-color);
    font-size: 0.875rem;
    text-align: left;
}

.menu-item:hover {
    background-color: var(--surface-100);
}

.menu-item:active {
    transform: scale(0.98);
}

.menu-item i {
    color: var(--text-color-secondary, #64748b);
    flex-shrink: 0;
}

/* ====================
   Desktop User Section
   ==================== */
.desktop-user-section {
    padding-left: 1rem;
    border-left: 1px solid var(--surface-border, #e5e7eb);
}

.user-profile-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-profile-btn {
    font-size: 0.875rem;
}

:deep(.p-splitbutton) {
    display: flex;
    align-items: center;
}

:deep(.p-splitbutton-menubutton) {
    border-radius: 50% !important;
    width: 32px !important;
    height: 32px !important;
}

:deep(.p-splitbutton-defaultbutton) {
    border-radius: 50% !important;
    padding: 0.5rem 1rem;
}

/* ====================
   Dark Mode Overrides
   ==================== */
.dark .layout-topbar {
    background: var(--surface-900);
    border-bottom-color: var(--surface-700);
}

.dark .layout-menu-button:hover,
.dark .topbar-icon-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dark .menu-item:hover {
    background-color: var(--surface-800);
}

.dark .desktop-user-section {
    border-left-color: var(--surface-700);
}

/* ====================
   Responsive Utilities
   ==================== */
@media (max-width: 640px) {
    /* Extra small screens */
    .business-name {
        max-width: 120px;
    }
}

@media (min-width: 641px) and (max-width: 1023px) {
    /* Tablets */
    .business-name {
        max-width: 200px;
    }
}

/* Touch devices - larger hit areas */
@media (hover: none) and (pointer: coarse) {
    .topbar-icon-btn,
    .layout-menu-button {
        width: 44px;
        height: 44px;
    }
    
    .menu-item {
        padding: 1rem;
        min-height: 48px;
    }
}

/* ====================
   Accessibility
   ==================== */
.topbar-icon-btn:focus-visible,
.layout-menu-button:focus-visible,
.menu-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* ====================
   Animation Classes
   ==================== */
.animate-scalein {
    animation: scalein 0.15s ease-out;
}

.animate-fadeout {
    animation: fadeout 0.15s ease-in;
}

@keyframes scalein {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeout {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
</style>
