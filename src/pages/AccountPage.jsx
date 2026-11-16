import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { accountApi } from '../api/account';
import StatusMessage from '../components/StatusMessage';
import CustomerLayout from '../layouts/CustomerLayout';
import { useAuthStore } from '../stores/authStore';
import { applyServerErrors } from '../utils/forms';

export default function AccountPage() {
    const navigate = useNavigate();
    const refresh = useAuthStore((state) => state.refresh);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [notice, setNotice] = useState('');
    const profileForm = useForm({ defaultValues: { name: '', email: '', phone: '' } });
    const passwordForm = useForm({ defaultValues: { current_password: '', password: '', password_confirmation: '' } });

    useEffect(() => {
        accountApi.show()
            .then((account) => {
                profileForm.reset({
                    name: account.name || '',
                    email: account.email || '',
                    phone: account.phone || '',
                });
                setState('ready');
            })
            .catch((error) => {
                if (error.status === 401) {
                    navigate('/login');
                    return;
                }
                setMessage(error.message);
                setState('error');
            });
    }, [navigate]);

    const saveProfile = profileForm.handleSubmit(async (values) => {
        setNotice('');

        try {
            const result = await accountApi.update({
                ...values,
                phone: values.phone || null,
            });
            await refresh();
            setNotice(result.message);
        } catch (error) {
            if (!applyServerErrors(error, profileForm.setError)) {
                setNotice(error.message);
            }
        }
    });

    const savePassword = passwordForm.handleSubmit(async (values) => {
        setNotice('');

        try {
            const result = await accountApi.updatePassword(values);
            passwordForm.reset();
            setNotice(result.message);
        } catch (error) {
            if (!applyServerErrors(error, passwordForm.setError)) {
                setNotice(error.message);
            }
        }
    });

    return (
        <CustomerLayout>
            <h1 className="cinema-section-title">Account</h1>
            {state === 'loading' && <p className="mt-6 cinema-muted">Loading account…</p>}
            {state === 'error' && <div className="mt-6"><StatusMessage tone="error">{message}</StatusMessage></div>}
            {state === 'ready' && (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <form className="cinema-panel" onSubmit={saveProfile}>
                        <h2 className="text-xl font-semibold text-mist">Profile</h2>
                        {notice && <div className="mt-4"><StatusMessage>{notice}</StatusMessage></div>}
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            Name
                            <input className="cinema-field mt-1" {...profileForm.register('name', { required: 'Name is required.' })} />
                        </label>
                        {profileForm.formState.errors.name && <p className="mt-1 text-sm text-red-200">{profileForm.formState.errors.name.message}</p>}
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            Email
                            <input type="email" className="cinema-field mt-1" {...profileForm.register('email', { required: 'Email is required.' })} />
                        </label>
                        {profileForm.formState.errors.email && <p className="mt-1 text-sm text-red-200">{profileForm.formState.errors.email.message}</p>}
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            Phone
                            <input className="cinema-field mt-1" {...profileForm.register('phone')} />
                        </label>
                        {profileForm.formState.errors.phone && <p className="mt-1 text-sm text-red-200">{profileForm.formState.errors.phone.message}</p>}
                        <button type="submit" className="cinema-button mt-5" disabled={profileForm.formState.isSubmitting}>Save profile</button>
                    </form>
                    <form className="cinema-panel" onSubmit={savePassword}>
                        <h2 className="text-xl font-semibold text-mist">Password</h2>
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            Current password
                            <input type="password" autoComplete="current-password" className="cinema-field mt-1" {...passwordForm.register('current_password', { required: 'Current password is required.' })} />
                        </label>
                        {passwordForm.formState.errors.current_password && <p className="mt-1 text-sm text-red-200">{passwordForm.formState.errors.current_password.message}</p>}
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            New password
                            <input type="password" autoComplete="new-password" className="cinema-field mt-1" {...passwordForm.register('password', { required: 'A new password is required.' })} />
                        </label>
                        {passwordForm.formState.errors.password && <p className="mt-1 text-sm text-red-200">{passwordForm.formState.errors.password.message}</p>}
                        <label className="mt-4 block text-sm font-semibold text-white/80">
                            Confirm new password
                            <input type="password" autoComplete="new-password" className="cinema-field mt-1" {...passwordForm.register('password_confirmation', { required: 'Confirm the new password.' })} />
                        </label>
                        {passwordForm.formState.errors.password_confirmation && <p className="mt-1 text-sm text-red-200">{passwordForm.formState.errors.password_confirmation.message}</p>}
                        <button type="submit" className="cinema-button mt-5" disabled={passwordForm.formState.isSubmitting}>Update password</button>
                    </form>
                </div>
            )}
        </CustomerLayout>
    );
}
