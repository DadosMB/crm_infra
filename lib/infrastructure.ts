/**
 * Infrastructure API Service
 * Handles API calls for ServiceOrders, Expenses, and Assets
 */

import { API_URL } from './config';

// ===== SERVICE ORDERS =====

export const serviceOrdersAPI = {
    /**
     * List service orders with filters
     */
    async list(filters?: {
        unit?: string;
        status?: string;
        owner_id?: number;
        archived?: boolean;
    }) {
        const params = new URLSearchParams();
        if (filters?.unit) params.append('unit', filters.unit);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.owner_id) params.append('owner_id', filters.owner_id.toString());
        if (filters?.archived !== undefined) params.append('archived', filters.archived.toString());

        const response = await fetch(`${API_URL}/infraestrutura/orders?${params}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service orders');
        }

        return response.json();
    },

    /**
     * Create new service order
     */
    async create(data: {
        title: string;
        unit: string;
        description: string;
        type: string;
        priority: string;
        owner_id: number;
        date_forecast?: string;
    }) {
        const response = await fetch(`${API_URL}/infraestrutura/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create service order');
        }

        return response.json();
    },

    /**
     * Update service order
     */
    async update(id: string, data: {
        title?: string;
        unit?: string;
        description?: string;
        status?: string;
        type?: string;
        priority?: string;
        date_forecast?: string;
        date_closed?: string;
    }) {
        const response = await fetch(`${API_URL}/infraestrutura/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update service order');
        }

        return response.json();
    },

    /**
     * Add history log to service order
     */
    async addLog(id: string, message: string) {
        const response = await fetch(`${API_URL}/infraestrutura/orders/${id}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add log');
        }

        return response.json();
    },

    /**
     * Archive service order
     */
    async archive(id: string) {
        const response = await fetch(`${API_URL}/infraestrutura/orders/${id}/archive`, {
            method: 'PUT',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to archive service order');
        }

        return response.json();
    }
};

// ===== EXPENSES =====

export const expensesAPI = {
    /**
     * List expenses with filters
     */
    async list(filters?: {
        unit?: string;
        month?: number;
        year?: number;
    }) {
        const params = new URLSearchParams();
        if (filters?.unit) params.append('unit', filters.unit);
        if (filters?.month) params.append('month', filters.month.toString());
        if (filters?.year) params.append('year', filters.year.toString());

        const response = await fetch(`${API_URL}/infraestrutura/expenses?${params}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }

        return response.json();
    },

    /**
     * Create new expense
     */
    async create(data: {
        item: string;
        value: number;
        date: string;
        supplier: string;
        warranty_parts_months?: number;
        warranty_service_months?: number;
        linked_os_id?: string;
        category: string;
        payment_method: string;
        unit: string;
        status?: string;
        payment_data?: any;
    }) {
        const response = await fetch(`${API_URL}/infraestrutura/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create expense');
        }

        return response.json();
    },

    /**
     * Update expense
     */
    async update(id: string, data: any) {
        const response = await fetch(`${API_URL}/infraestrutura/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update expense');
        }

        return response.json();
    },

    /**
     * Delete expense (admin only)
     */
    async delete(id: string) {
        const response = await fetch(`${API_URL}/infraestrutura/expenses/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete expense');
        }

        return response.json();
    }
};

// ===== ASSETS =====

export const assetsAPI = {
    /**
     * List assets with filters
     */
    async list(filters?: {
        unit?: string;
        category?: string;
        status?: string;
    }) {
        const params = new URLSearchParams();
        if (filters?.unit) params.append('unit', filters.unit);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);

        const response = await fetch(`${API_URL}/infraestrutura/assets?${params}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assets');
        }

        return response.json();
    },

    /**
     * Create new asset
     */
    async create(data: {
        asset_tag: string;
        name: string;
        unit: string;
        category: string;
        brand?: string;
        model?: string;
        description?: string;
        value?: number;
        photo_url?: string;
        registration_date: string;
        warranty?: any;
        invoice_info?: any;
    }) {
        const response = await fetch(`${API_URL}/infraestrutura/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create asset');
        }

        return response.json();
    },

    /**
     * Update asset
     */
    async update(id: number, data: any) {
        const response = await fetch(`${API_URL}/infraestrutura/assets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update asset');
        }

        return response.json();
    },

    /**
     * Delete asset (admin only)
     */
    async delete(id: number) {
        const response = await fetch(`${API_URL}/infraestrutura/assets/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete asset');
        }

        return response.json();
    },

    /**
     * Send asset to maintenance
     */
    async sendToMaintenance(data: {
        asset_id: number;
        provider_name: string;
        contact_info?: string;
        date_out: string;
        date_return_forecast?: string;
        description: string;
    }) {
        const response = await fetch(`${API_URL}/infraestrutura/assets/maintenance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to send asset to maintenance');
        }

        return response.json();
    },

    /**
     * Return asset from maintenance
     */
    async returnFromMaintenance(maintenanceId: number, dateReturned?: string) {
        const body = dateReturned ? { date_returned: dateReturned } : {};

        const response = await fetch(`${API_URL}/infraestrutura/assets/maintenance/${maintenanceId}/return`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to return asset from maintenance');
        }

        return response.json();
    }
};

// ===== SUPPLIERS =====

export const suppliersAPI = {
    async list() {
        const response = await fetch(`${API_URL}/infraestrutura/suppliers`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch suppliers');
        return response.json();
    },

    async create(data: { name: string; category: string; contact_info?: string }) {
        const response = await fetch(`${API_URL}/infraestrutura/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create supplier');
        return response.json();
    },

    async update(id: number, data: any) {
        const response = await fetch(`${API_URL}/infraestrutura/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update supplier');
        return response.json();
    },

    async delete(id: number) {
        const response = await fetch(`${API_URL}/infraestrutura/suppliers/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete supplier');
        return response.json();
    }
};

// ===== TASKS =====

export const tasksAPI = {
    async list() {
        const response = await fetch(`${API_URL}/infraestrutura/tasks`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    async create(data: any) {
        const response = await fetch(`${API_URL}/infraestrutura/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
    },

    async update(id: number, data: any) {
        const response = await fetch(`${API_URL}/infraestrutura/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    },

    async delete(id: number) {
        const response = await fetch(`${API_URL}/infraestrutura/tasks/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
    }
};

// Export all APIs
// Export all APIs
const realInfrastructureAPI = {
    serviceOrders: serviceOrdersAPI,
    expenses: expensesAPI,
    assets: assetsAPI,
    suppliers: suppliersAPI,
    tasks: tasksAPI
};

import { USE_MOCK } from './config';
import { mockServiceOrdersAPI, mockExpensesAPI, mockAssetsAPI, mockSuppliersAPI, mockTasksAPI } from './mockServices';

export const infrastructureAPI = USE_MOCK ? {
    serviceOrders: mockServiceOrdersAPI,
    expenses: mockExpensesAPI,
    assets: mockAssetsAPI,
    suppliers: mockSuppliersAPI,
    tasks: mockTasksAPI
} : realInfrastructureAPI;
