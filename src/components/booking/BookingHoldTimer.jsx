import { useEffect, useState } from 'react';

function formatRemaining(expiresAt, now) {
    if (!expiresAt) {
        return null;
    }

    const remaining = new Date(expiresAt).getTime() - now;

    if (remaining <= 0) {
        return { label: 'Hold expired', urgent: true, expired: true };
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return {
        label: `${minutes}:${String(seconds).padStart(2, '0')}`,
        urgent: remaining < 120000,
        expired: false,
    };
}

export default function BookingHoldTimer({ expiresAt, holdMinutes = null, preview = false }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (preview || !expiresAt) {
            return undefined;
        }

        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, [expiresAt, preview]);

    if (preview) {
        const holdLabel = holdMinutes
            ? <span className="font-semibold text-mist">{holdMinutes}:00</span>
            : <span className="font-semibold text-mist">the configured hold time</span>;

        return (
            <div className="rounded-xl border border-mango-500/40 bg-mango-500/10 px-4 py-3 text-sm text-mist">
                <p className="font-semibold text-mango-400">Seat hold timer</p>
                <p className="mt-1 cinema-muted">
                    After you confirm on Review, selected seats are held for {holdLabel} while you pay.
                </p>
            </div>
        );
    }

    const status = formatRemaining(expiresAt, now);

    if (!status) {
        return null;
    }

    return (
        <div className={`rounded-xl border px-4 py-3 text-sm ${status.urgent ? 'border-red-400/50 bg-red-500/10 text-red-100' : 'border-mango-500/40 bg-mango-500/10 text-mist'}`}>
            <p className="font-semibold">{status.expired ? 'Hold expired' : 'Seat hold remaining'}</p>
            <p className={`mt-1 font-mono text-2xl font-semibold ${status.urgent ? 'text-red-200' : 'text-mango-400'}`}>
                {status.expired ? '0:00' : status.label}
            </p>
            {!status.expired && <p className="mt-1 cinema-muted">Finish payment before the timer ends or seats are released.</p>}
        </div>
    );
}
