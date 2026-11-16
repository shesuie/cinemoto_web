import { useMemo, useState } from 'react';

function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);

    return new Date(y, m - 1, d);
}

function monthLabel(year, monthIndex) {
    return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex, 1));
}

function sameMonth(key, year, monthIndex) {
    const date = parseKey(key);

    return date.getFullYear() === year && date.getMonth() === monthIndex;
}

export default function DateCalendar({ availableDates, value, onChange }) {
    const available = useMemo(() => new Set(availableDates || []), [availableDates]);
    const seed = value && available.has(value)
        ? parseKey(value)
        : availableDates?.[0]
            ? parseKey(availableDates[0])
            : new Date();
    const [cursor, setCursor] = useState({ year: seed.getFullYear(), month: seed.getMonth() });

    const cells = useMemo(() => {
        const first = new Date(cursor.year, cursor.month, 1);
        const startPad = first.getDay();
        const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
        const rows = [];

        for (let i = 0; i < startPad; i += 1) {
            rows.push(null);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            rows.push(key);
        }

        while (rows.length % 7 !== 0) {
            rows.push(null);
        }

        return rows;
    }, [cursor]);

    const hasPrev = availableDates?.some((key) => {
        const date = parseKey(key);

        return date < new Date(cursor.year, cursor.month, 1);
    });
    const hasNext = availableDates?.some((key) => {
        const date = parseKey(key);

        return date > new Date(cursor.year, cursor.month + 1, 0);
    });

    const shift = (delta) => {
        const next = new Date(cursor.year, cursor.month + delta, 1);
        setCursor({ year: next.getFullYear(), month: next.getMonth() });
    };

    if (!availableDates?.length) {
        return <p className="cinema-muted">No screening dates are available for this branch.</p>;
    }

    return (
        <div className="rounded-xl border border-white/10 bg-navy-deep/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-mist disabled:opacity-30"
                    disabled={!hasPrev}
                    onClick={() => shift(-1)}
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <p className="text-sm font-semibold text-mist">{monthLabel(cursor.year, cursor.month)}</p>
                <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-mist disabled:opacity-30"
                    disabled={!hasNext}
                    onClick={() => shift(1)}
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((key, index) => {
                    if (!key) {
                        return <span key={`empty-${index}`} className="h-10" />;
                    }

                    const enabled = available.has(key);
                    const selected = value === key;
                    const inMonth = sameMonth(key, cursor.year, cursor.month);

                    return (
                        <button
                            key={key}
                            type="button"
                            disabled={!enabled}
                            onClick={() => onChange(key)}
                            className={[
                                'h-10 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                !inMonth ? 'opacity-0' : '',
                                enabled && selected ? 'bg-brand text-mist shadow-ticket' : '',
                                enabled && !selected ? 'bg-brand/15 text-mist hover:bg-brand/30' : '',
                                !enabled ? 'cursor-not-allowed text-white/20' : '',
                            ].join(' ')}
                        >
                            {Number(key.slice(-2))}
                        </button>
                    );
                })}
            </div>
            <p className="mt-3 text-xs text-white/45">Only dates with scheduled showtimes at this branch can be selected. Admins set those dates under Showtimes.</p>
        </div>
    );
}
