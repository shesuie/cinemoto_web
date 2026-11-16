import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { siteApi } from '../api/site';
import StatusMessage from '../components/StatusMessage';
import CustomerLayout from '../layouts/CustomerLayout';

const SLUGS = ['blog', 'pricing', 'about', 'faq', 'contact', 'terms'];

export default function SitePage() {
    const slug = useLocation().pathname.replace(/^\//, '');
    const [page, setPage] = useState(null);
    const [contact, setContact] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!SLUGS.includes(slug)) {
            return undefined;
        }

        let active = true;
        setState('loading');
        siteApi.content()
            .then((data) => {
                if (!active) return;
                setPage(data.pages?.[slug] || null);
                setContact(data.contact || null);
                setState('ready');
            })
            .catch((error) => {
                if (!active) return;
                setMessage(error.message || 'This page could not be loaded.');
                setState('error');
            });

        return () => {
            active = false;
        };
    }, [slug]);

    if (!SLUGS.includes(slug)) {
        return <Navigate to="/" replace />;
    }

    return (
        <CustomerLayout>
            {state === 'loading' && <p className="cinema-muted">Loading…</p>}
            {state === 'error' && <StatusMessage tone="error">{message}</StatusMessage>}
            {state === 'ready' && page && (
                <article className="cinema-panel mx-auto max-w-3xl">
                    <p className="text-sm text-white/45">
                        <Link to="/" className="transition hover:text-brand">Home</Link>
                        <span className="mx-2 text-white/25">/</span>
                        <span className="text-mist">{page.title}</span>
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-mist sm:text-4xl">{page.title}</h1>
                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/75 sm:text-base">
                        {String(page.body || '').split(/\n{2,}/).map((paragraph, index) => (
                            <p key={`${slug}-${index}`} className="whitespace-pre-line">{paragraph}</p>
                        ))}
                    </div>
                    {slug === 'contact' && contact && (
                        <div className="mt-8 space-y-2 rounded-xl border border-white/10 bg-navy-deep/50 p-4 text-sm text-white/80">
                            <p><span className="text-white/45">Address:</span> {contact.address}</p>
                            <p><span className="text-white/45">Phone:</span> <a className="text-brand hover:underline" href={`tel:${contact.phone}`}>{contact.phone}</a></p>
                            <p><span className="text-white/45">Email:</span> <a className="text-[#c084fc] hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>
                        </div>
                    )}
                </article>
            )}
        </CustomerLayout>
    );
}
