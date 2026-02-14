import { API_BASE_URL, getAuthHeaders } from '../config/api';

// ============ ADMIN PROFILE ============
export const updateAdminProfile = async (updates: { email?: string; newPassword?: string }) => {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
    }

    return await response.json();
};

// ============ CLIENT MANAGEMENT ============
export const getAllClients = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/clients`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch clients');
    }

    return await response.json();
};

export const createClient = async (username: string, pin: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, pin })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create client');
    }

    return await response.json();
};

export const resetClientPin = async (clientId: string, newPin: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/reset-pin`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPin })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset PIN');
    }

    return await response.json();
};

export const blockClient = async (clientId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/block`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to block client');
    }

    return await response.json();
};

export const unblockClient = async (clientId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/unblock`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to unblock client');
    }

    return await response.json();
};

export const deleteClient = async (clientId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete client');
    }

    return await response.json();
};

export const getDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
    }

    return await response.json();
};

