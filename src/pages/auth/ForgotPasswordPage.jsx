import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { accountApi } from '../../api/account';
import PrimaryButton from '../../components/ui/PrimaryButton';
import StatusMessage from '../../components/ui/StatusMessage';
import TextField from '../../components/ui/TextField';
import { applyServerErrors } from '../../utils/forms';

export default function ForgotPasswordPage() {
    const [message, setMessage] = useState('');
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: '' } });

    const submit = handleSubmit(async (values) => {
        setMessage('');

        try {
            const result = await accountApi.forgotPassword(values.email);
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
                <h1 className="text-2xl font-semibold tracking-tight text-mist">Reset password</h1>
                <p className="mt-1.5 text-sm text-white/55">
                    Enter your email and we&apos;ll send a reset link if an account exists.
                </p>
            </div>

            {message && <StatusMessage>{message}</StatusMessage>}

            <TextField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required.' })}
            />

            <PrimaryButton disabled={isSubmitting} className="w-full !py-3 focus-visible:ring-offset-navy">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
            </PrimaryButton>

            <p className="text-center text-sm text-white/55">
                <Link to="/login" className="font-semibold text-brand transition hover:text-[#7ec4ff]">Back to log in</Link>
            </p>
        </form>
    );
}
