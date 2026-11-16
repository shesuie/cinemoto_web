import { Link } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import { MOVIE_STATUSES } from '../../constants/domain';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

export default function MoviesPage() {
    const listing = useAdminListing('movies', { search: '', page: 1, status: '', published: '', genre: '' });
    const access = listing.payload?.access || {};
    const genres = listing.payload?.genres || [];

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
                    { key: 'status', label: 'Status', render: (row) => MOVIE_STATUSES.find((item) => item.value === row.status)?.label || row.status },
                    { key: 'is_published', label: 'Public', render: (row) => (row.is_published ? 'Published' : 'Hidden') },
                    { key: 'duration_minutes', label: 'Minutes' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update ? <Link className="admin-link" to={`/admin/movies/${row.id}/edit`}>Edit</Link> : null,
                    },
                ]}
            />
        </AdminLayout>
    );
}
