<script setup>
import { useToast } from '@/composables/useToast';
import { ref, computed } from 'vue';

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    columns: {
        type: Array,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    emptyMessage: {
        type: String,
        default: 'No items found. Click "Add Item" to create your first entry.'
    },
    itemLabel: {
        type: String,
        default: 'item'
    }
});

const emit = defineEmits(['save', 'delete', 'add']);

const { showToast } = useToast();
const editingRows = ref({});
const newItem = ref({});

// Delete confirmation state
const deleteDialog = ref(false);
const itemToDelete = ref(null);
const indexToDelete = ref(null);
const deleting = ref(false);

// Computed to get item display name for confirmation
const deleteItemName = computed(() => {
    if (!itemToDelete.value) return '';
    // Try to find a name field from the first column or common name fields
    const nameFields = ['name', 'title', 'label', 'code', 'number'];
    for (const field of nameFields) {
        if (itemToDelete.value[field]) return itemToDelete.value[field];
    }
    // Fall back to first column's value
    if (props.columns.length > 0 && itemToDelete.value[props.columns[0].field]) {
        return itemToDelete.value[props.columns[0].field];
    }
    return props.itemLabel;
});

const initializeNewItem = () => {
    const item = {};
    props.columns.forEach(col => {
        item[col.field] = col.type === 'boolean' ? false : '';
    });
    newItem.value = item;
};

initializeNewItem();

const editRow = (index) => {
    editingRows.value[index] = { ...props.items[index] };
};

const cancelEdit = (index) => {
    delete editingRows.value[index];
};

const isEditing = (index) => {
    return editingRows.value.hasOwnProperty(index);
};

const saveRow = (index) => {
    const item = editingRows.value[index];
    emit('save', item, index);
    delete editingRows.value[index];
};

const deleteRow = (item, index) => {
    // Show confirmation dialog instead of immediate delete
    itemToDelete.value = item;
    indexToDelete.value = index;
    deleteDialog.value = true;
};

const confirmDelete = () => {
    if (!itemToDelete.value) return;

    deleting.value = true;
    emit('delete', itemToDelete.value, indexToDelete.value);

    // Reset state after emitting (parent should handle actual deletion)
    // The deleting state will be reset when the parent refetches data or calls closeDeleteDialog
    setTimeout(() => {
        closeDeleteDialog();
    }, 500);
};

const closeDeleteDialog = () => {
    deleteDialog.value = false;
    itemToDelete.value = null;
    indexToDelete.value = null;
    deleting.value = false;
};

const addNewItem = () => {
    const hasEmpty = props.columns.some(col => {
        if (col.required && !newItem.value[col.field]) {
            return true;
        }
        return false;
    });

    if (hasEmpty) {
        showToast('warn', 'Please fill all required fields', 'Validation');
        return;
    }

    emit('add', { ...newItem.value });
    initializeNewItem();
};

const getInputType = (type) => {
    switch (type) {
        case 'date': return 'date';
        case 'number': return 'number';
        case 'email': return 'email';
        default: return 'text';
    }
};
</script>

<template>
    <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-surface-50 dark:bg-surface-800">
                    <tr>
                        <th class="p-3 w-12"></th>
                        <th class="p-3 w-12 text-left"></th>
                        <th 
                            v-for="col in columns" 
                            :key="col.field"
                            class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0"
                        >
                            <div class="flex items-center gap-2">
                                {{ col.header }}
                                <span v-if="col.required" class="text-red-500">*</span>
                                <i class="pi pi-sort-alt text-xs text-surface-400"></i>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody v-if="!loading">
                    <!-- Existing Items -->
                    <tr 
                        v-for="(item, index) in items" 
                        :key="item.id || index"
                        :class="{'bg-surface-50 dark:bg-surface-800/50': index % 2 === 0}"
                        class="border-t border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors"
                    >
                        <td class="p-3 text-center">
                            <Button 
                                icon="pi pi-times" 
                                text
                                rounded
                                severity="danger"
                                size="small"
                                @click="deleteRow(item, index)"
                                v-tooltip.top="'Delete'"
                            />
                        </td>
                        <td class="p-3 text-surface-600 dark:text-surface-400 font-semibold">
                            {{ index + 1 }}.
                        </td>
                        <td 
                            v-for="col in columns" 
                            :key="col.field"
                            class="p-3"
                        >
                            <!-- Editable Mode -->
                            <div v-if="isEditing(index)">
                                <InputText 
                                    v-if="col.type !== 'boolean' && col.type !== 'date'"
                                    v-model="editingRows[index][col.field]"
                                    :type="getInputType(col.type)"
                                    class="w-full"
                                    :placeholder="col.placeholder"
                                />
                                <DatePicker 
                                    v-else-if="col.type === 'date'"
                                    v-model="editingRows[index][col.field]"
                                    dateFormat="dd/mm/yy"
                                    class="w-full"
                                />
                                <Checkbox 
                                    v-else-if="col.type === 'boolean'"
                                    v-model="editingRows[index][col.field]"
                                    :binary="true"
                                />
                            </div>
                            <!-- Display Mode -->
                            <div v-else @dblclick="editRow(index)" class="cursor-pointer">
                                <Checkbox 
                                    v-if="col.type === 'boolean'"
                                    :modelValue="item[col.field]"
                                    :binary="true"
                                    disabled
                                />
                                <Tag 
                                    v-else-if="col.type === 'tag' && item[col.field]"
                                    :value="item[col.field]"
                                    :severity="col.tagSeverity ? col.tagSeverity(item[col.field]) : 'info'"
                                />
                                <span v-else class="text-surface-900 dark:text-surface-0">
                                    {{ item[col.field] || '-' }}
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Add New Item Row -->
                    <tr class="border-t-2 border-primary-200 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10">
                        <td class="p-3"></td>
                        <td class="p-3 text-surface-600 dark:text-surface-400 font-semibold">
                            {{ items.length + 1 }}.
                        </td>
                        <td 
                            v-for="col in columns" 
                            :key="col.field"
                            class="p-3"
                        >
                            <InputText 
                                v-if="col.type !== 'boolean' && col.type !== 'date'"
                                v-model="newItem[col.field]"
                                :type="getInputType(col.type)"
                                class="w-full"
                                :placeholder="col.placeholder || `Enter ${col.header.toLowerCase()}`"
                            />
                            <DatePicker 
                                v-else-if="col.type === 'date'"
                                v-model="newItem[col.field]"
                                dateFormat="dd/mm/yy"
                                class="w-full"
                                :placeholder="col.placeholder"
                            />
                            <Checkbox 
                                v-else-if="col.type === 'boolean'"
                                v-model="newItem[col.field]"
                                :binary="true"
                            />
                        </td>
                    </tr>

                    <!-- Empty State -->
                    <tr v-if="items.length === 0">
                        <td :colspan="columns.length + 2" class="p-8 text-center">
                            <i class="pi pi-inbox text-4xl text-surface-400 mb-3"></i>
                            <p class="text-surface-600 dark:text-surface-400">{{ emptyMessage }}</p>
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr>
                        <td :colspan="columns.length + 2" class="p-8 text-center">
                            <ProgressSpinner style="width: 50px; height: 50px" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center p-4 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
            <Button
                label="Add Item"
                icon="pi pi-plus"
                outlined
                @click="addNewItem"
                :disabled="loading"
            />
            <Button
                label="Update Settings"
                icon="pi pi-save"
                severity="success"
                @click="$emit('save-all')"
                :disabled="loading"
            />
        </div>

        <!-- Delete Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Confirm Deletion"
            modal
            :style="{ width: '400px' }"
            :closable="!deleting"
            :closeOnEscape="!deleting"
        >
            <div class="flex items-start gap-4">
                <i class="pi pi-exclamation-triangle text-4xl text-yellow-500"></i>
                <div>
                    <p class="text-surface-700 dark:text-surface-200 mb-2">
                        Are you sure you want to delete <strong>{{ deleteItemName }}</strong>?
                    </p>
                    <p class="text-sm text-surface-500 dark:text-surface-400">
                        This action cannot be undone.
                    </p>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        text
                        @click="closeDeleteDialog"
                        :disabled="deleting"
                    />
                    <Button
                        label="Delete"
                        icon="pi pi-trash"
                        severity="danger"
                        @click="confirmDelete"
                        :loading="deleting"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

