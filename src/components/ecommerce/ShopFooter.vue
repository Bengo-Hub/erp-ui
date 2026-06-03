<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import mpesaLogo from '@/assets/img/shop/mpesa.png';
import visaLogo from '@/assets/img/shop/visa.png';
import mastercardLogo from '@/assets/img/shop/mastercard.png';
import ipayLogo from '@/assets/img/shop/ipay.png';
import airtimeLogo from '@/assets/img/shop/airtelmoney.png';

const store = useStore();
const toast = useToast();

// Form data
const userEmail = ref('');
const submitted = ref(false);
const subscriptionSuccess = ref('');

// Validation rules
const rules = {
    userEmail: {
        required: helpers.withMessage('Email address is required', required),
        email: helpers.withMessage('Please enter a valid email address', email)
    }
};

const v$ = useVuelidate(rules, { userEmail });

// Get business information from Vuex store
const businessInfo = computed(() => {
    return store.state.auth.business || {};
});

const businessName = computed(() => businessInfo.value.name);
const businessAddress = computed(() => businessInfo.value.address);
const businessPhone = computed(() => businessInfo.value.phone);
const businessEmail = computed(() => businessInfo.value.email);

const currentYear = computed(() => new Date().getFullYear());

// Payment method images
const paymentImages = {
    mPesa: mpesaLogo,
    visa: visaLogo, // Use default as placeholder
    mastercard: mastercardLogo, // Use default as placeholder
    ipay: ipayLogo, // Use default as placeholder
    airtime: airtimeLogo // Use default as placeholder
};

// Custom styling variables from business branding
onMounted(() => {
    // Get the primary color from CSS variables for consistent branding
    document.querySelector('.shop-footer').style.setProperty('--primary-light-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-color-lightest').trim() || '#f0f7ff');
});

// Submit newsletter subscription
const subscribe = async () => {
    submitted.value = true;
    const isValid = await v$.value.$validate();

    if (!isValid) {
        return;
    }

    // In a real app, we would call an API to subscribe the user
    // For demo purposes, just show success message
    subscriptionSuccess.value = 'Thank you for subscribing to our newsletter!';

    toast.add({
        severity: 'success',
        summary: 'Subscribed',
        detail: 'You have successfully subscribed to our newsletter.',
        life: 3000
    });

    // Reset form
    email.value = '';
    submitted.value = false;

    // Clear success message after 5 seconds
    setTimeout(() => {
        subscriptionSuccess.value = '';
    }, 5000);
};
</script>

<template>
    <footer class="shop-footer bg-white border-t mt-8">
        <div class="container mx-auto px-4 py-8">
            <!-- Newsletter Subscription -->
            <div class="newsletter bg-primary-light rounded-lg p-6 mb-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h3 class="text-xl font-bold mb-2">Subscribe to Our Newsletter</h3>
                        <p class="text-gray-600">Get updates on new products, exclusive offers, and discounts.</p>
                    </div>
                    <div>
                        <div class="flex flex-col sm:flex-row">
                            <InputText v-model="userEmail" placeholder="Your email address" class="grow mb-2 sm:mb-0 sm:mr-2" :class="{ 'p-invalid': v$.userEmail.$invalid && submitted }" />
                            <Button label="Subscribe" @click="subscribe" />
                        </div>
                        <small v-if="v$.userEmail.$invalid && submitted" class="p-error">{{ v$.userEmail.$errors[0].$message }}</small>
                        <small v-if="subscriptionSuccess" class="text-green-600">{{ subscriptionSuccess }}</small>
                    </div>
                </div>
            </div>

            <!-- Footer Links -->
            <div class="footer-links grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <!-- Shop Information -->
                <div>
                    <h4 class="text-lg font-bold mb-4">{{ businessName || 'ProcurePro Shop' }}</h4>
                    <p class="text-gray-600 mb-4">Your one-stop shop for all your needs.</p>
                    <div class="social-links flex space-x-3">
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <i class="pi pi-facebook"></i>
                        </a>
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <i class="pi pi-twitter"></i>
                        </a>
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <i class="pi pi-instagram"></i>
                        </a>
                        <a href="#" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <i class="pi pi-linkedin"></i>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div>
                    <h4 class="text-lg font-bold mb-4">Quick Links</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li><router-link to="/ecommerce/shop" class="hover:text-primary">Home</router-link></li>
                        <li><router-link to="/ecommerce/shop/products" class="hover:text-primary">All Products</router-link></li>
                        <li><router-link to="/ecommerce/shop/flash-sales" class="hover:text-primary">Flash Sales</router-link></li>
                        <li><router-link to="/ecommerce/shop/new-arrivals" class="hover:text-primary">New Arrivals</router-link></li>
                        <li><router-link to="/ecommerce/shop/category/1" class="hover:text-primary">Featured Categories</router-link></li>
                    </ul>
                </div>

                <!-- Customer Service -->
                <div>
                    <h4 class="text-lg font-bold mb-4">Customer Service</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li><a href="#" class="hover:text-primary">Help Center</a></li>
                        <li><a href="#" class="hover:text-primary">Track Your Order</a></li>
                        <li><a href="#" class="hover:text-primary">Return Policy</a></li>
                        <li><a href="#" class="hover:text-primary">Shipping Information</a></li>
                        <li><a href="#" class="hover:text-primary">Contact Us</a></li>
                    </ul>
                </div>

                <!-- Contact Information -->
                <div>
                    <h4 class="text-lg font-bold mb-4">Contact Us</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li class="flex items-start">
                            <i class="pi pi-map-marker mt-1 mr-2"></i>
                            <span>{{ businessAddress || '123 Business Street, Nairobi, Kenya' }}</span>
                        </li>
                        <li class="flex items-center">
                            <i class="pi pi-phone mr-2"></i>
                            <span>{{ businessPhone || '+254 712 345 678' }}</span>
                        </li>
                        <li class="flex items-center">
                            <i class="pi pi-envelope mr-2"></i>
                            <span>{{ businessEmail || 'info@procureproshop.co.ke' }}</span>
                        </li>
                        <li class="flex items-center">
                            <i class="pi pi-clock mr-2"></i>
                            <span>Mon-Fri: 9AM to 5PM</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Payment Methods -->
            <div class="payment-methods border-t border-b py-6 mb-6">
                <h4 class="text-center text-lg font-bold mb-4">Payment Methods</h4>
                <div class="flex justify-center space-x-4">
                    <img :src="paymentImages.mPesa" alt="M-Pesa" class="h-8 object-contain" />
                    <img :src="paymentImages.visa" alt="Visa" class="h-8 object-contain" />
                    <img :src="paymentImages.mastercard" alt="Mastercard" class="h-8 object-contain" />
                    <img :src="paymentImages.ipay" alt="iPay" class="h-8 object-contain" />
                    <img :src="paymentImages.airtime" alt="Airtime" class="h-8 object-contain" />
                </div>
            </div>

            <!-- Copyright -->
            <div class="copyright text-center text-gray-600">
                <p>&copy; {{ currentYear }} {{ businessName || 'BengoBox Shop' }}. All Rights Reserved.</p>
                <div class="mt-2">
                    <a href="#" class="text-sm hover:text-primary mx-2">Privacy Policy</a>
                    <a href="#" class="text-sm hover:text-primary mx-2">Terms of Service</a>
                    <a href="#" class="text-sm hover:text-primary mx-2">Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.bg-primary-light {
    background-color: var(--primary-light-color, #f0f7ff);
}

.text-primary,
.hover\:text-primary:hover {
    color: var(--primary-color);
}

.bg-primary,
.hover\:bg-primary:hover {
    background-color: var(--primary-color);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-inputtext:enabled:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}
</style>
