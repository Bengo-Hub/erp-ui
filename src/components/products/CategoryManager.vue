<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['main', 'category', 'subcategory'].includes(value)
    },
    items: {
        type: Array,
        required: true
    },
    parentCategories: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['save', 'delete', 'refresh']);

const toast = useToast();

// State
const displayDialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const loading = ref(false);
const uploadError = ref(null);
const imagePreview = ref(null);
const itemToDelete = ref(null);
const expandedRows = ref({});

const formData = ref({
    id: null,
    name: '',
    parent: null,
    status: 'active',
    display_image: null,
    description: ''
});

const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]);

// Computed
const typeLabel = computed(() => {
    const labels = {
        main: 'Main Category',
        category: 'Category',
        subcategory: 'Subcategory'
    };
    return labels[props.type] || props.type;
});

// Build tree structure from flat items
const treeData = computed(() => {
    if (!props.items || props.items.length === 0) return [];

    // Create a map of items by ID
    const itemMap = new Map();
    props.items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [], level: 0 });
    });

    // Build tree structure
    const rootItems = [];
    itemMap.forEach(item => {
        const parentId = item.parent?.id || item.parent;
        if (parentId && itemMap.has(parentId)) {
            const parent = itemMap.get(parentId);
            item.level = parent.level + 1;
            parent.children.push(item);
        } else {
            rootItems.push(item);
        }
    });

    return rootItems;
});

// Flatten tree for table display with indentation info
const flattenedItems = computed(() => {
    const result = [];

    const flatten = (items, level = 0) => {
        items.forEach(item => {
            result.push({ ...item, _level: level, _hasChildren: item.children && item.children.length > 0 });
            if (item.children && item.children.length > 0 && expandedRows.value[item.id]) {
                flatten(item.children, level + 1);
            }
        });
    };

    flatten(treeData.value);
    return result;
});

// Available parent categories (exclude self and descendants)
const availableParents = computed(() => {
    if (!props.items) return [];

    // For edit mode, exclude self and all descendants
    if (editMode.value && formData.value.id) {
        const descendants = getDescendantIds(formData.value.id);
        return props.items.filter(item => item.id !== formData.value.id && !descendants.includes(item.id));
    }

    return props.items;
});

// Get all descendant IDs of a category
const getDescendantIds = (parentId) => {
    const descendants = [];
    const findDescendants = (pid) => {
        props.items.forEach(item => {
            const itemParentId = item.parent?.id || item.parent;
            if (itemParentId === pid) {
                descendants.push(item.id);
                findDescendants(item.id);
            }
        });
    };
    findDescendants(parentId);
    return descendants;
};

// Methods
const toggleRow = (item) => {
    if (item._hasChildren) {
        expandedRows.value[item.id] = !expandedRows.value[item.id];
    }
};

const expandAll = () => {
    props.items.forEach(item => {
        expandedRows.value[item.id] = true;
    });
};

const collapseAll = () => {
    expandedRows.value = {};
};

const openAddDialog = () => {
    editMode.value = false;
    formData.value = {
        id: null,
        name: '',
        parent: null,
        status: 'active',
        display_image: null,
        description: ''
    };
    imagePreview.value = null;
    displayDialog.value = true;
};

const editItem = (item) => {
    editMode.value = true;
    formData.value = {
        id: item.id,
        name: item.name || '',
        parent: item.parent?.id || item.parent || null,
        status: item.status || 'active',
        display_image: item.display_image || null,
        description: item.description || ''
    };
    if (item.display_image) {
        imagePreview.value = item.display_image;
    }
    displayDialog.value = true;
};

const confirmDelete = (item) => {
    // Check if category has children
    const hasChildren = props.items.some(i => (i.parent?.id || i.parent) === item.id);
    if (hasChildren) {
        toast.add({
            severity: 'warn',
            summary: 'Cannot Delete',
            detail: 'This category has child categories. Please delete or move them first.',
            life: 5000
        });
        return;
    }
    itemToDelete.value = item.id;
    deleteDialog.value = true;
};

const deleteItem = () => {
    emit('delete', itemToDelete.value);
    deleteDialog.value = false;
    itemToDelete.value = null;
};

const saveItem = () => {
    if (!formData.value.name) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    // Prepare data for emit
    const dataToSave = {
        ...formData.value,
        parent: formData.value.parent || null
    };

    emit('save', dataToSave);
    displayDialog.value = false;
};

const resetForm = () => {
    formData.value = {
        id: null,
        name: '',
        parent: null,
        status: 'active',
        display_image: null,
        description: ''
    };
    imagePreview.value = null;
    uploadError.value = null;
};

const onImageUpload = (event) => {
    const file = event.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
        uploadError.value = 'Only image files are allowed';
        return;
    }

    // Validate file size (2MB max)
    if (file.size > 2000000) {
        uploadError.value = 'File size must be less than 2MB';
        return;
    }

    uploadError.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
        formData.value.display_image = file;
    };
    reader.readAsDataURL(file);
};

const getParentName = (item) => {
    const parentId = item.parent?.id || item.parent;
    if (!parentId) return '-';
    const parent = props.items.find(i => i.id === parentId);
    return parent?.name || '-';
};

const getChildCount = (item) => {
    return props.items.filter(i => (i.parent?.id || i.parent) === item.id).length;
};
</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold capitalize">{{ typeLabel }} Management</h3>
            <div class="flex gap-2">
                <Button
                    v-if="items.length > 0"
                    label="Expand All"
                    icon="pi pi-angle-double-down"
                    class="p-button-sm p-button-text"
                    @click="expandAll"
                />
                <Button
                    v-if="items.length > 0"
                    label="Collapse All"
                    icon="pi pi-angle-double-up"
                    class="p-button-sm p-button-text"
                    @click="collapseAll"
                />
                <Button label="Add New" icon="pi pi-plus" class="p-button-sm" @click="openAddDialog" />
            </div>
        </div>

        <!-- Tree Table View -->
        <DataTable
            :value="flattenedItems"
            :paginator="flattenedItems.length > 15"
            :rows="15"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            responsiveLayout="scroll"
            class="p-datatable-sm category-tree-table"
            stripedRows
        >
            <Column header="Name" :sortable="false" style="min-width: 300px">
                <template #body="{ data }">
                    <div class="flex items-center" :style="{ paddingLeft: `${data._level * 24}px` }">
                        <Button
                            v-if="data._hasChildren"
                            :icon="expandedRows[data.id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                            class="p-button-text p-button-sm p-button-rounded mr-2"
                            @click="toggleRow(data)"
                        />
                        <span v-else class="inline-block w-8"></span>
                        <i
                            class="pi mr-2"
                            :class="data._hasChildren ? 'pi-folder text-yellow-500' : 'pi-file text-blue-400'"
                        ></i>
                        <span class="font-medium">{{ data.name }}</span>
                        <Badge
                            v-if="data._hasChildren"
                            :value="getChildCount(data)"
                            severity="info"
                            class="ml-2"
                        />
                    </div>
                </template>
            </Column>

            <Column field="parent" header="Parent" :sortable="false" style="width: 200px">
                <template #body="{ data }">
                    <span class="text-gray-600">{{ getParentName(data) }}</span>
                </template>
            </Column>

            <Column field="status" header="Status" :sortable="false" style="width: 120px">
                <template #body="{ data }">
                    <Tag
                        :value="data.status === 'active' ? 'Active' : 'Inactive'"
                        :severity="data.status === 'active' ? 'success' : 'danger'"
                    />
                </template>
            </Column>

            <Column header="Image" style="width: 100px">
                <template #body="{ data }">
                    <img
                        v-if="data.display_image"
                        :src="data.display_image"
                        :alt="data.name"
                        class="w-10 h-10 object-cover rounded"
                    />
                    <span v-else class="text-gray-400 text-sm">No image</span>
                </template>
            </Column>

            <Column header="Actions" :exportable="false" style="width: 120px">
                <template #body="{ data }">
                    <div class="flex gap-1">
                        <Button
                            icon="pi pi-pencil"
                            class="p-button-rounded p-button-text p-button-sm"
                            v-tooltip.top="'Edit'"
                            @click="editItem(data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-rounded p-button-text p-button-sm p-button-danger"
                            v-tooltip.top="'Delete'"
                            @click="confirmDelete(data)"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-8 text-gray-500">
                    <i class="pi pi-folder-open text-4xl mb-4 block"></i>
                    <p>No {{ typeLabel.toLowerCase() }}s found</p>
                    <Button label="Add First Category" icon="pi pi-plus" class="mt-4" @click="openAddDialog" />
                </div>
            </template>
        </DataTable>

        <!-- Add/Edit Dialog -->
        <Dialog
            v-model:visible="displayDialog"
            :header="editMode ? `Edit ${typeLabel}` : `Add New ${typeLabel}`"
            :modal="true"
            :style="{ width: '550px' }"
            @hide="resetForm"
        >
            <div class="space-y-4">
                <div class="field">
                    <label for="name" class="block text-sm font-medium mb-2">
                        Name <span class="text-red-500">*</span>
                    </label>
                    <InputText
                        id="name"
                        v-model="formData.name"
                        class="w-full"
                        placeholder="Enter category name"
                    />
                </div>

                <div class="field">
                    <label for="parent" class="block text-sm font-medium mb-2">Parent Category</label>
                    <Dropdown
                        id="parent"
                        v-model="formData.parent"
                        :options="availableParents"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select parent category (optional)"
                        class="w-full"
                        :filter="true"
                        showClear
                    >
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-folder text-yellow-500"></i>
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <small class="text-gray-500">Leave empty to create a root category</small>
                </div>

                <div class="field">
                    <label for="description" class="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                        id="description"
                        v-model="formData.description"
                        rows="3"
                        class="w-full"
                        placeholder="Category description (optional)"
                    />
                </div>

                <div class="field">
                    <label for="status" class="block text-sm font-medium mb-2">Status</label>
                    <Dropdown
                        id="status"
                        v-model="formData.status"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>

                <div class="field">
                    <label for="image" class="block text-sm font-medium mb-2">Display Image</label>
                    <FileUpload
                        mode="basic"
                        name="image"
                        accept="image/*"
                        :maxFileSize="2000000"
                        chooseLabel="Upload Image"
                        @select="onImageUpload"
                    />
                    <small class="p-error" v-if="uploadError">{{ uploadError }}</small>
                    <div v-if="imagePreview" class="mt-3 flex items-center gap-3">
                        <img :src="imagePreview" class="w-20 h-20 object-cover rounded border" />
                        <Button
                            icon="pi pi-times"
                            class="p-button-rounded p-button-danger p-button-sm"
                            @click="imagePreview = null; formData.display_image = null;"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="displayDialog = false" />
                    <Button
                        :label="editMode ? 'Update' : 'Create'"
                        icon="pi pi-check"
                        @click="saveItem"
                        :disabled="!formData.name"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Confirm Delete"
            :modal="true"
            :style="{ width: '400px' }"
        >
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-yellow-500" style="font-size: 2.5rem"></i>
                <div>
                    <p class="font-medium">Are you sure you want to delete this category?</p>
                    <p class="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="deleteItem" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.category-tree-table {
    font-size: 0.875rem;
}

.category-tree-table :deep(.p-datatable-tbody > tr:hover) {
    background-color: #f3f4f6;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

@media (max-width: 640px) {
    .p-dialog {
        width: 95vw !important;
    }
}
</style>
