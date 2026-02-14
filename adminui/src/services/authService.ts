import { API_BASE_URL } from '../config/api';

export const adminLogin = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    return await response.json();
};

export const clientLogin = async (username: string, pin: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/client/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, pin })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    return await response.json();
};

export const requestPasswordReset = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/request-reset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    const data = await response.json();
    return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
    }

    return await response.json();
};

export const logout = () => {
    // Remove both admin and client keys to fully clear on explicit logout call
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    // Also remove legacy keys if they exist
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
