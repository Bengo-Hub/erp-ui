// Employee related routes
export const employeeRoutes = [
    // HRM Dashboard - For HR Managers and Admins only
    {
        path: '/hrm',
        name: 'hrmDashboard',
        meta: { 
            requiresAuth: true,
            permission: ['add_employee', 'change_employee', 'delete_employee']  // Managers only
        },
        component: () => import('@/views/pages/dashboards/hrmDashboard.vue')
    },
    // ESS Dashboard (Employee Self-Service) - Fallback dashboard for all users
    {
        path: '/ess',
        name: 'ess-dashboard',
        meta: { 
            requiresAuth: true
            // No permission required - this is the fallback dashboard for all authenticated users
        },
        component: () => import('@/views/pages/ess/ESSDashboard.vue')
    },
    {
        path: '/hrm/employees/view-employees',
        name: 'employees',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/employees/view-employees.vue')
    },
    // Training
    {
        path: '/hrm/training/courses',
        name: 'training-courses',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Courses.vue')
    },
    {
        path: '/hrm/training/enrollments',
        name: 'training-enrollments',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Enrollments.vue')
    },
    {
        path: '/hrm/training/evaluations',
        name: 'training-evaluations',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Evaluations.vue')
    },
    {
        path: '/hrm/employees/manageContracts',
        name: 'contracts',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/employees/manageContracts.vue')
    },
    {
        path: '/hrm/org/orgChart',
        name: 'orgChart',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/org/orgChart.vue')
    },
    // Attendance
    {
        path: '/hrm/attendance/work-shifts',
        name: 'work-shifts',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/WorkShifts.vue')
    },
    {
        path: '/hrm/attendance/work-shifts/create',
        name: 'work-shifts-create',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/ShiftEditor.vue')
    },
    {
        path: '/hrm/attendance/work-shifts/:id/edit',
        name: 'work-shifts-edit',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/ShiftEditor.vue')
    },
    {
        path: '/hrm/attendance/shift-rotations/create',
        name: 'shift-rotations-create',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/ShiftRotationEditor.vue')
    },
    {
        path: '/hrm/attendance/shift-rotations/:id/edit',
        name: 'shift-rotations-edit',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/ShiftRotationEditor.vue')
    },
    {
        path: '/hrm/attendance/off-days',
        name: 'off-days',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/OffDays.vue')
    },
    {
        path: '/hrm/attendance/records',
        name: 'attendance-records',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/AttendanceRecords.vue')
    },
    {
        path: '/hrm/attendance/timesheets',
        name: 'timesheets',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/Timesheets.vue')
    },
    {
        path: '/hrm/payroll/overtime',
        name: 'overtime',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/overtime.vue')
    },
    // Recruitment
    {
        path: '/hrm/recruitment/jobs',
        name: 'recruitment-jobs',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Jobs.vue')
    },
    {
        path: '/hrm/recruitment/candidates',
        name: 'recruitment-candidates',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Candidates.vue')
    },
    {
        path: '/hrm/recruitment/applications',
        name: 'recruitment-applications',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Applications.vue')
    },
    // Performance (reusing appraisals)
    {
        path: '/hrm/performance/appraisals',
        name: 'performance-appraisals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/appraisalList.vue')
    },
    {
        path: '/hrm/performance/goals',
        name: 'performance-goals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/goalsList.vue')
    },
    {
        path: '/hrm/performance/templates',
        name: 'performance-templates',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/appraisalTemplates.vue')
    }
];
