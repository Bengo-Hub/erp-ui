// User Management related routes
export const userManagementRoutes = [
    {
        path: '/users',
        name: 'user-management',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/users/UserManagement.vue')
    },
    {
        path: '/users/list',
        name: 'users-list-modern',
        meta: { 
            requiresAuth: true,
            permission: 'view_customuser'
        },
        component: () => import('@/views/pages/users/UserList.vue')
    },
    {
        path: '/users/:id',
        name: 'user-profile',
        meta: { 
            requiresAuth: true,
            permission: 'view_customuser'
        },
        component: () => import('@/views/pages/users/UserProfile.vue')
    },
    {
        path: '/users/roles',
        name: 'role-management',
        meta: { 
            requiresAuth: true,
            permission: 'view_group'
        },
        component: () => import('@/views/pages/users/RoleManagement.vue')
    },
    {
        path: '/users/permissions',
        name: 'permission-management',
        meta: { 
            requiresAuth: true,
            permission: 'view_permission'
        },
        component: () => import('@/views/pages/users/PermissionManagement.vue')
    },
    {
        path: '/users/account',
        name: 'user-account',
        meta: { 
            requiresAuth: true
        },
        component: () => import('@/views/pages/users/UserAccount.vue')
    }
];
