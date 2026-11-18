export function StarIcon({ className = 'h-3.5 w-3.5' }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z" />
        </svg>
    );
}

export function ClockIcon({ className = 'h-3.5 w-3.5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
    );
}

export function PlayIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5L8 5.5z" />
        </svg>
    );
}
