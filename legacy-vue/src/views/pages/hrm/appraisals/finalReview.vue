<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useVuelidate } from '@vuelidate/core';
import { maxValue, minValue, required } from '@vuelidate/validators';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();
const loading = ref(false);

const jobLevel = ref();
const jobLevels = ref([{ name: 'Limited to current role only or possible bad fit' }, { name: 'Good fit at current level, lateral move or upward 1 level' }, { name: 'Highly capable to attain higher roles, upward mobility more than 1 level' }]);

const appraisal = ref(null);
const ratings = ref({});
const comments = ref({});
const evaluators = ref([]);
const selectedEvaluator = ref(null);

const ratingRules = {
    value: { required, minValue: minValue(1), maxValue: maxValue(5) }
};

const v$ = useVuelidate(ratingRules, ratings);

const fetchAppraisal = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getAppraisal(route.params.id);
        appraisal.value = response.data;
        await fetchEvaluators();
    } catch (error) {
        console.error('Error fetching appraisal:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to fetch appraisal. Please try again later.', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchEvaluators = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getEvaluators();
        evaluators.value = response.data;
    } catch (error) {
        console.error('Error fetching evaluators:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to fetch evaluators. Please try again later.', 3000);
    } finally {
        loading.value = false;
    }
};

// Review save/submit is not supported by backend appraisals API.
// Align actions with available endpoints: submit/approve/reject appraisal statuses.
const submitReview = async () => {
    confirm.require({
        message: 'Submit this appraisal?',
        header: 'Confirm Submit',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.submitAppraisal(appraisal.value.id);
                showToast('success', 'Success', 'Appraisal submitted', 3000);
                await fetchAppraisal();
            } catch (error) {
                console.error('Error submitting appraisal:', error);
                showToast('error', 'Error', error.response?.data?.message || 'Failed to submit', 3000);
            } finally {
                loading.value = false;
            }
        }
    });
};

onMounted(async () => {
    await fetchAppraisal();
});
</script>
<template>
    <div class="">
        <div class="mb-10">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text />
                    <router-link :to="`/hrm/appraisals`" class="text-gray-600 hover:text-blue-500">
                        <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text />
                    </router-link>
                </template>
            </Toolbar>
        </div>

        <div>
            <h2 class="text-xl font-bold text-gray-500">Main Evaluator (Final) Review</h2>
        </div>

        <!-- Editable Div -->
        <div class="mb-2">
            <div id="editable" contenteditable="false" class="w-full border border-gray-200 rounded p-4 min-h-[600px]">
                <div class="flex justify-center w-full mb-5 bg-white">
                    <!-- Container for image and HRM text with no space in between -->
                    <div class="flex items-center">
                        <a href="/" class="router-link-active layout-topbar-logo">
                            <img src="/src/assets/images/logos/logo.png" alt="Logo" class="h-20 w-28 object-contain pl-0" />
                        </a>
                        <span class="text-6xl font-bold text-blue-800 pl-2">H<b class="text-red-800">RM</b></span>
                    </div>
                </div>
                <h1 class="underline text-2xl text-center font-semibold">Annual Appraisal</h1>
                <p>
                    The goal of this review process is to allow supervisors to share their assessment of the past review period and create a forum to discuss employee performance, strengths and areas of development feedback. To enhance the
                    discussion, we have provided the following guide for rating competencies and overall performance.
                </p>
                <br />
                <p class="font-bold">Rating 5: Displayed excellent proficiency and great effort in this area</p>
                <p>
                    Performance levels and accomplishments far exceed normal expectations. This category is reserved for the employee who truly stands out and clearly and consistently demonstrates exceptional accomplishments in terms of quality and
                    quantity of work that is easily recognized as truly exceptional by others.
                </p>
                <br />
                <p class="font-bold">Rating 4: Displayed strong proficiency in this area</p>
                <p>
                    Performance clearly and fully meets all the requirements of the position in terms of quality and quantity of work. It is described as good, solid performance, with thorough and on-time results. While minor deviations may occur,
                    the overall level of performance meets all position requirements.
                </p>
                <br />
                <p class="font-bold">Rating 3: Displayed adequate performance in this area</p>
                <p>Performance meets most of the requirements but not all requirements of the position in terms of quality and quantity of work. Performance levels / quality of work may meet expectations but not on a consistent/ sustained basis.</p>
                <br />
                <p class="font-bold">Rating 2: Showed some effort but overall results were below expectations, improvement needed</p>
                <p>Performance is noticeably less than expected. The employee generally meets most job requirements, but struggles to fully meet them all. The need for further development and improvement is clearly recognized.</p>
                <br />
                <p class="font-bold">Rating 1: Performed Poorly in this area, much improvement needed</p>
                <p>Performance must improve substantially within a reasonable period if the individual is to remain in this position. The employee is not meeting the job requirements.</p>
            </div>
        </div>
        <div class="flex flex-row border border-gray-200 mt-10">
            <div class="flex justify-start flex-col w-1/4">
                <div class="ml-16 mt-4">
                    <img class="rounded-full h-40 w-40" src="\src\assets\images\appraisal\person4.jpg" alt="some_text" />
                    <div class="mt-2 pl-5">
                        <span id="finalRatingValue" class="text-5xl block text-primary">4.70</span>
                        <span id="finalRatingLabel" class="block pl-5 text-primary">Rating</span>
                    </div>
                </div>
            </div>
            <div class="w-3/4 pl-5">
                <div class="flex justify-between mb-4">
                    <div class="flex flex-col w-1/2">
                        <!-- Adjust width as needed -->
                        <label for="Employee">Employee:</label>
                        <InputText value="Christine Kerubo" />
                    </div>
                    <div class="flex flex-col w-1/2 ml-2">
                        <!-- Adjust width as needed -->
                        <label for="Status">Status:</label>
                        <InputText value="SUBMITTED" />
                    </div>
                </div>
                <!-- Evaluator selection removed to align with backend API -->
                <div class="mt-2 flex flex-col">
                    <label for="comment">Comment</label>
                    <InputText id="comment" class="" />
                </div>
            </div>
        </div>
        <div class="mt-4 border border-gray-200">
            <div class="font-bold text-xl">
                <label for="competencies">Competencies</label>
            </div>
            <div class="w-1/2 mt-2 mb-2">
                <ProgressBar :value="60"></ProgressBar>
            </div>
        </div>
        <div class="mt-4 border border-gray-200">
            <p class="font-bold text-xl">Communication</p>
            <div>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Clarity</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.communicationClarity" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.communicationClarity" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Listening</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.communicationListening" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.communicationListening" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Communication</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.communicationCommunication" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.communicationCommunication" />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4 border border-gray-200">
            <p class="font-bold text-xl">Time Management</p>
            <div>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Organization</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.timeManagementOrganization" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.timeManagementOrganization" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Prioritization</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.timeManagementPrioritization" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.timeManagementPrioritization" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Time Management</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.timeManagementTimeManagement" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*9%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.timeManagementTimeManagement" />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4 border border-gray-200">
            <p class="font-bold text-xl">Decision Making</p>
            <div>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Decision Making</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.decisionMakingDecisionMaking" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*6%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.decisionMakingDecisionMaking" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Insight & Analysis</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.decisionMakingInsightAnalysis" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*6%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.decisionMakingInsightAnalysis" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Responsibility</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.decisionMakingResponsibility" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.decisionMakingResponsibility" />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4 border border-gray-200">
            <p class="font-bold text-xl">Teamwork and Relationship Management</p>
            <div>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Consensus Building</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.teamworkRelationshipManagementConsensusBuilding" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.teamworkRelationshipManagementConsensusBuilding" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Introspection</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.teamworkRelationshipManagementIntrospection" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*6%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.teamworkRelationshipManagementIntrospection" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Teamplayer</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.teamworkRelationshipManagementTeamplayer" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.teamworkRelationshipManagementTeamplayer" />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4 border border-gray-200">
            <p class="font-bold text-xl">Problem Solving</p>
            <div>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Anticipation</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.problemSolvingAnticipation" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*3%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.problemSolvingAnticipation" />
                    </div>
                </div>
            </div>

            <div class="mt-6 border border-gray-200">
                <div class="flex items-center space-x-2">
                    <i class="pi pi-info-circle text-secondary"></i>
                    <label for="clarity">Decisiveness</label>
                </div>
                <div class="">
                    <label for="rating" class="text-sm text-primary">Rating:</label>
                    <div class="flex flex-col">
                        <div class="flex items-center pb-0 mb-0.5">
                            <Rating v-model="ratings.problemSolvingDecisiveness" class="mr-12" />
                            <span class="ml-2 text-xl text-secondary font-bold">*6%</span>
                            <!-- Percentage next to the rating -->
                        </div>
                    </div>
                    <div class="mt-2">
                        <label for="comment">Comment</label>
                        <InputText class="w-full" v-model="comments.problemSolvingDecisiveness" />
                    </div>
                </div>
            </div>
        </div>
        <div class="border border-white">
            <div class="mt-4">
                <p class="font-bold mb-6 mt-4">Questions</p>
                <label for="question1">1. In which areas of your job would you require more support from your supervisor & outline how this would better support your performance? </label><br />
                <label for="" class="text-sm text-primary">Comment</label>
                <Textarea class="w-full" v-model="comments.question1" />
            </div>
            <div class="mt-4">
                <label for="question1">2. What are your expectations for the next review period & how do you plan to improve/redefine your work performance to deliver the expected targets & goals? </label><br />
                <label for="" class="text-sm text-primary">Comment</label>
                <Textarea class="w-full" v-model="comments.question2" />
            </div>
        </div>

        <div class="border border-white">
            <div class="mt-4">
                <p class="font-bold mb-6 mt-4">Summary</p>
                <label class="text-sm">Overall comment </label><br />
                <label for="" class="text-sm text-primary">Comment</label>
                <Textarea class="w-full" v-model="comments.summary" />
            </div>

            <div class="border border-white">
                <div class="mt-4">
                    <p class="font-bold mb-6 mt-4">Potential Assesment</p>
                    <label class="text-sm">What is the potential job level the individual is capable of attaining? </label><br />
                    <div class="flex justify-start">
                        <Select v-model="jobLevel" :options="jobLevels" optionLabel="name" placeholder="--select--" class="w-full" />
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end space-x-2 mt-4">
            <Button label="Submit" @click="submitReview" :loading="loading" />
        </div>
    </div>
</template>
