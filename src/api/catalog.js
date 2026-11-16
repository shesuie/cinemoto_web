import api from './client';

export const catalogApi = {
    async movies() {
        const response = await api.get('/api/v1/movies');

        return response.data.data;
    },

    async movie(id) {
        const response = await api.get(`/api/v1/movies/${id}`);

        return response.data.data;
    },

    async seats(showtimeId) {
        const response = await api.get(`/api/v1/showtimes/${showtimeId}/seats`);

        return response.data.data;
    },

    async food(cinemaId) {
        const response = await api.get('/api/v1/food/products', {
            params: { cinema_id: cinemaId },
        });

        return response.data.data;
    },
};
