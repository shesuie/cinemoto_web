import { Link, useNavigate } from 'react-router-dom';
import BrandWordmark from '../../components/ui/BrandWordmark';
import { useAuthStore } from '../../stores/authStore';

export default function HomePage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const signOut = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-mist">
            <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
                <BrandWordmark />
                {user ? (
                    <button type="button" className="rounded-md text-sm text-gray-600 underline" onClick={signOut}>
                        Log out
                    </button>
                ) : (
                    <Link to="/login" className="rounded-md text-sm font-semibold text-brand">
                        Log in
                    </Link>
                )}
            </header>
            <main className="mx-auto max-w-3xl px-4 py-10">
                <h1 className="text-2xl font-semibold text-ink">CINEMO&apos;TO</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Sign in to hold seats and order food. Movie browsing uses the same published catalog as the cinema site.
                </p>
                {user ? (
                    <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-ink">Signed in</h2>
                        <dl className="mt-4 space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between gap-4"><dt>Name</dt><dd>{user.name}</dd></div>
                            <div className="flex justify-between gap-4"><dt>Email</dt><dd>{user.email}</dd></div>
                            <div className="flex justify-between gap-4"><dt>Roles</dt><dd>{user.roles?.join(', ') || 'None'}</dd></div>
                            <div className="flex justify-between gap-4"><dt>Email verified</dt><dd>{user.verified ? 'Yes' : 'No'}</dd></div>
                        </dl>
                        {!user.verified && (
                            <p className="mt-4 text-sm text-gray-600">
                                Confirm your email before holding seats.
                                {' '}
                                <Link to="/verify-email" className="font-semibold text-brand">Resend the verification email</Link>
                            </p>
                        )}
                    </section>
                ) : (
                    <Link to="/login" className="mt-6 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
                        Log in
                    </Link>
                )}
            </main>
        </div>
    );
}
