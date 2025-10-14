import permissionsPlugin from '@/plugins/permissions';
import store from '@/store/index'; // import your store
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Editor from 'primevue/editor';
import Fieldset from 'primevue/fieldset';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner'; // Import PrimeVue Spinner
import Select from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';

// PrimeVue CSS (you need to include these styles)
import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import 'primeicons/primeicons.css';

// Import centralized axios configuration
import axiosInstance, { updateBaseURL } from '@/utils/axiosConfig';

// PWA Service Worker Registration
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then(registration => {
//         console.log('Service Worker registered: ', registration);
//       })
//       .catch(error => {
//         console.error('Service Worker registration failed: ', error);
//       });
//   });
// }

//import Highcharts from 'highcharts';
//import { HighchartsVue } from 'highcharts-vue';
// import ExportingModule from 'highcharts/modules/exporting';
// ExportingModule(Highcharts);

// API ENDPOINT CONFIG - flexible for dev and production
function getApiBaseUrl() {
    // 1. Check environment variable (highest priority - from build args)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // 2. Development mode detection (localhost or 127.0.0.1)
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Development: use localhost with port 8000
        return `http://${hostname}:8000`;
    }
    
    // 3. Production fallback
    return 'https://erpapi.masterspace.co.ke';
}

const apiBaseUrl = getApiBaseUrl();
window.$http = apiBaseUrl + '/api/v1';

// Update axios instance base URL with configured endpoint
updateBaseURL(window.$http);

// Log for debugging
console.log(`API Base URL: ${window.$http}`);

// Make axios instance available globally for backward compatibility
window.axios = axiosInstance;

const app = createApp(App);
// Check for token in sessionStorage after reload
const token = sessionStorage.getItem('token'); // Use sessionStorage if required
// If token exists, set it to Axios headers
if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Token ${token}`;
}

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.app-dark',
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities'
        }
    }
});
app.component('ProgressSpinner', ProgressSpinner);
app.component('Button', Button);
app.component('InputText', InputText);
app.component('DataTable', DataTable);
app.component('Dialog', Dialog);
app.component('Toast', Toast);
app.component('Select', Select);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Column', Column);
app.component('Fieldset', Fieldset);
app.component('Editor', Editor);
app.component('Chart', Chart); // Register Chart component
app.component('Card', Card); // Register Card component
app.component('Tag', Tag); // Register Tag component
app.component('Calendar', Calendar); // Register Calendar component
app.component('Dropdown', Dropdown); // Register Dropdown component
app.component('InputNumber', InputNumber); // Register InputNumber component
app.component('Textarea', Textarea); // Register Textarea component
app.use(ToastService);
//app.use(HighchartsVue);
app.use(ConfirmationService);
app.use(permissionsPlugin); // Register permissions plugin
app.use(store); // use the store
app.mount('#app');
