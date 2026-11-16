import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { useAuthStore } from '../stores/authStore';
import { destinationAfterAuth, loginPath, resolveReturnPath } from '../utils/authRedirect';
import { applyServerErrors } from '../utils/forms';

export default function TwoFactorPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = resolveReturnPath(location);
    const status = useAuthStore((state) => state.status);
    const user = useAuthStore((state) => state.user);
    const confirmTwoFactor = useAuthStore((state) => state.confirmTwoFactor);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { code: '' } });

    if (status === 'authenticated' && user) {
        return <Navigate to={destinationAfterAuth(user, returnTo)} replace />;
    }

    const submit = handleSubmit(async (values) => {
        try {
            const signedIn = await confirmTwoFactor(values.code);
            navigate(destinationAfterAuth(signedIn, returnTo));
        } catch (error) {
            if (!applyServerErrors(error, setError)) {
                toast.error(error.message || 'That code could not be checked');
            }
        }
    });

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Authenticator</h1>
                <p className="mt-1.5 text-sm text-white/55">
                    Enter the 6-digit code from your authenticator app, or one recovery code.
                </p>
            </div>

            <TextField
                id="code"
                label="Code"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                error={errors.code?.message}
                {...register('code', { required: 'The code is required.' })}
            />

            <PrimaryButton disabled={isSubmitting} className="w-full !py-3 focus-visible:ring-offset-navy">
                {isSubmitting ? 'Checking…' : 'Continue'}
            </PrimaryButton>

            <p className="text-center text-sm text-white/55">
                <Link
                    to={loginPath(returnTo)}
                    state={{ from: returnTo }}
                    className="font-semibold text-brand transition hover:text-[#7ec4ff]"
                >
                    Back to log in
                </Link>
            </p>
        </form>
    );
}
