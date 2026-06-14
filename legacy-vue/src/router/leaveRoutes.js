// Leave related routes
export const leaveRoutes = [
    {
        path: '/hrm/Leave/leaveList',
        name: 'leaveList',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/leaveList.vue')
    },
    {
        path: '/hrm/Leave/newLeave',
        name: 'newLeave',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/newLeave.vue')
    },
    {
        path: '/hrm/Leave/leaveBalances',
        name: 'leaveBalances',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/leaveBalances.vue')
    },
    {
        path: '/hrm/Leave/leaveEntitlement',
        name: 'leaveEntitlement',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/leaveEntitlement.vue')
    },
    {
        path: '/hrm/Leave/leaveCategories',
        name: 'leaveCategories',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/leaveCategories.vue')
    },
    {
        path: '/hrm/Leave/addLeaveType',
        name: 'addLeaveType',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/addLeaveType.vue')
    },
    {
        path: '/hrm/Leave/leaveLogs',
        name: 'leaveLogs',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/Leave/leaveLogs.vue')
    }
];
