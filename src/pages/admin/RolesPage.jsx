import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

export default function RolesPage() {
    const listing = useAdminListing('roles', { search: '', page: 1 });
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`roles/${pending.id}`);
            toast.success(result.message);
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.roleRemoveFailed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Roles">
            <AdminTable
                title="Roles and permissions"
                description="Customer is the default public-site role and is not listed here. Super Admin stays in place. A role can be removed only when no account uses it."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                toolbar={<Link to="/admin/roles/create" className="admin-btn">Create role</Link>}
                columns={[
                    { key: 'name', label: 'Role' },
                    { key: 'permissions', label: 'Permissions' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => (
                            <span className="flex gap-3">
                                {!row.locked && <Link className="admin-link" to={`/admin/roles/${row.id}/edit`}>Edit</Link>}
                                {row.deletable && <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>}
                            </span>
                        ),
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title="Delete role"
                    message={`${pending.name} will be removed. Super Admin and Customer cannot be deleted.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
