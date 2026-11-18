import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../components/ui/BrandMark';
import CustomerFooter from '../components/ui/CustomerFooter';
import MovieSearchBar from '../components/catalog/MovieSearchBar';
import useSiteBranding from '../hooks/useSiteBranding';
import { useAuthStore } from '../stores/authStore';
import { loginPath } from '../utils/authRedirect';

export default function CustomerLayout({ children, flush = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const branding = useSiteBranding();
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
                <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-3 px-4 py-4">
                    <Link to="/" className="justify-self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <BrandMark
                            name={branding.name}
                            font={branding.font}
                            logoUrl={branding.logo_url}
                        />
                    </Link>
                    <nav className="flex flex-wrap items-center justify-center gap-4 justify-self-center text-sm font-medium text-white/75">
                        <Link to="/" className="transition hover:text-brand">Movies</Link>
                        {customer && <Link to="/tickets" className="transition hover:text-brand">My Tickets</Link>}
                        {user?.staff && <Link to="/admin/dashboard" className="transition hover:text-brand">Admin</Link>}
                        {user && <Link to="/account" className="transition hover:text-brand">Account</Link>}
                    </nav>
                    <div className="flex flex-wrap items-center justify-end gap-3 justify-self-end">
                        <MovieSearchBar />
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
