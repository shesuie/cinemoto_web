import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import AdminLayout from '../../layouts/AdminLayout';

function useListing(path, initial) {
    const [params] = useSearchParams();
    const [query, setQuery] = useState(() => ({
        ...initial,
        ...Object.fromEntries([...params.entries()].filter(([key]) => Object.prototype.hasOwnProperty.call(initial, key))),
    }));
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (next = query) => {
        setLoading(true);
        setError('');
        try {
            setPayload(await adminApi.list(path, next));
        } catch (failure) {
            setError(failure.message || 'The list could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(query);
    }, [query]);

    return { query, setQuery, payload, loading, error, load };
}

export function useAdminListing(path, initial) {
    return useListing(path, initial);
}

export default function CinemasPage() {
    const listing = useListing('cinemas', { search: '', page: 1 });
    const [form, setForm] = useState({ id: null, name: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const access = listing.payload?.access || {};

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (form.id) {
                await adminApi.update(`cinemas/${form.id}`, { name: form.name, address: form.address });
            } else {
                await adminApi.create('cinemas', { name: form.name, address: form.address });
            }
            toast.success(form.id ? 'The branch details were saved.' : 'The branch was added.');
            setForm({ id: null, name: '', address: '' });
            listing.load();
        } catch (failure) {
            setFormError(failure.message || 'The branch could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="Cinemas">
            {(access.create || form.id) && (
                <form onSubmit={save} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Branch name" className="admin-btn-secondary" />
                    <input required maxLength={255} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Address" className="admin-btn-secondary" />
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save branch'}</button>
                    {formError && <p className="md:col-span-3 text-sm text-red-700">{formError}</p>}
                </form>
            )}
            <AdminTable
                title="Branches"
                description="Each cinema is a branch."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'address', label: 'Address' },
                    { key: 'screens', label: 'Screens' },
                    { key: 'created_at', label: 'Added' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update ? (
                            <button type="button" className="admin-link" onClick={() => setForm({ id: row.id, name: row.name, address: row.address })}>Edit</button>
                        ) : null,
                    },
                ]}
            />
        </AdminLayout>
    );
}
