import { create } from 'zustand';
import { authApi } from '../api/auth';

export const useAuthStore = create((set) => ({
    user: null,
    status: 'loading',
    challenge: false,

    restore: async () => {
        try {
            const user = await authApi.me();
            set({ user, status: 'authenticated', challenge: false });
        } catch {
            set({ user: null, status: 'guest' });
        }
    },

    login: async (payload) => {
        const result = await authApi.login(payload);

        if (result.twoFactor) {
            set({ user: null, status: 'guest', challenge: true });

            return result;
        }

        set({ user: result.user, status: 'authenticated', challenge: false });

        return result;
    },

    confirmTwoFactor: async (code) => {
        const user = await authApi.twoFactor(code);
        set({ user, status: 'authenticated', challenge: false });

        return user;
    },

    logout: async () => {
        await authApi.logout();
        set({ user: null, status: 'guest', challenge: false });
    },

    resendVerification: () => authApi.resendVerification(),

    refresh: async () => {
        const user = await authApi.me();
        set({ user, status: 'authenticated' });

        return user;
    },
}));
