// External microservice frontends.
//
// The ERP-UI is an HR + internal-operations app. Every other business domain
// now lives in its own microservice with its own frontend. The navigation menu
// links out to those frontends (opened in a new browser tab) instead of
// rendering their pages locally.
//
// Each URL is read from a Vite env var with a localhost dev default. Override
// the defaults per environment via the corresponding VITE_* variables (see
// .env.example).
export const EXTERNAL_SERVICES = {
    finance: import.meta.env.VITE_TREASURY_UI_URL || 'http://localhost:3001',
    crm: import.meta.env.VITE_MARKETFLOW_UI_URL || 'http://localhost:3002',
    // inventory frontend also owns products, procurement, manufacturing and assets
    inventory: import.meta.env.VITE_INVENTORY_UI_URL || 'http://localhost:3003',
    pos: import.meta.env.VITE_POS_UI_URL || 'http://localhost:3004',
    // ordering frontend owns online orders + the storefront/shop
    ordering: import.meta.env.VITE_ORDERING_UI_URL || 'http://localhost:3005',
    notifications: import.meta.env.VITE_NOTIFICATIONS_UI_URL || 'http://localhost:3006',
    projects: import.meta.env.VITE_PROJECTS_UI_URL || 'http://localhost:3007',
    billing: import.meta.env.VITE_SUBSCRIPTIONS_UI_URL || 'http://localhost:3008',
    auth: import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:3009'
};

/**
 * Open an external service frontend in a new browser tab.
 * @param {keyof typeof EXTERNAL_SERVICES} service
 */
export function openExternalService(service) {
    const url = EXTERNAL_SERVICES[service];
    if (url) {
        window.open(url, '_blank', 'noopener');
    }
}

export default EXTERNAL_SERVICES;
