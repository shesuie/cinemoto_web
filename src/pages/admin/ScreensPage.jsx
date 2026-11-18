import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

const emptyForm = { id: null, cinema_id: '', name: '' };

export default function ScreensPage() {
    const listing = useAdminListing('screens', { search: '', page: 1, cinema_id: '' });
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const access = listing.payload?.access || {};
    const cinemas = listing.payload?.cinemas || [];

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            const body = { cinema_id: Number(form.cinema_id), name: form.name };
            if (form.id) {
                await adminApi.update(`screens/${form.id}`, body);
            } else {
                await adminApi.create('screens', body);
            }
            toast.success(form.id ? MESSAGES.screenSaved : MESSAGES.screenAdded);
            setForm(emptyForm);
            listing.load();
        } catch (failure) {
            setFormError(failure.message || 'The screen could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`screens/${pending.id}`);
            toast.success(result.message);
            if (form.id === pending.id) {
                setForm(emptyForm);
            }
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.screenRemoveFailed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Screens">
            {(access.create || form.id) && (
                <form onSubmit={save} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto_auto]">
                    <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value })} className="admin-btn-secondary">
                        <option value="">Cinema</option>
                        {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                    </select>
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Screen name" className="admin-btn-secondary" />
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save screen'}</button>
                    {form.id && (
                        <button type="button" className="admin-btn-secondary" onClick={() => { setForm(emptyForm); setFormError(''); }}>
                            Cancel
                        </button>
                    )}
                    {formError && <p className="text-sm text-red-700 md:col-span-4">{formError}</p>}
                </form>
            )}
            <AdminTable
                title="Screens"
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[{
                    key: 'cinema_id',
                    label: 'All cinemas',
                    options: cinemas.map((cinema) => ({ value: cinema.id, label: cinema.name })),
                }]}
                columns={[
                    { key: 'name', label: 'Screen' },
                    { key: 'cinema', label: 'Cinema' },
                    { key: 'created_at', label: 'Added' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update ? (
                            <span className="flex gap-3">
                                <button type="button" className="admin-link" onClick={() => setForm({ id: row.id, cinema_id: String(row.cinema_id), name: row.name })}>Edit</button>
                                {row.deletable && <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>}
                            </span>
                        ) : null,
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title="Delete screen"
                    message={`${pending.name} will be permanently deleted with its seats. Screens with bookings cannot be removed.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
