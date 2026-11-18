import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { accountApi } from '../../api/account';
import PrimaryButton from '../../components/ui/PrimaryButton';
import StatusMessage from '../../components/ui/StatusMessage';
import TextField from '../../components/ui/TextField';
import { loginPath, resolveReturnPath } from '../../utils/authRedirect';
import { applyServerErrors } from '../../utils/forms';

export default function RegisterPage() {
    const location = useLocation();
    const returnTo = resolveReturnPath(location);
    const [message, setMessage] = useState('');
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { name: '', email: '', password: '', password_confirmation: '', company: '' },
    });

    const submit = handleSubmit(async (values) => {
        setMessage('');

        try {
            const result = await accountApi.register(values);
            setMessage(result.message || 'Account created. Confirm your email, then log in to continue your booking.');
        } catch (error) {
            if (!applyServerErrors(error, setError)) {
                setMessage(error.message);
            }
        }
    });

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Create an account</h1>
                <p className="mt-1.5 text-sm text-white/55">
                    {returnTo.includes('/book/')
                        ? 'Your seats and food stay saved. After you confirm your email and log in, we will bring you back to review.'
                        : 'Registration does not sign you in. Confirm your email, then log in.'}
                </p>
            </div>

            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <input tabIndex={-1} autoComplete="off" {...register('company')} />
            </div>

            {message && (
                <div className="space-y-3">
                    <StatusMessage>{message}</StatusMessage>
                    <Link
                        to={loginPath(returnTo)}
                        state={{ from: returnTo }}
                        className="inline-flex text-sm font-semibold text-brand transition hover:text-[#7ec4ff]"
                    >
                        Continue to log in →
                    </Link>
                </div>
            )}

            <TextField id="name" label="Name" autoComplete="name" placeholder="Your name" error={errors.name?.message} {...register('name', { required: 'Name is required.' })} />
            <TextField id="email" label="Email" type="email" autoComplete="email" placeholder="you@email.com" error={errors.email?.message} {...register('email', { required: 'Email is required.' })} />
            <TextField id="password" label="Password" type="password" autoComplete="new-password" placeholder="Create a password" error={errors.password?.message} {...register('password', { required: 'Password is required.' })} />
            <TextField id="password_confirmation" label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat password" error={errors.password_confirmation?.message} {...register('password_confirmation', { required: 'Confirm the password.' })} />

            <PrimaryButton disabled={isSubmitting} className="w-full !py-3 focus-visible:ring-offset-navy">
                {isSubmitting ? 'Creating…' : 'Register'}
            </PrimaryButton>

            <p className="text-center text-sm text-white/55">
                Already have an account?{' '}
                <Link
                    to={loginPath(returnTo)}
                    state={{ from: returnTo }}
                    className="font-semibold text-brand transition hover:text-[#7ec4ff]"
                >
                    Log in
                </Link>
            </p>
        </form>
    );
}
