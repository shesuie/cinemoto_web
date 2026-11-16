import { Link, useLocation, useNavigate } from 'react-router-dom';
import CustomerFooter from '../components/CustomerFooter';
import HeaderMovieSearch from '../components/HeaderMovieSearch';
import { useAuthStore } from '../stores/authStore';
import { loginPath } from '../utils/authRedirect';
import { mediaUrl } from '../utils/format';

export default function CustomerLayout({ children, flush = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const customer = user?.roles?.includes('customer');
    const signInTo = loginPath(`${location.pathname}${location.search}`);

    const signOut = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen flex-col bg-navy text-mist">
            <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
                    <Link to="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <img
                            src={mediaUrl('/images/film-reel.png')}
                            alt=""
                            className="h-9 w-9"
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                            }}
                        />
                        <span className="text-lg font-semibold tracking-[0.14em] sm:text-xl">
                            CINE<span className="text-brand">MO&apos;TO</span>
                        </span>
                    </Link>
                    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/75">
                        <Link to="/" className="transition hover:text-brand">Movies</Link>
                        {customer && <Link to="/tickets" className="transition hover:text-brand">My Tickets</Link>}
                        {user?.staff && <Link to="/admin/dashboard" className="transition hover:text-brand">Admin</Link>}
                        {user && <Link to="/account" className="transition hover:text-brand">Account</Link>}
                    </nav>
                    <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                        <HeaderMovieSearch />
                        {user ? (
                            <button type="button" className="cinema-button !py-2" onClick={signOut}>
                                Sign out
                            </button>
                        ) : (
                            <Link
                                to={signInTo}
                                state={{ from: `${location.pathname}${location.search}` }}
                                className="cinema-button !py-2"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <main className={flush ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8'}>
                {children}
            </main>
            <CustomerFooter />
        </div>
    );
}
