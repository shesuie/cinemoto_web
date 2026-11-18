import { useEffect, useState } from 'react';
import { siteApi } from '../api/site';

const FALLBACK = {
    name: "CINEMO'TO",
    font: 'script',
    logo_url: '/images/film-reel.png',
};

export default function useSiteBranding() {
    const [branding, setBranding] = useState(FALLBACK);

    useEffect(() => {
        let active = true;
        siteApi.content()
            .then((data) => {
                if (!active) return;
                setBranding({
                    ...FALLBACK,
                    ...(data.branding || {}),
                });
            })
            .catch(() => {
                if (active) setBranding(FALLBACK);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        document.title = branding.name || FALLBACK.name;

        const href = branding.logo_url?.startsWith('http')
            ? branding.logo_url
            : branding.logo_url === '/images/film-reel.png'
                ? '/images/film-reel.png'
                : `${import.meta.env.VITE_API_URL || ''}${branding.logo_url || '/images/film-reel.png'}`;

        let link = document.querySelector("link[rel='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = href;
    }, [branding.name, branding.logo_url]);

    return branding;
}
