import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteApi } from '../api/site';

const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Blog', to: '/blog' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About', to: '/about' },
    { label: 'Faq', to: '/faq' },
    { label: 'Contact', to: '/contact' },
];

function IconCircle({ children }) {
    return (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a3142] text-mist">
            {children}
        </span>
    );
}

function MapPinIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="2.2" />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M22 16.9v2.2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2.2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2.1z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 7 9-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.9-6.4L5.4 22H2.6l7.1-8.1L2 2h6.3l4.4 5.8L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z" />
        </svg>
    );
}

function TikTokIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.5 3c.5 2.3 1.9 3.9 4.2 4.3v2.7c-1.5-.1-2.9-.6-4.2-1.5v6.3c0 3.5-2.8 6.3-6.3 6.3S3.9 18.3 3.9 14.8 6.7 8.5 10.2 8.5c.3 0 .7 0 1 .1v2.9c-.3-.1-.7-.2-1-.2-1.9 0-3.4 1.5-3.4 3.5s1.5 3.5 3.4 3.5 3.4-1.5 3.4-3.5V3h2.9z" />
        </svg>
    );
}

const socialIcons = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    x: XIcon,
    tiktok: TikTokIcon,
};

export default function CustomerFooter() {
    const [contact, setContact] = useState(null);
    const [socials, setSocials] = useState([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;
        siteApi.content()
            .then((data) => {
                if (!active) return;
                setContact(data.contact || null);
                setSocials(data.social || []);
                setReady(true);
            })
            .catch(() => {
                if (active) {
                    setContact(null);
                    setSocials([]);
                    setReady(true);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <footer id="contact" className="border-t border-white/10 bg-[#0b0f1a]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:gap-8">
                <div>
                    <Link to="/" className="inline-flex items-baseline gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <span className="font-script text-3xl leading-none text-mist">CINE</span>
                        <span className="text-2xl font-semibold tracking-[0.08em] text-[#c084fc]">MO&apos;TO</span>
                    </Link>
                    <nav className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-white/80" aria-label="Footer">
                        {navLinks.map((link, index) => (
                            <span key={link.label} className="inline-flex items-center gap-2">
                                {index > 0 && <span className="text-white/25" aria-hidden>|</span>}
                                <Link to={link.to} className="transition hover:text-[#c084fc]">
                                    {link.label}
                                </Link>
                            </span>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4 text-sm text-white/75">
                    {!ready && <p className="text-white/40">Loading contact…</p>}
                    {ready && contact && (
                        <>
                            {contact.address && (
                                <p className="flex items-start gap-3">
                                    <IconCircle><MapPinIcon /></IconCircle>
                                    <span className="pt-2">{contact.address}</span>
                                </p>
                            )}
                            {contact.phone && (
                                <p className="flex items-start gap-3">
                                    <IconCircle><PhoneIcon /></IconCircle>
                                    <a href={`tel:${contact.phone}`} className="pt-2 transition hover:text-mist">{contact.phone}</a>
                                </p>
                            )}
                            {contact.email && (
                                <p className="flex items-start gap-3">
                                    <IconCircle><MailIcon /></IconCircle>
                                    <a href={`mailto:${contact.email}`} className="pt-2 text-[#c084fc] transition hover:text-[#d8b4fe]">
                                        {contact.email}
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div id="about">
                    <h2 className="text-lg font-semibold text-mist">About Cinemo&apos;to</h2>
                    {contact?.about && (
                        <p className="mt-3 text-sm leading-relaxed text-white/60">{contact.about}</p>
                    )}
                    {socials.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-3">
                            {socials.map(({ id, label, url }) => {
                                const Icon = socialIcons[id] || FacebookIcon;

                                return (
                                    <a
                                        key={id}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={label}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2a3142] text-mist transition hover:-translate-y-0.5 hover:bg-[#3a4358] hover:text-[#c084fc]"
                                    >
                                        <Icon />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="border-t border-white/5">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-white/35">
                    <p>© {new Date().getFullYear()} CINEMO&apos;TO. All rights reserved.</p>
                    <Link to="/terms" className="transition hover:text-[#c084fc]">Terms and conditions</Link>
                </div>
            </div>
        </footer>
    );
}
