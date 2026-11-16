import api from './client';

let cached = null;
let pending = null;

export const siteApi = {
    async content({ force = false } = {}) {
        if (!force && cached) {
            return cached;
        }

        if (!force && pending) {
            return pending;
        }

        pending = api.get('/api/v1/site')
            .then((response) => {
                cached = response.data.data;
                pending = null;

                return cached;
            })
            .catch((error) => {
                pending = null;
                throw error;
            });

        return pending;
    },

    clear() {
        cached = null;
        pending = null;
    },
};
