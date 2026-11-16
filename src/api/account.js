import api from './client';

export const accountApi = {
    async show() {
        const response = await api.get('/api/v1/auth/account');

        return response.data.data;
    },

    async update(payload) {
        const response = await api.patch('/api/v1/auth/account', payload);

        return response.data;
    },

    async updatePassword(payload) {
        const response = await api.put('/api/v1/auth/password', payload);

        return response.data;
    },

    async register(payload) {
        const response = await api.post('/api/v1/auth/register', payload);

        return response.data;
    },

    async forgotPassword(email) {
        const response = await api.post('/api/v1/auth/forgot-password', { email });

        return response.data;
    },

    async resetPassword(payload) {
        const response = await api.post('/api/v1/auth/reset-password', payload);

        return response.data;
    },
};
