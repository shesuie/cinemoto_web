import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { accountApi } from '../api/account';
import PrimaryButton from '../components/PrimaryButton';
import StatusMessage from '../components/StatusMessage';
import TextField from '../components/TextField';
import { applyServerErrors } from '../utils/forms';

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const [message, setMessage] = useState('');
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            email: params.get('email') || '',
            password: '',
            password_confirmation: '',
        },
    });

    const submit = handleSubmit(async (values) => {
        setMessage('');

        try {
            const result = await accountApi.resetPassword({
                ...values,
                token: params.get('token') || '',
            });
            setMessage(result.message);
        } catch (error) {
            if (!applyServerErrors(error, setError)) {
                setMessage(error.message);
            }
        }
    });

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Choose a new password</h1>
                <p className="mt-1.5 text-sm text-white/55">Pick a strong password, then sign in again.</p>
            </div>

            {message && <StatusMessage>{message}</StatusMessage>}

            <TextField id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email', { required: 'Email is required.' })} />
            <TextField id="password" label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password', { required: 'Password is required.' })} />
            <TextField id="password_confirmation" label="Confirm password" type="password" autoComplete="new-password" error={errors.password_confirmation?.message} {...register('password_confirmation', { required: 'Confirm the password.' })} />

            <PrimaryButton disabled={isSubmitting} className="w-full !py-3 focus-visible:ring-offset-navy">
                {isSubmitting ? 'Saving…' : 'Reset password'}
            </PrimaryButton>

            <p className="text-center text-sm text-white/55">
                <Link to="/login" className="font-semibold text-brand transition hover:text-[#7ec4ff]">Back to log in</Link>
            </p>
        </form>
    );
}
