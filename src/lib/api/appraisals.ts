/** erp-api appraisal endpoints: cycles, templates, questions, appraisals (+ workflow),
 *  responses, goals (+ progress). */

import { apiClient } from '@/lib/api/client';
import { type ListParams, type Paginated } from '@/lib/api/drf';

const APP = '/hrm/appraisals';

export interface AppraisalCycle {
    id: number | string;
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    is_active?: boolean;
    [key: string]: unknown;
}

export interface AppraisalTemplate {
    id: number | string;
    name?: string;
    description?: string;
    is_active?: boolean;
    question_count?: number;
    /** A platform template every organisation inherits; its description, active flag and
     *  questions can be changed for this organisation, its name stays. */
    inherited?: boolean;
    /** An inherited template this organisation changed. */
    customised?: boolean;
    [key: string]: unknown;
}

export interface AppraisalQuestion {
    id: number | string;
    template?: number;
    template_id?: string;
    template_name?: string;
    text?: string;
    question_text?: string;
    /** erp-api: text | rating | multiple_choice | yes_no */
    question_type?: string;
    is_required?: boolean;
    category?: string;
    weight?: string | number;
    max_score?: string | number;
    order?: number;
    /** A question of a platform template; its wording and scoring can be changed here. */
    inherited?: boolean;
    customised?: boolean;
    [key: string]: unknown;
}

/** erp-api appraisal row with the names GET /hrm/appraisals and GET /{id} add. */
export interface Appraisal {
    id: string;
    employee_id?: string;
    employee_name?: string;
    employee_number?: string;
    cycle_id?: string;
    cycle_name?: string;
    template_id?: string | null;
    template_name?: string;
    evaluator_id?: string | null;
    evaluator_name?: string;
    status?: AppraisalStatus;
    overall_rating?: string | number | null;
    rejection_reason?: string | null;
    created_at?: string;
    [key: string]: unknown;
}

export interface AppraisalResponse {
    id: string;
    appraisal_id?: string;
    question_id?: string;
    response?: string;
    rating?: string | number | null;
    [key: string]: unknown;
}

export interface Goal {
    id: number | string;
    employee?: number;
    employee_id?: string | null;
    end_date?: string | null;
    employee_name?: string;
    title?: string;
    description?: string;
    category?: string;
    target_date?: string;
    due_date?: string;
    progress?: string | number;
    weight?: string | number;
    status?: string;
    is_library?: boolean;
    created_at?: string;
    /** A platform sample goal of the library; its description, category and weight can be
     *  changed here, its title stays. */
    inherited?: boolean;
    customised?: boolean;
    [key: string]: unknown;
}

/** A number from a form value; blank or invalid gives undefined. */
function toNumber(v: unknown): number | undefined {
    if (v === '' || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

/** erp-api goal create/update body: {employee_id,title,description,start_date,end_date,
 *  is_template,category,weight}. The UI form uses employee/target_date/is_library. */
function goalBody(data: Partial<Goal>) {
    return {
        employee_id: data.employee_id ?? data.employee,
        title: data.title,
        description: data.description,
        start_date: (data as Record<string, unknown>).start_date,
        end_date: data.end_date ?? data.target_date,
        is_template: data.is_library ?? false,
        // category and weight are kept in the goal metadata by erp-api.
        category: data.category || undefined,
        weight: toNumber(data.weight)
    };
}

/** erp-api question create/update body. */
function questionBody(data: Partial<AppraisalQuestion>) {
    return {
        question_text: data.question_text ?? data.text,
        question_type: data.question_type || undefined,
        is_required: data.is_required,
        category: data.category || undefined,
        weight: toNumber(data.weight),
        max_score: toNumber(data.max_score),
        order: toNumber(data.order) ?? 0
    };
}

function crud<T extends { id: number | string }>(segment: string) {
    const base = `${APP}/${segment}`;
    return {
        list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
        get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
        create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
        update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
        remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`)
    };
}

export const appraisalApi = {
    cycles: {
        ...crud<AppraisalCycle>('cycles'),
        // erp-api: single status setter PUT /cycles/{id}/status.
        setStatus: (id: number | string, status: string) => apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status }),
        // erp-api cycle states: created -> activated -> closed -> reopened -> closed.
        activate: (id: number | string) => apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: 'activated' }),
        close: (id: number | string) => apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: 'closed' }),
        reopen: (id: number | string) => apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: 'reopened' })
    },
    templates: {
        ...crud<AppraisalTemplate>('templates'),
        // Drops this organisation's changes to an inherited template.
        revert: (id: number | string) => apiClient.delete<AppraisalTemplate>(`${APP}/templates/${id}/customisation`)
    },
    // Questions are scoped under a template (no top-level /questions route).
    questions: {
        list: (templateId: number | string, params?: ListParams) => apiClient.get<Paginated<AppraisalQuestion> | AppraisalQuestion[]>(`${APP}/templates/${templateId}/questions`, params),
        // Every question of every template the tenant can use, each with template_name.
        listAll: (params?: ListParams) => apiClient.get<Paginated<AppraisalQuestion> | AppraisalQuestion[]>(`${APP}/questions`, params),
        // Numeric fields go as numbers (form inputs give strings, which the API cannot decode).
        create: (templateId: number | string, data: Partial<AppraisalQuestion>) => apiClient.post<AppraisalQuestion>(`${APP}/templates/${templateId}/questions`, questionBody(data)),
        // A question that already has answers is refused (409).
        update: (id: number | string, templateId: number | string, data: Partial<AppraisalQuestion>) => apiClient.put<AppraisalQuestion>(`${APP}/questions/${id}`, { ...questionBody(data), template_id: templateId }),
        remove: (id: number | string) => apiClient.delete<void>(`${APP}/questions/${id}`),
        revert: (id: number | string) => apiClient.delete<AppraisalQuestion>(`${APP}/questions/${id}/customisation`)
    },
    goals: {
        ...crud<Goal>('goals'),
        create: (data: Partial<Goal>) => apiClient.post<Goal>(`${APP}/goals/`, goalBody(data)),
        // Progress and status change through updateProgress, not here.
        update: (id: number | string, data: Partial<Goal>) => apiClient.put<Goal>(`${APP}/goals/${id}/`, goalBody(data)),
        // erp-api: POST /goals/{id}/progress.
        updateProgress: (id: number | string, data: { progress: number | string; note?: string }) => apiClient.post<Goal>(`${APP}/goals/${id}/progress`, data),
        listProgress: (id: number | string) => apiClient.get(`${APP}/goals/${id}/progress`),
        revert: (id: number | string) => apiClient.delete<Goal>(`${APP}/goals/${id}/customisation`)
    },
    // Appraisals themselves live at the collection root (/hrm/appraisals/), not
    // a nested /appraisals segment.
    appraisals: {
        list: (params?: ListParams, signal?: AbortSignal) => apiClient.get<Paginated<Appraisal> | Appraisal[]>(`${APP}/`, params, { signal }),
        get: (id: number | string) => apiClient.get<Appraisal>(`${APP}/${id}/`),
        create: (data: Record<string, unknown>) =>
            apiClient.post<Appraisal>(`${APP}/`, {
                cycle_id: data.cycle_id ?? data.cycle,
                employee_id: data.employee_id ?? data.employee,
                template_id: data.template_id ?? data.template,
                evaluator_id: data.evaluator_id ?? data.reviewer ?? data.evaluator
            }),
        // erp-api: single status setter PUT /{id}/status. States: draft -> in_progress ->
        // completed -> approved | rejected, and rejected -> in_progress (reopen).
        setStatus: (id: number | string, status: AppraisalStatus, extra?: Record<string, unknown>) => apiClient.put<Appraisal>(`${APP}/${id}/status`, { status, ...extra }),
        start: (id: number | string) => apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: 'in_progress' }),
        // Submitting for review moves in_progress -> completed; overall_rating (0-5) is optional.
        submit: (id: number | string, overallRating?: string) =>
            apiClient.put<Appraisal>(`${APP}/${id}/status`, {
                status: 'completed',
                overall_rating: overallRating
            }),
        approve: (id: number | string) => apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: 'approved' }),
        reject: (id: number | string, reason: string) => apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: 'rejected', rejection_reason: reason }),
        reopen: (id: number | string) => apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: 'in_progress' })
    },
    // Responses are scoped under an appraisal id.
    listResponses: (appraisalId: number | string) => apiClient.get<Paginated<AppraisalResponse> | AppraisalResponse[]>(`${APP}/${appraisalId}/responses`),
    // One answer per call; saving a question again replaces its earlier answer. rating is a
    // string 0-5 (the API parses it as a decimal).
    saveResponse: (appraisalId: number | string, data: { question_id: string; response?: string; rating?: string }) => apiClient.post<AppraisalResponse>(`${APP}/${appraisalId}/responses`, data)
};

export type AppraisalStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';

/** Plain-English labels for the erp-api appraisal states. */
export const APPRAISAL_STATUS_LABELS: Record<AppraisalStatus, string> = {
    draft: 'Not started',
    in_progress: 'In progress',
    completed: 'Awaiting review',
    approved: 'Approved',
    rejected: 'Rejected'
};

export type AppraisalCycleStatus = 'created' | 'activated' | 'closed' | 'reopened';

export const APPRAISAL_CYCLE_STATUS_LABELS: Record<AppraisalCycleStatus, string> = {
    created: 'Not started',
    activated: 'Active',
    closed: 'Closed',
    reopened: 'Reopened'
};
