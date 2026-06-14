import AppraisalDetail from '@/views/pages/hrm/appraisals/appraisalDetail.vue';
import AppraisalEdit from '@/views/pages/hrm/appraisals/appraisalEdit.vue';
import AppraisalList from '@/views/pages/hrm/appraisals/appraisalList.vue';
import AppraisalTemplates from '@/views/pages/hrm/appraisals/appraisalTemplates.vue';
import Evaluators from '@/views/pages/hrm/appraisals/evaluators.vue';
import FinalReview from '@/views/pages/hrm/appraisals/finalReview.vue';
import GoalsList from '@/views/pages/hrm/appraisals/goalsList.vue';
import Questions from '@/views/pages/hrm/appraisals/questions.vue';
import WorkflowManagement from '@/views/pages/hrm/appraisals/workflowManagement.vue';

export const appraisalRoutes = [
    {
        path: '/hrm/appraisals',
        name: 'appraisals',
        component: AppraisalList,
        meta: {
            title: 'Appraisals',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals' }]
        }
    },
    {
        path: '/hrm/appraisals/:id',
        name: 'appraisal-detail',
        component: AppraisalDetail,
        meta: {
            title: 'Appraisal Detail',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Detail' }]
        }
    },
    {
        path: '/hrm/appraisals/:id/edit',
        name: 'appraisal-edit',
        component: AppraisalEdit,
        meta: {
            title: 'Edit Appraisal',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Detail', to: '/hrm/appraisals/:id' }, { label: 'Edit' }]
        }
    },
    {
        path: '/hrm/appraisals/templates',
        name: 'appraisal-templates',
        component: AppraisalTemplates,
        meta: {
            title: 'Appraisal Templates',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Templates' }]
        }
    },
    {
        path: '/hrm/appraisals/workflow',
        name: 'workflow-management',
        component: WorkflowManagement,
        meta: {
            title: 'Workflow Management',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Workflow' }]
        }
    },
    {
        path: '/hrm/appraisals/goals',
        name: 'goals',
        component: GoalsList,
        meta: {
            title: 'Goals',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Goals' }]
        }
    },
    {
        path: '/hrm/appraisals/evaluators',
        name: 'evaluators',
        component: Evaluators,
        meta: {
            title: 'Evaluators',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Evaluators' }]
        }
    },
    {
        path: '/hrm/appraisals/questions',
        name: 'questions',
        component: Questions,
        meta: {
            title: 'Questions',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Questions' }]
        }
    },
    {
        path: '/hrm/appraisals/:id/review',
        name: 'final-review',
        component: FinalReview,
        meta: {
            title: 'Final Review',
            breadcrumb: [{ label: 'Home', to: '/' }, { label: 'HRM', to: '/hrm' }, { label: 'Appraisals', to: '/hrm/appraisals' }, { label: 'Detail', to: '/hrm/appraisals/:id' }, { label: 'Review' }]
        }
    }
];
