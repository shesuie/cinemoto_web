import api from './client';

export const bookingApi = {
    async list() {
        const response = await api.get('/api/v1/bookings');

        return response.data.data;
    },

    async show(id) {
        const response = await api.get(`/api/v1/bookings/${id}`);

        return response.data.data;
    },

    async hold(payload) {
        const response = await api.post('/api/v1/bookings', payload);

        return response.data;
    },

    async pay(id, payload) {
        const response = await api.post(`/api/v1/bookings/${id}/payment`, payload);

        return response.data;
    },

    async cancel(id) {
        const response = await api.post(`/api/v1/bookings/${id}/cancel`);

        return response.data;
    },

    async ticket(id) {
        const response = await api.get(`/api/v1/bookings/${id}/ticket`);

        return response.data.data;
    },
};
