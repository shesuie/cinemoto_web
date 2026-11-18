import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

const emptyForm = { id: null, name: '' };

export default function FoodCategoriesPage() {
    const listing = useAdminListing('food-categories', { search: '', page: 1 });
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const access = listing.payload?.access || {};

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (form.id) {
                await adminApi.update(`food-categories/${form.id}`, { name: form.name });
            } else {
                await adminApi.create('food-categories', { name: form.name });
            }
            toast.success(form.id ? MESSAGES.foodCategorySaved : MESSAGES.foodCategoryAdded);
            setForm(emptyForm);
            listing.load();
        } catch (failure) {
            setError(failure.message || 'The category could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`food-categories/${pending.id}`);
            toast.success(result.message);
            if (form.id === pending.id) {
                setForm(emptyForm);
            }
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.foodCategoryRemoveFailed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Food categories">
            {(access.create || form.id) && (
                <form onSubmit={save} className="mb-4 flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Category name" className="h-10 min-w-[16rem] flex-1 rounded-lg border border-gray-300 px-3 text-sm" />
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save category'}</button>
                    {form.id && (
                        <button type="button" className="admin-btn-secondary" onClick={() => { setForm(emptyForm); setError(''); }}>
                            Cancel
                        </button>
                    )}
                    {error && <p className="basis-full text-sm text-red-700">{error}</p>}
                </form>
            )}
            <AdminTable
                title="Categories"
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'products', label: 'Products' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update ? (
                            <span className="flex gap-3">
                                <button type="button" className="admin-link" onClick={() => setForm({ id: row.id, name: row.name })}>Edit</button>
                                {row.deletable && <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>}
                            </span>
                        ) : null,
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title="Delete category"
                    message={`${pending.name} will be permanently deleted. Categories with products cannot be removed.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
