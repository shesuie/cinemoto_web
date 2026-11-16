import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { resolveReturnPath } from '../utils/authRedirect';

export default function VerifyEmailPage() {
    const location = useLocation();
    const returnTo = resolveReturnPath(location, '/');
    const user = useAuthStore((state) => state.user);
    const resendVerification = useAuthStore((state) => state.resendVerification);
    const refresh = useAuthStore((state) => state.refresh);
    const logout = useAuthStore((state) => state.logout);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSending(true);

        try {
            const response = await resendVerification();
            setSent(true);
            await refresh();
            toast.success(response.message || 'Verification link sent.');
        } catch (error) {
            toast.error(error.message || 'The verification email could not be sent.');
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Email verification</h1>
                <p className="mt-1.5 text-sm text-white/55">
                    Confirm your email before holding seats or placing a food order. You can keep browsing meanwhile.
                </p>
            </div>

            {user?.verified && (
                <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    This email address is already verified.
                </p>
            )}
            {sent && !user?.verified && (
                <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    A new verification link has been sent to the email address on this account.
                </p>
            )}

            <PrimaryButton disabled={sending || user?.verified} className="w-full !py-3 focus-visible:ring-offset-navy">
                {sending ? 'Sending…' : 'Resend verification email'}
            </PrimaryButton>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                {user?.verified && returnTo !== '/' ? (
                    <Link to={returnTo} className="font-semibold text-brand transition hover:text-[#7ec4ff]">
                        Continue booking →
                    </Link>
                ) : (
                    <Link to="/" className="text-brand transition hover:text-[#7ec4ff]">Back home</Link>
                )}
                <button
                    type="button"
                    className="text-white/55 transition hover:text-mist"
                    onClick={() => logout()}
                >
                    Log out
                </button>
            </div>
        </form>
    );
}
