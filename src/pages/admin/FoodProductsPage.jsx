import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';
import { useAdminListing } from './CinemasPage';

export default function FoodProductsPage() {
    const listing = useAdminListing('food', { search: '', page: 1, category: '', available: '', cinema_id: '' });
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const access = listing.payload?.access || {};
    const categories = listing.payload?.categories || [];
    const cinemas = listing.payload?.cinemas || [];

    const changeAvailability = async () => {
        if (!pending) {
            return;
        }
        setBusy(true);
        try {
            const result = await adminApi.patch(`food/${pending.id}/availability`, { is_available: !pending.is_available });
            toast.success(result.message);
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || 'Availability could not be changed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Food products">
            <AdminTable
                title="Menu"
                description={listing.payload?.branch ? `${listing.payload.branch.name} menu.` : 'Each item belongs to one branch.'}
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                toolbar={access.create ? <Link to="/admin/food/create" className="admin-btn">Add product</Link> : null}
                filters={[
                    ...(cinemas.length ? [{ key: 'cinema_id', label: 'All branches', options: cinemas.map((cinema) => ({ value: cinema.id, label: cinema.name })) }] : []),
                    { key: 'category', label: 'Any category', options: categories.map((category) => ({ value: category.id, label: category.name })) },
                    { key: 'available', label: 'Any availability', options: [{ value: 'yes', label: 'Available' }, { value: 'no', label: 'Hidden' }] },
                ]}
                columns={[
                    { key: 'name', label: 'Product' },
                    { key: 'cinema', label: 'Branch' },
                    { key: 'category', label: 'Category' },
                    { key: 'price_cents', label: 'Price', render: (row) => pesos(row.price_cents) },
                    { key: 'stock_quantity', label: 'Limit', render: (row) => (row.stock_quantity == null ? 'No limit' : row.stock_quantity) },
                    { key: 'is_available', label: 'Availability', render: (row) => (row.is_available ? 'Available' : 'Hidden') },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => (
                            <span className="flex gap-3">
                                {access.update && <Link className="admin-link" to={`/admin/food/${row.id}/edit`}>Edit</Link>}
                                {access.update && (
                                    <button type="button" className="admin-link" onClick={() => setPending(row)}>
                                        {row.is_available ? 'Hide' : 'Show'}
                                    </button>
                                )}
                            </span>
                        ),
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title={pending.is_available ? 'Mark unavailable' : 'Mark available'}
                    message={pending.is_available ? `${pending.name} will be hidden from the public menu.` : `${pending.name} will return to the public menu.`}
                    confirmLabel={pending.is_available ? 'Hide' : 'Show'}
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={changeAvailability}
                />
            )}
        </AdminLayout>
    );
}
