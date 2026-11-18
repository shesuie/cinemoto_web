import { useForm } from 'react-hook-form';
import { MESSAGES } from '../../constants/messages';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PrimaryButton from '../../components/ui/PrimaryButton';
import TextField from '../../components/ui/TextField';
import { useAuthStore } from '../../stores/authStore';
import { destinationAfterAuth, registerPath, resolveReturnPath } from '../../utils/authRedirect';
import { applyServerErrors } from '../../utils/forms';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = resolveReturnPath(location);
    const status = useAuthStore((state) => state.status);
    const user = useAuthStore((state) => state.user);
    const login = useAuthStore((state) => state.login);
    const {
        register,
        handleSubmit,
        setError,
        resetField,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { email: '', password: '', remember: false, company: '' },
    });

    if (status === 'authenticated' && user) {
        return <Navigate to={destinationAfterAuth(user, returnTo)} replace />;
    }

    const submit = handleSubmit(async (values) => {
        try {
            const result = await login(values);

            if (result.twoFactor) {
                navigate('/two-factor', { state: { from: returnTo } });
                return;
            }

            const next = destinationAfterAuth(result.user, returnTo);
            if (result.user?.roles?.includes('customer') && !result.user.verified && returnTo.includes('/book/')) {
                navigate('/verify-email', { state: { from: returnTo } });
                return;
            }

            navigate(next);
        } catch (error) {
            resetField('password');

            if (!applyServerErrors(error, setError)) {
                toast.error(error.message || MESSAGES.signInFailed);
            }
        }
    });

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Welcome back</h1>
                <p className="mt-1.5 text-sm text-white/55">
                    {returnTo.includes('/book/')
                        ? 'Sign in to continue your booking. Your movie, seats, and food stay saved on this device.'
                        : 'Sign in to hold seats and finish checkout. Browse anytime without an account.'}
                </p>
                {new URLSearchParams(location.search).get('verified') === '1' && (
                    <p className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        Email confirmed. Sign in to continue.
                    </p>
                )}
            </div>

            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" tabIndex={-1} autoComplete="off" {...register('company')} />
            </div>

            <TextField
                id="email"
                label="Email"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="you@email.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required.' })}
            />

            <TextField
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                error={errors.password?.message}
                {...register('password', { required: 'Password is required.' })}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/70">
                    <input
                        type="checkbox"
                        className="rounded border-white/20 bg-navy-deep text-brand focus:ring-brand focus:ring-offset-0"
                        {...register('remember')}
                    />
                    Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-brand transition hover:text-[#7ec4ff]">
                    Forgot password?
                </Link>
            </div>

            <PrimaryButton
                disabled={isSubmitting}
                className="w-full !py-3 focus-visible:ring-offset-navy"
            >
                {isSubmitting ? 'Signing in…' : 'Log in'}
            </PrimaryButton>

            <p className="text-center text-sm text-white/55">
                New here?{' '}
                <Link
                    to={registerPath(returnTo)}
                    state={{ from: returnTo }}
                    className="font-semibold text-brand transition hover:text-[#7ec4ff]"
                >
                    Create an account
                </Link>
            </p>
        </form>
    );
}
