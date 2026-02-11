import { User } from '../types';

import { API_URL } from './config';

const realUsersAPI = {
    /**
     * List all users (Admin only)
     */
    async list(): Promise<User[]> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/auth/listar_usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const data = await response.json();

        // Map backend fields to frontend User type
        return data.map((u: any) => ({
            id: u.id.toString(),
            name: u.nome_usuario,
            email: u.email || '',
            role: u.role,
            initials: u.nome_usuario.substring(0, 2).toUpperCase(),
            color: 'bg-indigo-500', // Default color
            isAdmin: u.role === 'admin' || u.role.includes('master'), // Map roles to isAdmin flag
            avatarUrl: u.avatar_url,
            isGuest: u.role === 'visitor'
        }));
    },

    /**
     * Create new user
     */
    async create(user: Partial<User>, password?: string): Promise<any> {
        const token = localStorage.getItem('access_token');

        // Map frontend User to backend CadastrarUsuario
        const payload = {
            usuario: user.email?.split('@')[0] || user.name?.toLowerCase().replace(/\s/g, ''), // Generate username
            email: user.email,
            password: password, // Required for creation
            nome_usuario: user.name,
            setor: 'Infraestrutura', // Enforce sector as per user request
            avatar_url: user.avatarUrl,
            role: user.isAdmin ? 'admin' : (user.role || 'visitor')
        };

        const response = await fetch(`${API_URL}/auth/cadastrar_usuario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Failed to create user');
        }

        return response.json();
    },

    /**
     * Update existing user
     */
    async update(user: User): Promise<any> {
        const token = localStorage.getItem('access_token');

        // Map frontend User to backend AtualizarUsuario
        const payload = {
            id: parseInt(user.id),
            nome_usuario: user.name,
            email: user.email,
            avatar_url: user.avatarUrl,
            setor: 'Infraestrutura', // Enforce sector
            role: user.isAdmin ? 'admin' : user.role
            // password is updated separately or if provided
        };

        const response = await fetch(`${API_URL}/auth/atualizar_usuario`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Failed to update user');
        }

        return response.json();
    },

    /**
     * Delete user
     */
    async delete(userId: string): Promise<any> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/auth/deletar_usuario/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        return response.json();
    }
};

import { USE_MOCK } from './config';
import { mockUsersAPI } from './mockServices';

export const usersAPI = USE_MOCK ? mockUsersAPI : realUsersAPI;
