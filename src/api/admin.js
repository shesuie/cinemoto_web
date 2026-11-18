import api from './client';

function query(params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            search.set(key, value);
        }
    });
    const text = search.toString();

    return text ? `?${text}` : '';
}

let navigationCached = null;
let navigationPending = null;

export const adminApi = {
    navigation({ force = false } = {}) {
        if (!force && navigationCached) {
            return Promise.resolve(navigationCached);
        }

        if (!force && navigationPending) {
            return navigationPending;
        }

        navigationPending = api.get('/api/v1/admin/navigation')
            .then((response) => {
                navigationCached = response.data.data;

                return navigationCached;
            })
            .finally(() => {
                navigationPending = null;
            });

        return navigationPending;
    },

    clearNavigation() {
        navigationCached = null;
        navigationPending = null;
    },

    dashboard(params) {
        return api.get(`/api/v1/admin/dashboard${query(params)}`).then((response) => response.data.data);
    },

    async dashboardExport(params) {
        const response = await api.get(`/api/v1/admin/dashboard/export${query(params)}`, {
            responseType: 'blob',
        });
        const disposition = response.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/i);
        const filename = match?.[1] || `cinemoto-report-${Date.now()}.xlsx`;
        const url = window.URL.createObjectURL(response.data);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
    },

    list(path, params) {
        return api.get(`/api/v1/admin/${path}${query(params)}`).then((response) => response.data);
    },

    show(path) {
        return api.get(`/api/v1/admin/${path}`).then((response) => response.data);
    },

    create(path, body) {
        return api.post(`/api/v1/admin/${path}`, body).then((response) => response.data);
    },

    update(path, body) {
        return api.put(`/api/v1/admin/${path}`, body).then((response) => response.data);
    },

    patch(path, body) {
        return api.patch(`/api/v1/admin/${path}`, body).then((response) => response.data);
    },

    post(path, body) {
        return api.post(`/api/v1/admin/${path}`, body).then((response) => response.data);
    },

    remove(path) {
        return api.delete(`/api/v1/admin/${path}`).then((response) => response.data);
    },
};
