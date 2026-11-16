import { Link, Outlet } from 'react-router-dom';
import { mediaUrl } from '../utils/format';

export default function GuestLayout() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy px-4 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(63,162,246,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(192,132,252,0.12),_transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

            <div className="relative z-10 w-full max-w-md">
                <Link
                    to="/"
                    className="mx-auto flex w-fit items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                    <img
                        src={mediaUrl('/images/film-reel.png')}
                        alt=""
                        className="h-10 w-10"
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="text-xl font-semibold tracking-[0.14em] text-mist">
                        CINE<span className="text-brand">MO&apos;TO</span>
                    </span>
                </Link>

                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-navy-mid/50 px-6 py-7 shadow-cinema backdrop-blur-md sm:px-8">
                    <Outlet />
                </div>

                <p className="mt-5 text-center text-xs text-white/40">
                    <Link to="/" className="transition hover:text-brand">Browse movies without signing in</Link>
                </p>
            </div>
        </div>
    );
}
