import { Link } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';
import { useAdminListing } from './CinemasPage';

export default function OrdersPage() {
    const listing = useAdminListing('orders', { search: '', page: 1, status: '', payment_status: '', from: '', to: '' });
    const statuses = listing.payload?.statuses || [];
    const payments = listing.payload?.payment_statuses || [];

    return (
        <AdminLayout header="Orders">
            <AdminTable
                title="Food orders"
                description="A food order keeps its own payment status. A successful ticket test does not mark the food as paid."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    { key: 'status', label: 'Any order status', options: statuses.map((status) => ({ value: status, label: status })) },
                    { key: 'payment_status', label: 'Any payment status', options: payments.map((status) => ({ value: status, label: status })) },
                    { key: 'from', label: 'From', type: 'date' },
                    { key: 'to', label: 'To', type: 'date' },
                ]}
                columns={[
                    { key: 'id', label: 'Order', render: (row) => <Link className="admin-link" to={`/admin/orders/${row.id}`}>#{row.id}</Link> },
                    { key: 'customer', label: 'Customer' },
                    { key: 'cinema', label: 'Branch' },
                    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                    { key: 'payment_status', label: 'Payment', render: (row) => <StatusBadge value={row.payment_status} /> },
                    { key: 'total_cents', label: 'Total', render: (row) => pesos(row.total_cents) },
                    { key: 'created_at', label: 'Created' },
                ]}
            />
        </AdminLayout>
    );
}
