const API_URL = 'http://127.0.0.1:5001';

export const notificationsAPI = {
    async list() {
        const response = await fetch(`${API_URL}/notifications/`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
    },

    async markAsRead(id: string) {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return response.json();
    }
};
