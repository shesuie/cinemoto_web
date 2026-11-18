import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';

function cinemaLabel(cinema) {
    return cinema.address ? `${cinema.name} · ${cinema.address}` : cinema.name;
}

export default function UserDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const staffForm = window.location.pathname.startsWith('/admin/users/');
    const [form, setForm] = useState({ name: '', email: '', role: '', cinema_id: '' });
    const [choices, setChoices] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const path = staffForm ? `users/${id}` : `customers/${id}`;
        adminApi.show(path)
            .then((payload) => {
                if (staffForm && payload.data.audience === 'customer') {
                    navigate(`/admin/customers/${id}/edit`, { replace: true });
                    return;
                }
                if (!staffForm && payload.data.audience === 'staff') {
                    navigate(`/admin/users/${id}/edit`, { replace: true });
                    return;
                }
                setForm({
                    name: payload.data.name,
                    email: payload.data.email,
                    role: payload.data.roles?.[0] || '',
                    cinema_id: payload.data.cinema_id ? String(payload.data.cinema_id) : '',
                });
                setChoices(payload.choices || []);
                setCinemas(payload.cinemas || []);
                setConfirmed(Boolean(payload.data.email_confirmed));
            })
            .catch((failure) => setError(failure.message || 'The account could not be loaded.'))
            .finally(() => setLoading(false));
    }, [id, staffForm, navigate]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        const body = {
            name: form.name,
            email: form.email,
            roles: [form.role],
            cinema_id: staffForm && form.role !== 'customer' ? Number(form.cinema_id) : null,
        };
        try {
            const result = await adminApi.update(staffForm ? `users/${id}` : `customers/${id}`, body);
            toast.success(result.message);
            navigate(result.data?.audience === 'staff' ? '/admin/users' : '/admin/customers');
        } catch (failure) {
            setError(failure.message || 'The account could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="Edit account">
            {loading ? <p className="text-sm text-gray-500">Loading the account…</p> : (
                <form onSubmit={save} className="grid max-w-xl gap-3 rounded-lg bg-white p-4 shadow-sm">
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    <p className="text-sm text-gray-600">
                        Email {confirmed ? 'confirmed' : 'not confirmed'}. There is no separate active or inactive status, and this form keeps one role.
                        {staffForm ? ' The assigned branch locks this user’s dashboard and reports to that cinema only.' : ''}
                    </p>
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-label="Name" className="admin-btn-secondary" />
                    <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-label="Email" className="admin-btn-secondary" />
                    <select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} aria-label="Role" className="admin-btn-secondary">
                        <option value="">One role</option>
                        {choices.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    {staffForm && form.role !== 'customer' && (
                        <>
                            <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value })} aria-label="Assigned branch" className="admin-btn-secondary">
                                <option value="">Assigned branch</option>
                                {cinemas.map((cinema) => (
                                    <option key={cinema.id} value={cinema.id}>{cinemaLabel(cinema)}</option>
                                ))}
                            </select>
                            {cinemas.length === 0 && (
                                <p className="text-sm text-amber-800">
                                    No branches yet. <Link className="admin-link" to="/admin/cinemas">Register a cinema branch</Link> first.
                                </p>
                            )}
                        </>
                    )}
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save account'}</button>
                </form>
            )}
        </AdminLayout>
    );
}
