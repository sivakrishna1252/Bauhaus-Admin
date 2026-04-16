import { API_BASE_URL, getAuthHeaders } from '../config/api';

export type EntryCategory = 'TIMELINE' | 'AGREEMENT' | 'PAYMENT_INVOICE' | 'HANDOVER' | 'CERTIFICATE' | 'PROJECT_DOCUMENT' | 'CLIENT_UPLOAD';

export interface MediaFile {
    url: string;
    type: "IMAGE" | "VIDEO" | "PDF";
}

export type TimelineType = 'DESIGN' | 'PROJECT';
export type TimelineStepStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DailyWorkLog {
    id: string;
    description: string;
    logDate: string;
}

export interface CompletionFile {
    id: string;
    fileUrl: string;
    fileType: 'IMAGE' | 'VIDEO' | 'PDF';
    rejectionRound: number;
    createdAt: string;
}

export interface FeedbackFile {
    id: string;
    fileUrl: string;
    fileType: 'IMAGE' | 'VIDEO' | 'PDF';
    rejectionRound: number;
    createdAt: string;
}

export interface TimelineStepIteration {
    id: string;
    iterationNumber: number;
    adminFeedback: string | null;
    clientFeedback: string | null;
    status: TimelineStepStatus;
    createdAt: string;
    updatedAt: string;
}

export interface TimelineStepDelay {
    id: string;
    delayNumber: number;
    reason: string;
    createdAt: string;
}

export interface TimelineStep {
    id: string;
    type: TimelineType;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string;
    status: TimelineStepStatus;
    order: number;
    paymentTag: string | null;
    delayReason: string | null;
    completionUrl: string | null;
    delayCount: number;
    rejectCount: number;
    clientFeedback: string | null;
    dailyLogs: DailyWorkLog[];
    completionFiles: CompletionFile[];
    feedbackFiles: FeedbackFile[];
    iterations?: TimelineStepIteration[];
    delays?: TimelineStepDelay[];
}

export interface ProjectEntry {
    id: string;
    media: MediaFile[];
    description: string;
    category: EntryCategory;
    createdAt: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: string;
    clientId: string;
    finalDocumentUrl: string | null;
    isFinalized: boolean;
    designer?: string;
    principalDesigner?: string;
    client: {
        username: string;
    };
    entries: ProjectEntry[];
    timelineSteps: TimelineStep[];
    createdAt: string;
    updatedAt: string;
}

export interface ProjectData {
    clientId: string;
    title: string;
    description: string;
    designer?: string;
    principalDesigner?: string;
}

export const createProject = async (projectData: ProjectData) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
    }

    return await response.json();
};

export const getAllProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch projects');
    }

    return await response.json();
};

export const getProjectDetail = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch project details');
    }

    return await response.json();
};

export const getDesignerAssignments = async () => {
    const response = await fetch(`${API_BASE_URL}/projects/assignments/designers`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch designer assignments');
    }

    return await response.json();
};

export const updateProject = async (projectId: string, projectData: Partial<ProjectData>) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project');
    }

    return await response.json();
};

export const updateProjectStatus = async (projectId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
    }

    return await response.json();
};

export const deleteProject = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to delete project');
    }

    return await response.json();
};

export const summarizeProject = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/summarize`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send summary');
    }

    return await response.json();
};

export const downloadProjectArchive = async (projectId: string, projectTitle: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/archive`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to download archive');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectTitle.replace(/\s+/g, '_')}_Final_Archive.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const getMyProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/my-projects`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch your projects');
    }

    return await response.json();
};

export const createProjectEntry = async (projectId: string, entryData: FormData) => {
    const { Authorization } = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/entries`, {
        method: 'POST',
        headers: {
            'Authorization': Authorization
        },
        body: entryData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create entry');
    }

    return await response.json();
};

export const updateProjectEntry = async (entryId: string, entryData: FormData) => {
    const { Authorization } = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/projects/entries/${entryId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': Authorization
        },
        body: entryData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update entry');
    }

    return await response.json();
};

export const deleteProjectEntry = async (entryId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/entries/${entryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to delete entry');
    }

    return await response.json();
};

export const getProjectTimeline = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/timeline`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch timeline');
    }

    return await response.json();
};

export const createTimelineStep = async (projectId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to create step');
    return await response.json();
};

export const updateTimelineStep = async (stepId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/timeline/${stepId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to update step');
    return await response.json();
};

export const completeTimelineStep = async (stepId: string, formData: FormData) => {
    const { Authorization } = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/timeline/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': Authorization },
        body: formData
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to complete step');
    return await response.json();
};

export const addDailyLog = async (stepId: string, description: string) => {
    const response = await fetch(`${API_BASE_URL}/timeline/${stepId}/logs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ description })
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to add log');
    return await response.json();
};

export const generateFinalDocument = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/generate-document`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to generate document');
    return await response.json();
};

export const deleteTimelineStep = async (stepId: string) => {
    const response = await fetch(`${API_BASE_URL}/timeline/${stepId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete step');
    return await response.json();
};

export const submitTimelineFeedback = async (stepId: string, formData: FormData) => {
    const { Authorization } = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/timeline/${stepId}/feedback`, {
        method: 'POST',
        headers: {
            'Authorization': Authorization
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
    }

    return await response.json();
};

export const bulkUpdateTimeline = async (projectId: string, updates: any[], globalReason?: string, notifyAction?: 'INITIALIZE') => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/timeline/bulk-update`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ updates, globalReason, notifyAction })
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to update timeline');
    return await response.json();
};

export const initializeProject = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/timeline/initialize`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to initialize project');
    return await response.json();
};

export const clearProjectTimeline = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/timeline`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to clear timeline');
    return await response.json();
};


