<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import NewQuestion from './newQuestion.vue';

const { showToast } = useToast();
const loading = ref(false);

const showNewQuestionModal = ref(false);
const questions = ref([]);
const selectedQuestions = ref([]);

const fetchQuestions = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getQuestions();
        questions.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error fetching questions:', error);
        showToast('error', 'Error', 'Failed to fetch questions', 3000);
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    showNewQuestionModal.value = true;
};

const selectAll = () => {
    selectedQuestions.value = (questions.value || []).map((q) => q.id);
};

const handleQuestionSaved = async () => {
    loading.value = true;
    try {
        await fetchQuestions();
        showNewQuestionModal.value = false;
        showToast('success', 'Success', 'Question saved successfully', 3000);
    } catch (error) {
        console.error('Error handling question save:', error);
        showToast('error', 'Error', 'Failed to save question', 3000);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchQuestions();
});
</script>

<template>
    <div>
        <div class="card flex justify-center">
            <div class="flex flex-col gap-4 w-full">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <i class="pi pi-ellipsis-h mr-4" v-tooltip.top="'Select All'" @click="selectAll"></i>
                        <h6>Questions</h6>
                    </div>
                    <div class="flex items-center">
                        <i class="pi pi-plus pi-lg cursor-pointer flex items-center justify-center w-16 h-16 rounded-full bg-gray-400 hover:bg-gray-500" v-tooltip.bottom="'Add Question'" @click="openModal"></i>
                    </div>
                </div>
                <div v-if="!questions.length && !loading" class="text-center p-4 text-gray-500">No questions found</div>
                <div v-for="q in questions" :key="q.id" class="flex items-center border-b py-2">
                    <Checkbox v-model="selectedQuestions" :inputId="`q_${q.id}`" :value="q.id" class="mr-4" />
                    <label class="font-medium" :for="`q_${q.id}`">{{ q.text || q.title }}</label>
                </div>
            </div>
        </div>

        <Dialog v-model:visible="showNewQuestionModal" header="Add Question" :modal="true" :closable="true" class="w-1/2">
            <NewQuestion @close="showNewQuestionModal = false" @saved="handleQuestionSaved" />
        </Dialog>
    </div>
</template>

<style scoped>
/* Add any specific styles you need */
</style>
