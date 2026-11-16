import { Link } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import { BOOKING_STATUSES } from '../../constants/domain';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';
import { useAdminListing } from './CinemasPage';

export default function AdminBookingsPage() {
    const listing = useAdminListing('bookings', { search: '', page: 1, status: '', movie_id: '', cinema_id: '', from: '', to: '' });

    return (
        <AdminLayout header="Bookings">
            <AdminTable
                title="Booking list"
                description="Ticket payment is a test result. Food orders stay on their own payment status."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    { key: 'status', label: 'Any status', options: BOOKING_STATUSES.map((status) => ({ value: status, label: status })) },
                    { key: 'movie_id', label: 'Any movie', options: (listing.payload?.movies || []).map((movie) => ({ value: movie.id, label: movie.title })) },
                    { key: 'cinema_id', label: 'Any cinema', options: (listing.payload?.cinemas || []).map((cinema) => ({ value: cinema.id, label: cinema.name })) },
                    { key: 'from', label: 'From', type: 'date' },
                    { key: 'to', label: 'To', type: 'date' },
                ]}
                columns={[
                    { key: 'id', label: 'Booking', render: (row) => <Link className="admin-link" to={`/admin/bookings/${row.id}`}>#{row.id}</Link> },
                    { key: 'customer', label: 'Customer' },
                    { key: 'movie', label: 'Movie' },
                    { key: 'cinema', label: 'Cinema' },
                    { key: 'status', label: 'Status' },
                    { key: 'payment_status', label: 'Payment' },
                    { key: 'total_cents', label: 'Total', render: (row) => pesos(row.total_cents) },
                    { key: 'created_at', label: 'Created' },
                ]}
            />
        </AdminLayout>
    );
}
