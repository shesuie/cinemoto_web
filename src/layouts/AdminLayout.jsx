import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { useAuthStore } from '../stores/authStore';
import { mediaUrl } from '../utils/format';

const icons = {
    '/admin/dashboard': 'M3 12l9-8 9 8v8H3z',
    '/admin/cinemas': 'M4 20V6l8-3 8 3v14',
    '/admin/screens': 'M3 5h14v10H3z',
    '/admin/seats': 'M6 4h8v6H6zM4 18h12',
    '/admin/movies': 'M4 4h16v16H4z',
    '/admin/genres': 'M4 7h16M4 12h16M4 17h10',
    '/admin/showtimes': 'M4 6h16v14H4zM8 3v4M16 3v4',
    '/admin/food-categories': 'M4 6h16M4 12h16M4 18h16',
    '/admin/food': 'M5 8h14l-1 10H6z',
    '/admin/bookings': 'M5 4h14v16H5z',
    '/admin/tickets/check': 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16 16h2v2',
    '/admin/orders': 'M5 6h14l-1 12H6z',
    '/admin/customers': 'M8 8a4 4 0 118 0 4 4 0 01-8 0zM4 19c1.5-3 4-4 8-4s6.5 1 8 4',
    '/admin/users': 'M8 8a4 4 0 118 0 4 4 0 01-8 0zM4 19c1.5-3 4-4 8-4s6.5 1 8 4',
    '/admin/roles': 'M12 3l7 3v6c0 5-3 7-7 9-4-2-7-4-7-9V6z',
    '/account': 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-3 4-4 8-4s6.5 1 8 4',
    '/admin/settings': 'M12 8a4 4 0 100 8 4 4 0 000-8z',
};

function isActive(href, path) {
    if (path === href) {
        return true;
    }

    const prefixes = ['/admin/movies', '/admin/food', '/admin/showtimes', '/admin/bookings', '/admin/orders', '/admin/users', '/admin/customers', '/admin/roles', '/admin/cinemas', '/admin/screens', '/admin/seats'];

    return prefixes.includes(href) && path.startsWith(`${href}/`);
}

function Icon({ href }) {
    return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={icons[href] || 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
    );
}

export default function AdminLayout({ header, children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const path = location.pathname;
    const [menuOpen, setMenuOpen] = useState(false);
    const [navigation, setNavigation] = useState([]);
    const [navError, setNavError] = useState('');

    useEffect(() => {
        let active = true;
        adminApi.navigation()
            .then((groups) => {
                if (active) {
                    setNavigation(groups);
                }
            })
            .catch((error) => {
                if (active) {
                    setNavError(error.message || 'The menu could not be loaded.');
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const signOut = async () => {
        await logout();
        navigate('/login');
    };

    const sidebar = (
        <div className="flex h-full min-h-0 flex-col">
            <Link to="/admin/dashboard" className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-5" onClick={() => setMenuOpen(false)}>
                <img src={mediaUrl('/images/film-reel.png')} alt="" className="h-9 w-9" />
                <span>
                    <span className="block text-sm font-semibold tracking-[0.18em] text-white">CINE<span className="text-[#c084fc]">MO&apos;TO</span></span>
                    <span className="text-xs text-[#9aa6bd]">Cinema management</span>
                </span>
            </Link>
            <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
                {navError && <p className="px-3 text-xs text-red-200">{navError}</p>}
                {navigation.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b97ad]">{group.label}</p>
                        <div className="mt-1 space-y-0.5">
                            {group.items.map((item) => {
                                const active = isActive(item.href, path);

                                return (
                                    <Link
                                        key={`${group.label}-${item.label}`}
                                        to={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition duration-200 ${active ? 'bg-[#304463] text-white shadow-sm' : 'text-[#d5dbe6] hover:translate-x-0.5 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <Icon href={item.href} />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="shrink-0 border-t border-white/10 px-3 py-3">
                <button type="button" className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-[#d5dbe6] transition duration-200 hover:bg-white/10 hover:text-white" onClick={signOut}>
                    Log Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#eef2f7] font-sans text-gray-900">
            <aside className="hidden h-screen w-72 shrink-0 bg-[#1A2130] lg:block">{sidebar}</aside>
            {menuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                    <aside className="relative h-full w-72 max-w-[85vw] bg-[#1A2130]">{sidebar}</aside>
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" className="rounded-lg p-2 text-[#1A2130] hover:bg-gray-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z" /></svg>
                        </button>
                        <div className="truncate text-lg font-semibold text-[#1A2130]">{header}</div>
                    </div>
                    <Link to="/account" className="max-w-[14rem] truncate text-[15px] font-medium text-[#1A2130]">{user?.name}</Link>
                </header>
                <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
