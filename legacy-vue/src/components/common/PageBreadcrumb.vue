<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
    customBreadcrumbs: {
        type: Array,
        default: () => []
    },
    show: {
        type: Boolean,
        default: true
    }
});

const route = useRoute();

const routeLabelMap = {
    'finance': 'Finance', 'hrm': 'HRM', 'inventory': 'Inventory', 'sales': 'Sales', 'purchases': 'Purchases',
    'reports': 'Reports', 'settings': 'Settings', 'dashboard': 'Dashboard', 'accounts': 'Accounts',
    'budgets': 'Budgets', 'expenses': 'Expenses', 'payments': 'Payments', 'taxes': 'Taxes',
    'vouchers': 'Vouchers', 'billing': 'Billing Documents', 'reconciliation': 'Bank Reconciliation',
    'employees': 'Employees', 'payroll': 'Payroll', 'attendance': 'Attendance', 'leave': 'Leave Management',
    'casual': 'Casual Workers', 'consultants': 'Consultants', 'advance-pay': 'Advance Pay',
    'loss-damages': 'Losses & Damages', 'cashflow': 'Cash Flow', 'profit': 'Profit & Loss',
    'balance-sheet': 'Balance Sheet', 'trial-balance': 'Trial Balance', 'users': 'User Management',
    'roles': 'Roles & Permissions', 'security': 'Security', 'backups': 'Backups',
    'crm': 'CRM', 'pipeline': 'Pipeline', 'leads': 'Leads', 'customers': 'Customers',
    'opportunities': 'Opportunities', 'procurement': 'Procurement', 'suppliers': 'Suppliers',
    'requisitions': 'Requisitions', 'ecommerce': 'E-commerce', 'products': 'Products',
    'pos': 'Point of Sale', 'checkout': 'Checkout', 'manufacturing': 'Manufacturing',
    'analytics': 'Analytics', 'formulas': 'Formulas', 'integrations': 'Integrations'
};

const breadcrumbs = computed(() => {
    if (props.customBreadcrumbs.length > 0) {
        return props.customBreadcrumbs;
    }

    const pathSegments = route.path.split('/').filter((segment) => segment);
    const generatedBreadcrumbs = [];

    let currentPath = '';

    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        let label = routeLabelMap[segment] || segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        if (segment === 'view-employees') {
            label = 'View Employees';
        } else if (segment === 'casualEmployees') {
            label = 'Casual Employees';
        }

        generatedBreadcrumbs.push({
            label,
            to: index < pathSegments.length - 1 ? currentPath : null
        });
    });

    return generatedBreadcrumbs;
});

const shouldShow = computed(() => {
    // Show breadcrumb on all pages except the exact home page
    // Always show on dashboard pages
    const isDashboard = route.path.includes('dashboard') || route.name?.includes('dashboard');
    return props.show && (route.path !== '/' || isDashboard);
});
</script>

<template>
    <nav v-if="shouldShow" class="breadcrumb-wrapper" aria-label="Breadcrumb">
        <div class="breadcrumb-container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item">
                    <router-link
                        to="/"
                        class="breadcrumb-link breadcrumb-home"
                        title="Go to Home"
                    >
                        <i class="pi pi-home"></i>
                        <span class="breadcrumb-text">Home</span>
                    </router-link>
                </li>

                <li v-for="(item, index) in breadcrumbs" :key="index" class="breadcrumb-item">
                    <div class="breadcrumb-separator">
                        <i class="pi pi-chevron-right"></i>
                    </div>

                    <router-link
                        v-if="item.to && index < breadcrumbs.length - 1"
                        :to="item.to"
                        class="breadcrumb-link breadcrumb-navigable"
                        :title="`Go to ${item.label}`"
                    >
                        {{ item.label }}
                    </router-link>

                    <span
                        v-else
                        class="breadcrumb-link breadcrumb-current"
                        :title="`Current page: ${item.label}`"
                    >
                        {{ item.label }}
                    </span>
                </li>
            </ol>
        </div>
    </nav>
</template>

<style scoped>
.breadcrumb-wrapper {
    margin-bottom: 1.5rem;
    padding: 1rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

.breadcrumb-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
}

.breadcrumb-container {
    max-width: 100%;
    overflow-x: auto;
    position: relative;
    z-index: 1;
}

.breadcrumb-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0;
    padding: 0 1rem;
    list-style: none;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.breadcrumb-separator {
    display: flex;
    align-items: center;
    margin: 0 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}

.breadcrumb-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
    overflow: hidden;
}

.breadcrumb-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.breadcrumb-link:hover::before {
    left: 100%;
}

.breadcrumb-home {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.breadcrumb-home:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.breadcrumb-navigable {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.breadcrumb-navigable:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.breadcrumb-current {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-weight: 600;
    cursor: default;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.breadcrumb-text {
    display: inline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .breadcrumb-wrapper {
        margin-bottom: 1rem;
        padding: 0.75rem 0;
        border-radius: 8px;
    }

    .breadcrumb-list {
        padding: 0 0.75rem;
    }

    .breadcrumb-link {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
    }

    .breadcrumb-separator {
        margin: 0 0.5rem;
    }

    .breadcrumb-text {
        display: none;
    }
}

@media (max-width: 480px) {
    .breadcrumb-wrapper {
        padding: 0.5rem 0;
        border-radius: 6px;
    }

    .breadcrumb-list {
        padding: 0 0.5rem;
    }

    .breadcrumb-link {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
    }

    .breadcrumb-separator {
        margin: 0 0.25rem;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .breadcrumb-wrapper {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
}
</style>
