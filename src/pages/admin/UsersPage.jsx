import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

const empty = { name: '', email: '', password: '', role: '', cinema_id: '' };

function cinemaLabel(cinema) {
    return cinema.address ? `${cinema.name} · ${cinema.address}` : cinema.name;
}

export default function UsersPage() {
    const listing = useAdminListing('users', { search: '', page: 1, from: '', to: '' });
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const roles = listing.payload?.roles || [];
    const cinemas = listing.payload?.cinemas || [];

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const result = await adminApi.create('users', {
                name: form.name,
                email: form.email,
                password: form.password,
                roles: [form.role],
                cinema_id: Number(form.cinema_id),
            });
            toast.success(result.message || MESSAGES.adminCreated);
            setForm(empty);
            listing.load();
        } catch (failure) {
            setError(failure.message || MESSAGES.requestFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="Administrators">
            <form onSubmit={save} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-2">
                <div className="md:col-span-2 rounded-lg border border-[#d7deea] bg-[#f7f8fb] px-3 py-2 text-sm text-gray-600">
                    Recommended order: <Link className="admin-link" to="/admin/cinemas">register the branch</Link> (name + address), then{' '}
                    <Link className="admin-link" to="/admin/roles">create a role with modules</Link>, then create the user and assign that branch.
                    The role controls which modules they can open; the branch controls which cinema’s reports they see.
                </div>
                <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="admin-btn-secondary" />
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="admin-btn-secondary" />
                <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" className="admin-btn-secondary" autoComplete="new-password" />
                <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value })} className="admin-btn-secondary" aria-label="Branch">
                    <option value="">Assigned branch</option>
                    {cinemas.map((cinema) => (
                        <option key={cinema.id} value={cinema.id}>{cinemaLabel(cinema)}</option>
                    ))}
                </select>
                <select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="admin-btn-secondary md:col-span-2" aria-label="Role">
                    <option value="">One existing role</option>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <button type="submit" disabled={saving || roles.length === 0 || cinemas.length === 0} className="admin-btn">{saving ? 'Saving…' : 'Add administrator'}</button>
                {cinemas.length === 0 && (
                    <p className="text-sm text-amber-800 md:col-span-2">
                        No branches yet. <Link className="admin-link" to="/admin/cinemas">Add a cinema branch</Link> before creating an administrator.
                    </p>
                )}
                {roles.length === 0 && (
                    <p className="text-sm text-gray-500 md:col-span-2">
                        Create a role with modules before adding an administrator. <Link className="admin-link" to="/admin/roles">Open Roles</Link>
                    </p>
                )}
                {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
            </form>
            <section className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1A2130]">Super Admin</h2>
                <p className="mt-1 text-sm text-gray-500">Super Admin accounts see all branches and are not edited from this list.</p>
                <ul className="mt-3 space-y-1 text-sm">
                    {(listing.payload?.super_admins || []).map((account) => (
                        <li key={account.id}>{account.name} · {account.email}</li>
                    ))}
                </ul>
            </section>
            <AdminTable
                title="Administrators"
                description="Each account has one role and one assigned cinema branch. Dashboard reports follow that branch. The Super Admin role cannot be assigned here."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    { key: 'from', label: 'From', type: 'date' },
                    { key: 'to', label: 'To', type: 'date' },
                ]}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' },
                    { key: 'branch', label: 'Branch' },
                    { key: 'email_confirmed', label: 'Email', render: (row) => (row.email_confirmed ? 'Confirmed' : 'Not confirmed') },
                    { key: 'actions', label: '', render: (row) => <Link className="admin-link" to={`/admin/users/${row.id}/edit`}>Edit</Link> },
                ]}
            />
        </AdminLayout>
    );
}
