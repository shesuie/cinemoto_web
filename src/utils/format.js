import { DISPLAY_TIMEZONE } from '../constants/domain';

export function pesos(cents) {
    return `₱${((Number(cents) || 0) / 100).toFixed(2)}`;
}

export function manilaDateKey(value) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: DISPLAY_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(value));
}

export function manilaWhen(value) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-PH', {
        timeZone: DISPLAY_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export function manilaTime(value) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-PH', {
        timeZone: DISPLAY_TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export function manilaDateLabel(value) {
    if (!value) {
        return '';
    }

    const key = String(value).length === 10 ? `${value}T12:00:00+08:00` : value;

    return new Intl.DateTimeFormat('en-PH', {
        timeZone: DISPLAY_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(key));
}

export function mediaUrl(path) {
    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `${import.meta.env.VITE_API_URL}${path}`;
}

export function releaseYear(value) {
    if (!value) {
        return '';
    }

    return String(value).slice(0, 4);
}

export function formatDuration(minutes) {
    const total = Number(minutes) || 0;

    if (total <= 0) {
        return '';
    }

    if (total >= 60) {
        const hours = Math.floor(total / 60);
        const rest = total % 60;

        return rest ? `${hours}h ${rest}min` : `${hours}h`;
    }

    return `${total}min`;
}
