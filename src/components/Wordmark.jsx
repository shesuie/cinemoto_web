export default function Wordmark({ light = false }) {
    return (
        <span className={`text-sm font-semibold tracking-[0.18em] ${light ? 'text-white' : 'text-ink'}`}>
            CINE<span className="text-[#c084fc]">MO&apos;TO</span>
        </span>
    );
}
