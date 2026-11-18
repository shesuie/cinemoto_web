import { useEffect, useRef, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdminLayout from '../../layouts/AdminLayout';

function mergeListing(previous, next) {
    if (!previous) {
        return next;
    }

    return {
        ...previous,
        ...next,
        listing: next.listing ?? previous.listing,
        query: next.query ?? previous.query,
    };
}

function useListing(path, initial) {
    const [params] = useSearchParams();
    const [query, setQuery] = useState(() => ({
        ...initial,
        ...Object.fromEntries([...params.entries()].filter(([key]) => Object.prototype.hasOwnProperty.call(initial, key))),
    }));
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const catalogReady = useRef(false);

    const fetchList = async (next, { withMeta = false } = {}) => {
        const wantMeta = withMeta || !catalogReady.current;
        const result = await adminApi.list(path, { ...next, meta: wantMeta ? 1 : 0 });
        if (wantMeta) {
            catalogReady.current = true;
        }

        return result;
    };

    const load = async (next = query) => {
        setLoading(true);
        setError('');
        try {
            const result = await fetchList(next, { withMeta: true });
            setPayload(result);
        } catch (failure) {
            if (failure?.code === 'ERR_CANCELED' || failure?.name === 'CanceledError') {
                return;
            }
            setError(failure.message || 'The list could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        catalogReady.current = false;
        setPayload(null);
    }, [path]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        fetchList(query)
            .then((result) => {
                if (active) {
                    setPayload((current) => mergeListing(current, result));
                }
            })
            .catch((failure) => {
                if (active) {
                    setError(failure.message || 'The list could not be loaded.');
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [path, query]);

    return { query, setQuery, payload, loading, error, load };
}

export function useAdminListing(path, initial) {
    return useListing(path, initial);
}

const emptyForm = { id: null, name: '', address: '' };

export default function CinemasPage() {
    const listing = useListing('cinemas', { search: '', page: 1 });
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
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
            toast.success(form.id ? MESSAGES.branchSaved : MESSAGES.branchAdded);
            setForm(emptyForm);
            listing.load();
        } catch (failure) {
            setFormError(failure.message || 'The branch could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`cinemas/${pending.id}`);
            toast.success(result.message);
            if (form.id === pending.id) {
                setForm(emptyForm);
            }
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.branchRemoveFailed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Cinemas">
            <p className="mb-4 max-w-3xl text-sm text-gray-600">
                Register each cinema branch here first (name and address). After that, create a role with modules, then assign the branch to a staff user. Customer ticket and food sales for that branch appear on that user&apos;s dashboard reports.
            </p>
            {(access.create || form.id) && (
                <form onSubmit={save} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto_auto]">
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Branch name" className="admin-btn-secondary" />
                    <input required maxLength={255} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Address" className="admin-btn-secondary" />
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save branch'}</button>
                    {form.id && (
                        <button type="button" className="admin-btn-secondary" onClick={() => { setForm(emptyForm); setFormError(''); }}>
                            Cancel
                        </button>
                    )}
                    {formError && <p className="md:col-span-4 text-sm text-red-700">{formError}</p>}
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
                            <span className="flex gap-3">
                                <button type="button" className="admin-link" onClick={() => setForm({ id: row.id, name: row.name, address: row.address })}>Edit</button>
                                {row.deletable && <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>}
                            </span>
                        ) : null,
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title="Delete branch"
                    message={`${pending.name} will be permanently deleted. Branches with bookings or food products cannot be removed.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
