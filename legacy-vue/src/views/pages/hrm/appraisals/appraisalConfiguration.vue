<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import Evaluators from './evaluators.vue';
import Questions from './questions.vue';
import Templates from './templates.vue';

const { showToast } = useToast();

const evaluatorGroups = ref([]);
const questionCategories = ref([]);
const templates = ref([]);
const showEvaluatorsModal = ref(false);
const showQuestionsModal = ref(false);
const showTemplatesModal = ref(false);
const selectedEvaluatorGroup = ref(null);
const selectedQuestionCategory = ref(null);
const selectedTemplate = ref(null);

onMounted(async () => {
    await fetchConfiguration();
});

const fetchConfiguration = async () => {
    try {
        const [evaluatorsRes, questionsRes, templatesRes] = await Promise.all([appraisalService.getEvaluatorGroups(), appraisalService.getQuestionCategories(), appraisalService.getTemplates()]);

        evaluatorGroups.value = evaluatorsRes.data;
        questionCategories.value = questionsRes.data;
        templates.value = templatesRes.data;
    } catch (error) {
        console.error('Error fetching configuration:', error);
        showToast('error', 'Error', 'Failed to fetch configuration', 3000);
    }
};

const editEvaluatorGroup = (group) => {
    selectedEvaluatorGroup.value = group;
    showEvaluatorsModal.value = true;
};

const editQuestionCategory = (category) => {
    selectedQuestionCategory.value = category;
    showQuestionsModal.value = true;
};

const editTemplate = (template) => {
    selectedTemplate.value = template;
    showTemplatesModal.value = true;
};

const handleEvaluatorSave = async (data) => {
    try {
        if (data.id) {
            await appraisalService.updateEvaluatorGroup(data.id, data);
        } else {
            await appraisalService.createEvaluatorGroup(data);
        }
        await fetchConfiguration();
        showEvaluatorsModal.value = false;
        showToast('success', 'Success', 'Evaluator group saved successfully', 3000);
    } catch (error) {
        console.error('Error saving evaluator group:', error);
        showToast('error', 'Error', 'Failed to save evaluator group', 3000);
    }
};

const handleQuestionSave = async (data) => {
    try {
        if (data.id) {
            await appraisalService.updateQuestionCategory(data.id, data);
        } else {
            await appraisalService.createQuestionCategory(data);
        }
        await fetchConfiguration();
        showQuestionsModal.value = false;
        showToast('success', 'Success', 'Question category saved successfully', 3000);
    } catch (error) {
        console.error('Error saving question category:', error);
        showToast('error', 'Error', 'Failed to save question category', 3000);
    }
};

const handleTemplateSave = async (data) => {
    try {
        if (data.id) {
            await appraisalService.updateTemplate(data.id, data);
        } else {
            await appraisalService.createTemplate(data);
        }
        await fetchConfiguration();
        showTemplatesModal.value = false;
        showToast('success', 'Success', 'Template saved successfully', 3000);
    } catch (error) {
        console.error('Error saving template:', error);
        showToast('error', 'Error', 'Failed to save template', 3000);
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/appraisals')" />
                    <Button label="Appraisal Configuration" severity="primary" text />
                </template>
            </Toolbar>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Evaluators Configuration -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Evaluators</span>
                        <Button icon="pi pi-plus" class="p-button-text" @click="showEvaluatorsModal = true" />
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div v-for="group in evaluatorGroups" :key="group.id" class="p-4 border rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium">{{ group.name }}</span>
                                <Button icon="pi pi-pencil" class="p-button-text" @click="editEvaluatorGroup(group)" />
                            </div>
                            <div class="text-sm text-gray-500">
                                <div>Auto-assign: {{ group.auto_assign ? 'Yes' : 'No' }}</div>
                                <div>Required: {{ group.required ? 'Yes' : 'No' }}</div>
                                <div>Min Evaluators: {{ group.min_evaluators }}</div>
                                <div>Max Evaluators: {{ group.max_evaluators }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Questions Configuration -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Questions</span>
                        <Button icon="pi pi-plus" class="p-button-text" @click="showQuestionsModal = true" />
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div v-for="category in questionCategories" :key="category.id" class="p-4 border rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium">{{ category.name }}</span>
                                <Button icon="pi pi-pencil" class="p-button-text" @click="editQuestionCategory(category)" />
                            </div>
                            <div class="text-sm text-gray-500">
                                <div>Questions: {{ category.question_count }}</div>
                                <div>Weight: {{ category.weight }}%</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Templates Configuration -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Templates</span>
                        <Button icon="pi pi-plus" class="p-button-text" @click="showTemplatesModal = true" />
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div v-for="template in templates" :key="template.id" class="p-4 border rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium">{{ template.name }}</span>
                                <Button icon="pi pi-pencil" class="p-button-text" @click="editTemplate(template)" />
                            </div>
                            <div class="text-sm text-gray-500">
                                <div>Questions: {{ template.question_count }}</div>
                                <div>Categories: {{ template.category_count }}</div>
                                <div>Status: {{ template.is_active ? 'Active' : 'Inactive' }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Evaluators Modal -->
        <Dialog v-model:visible="showEvaluatorsModal" modal header="Evaluator Configuration" :style="{ width: '90vw', maxWidth: '800px' }">
            <Evaluators :group="selectedEvaluatorGroup" @save="handleEvaluatorSave" @close="showEvaluatorsModal = false" />
        </Dialog>

        <!-- Questions Modal -->
        <Dialog v-model:visible="showQuestionsModal" modal header="Question Configuration" :style="{ width: '90vw', maxWidth: '800px' }">
            <Questions :category="selectedQuestionCategory" @save="handleQuestionSave" @close="showQuestionsModal = false" />
        </Dialog>

        <!-- Templates Modal -->
        <Dialog v-model:visible="showTemplatesModal" modal header="Template Configuration" :style="{ width: '90vw', maxWidth: '800px' }">
            <Templates :template="selectedTemplate" @save="handleTemplateSave" @close="showTemplatesModal = false" />
        </Dialog>
    </div>
</template>

<style scoped>
@media (max-width: 640px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
