import api from './client';

let mePending = null;

export const authApi = {
    async login(payload) {
        try {
            const response = await api.post('/api/v1/auth/login', payload);
            mePending = null;

            return { user: response.data.data };
        } catch (error) {
            if (error.status === 409 && error.errorCode === 'TWO_FACTOR_REQUIRED') {
                return { twoFactor: true };
            }

            throw error;
        }
    },

    async twoFactor(code) {
        const response = await api.post('/api/v1/auth/two-factor', { code });
        mePending = null;

        return response.data.data;
    },

    async me() {
        if (mePending) {
            return mePending;
        }

        mePending = api.get('/api/v1/auth/me')
            .then((response) => response.data.data)
            .finally(() => {
                mePending = null;
            });

        return mePending;
    },

    async logout() {
        mePending = null;
        await api.post('/api/v1/auth/logout');
    },

    async resendVerification() {
        const response = await api.post('/api/v1/auth/email/verification-notification');

        return response.data;
    },
};
