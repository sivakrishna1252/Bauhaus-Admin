import { API_BASE_URL, getAuthHeaders } from '../config/api';

export type EntryCategory = 'TIMELINE' | 'AGREEMENT' | 'PAYMENT_INVOICE' | 'HANDOVER' | 'CERTIFICATE';

export interface MediaFile {
    url: string;
    type: "IMAGE" | "VIDEO" | "PDF";
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
    client: {
        username: string;
    };
    entries: ProjectEntry[];
}

export interface ProjectData {
    clientId: string;
    title: string;
    description: string;
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

