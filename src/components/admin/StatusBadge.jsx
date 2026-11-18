const TONES = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-red-50 text-red-800 ring-red-200',
    expired: 'bg-slate-100 text-slate-700 ring-slate-200',
    unpaid: 'bg-amber-50 text-amber-800 ring-amber-200',
    paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    scheduled: 'bg-sky-50 text-sky-800 ring-sky-200',
    now_showing: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    coming_soon: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    ended: 'bg-slate-100 text-slate-700 ring-slate-200',
    published: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    hidden: 'bg-slate-100 text-slate-700 ring-slate-200',
    available: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    not_available: 'bg-red-50 text-red-800 ring-red-200',
    open: 'bg-sky-50 text-sky-800 ring-sky-200',
    test_succeeded: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    succeeded: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    failed: 'bg-red-50 text-red-800 ring-red-200',
};

const LABELS = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    unpaid: 'Unpaid',
    paid: 'Paid',
    scheduled: 'Scheduled',
    now_showing: 'Now showing',
    coming_soon: 'Coming soon',
    ended: 'Ended',
    published: 'Published',
    hidden: 'Hidden',
    available: 'Available',
    not_available: 'Not available',
    open: 'Open',
    test_succeeded: 'Test succeeded',
    succeeded: 'Succeeded',
    failed: 'Failed',
};

function normalize(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

export default function StatusBadge({ value, label }) {
    const key = normalize(value);
    const tone = TONES[key] || 'bg-slate-100 text-slate-700 ring-slate-200';
    const text = label || LABELS[key] || String(value || '—');

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${tone}`}>
            {text}
        </span>
    );
}
