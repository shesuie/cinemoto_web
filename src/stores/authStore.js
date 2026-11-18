import { create } from 'zustand';
import { adminApi } from '../api/admin';
import { authApi } from '../api/auth';
import { siteApi } from '../api/site';

let restorePromise = null;

export const useAuthStore = create((set, get) => ({
    user: null,
    status: 'loading',
    challenge: false,

    restore: async () => {
        if (get().status !== 'loading' && get().user) {
            return get().user;
        }

        if (restorePromise) {
            return restorePromise;
        }

        restorePromise = (async () => {
            try {
                const user = await Promise.race([
                    authApi.me(),
                    new Promise((_, reject) => {
                        window.setTimeout(() => reject(new Error('Session check timed out.')), 8000);
                    }),
                ]);
                set({ user, status: 'authenticated', challenge: false });

                return user;
            } catch {
                set({ user: null, status: 'guest', challenge: false });

                return null;
            } finally {
                restorePromise = null;
            }
        })();

        return restorePromise;
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
        adminApi.clearNavigation();
        siteApi.clear();
        set({ user: null, status: 'guest', challenge: false });
    },

    resendVerification: () => authApi.resendVerification(),

    refresh: async () => {
        const user = await authApi.me();
        set({ user, status: 'authenticated' });

        return user;
    },
}));
