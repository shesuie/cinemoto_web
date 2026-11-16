import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

let csrfRequest = null;

export function ensureCsrf() {
    if (!csrfRequest) {
        csrfRequest = api.get('/sanctum/csrf-cookie').catch((error) => {
            csrfRequest = null;
            throw error;
        });
    }

    return csrfRequest;
}

function normalizeError(error) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    return {
        status,
        message: body?.message || 'The request could not be completed.',
        errorCode: body?.error_code || null,
        errors: body?.errors || {},
    };
}

api.interceptors.request.use(async (config) => {
    const method = (config.method || 'get').toLowerCase();

    if (!['get', 'head', 'options'].includes(method) && !config.url?.includes('/sanctum/csrf-cookie')) {
        await ensureCsrf();
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        if (error.response?.status === 419 && config && !config._csrfRetried) {
            config._csrfRetried = true;
            csrfRequest = null;
            await ensureCsrf();

            return api.request(config);
        }

        return Promise.reject(normalizeError(error));
    },
);

export default api;
