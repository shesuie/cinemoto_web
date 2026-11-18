import { mediaUrl } from '../../utils/format';

const FONT_CLASS = {
    script: 'font-script',
    sans: 'font-sans',
    rounded: 'font-rounded',
    serif: 'font-serif-display',
};

function splitCinemaName(name) {
    const match = String(name || '').trim().match(/^(cine)\s*(mo['’]?to)$/i);
    if (!match) {
        return null;
    }

    return {
        lead: match[1].toUpperCase(),
        accent: match[2],
    };
}

function formatAccent(part) {
    const normalized = part.replace(/’/g, "'");
    if (/^mo'?to$/i.test(normalized)) {
        return "MO'TO";
    }

    return normalized.toUpperCase();
}

export default function BrandMark({
    name = "CINEMO'TO",
    font = 'script',
    logoUrl = '/images/film-reel.png',
    showLogo = true,
    size = 'md',
    tone = 'light',
}) {
    const fontClass = FONT_CLASS[font] || FONT_CLASS.script;
    const parts = splitCinemaName(name);
    const logoSrc = mediaUrl(logoUrl) || mediaUrl('/images/film-reel.png');
    const leadColor = tone === 'dark' ? 'text-ink' : 'text-mist';
    const logoSize = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
    const leadClass = size === 'lg'
        ? `${fontClass} text-3xl leading-none ${leadColor}`
        : `${fontClass} text-2xl leading-none ${leadColor} sm:text-[1.65rem]`;
    const accentClass = size === 'lg'
        ? 'text-2xl font-semibold tracking-[0.08em] text-[#c084fc]'
        : 'text-xl font-semibold tracking-[0.08em] text-[#c084fc] sm:text-[1.35rem]';
    const plainClass = size === 'lg'
        ? `${fontClass} text-3xl leading-none ${leadColor}`
        : `${fontClass} text-2xl leading-none ${leadColor}`;

    return (
        <span className="inline-flex items-center gap-3">
            {showLogo && logoSrc ? (
                <img
                    src={logoSrc}
                    alt=""
                    className={logoSize}
                    onError={(event) => {
                        event.currentTarget.style.display = 'none';
                    }}
                />
            ) : null}
            {parts ? (
                <span className="inline-flex items-baseline gap-0.5">
                    <span className={leadClass}>{parts.lead}</span>
                    <span className={accentClass}>{formatAccent(parts.accent)}</span>
                </span>
            ) : (
                <span className={plainClass}>{name}</span>
            )}
        </span>
    );
}
