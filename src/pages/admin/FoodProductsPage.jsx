import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';
import { useAdminListing } from './CinemasPage';

export default function FoodProductsPage() {
    const listing = useAdminListing('food', { search: '', page: 1, category: '', available: '', cinema_id: '' });
    const [availability, setAvailability] = useState(null);
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const access = listing.payload?.access || {};
    const categories = listing.payload?.categories || [];
    const cinemas = listing.payload?.cinemas || [];

    const changeAvailability = async () => {
        if (!availability) {
            return;
        }
        setBusy(true);
        try {
            const result = await adminApi.patch(`food/${availability.id}/availability`, { is_available: !availability.is_available });
            toast.success(result.message);
            setAvailability(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.foodAvailabilityFailed);
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`food/${pending.id}`);
            toast.success(result.message);
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.foodProductRemoveFailed);
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
                    { key: 'available', label: 'Any availability', options: [{ value: 'yes', label: 'Available' }, { value: 'no', label: 'Not available' }] },
                ]}
                columns={[
                    { key: 'name', label: 'Product' },
                    { key: 'cinema', label: 'Branch' },
                    { key: 'category', label: 'Category' },
                    { key: 'price_cents', label: 'Price', render: (row) => pesos(row.price_cents) },
                    { key: 'stock_quantity', label: 'Limit', render: (row) => (row.stock_quantity == null ? 'No limit' : row.stock_quantity) },
                    {
                        key: 'is_available',
                        label: 'Availability',
                        render: (row) => <StatusBadge value={row.is_available ? 'available' : 'not_available'} />,
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => (
                            <span className="flex gap-3">
                                {access.update && <Link className="admin-link" to={`/admin/food/${row.id}/edit`}>Edit</Link>}
                                {access.update && (
                                    <button type="button" className="admin-link" onClick={() => setAvailability(row)}>
                                        {row.is_available ? 'Mark not available' : 'Mark available'}
                                    </button>
                                )}
                                {access.update && row.deletable && (
                                    <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>
                                )}
                            </span>
                        ),
                    },
                ]}
            />
            {availability && (
                <ConfirmDialog
                    title={availability.is_available ? 'Mark unavailable' : 'Mark available'}
                    message={availability.is_available ? `${availability.name} will show as not available on the public menu.` : `${availability.name} will be available to order again.`}
                    confirmLabel={availability.is_available ? 'Mark not available' : 'Mark available'}
                    busy={busy}
                    onClose={() => setAvailability(null)}
                    onConfirm={changeAvailability}
                />
            )}
            {pending && (
                <ConfirmDialog
                    title="Delete product"
                    message={`${pending.name} will be permanently deleted from the menu.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
