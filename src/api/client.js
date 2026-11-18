import axios from 'axios';
import { httpFallbackMessage, MESSAGES } from '../constants/messages';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/** Cap parallel calls — php artisan serve is single-threaded and queues the rest. */
const MAX_CONCURRENT = 2;
let activeRequests = 0;
const waitQueue = [];

function releaseSlot() {
    activeRequests = Math.max(0, activeRequests - 1);
    const next = waitQueue.shift();
    if (next) {
        next();
    }
}

function acquireSlot() {
    if (activeRequests < MAX_CONCURRENT) {
        activeRequests += 1;

        return Promise.resolve();
    }

    return new Promise((resolve) => {
        waitQueue.push(() => {
            activeRequests += 1;
            resolve();
        });
    });
}

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

function firstValidationMessage(errors) {
    if (!errors || typeof errors !== 'object') {
        return null;
    }

    for (const value of Object.values(errors)) {
        const line = Array.isArray(value) ? value.find((item) => typeof item === 'string' && item.trim()) : null;
        if (line) {
            return line;
        }
    }

    return null;
}

function friendlyMessage(status, body) {
    const validation = firstValidationMessage(body?.errors);
    if (validation) {
        return validation;
    }

    const raw = typeof body?.message === 'string' ? body.message.trim() : '';

    return httpFallbackMessage(status, raw) || MESSAGES.requestFailed;
}

function normalizeError(error) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    return {
        status,
        message: friendlyMessage(status, body),
        errorCode: body?.error_code || null,
        errors: body?.errors || {},
        code: error.code,
        name: error.name,
    };
}

api.interceptors.request.use(async (config) => {
    const method = (config.method || 'get').toLowerCase();
    const isCsrf = config.url?.includes('/sanctum/csrf-cookie');

    if (!isCsrf) {
        await acquireSlot();
        config.__slotHeld = true;
    }

    if (!['get', 'head', 'options'].includes(method) && !isCsrf) {
        await ensureCsrf();
    }

    // Let the browser set multipart boundary — a fixed Content-Type breaks file uploads.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers && typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type');
        } else if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => {
        if (response.config?.__slotHeld) {
            releaseSlot();
        }

        return response;
    },
    async (error) => {
        const config = error.config;
        if (config?.__slotHeld) {
            releaseSlot();
            config.__slotHeld = false;
        }

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
