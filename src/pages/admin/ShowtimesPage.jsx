import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import { SHOWTIME_STATUS_CANCELLED, SHOWTIME_STATUSES } from '../../constants/domain';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';
import { useAdminListing } from './CinemasPage';

const empty = { id: null, movie_id: '', cinema_id: '', screen_id: '', date: '', time: '', price_pesos: '' };

function splitStartsAt(value) {
    if (!value) {
        return { date: '', time: '' };
    }

    const normalized = String(value).replace(' ', 'T');
    const [datePart, timePart = ''] = normalized.split('T');

    return {
        date: datePart || '',
        time: timePart.slice(0, 5),
    };
}

function combineStartsAt(date, time) {
    if (!date || !time) {
        return '';
    }

    return `${date}T${time}`;
}

export default function ShowtimesPage() {
    const listing = useAdminListing('showtimes', { search: '', page: 1, movie_id: '', cinema_id: '', screen_id: '', status: '' });
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const access = listing.payload?.access || {};
    const movies = listing.payload?.movies || [];
    const cinemas = listing.payload?.cinemas || [];
    const screens = useMemo(() => {
        const cinema = cinemas.find((item) => String(item.id) === String(form.cinema_id));

        return cinema?.screens || [];
    }, [cinemas, form.cinema_id]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        const startsAt = combineStartsAt(form.date, form.time);
        if (!startsAt) {
            setError('Choose both a screening date and a time.');
            setSaving(false);
            return;
        }
        const body = {
            movie_id: Number(form.movie_id),
            cinema_id: Number(form.cinema_id),
            screen_id: Number(form.screen_id),
            starts_at: startsAt,
            price_cents: Math.round(Number(form.price_pesos) * 100),
        };
        try {
            if (form.id) {
                await adminApi.update(`showtimes/${form.id}`, body);
            } else {
                await adminApi.create('showtimes', body);
            }
            toast.success(form.id ? 'The screening details were saved.' : 'The screening was added.');
            setForm(empty);
            listing.load();
        } catch (failure) {
            setError(failure.message || 'The screening could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const cancel = async (row) => {
        if (!window.confirm(`Cancel the screening of ${row.movie}? Pending holds will be released.`)) {
            return;
        }
        try {
            const result = await adminApi.post(`showtimes/${row.id}/cancel`);
            toast.success(result.message);
            listing.load();
        } catch (failure) {
            toast.error(failure.message || 'The screening could not be cancelled.');
        }
    };

    return (
        <AdminLayout header="Showtimes">
            <p className="mb-4 rounded-lg border border-[#d7deea] bg-white px-4 py-3 text-sm text-[#304463]">
                Add one screening per clock time. Example: for the same movie/date with 9:00 AM, 1:00 PM, and 7:00 PM, create three showtimes on that date. Customers pick the date first, then one of those times.
            </p>
            {(access.create || form.id) && (
                <form onSubmit={save} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-3">
                    <select required value={form.movie_id} onChange={(event) => setForm({ ...form, movie_id: event.target.value })} className="admin-btn-secondary">
                        <option value="">Movie</option>
                        {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
                    </select>
                    <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value, screen_id: '' })} className="admin-btn-secondary">
                        <option value="">Cinema branch</option>
                        {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                    </select>
                    <select required value={form.screen_id} onChange={(event) => setForm({ ...form, screen_id: event.target.value })} className="admin-btn-secondary">
                        <option value="">Screen</option>
                        {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.name}</option>)}
                    </select>
                    <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="admin-btn-secondary" aria-label="Screening date" />
                    <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="admin-btn-secondary" aria-label="Screening time" />
                    <input required inputMode="decimal" value={form.price_pesos} onChange={(event) => setForm({ ...form, price_pesos: event.target.value })} placeholder="Price in pesos" className="admin-btn-secondary" />
                    <button type="submit" disabled={saving} className="admin-btn md:col-span-3">{saving ? 'Saving…' : 'Save screening'}</button>
                    {error && <p className="text-sm text-red-700 md:col-span-3">{error}</p>}
                </form>
            )}
            <AdminTable
                title="Screenings"
                description="Each date+time you save appears on the customer booking calendar for that cinema branch."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    { key: 'movie_id', label: 'Any movie', options: movies.map((movie) => ({ value: movie.id, label: movie.title })) },
                    { key: 'cinema_id', label: 'Any cinema branch', options: cinemas.map((cinema) => ({ value: cinema.id, label: cinema.name })) },
                    { key: 'status', label: 'Any status', options: SHOWTIME_STATUSES.map((status) => ({ value: status, label: status === 'scheduled' ? 'Scheduled' : 'Cancelled' })) },
                ]}
                columns={[
                    { key: 'movie', label: 'Movie' },
                    { key: 'cinema', label: 'Cinema branch' },
                    { key: 'screen', label: 'Screen' },
                    { key: 'starts_at', label: 'Starts' },
                    { key: 'price_cents', label: 'Price', render: (row) => pesos(row.price_cents) },
                    { key: 'status', label: 'Status' },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => (
                            <span className="flex gap-3">
                                {access.update && row.status !== SHOWTIME_STATUS_CANCELLED && (
                                    <button type="button" className="admin-link" onClick={() => {
                                        const parts = splitStartsAt(row.starts_at_input);
                                        setForm({
                                            id: row.id,
                                            movie_id: String(row.movie_id),
                                            cinema_id: String(row.cinema_id),
                                            screen_id: String(row.screen_id),
                                            date: parts.date,
                                            time: parts.time,
                                            price_pesos: (row.price_cents / 100).toFixed(2),
                                        });
                                    }}
                                    >Edit</button>
                                )}
                                {access.cancel && row.status !== SHOWTIME_STATUS_CANCELLED && (
                                    <button type="button" className="admin-link-danger" onClick={() => cancel(row)}>Cancel</button>
                                )}
                            </span>
                        ),
                    },
                ]}
            />
        </AdminLayout>
    );
}
