import BrandMark from './BrandMark';
import useSiteBranding from '../../hooks/useSiteBranding';

export default function BrandWordmark({ light = false }) {
    const branding = useSiteBranding();

    return (
        <BrandMark
            name={branding.name}
            font={branding.font}
            logoUrl={branding.logo_url}
            showLogo={false}
            tone={light ? 'light' : 'dark'}
        />
    );
}
