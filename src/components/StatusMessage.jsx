export default function StatusMessage({ children, tone = 'info', light = false }) {
    const dark = {
        info: 'border-white/15 bg-white/5 text-mist',
        error: 'border-red-400/40 bg-red-500/10 text-red-100',
        success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
    };
    const onLight = {
        info: 'border-stone-300 bg-stone-50 text-ink',
        error: 'border-red-300 bg-red-50 text-red-800',
        success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    };
    const tones = light ? onLight : dark;

    return <p className={`rounded-lg border px-4 py-3 text-sm ${tones[tone] || tones.info}`}>{children}</p>;
}
