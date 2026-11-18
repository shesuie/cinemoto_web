import { useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import StatusBadge from '../../components/admin/StatusBadge';
import { MOVIE_STATUSES } from '../../constants/domain';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

export default function MoviesPage() {
    const listing = useAdminListing('movies', { search: '', page: 1, status: '', published: '', genre: '' });
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const access = listing.payload?.access || {};
    const genres = listing.payload?.genres || [];

    const remove = async () => {
        setBusy(true);
        try {
            const result = await adminApi.remove(`movies/${pending.id}`);
            toast.success(result.message);
            setPending(null);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.movieRemoveFailed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout header="Movies">
            <AdminTable
                title="Movie list"
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                toolbar={access.create ? <Link to="/admin/movies/create" className="admin-btn">Add movie</Link> : null}
                filters={[
                    { key: 'status', label: 'Any status', options: MOVIE_STATUSES },
                    { key: 'published', label: 'Published or hidden', options: [{ value: 'yes', label: 'Published' }, { value: 'no', label: 'Hidden' }] },
                    { key: 'genre', label: 'Any genre', options: genres.map((genre) => ({ value: genre.id, label: genre.name })) },
                ]}
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'genres', label: 'Genres' },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (row) => (
                            <StatusBadge
                                value={row.status}
                                label={MOVIE_STATUSES.find((item) => item.value === row.status)?.label || row.status}
                            />
                        ),
                    },
                    {
                        key: 'is_published',
                        label: 'Public',
                        render: (row) => <StatusBadge value={row.is_published ? 'published' : 'hidden'} />,
                    },
                    { key: 'duration_minutes', label: 'Minutes' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update ? (
                            <span className="flex gap-3">
                                <Link className="admin-link" to={`/admin/movies/${row.id}/edit`}>Edit</Link>
                                {row.deletable && <button type="button" className="admin-link-danger" onClick={() => setPending(row)}>Delete</button>}
                            </span>
                        ) : null,
                    },
                ]}
            />
            {pending && (
                <ConfirmDialog
                    title="Delete movie"
                    message={`${pending.title} will be permanently deleted. Movies with booked showtimes cannot be removed.`}
                    confirmLabel="Delete"
                    busy={busy}
                    onClose={() => setPending(null)}
                    onConfirm={remove}
                />
            )}
        </AdminLayout>
    );
}
