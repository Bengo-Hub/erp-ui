<script setup>
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const categories = ref([]);
const hoverStates = reactive({});
const expandedCategories = ref([]);
const subcategories = ref({});
const showCategoryDrawer = ref(false);
let hoverTimeout = null;

const props = defineProps({
    initiallyExpanded: {
        type: Boolean,
        default: false
    },
    categories: {
        type: Array,
        required: true
    }
});

onMounted(async () => {
    if (props.categories && props.categories.length > 0) {
        categories.value = processCategories(props.categories);
    } else {
        categories.value = [];
    }
    // If initially expanded is true, expand all categories
    if (props.initiallyExpanded) {
        expandedCategories.value = categories.value.map((cat) => cat.id);
    }
});

const processCategories = (cats) => {
    return cats.map((category) => ({
        ...category,
        categories: category.categories || [],
        subcategories: category.subcategories || []
    }));
};

const handleCategoryHover = (category) => {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
        hoverStates[category.id] = true;
    }, 200);
};

const hasChildren = (category) => {
    return category.categories?.length > 0 || category.subcategories?.length > 0;
};

const hasSubcategories = (category) => {
    return category.categories?.some((c) => c.subcategories?.length > 0);
};

const getCategoryLink = (cat) => `/ecommerce/shop/category/${cat.id}`;
const getSubcategoryLink = (sub) => `/ecommerce/shop/subcategory/${sub.id}`;

const fetchSubcategories = async (categoryId) => {
    try {
        const response = await ecommerceService.getCategoryById(categoryId);
        subcategories.value[categoryId] = response.data.Subcategories || [];
    } catch (error) {
        console.error(`Error fetching subcategories for category ${categoryId}:`, error);
        // Mock data fallback
        subcategories.value[categoryId] = [
            { id: `${categoryId}1`, name: `${categoryId} Subcategory 1` },
            { id: `${categoryId}2`, name: `${categoryId} Subcategory 2` },
            { id: `${categoryId}3`, name: `${categoryId} Subcategory 3` }
        ];
    }
};

const toggleCategory = (categoryId) => {
    if (expandedCategories.value.includes(categoryId)) {
        expandedCategories.value = expandedCategories.value.filter((id) => id !== categoryId);
    } else {
        expandedCategories.value.push(categoryId);
    }
};

const getSubcategories = (categoryId) => {
    return subcategories.value[categoryId] || [];
};

const navigateToCategory = (categoryId) => {
    router.push(`/ecommerce/shop/category/${categoryId}`);
    showCategoryDrawer.value = false;
};
</script>

<template>
    <div class="category-menu">
        <!-- Desktop Category Menu -->
        <div class="hidden md:block bg-white rounded shadow-sm relative">
            <h3 class="text-xl font-bold p-3 border-b">Categories{{ categories }}</h3>
            <ul class="category-list">
                <li v-for="category in categories" :key="category.id" class="category-item group" @mouseenter="handleCategoryHover(category)" @mouseleave="hoverStates[category.id] = false">
                    <!-- Main Category Item -->
                    <div class="flex justify-between items-center p-3 hover:bg-gray-100 border-b cursor-pointer" :class="{ 'bg-gray-50': hoverStates[category.id] }">
                        <router-link v-if="!hasChildren(category)" :to="getCategoryLink(category)" class="w-full">
                            {{ category.name }}
                        </router-link>
                        <template v-else>
                            <span>{{ category.name }}</span>
                            <i class="pi pi-chevron-right text-sm"></i>
                        </template>
                    </div>

                    <!-- Side Panel for Categories/Subcategories -->
                    <div v-if="hoverStates[category.id] && hasChildren(category)" class="side-panel">
                        <div class="panel-content">
                            <!-- Panel Header -->
                            <h4 class="panel-header">{{ category.name }}</h4>

                            <!-- Scenario 1: Categories with Subcategories -->
                            <template v-if="hasSubcategories(category)">
                                <div v-for="child in category.categories" :key="child.id" class="category-section">
                                    <h5 class="subcategory-header">{{ child.name }}</h5>
                                    <div class="subcategory-scroller">
                                        <router-link v-for="sub in child.subcategories" :key="sub.id" :to="getSubcategoryLink(sub)" class="subcategory-item">
                                            {{ sub.name }}
                                        </router-link>
                                    </div>
                                </div>
                            </template>

                            <!-- Scenario 2: Categories without Subcategories -->
                            <div v-else class="vertical-categories">
                                <router-link v-for="child in category.categories" :key="child.id" :to="getCategoryLink(child)" class="category-link">
                                    {{ child.name }}
                                </router-link>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Mobile Category Menu -->
        <div class="block md:hidden mb-4">
            <Button label="Categories" icon="pi pi-list" class="p-button-outlined w-full" @click="showCategoryDrawer = true" />

            <Sidebar v-model:visible="showCategoryDrawer" position="left" class="w-10rem">
                <h3 class="text-xl font-bold p-3 border-b">Categories</h3>
                <ul class="category-list">
                    <li v-for="category in categories" :key="category.id" class="category-item">
                        <div class="flex justify-between items-center p-3 hover:bg-gray-100 border-b cursor-pointer" @click="toggleCategory(category.id)">
                            <span>{{ category.name }}</span>
                            <i class="pi" :class="expandedCategories.includes(category.id) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                        </div>
                        <!-- Sub-categories -->
                        <div v-if="expandedCategories.includes(category.id)" class="subcategories">
                            <ul>
                                <li v-for="subcat in getSubcategories(category.id)" :key="subcat.id" class="py-2 px-5 hover:text-primary cursor-pointer" @click.stop="navigateToCategory(subcat.id)">
                                    {{ subcat.name }}
                                </li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </Sidebar>
        </div>
    </div>
</template>

<style scoped>
.category-item {
    position: relative;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s;
}

.side-panel {
    position: fixed;
    left: 260px; /* Match sidebar width */
    top: 0;
    bottom: 0;
    width: 400px;
    background: white;
    box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 1rem;
    overflow-y: auto;
}

.panel-header {
    font-size: 1.125rem;
    font-weight: bold;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.subcategory-scroller {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.75rem;
    scrollbar-width: thin;
}

.subcategory-item {
    padding: 0.5rem 1rem;
    background-color: #f3f4f6;
    border-radius: 9999px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
}

.subcategory-item:hover {
    background-color: var(--primary-color);
    color: white;
}

.vertical-categories {
    display: grid;
    gap: 0.5rem;
}

.category-link {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
}

.category-link:hover {
    background-color: #f3f4f6;
}

.subcategory-header {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #4b5563;
}

.category-section {
    margin-bottom: 1.5rem;
}

.subcategories {
    background-color: #f9f9f9;
}

:deep(.p-sidebar-left) {
    width: 80vw;
    max-width: 300px;
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}
</style>
