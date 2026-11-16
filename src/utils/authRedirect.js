import { homeFor } from './home';

/** Only allow same-origin relative paths (blocks open redirects). */
export function safeReturnPath(value, fallback = '/') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const path = value.trim();
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
        return fallback;
    }

    return path;
}

export function resolveReturnPath(location, fallback = '/') {
    const fromState = location?.state?.from;
    const fromQuery = new URLSearchParams(location?.search || '').get('next');

    return safeReturnPath(fromState || fromQuery || '', fallback);
}

export function loginPath(returnTo) {
    const safe = safeReturnPath(returnTo, '');
    if (!safe || safe === '/') {
        return '/login';
    }

    return `/login?next=${encodeURIComponent(safe)}`;
}

export function registerPath(returnTo) {
    const safe = safeReturnPath(returnTo, '');
    if (!safe || safe === '/') {
        return '/register';
    }

    return `/register?next=${encodeURIComponent(safe)}`;
}

export function destinationAfterAuth(user, returnTo) {
    const safe = safeReturnPath(returnTo, '');
    if (safe && safe !== '/' && user?.roles?.includes('customer')) {
        return safe;
    }

    return homeFor(user);
}
