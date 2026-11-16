import { Link } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

export default function CustomersPage() {
    const listing = useAdminListing('customers', { search: '', page: 1, from: '', to: '' });

    return (
        <AdminLayout header="Users">
            <AdminTable
                title="Users"
                description="Search by name or email. Accounts do not have an active or inactive status."
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
                    { key: 'email_confirmed', label: 'Email', render: (row) => (row.email_confirmed ? 'Confirmed' : 'Not confirmed') },
                    { key: 'created_at', label: 'Registered' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => listing.payload?.can_assign ? <Link className="admin-link" to={`/admin/customers/${row.id}/edit`}>Edit</Link> : null,
                    },
                ]}
            />
        </AdminLayout>
    );
}
