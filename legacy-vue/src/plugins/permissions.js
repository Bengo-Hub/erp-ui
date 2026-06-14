import { vPermission, vPermissionDisable } from '@/directives/permission';

export default {
    install(app) {
        // Register permission directives globally
        app.directive('permission', vPermission);
        app.directive('permission-disable', vPermissionDisable);
    }
};
