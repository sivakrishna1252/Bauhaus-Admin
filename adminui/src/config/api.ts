// src/config/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://72.60.219.145:5004/api';
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://72.60.219.145:5004';

// Helper to determine the correct token key based on the current path
const getTokenFromStorage = (): string | null => {
    if (typeof window === 'undefined') return null;
    const isClientPath = window.location.pathname.startsWith('/client');
    const tokenKey = isClientPath ? 'client_token' : 'admin_token';
    return localStorage.getItem(tokenKey);
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
    const token = getTokenFromStorage();
    if (!token) return { 'Content-Type': 'application/json' };
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Helper for multipart/form-data (file uploads)
export const getAuthHeadersMultipart = (): Record<string, string> => {
    const token = getTokenFromStorage();
    if (!token) return {};
    return {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for multipart - browser will set it with boundary
    };
};
