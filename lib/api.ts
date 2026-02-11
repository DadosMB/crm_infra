import { API_URL } from './config';

export interface ApiRequestOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * API client with automatic authentication
 * Uses HttpOnly cookies for authentication
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        credentials: 'include', // Always send cookies
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers
        }
    });

    // Handle authentication errors
    if (response.status === 401 && !skipAuth) {
        // Token expired or invalid
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        window.location.href = '/';
        throw new Error('Session expired');
    }

    // Handle other errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper methods for common HTTP verbs
 */
export const api = {
    get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};
