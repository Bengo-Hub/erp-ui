import ShopLayout from '@/components/ecommerce/ShopLayout.vue';
import AppLayout from '@/layout/AppLayout.vue';
import { appraisalRoutes } from './appraisalRoutes';
import { authRoutes } from './authRoutes';
import { crmRoutes } from './crmRoutes';
import { dashboardRoutes } from './dashboardRoutes';
import { ecommerceRoutes } from './ecommerceRoutes';
import { employeeRoutes } from './employeeRoutes';
import { financeRoutes, publicFinanceRoutes } from './financeRoutes';
import { inventoryRoutes } from './inventoryRoutes';
import { leaveRoutes } from './leaveRoutes';
import { manufacturingRoutes } from './manufacturingRoutes';
import { payrollRoutes } from './payrollRoutes';
import { procurementRoutes } from './procurementRoutes';
import { productManagementRoutes } from './productManagementRoutes';
import { reportsRoutes } from './reportsRoutes';
import { securityRoutes } from './securityRoutes';
import { settingsRoutes } from './settingsRoutes';
import { userManagementRoutes } from './userManagementRoutes';

// Filter out routes that are shop-related (have the isShopRoute meta flag)
const filterShopRoutes = (routes) => {
    return routes.filter((route) => route.meta?.isShopRoute);
};

// Filter out routes that are NOT shop-related
const filterNonShopRoutes = (routes) => {
    return routes.filter((route) => !route.meta?.isShopRoute);
};

// Get shop routes from ecommerceRoutes
const shopRoutes = filterShopRoutes(ecommerceRoutes);
// Get admin/POS routes from ecommerceRoutes
const posRoutes = filterNonShopRoutes(ecommerceRoutes);

const routes = [
    {
        path: '/ecommerce/shop',
        component: ShopLayout,
        children: [
            // Add explicit routes for any known paths
            {
                path: 'products',
                component: () => import('@/views/pages/ecommerce/products/ProductListing.vue'),
                name: 'shop-products',
                props: (route) => ({ searchQuery: route.query.search })
            },
            // Map remaining shop routes
            ...shopRoutes
                .filter(
                    (route) =>
                        // Don't include the products route that we've already added explicitly
                        route.name !== 'shop-products'
                )
                .map((route) => {
                    const updatedRoute = { ...route };

                    // Simple path transformation - remove /ecommerce/shop prefix
                    if (updatedRoute.path.startsWith('/ecommerce/shop/')) {
                        updatedRoute.path = updatedRoute.path.replace('/ecommerce/shop/', '');
                    } else if (updatedRoute.path === '/ecommerce/shop') {
                        updatedRoute.path = '';
                    }

                    return updatedRoute;
                })
        ]
    },
    {
        path: '/',
        component: AppLayout,
        children: [
            //################### DASHBOARDS ####################################
            ...dashboardRoutes,
            //################### APPRAISALS ####################################
            ...appraisalRoutes,
            //#################### PAYROLL #######################################
            ...payrollRoutes,
            //#################### REPORTS #######################################
            ...reportsRoutes,
            //#################### EMPLOYEES #######################################
            ...employeeRoutes,
            //#################### LEAVE #######################################
            ...leaveRoutes,
            //#################### USER MANAGEMENT #######################################
            ...userManagementRoutes,
            //#################### SECURITY #######################################
            ...securityRoutes,
            //################### POS/ECOMMERCE  ####################################
            ...posRoutes,
            //################### PRODUCT MANAGEMENT  ############################
            ...inventoryRoutes,
            ...productManagementRoutes,
            //################### PROCUREMENT  ####################################
            ...procurementRoutes,
            //################### FINANCE  ####################################
            ...financeRoutes,
            //#################### CRM ##########################################
            ...crmRoutes,
            //#################### MANUFACTURING ################################
            ...manufacturingRoutes,
            //#################### SETTINGS #####################################
            ...settingsRoutes,
            //#################### UTILITY PAGES ################################
            {
                path: '/calendar',
                name: 'calendar',
                component: () => import('@/views/pages/Calendar.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Calendar'
                }
            },
            {
                path: '/messages',
                name: 'messages',
                component: () => import('@/views/pages/Messages.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Messages'
                }
            }
        ]
    },
    //#################### AUTH ROUTES #########################################
    ...authRoutes,
    //#################### PUBLIC ROUTES (No layout wrapper) ####################
    ...publicFinanceRoutes
];

export default routes;
