import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminTable from '../../components/admin/AdminTable';
import SeatLayoutEditor from '../../components/admin/SeatLayoutEditor';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

export default function SeatsPage() {
    const listing = useAdminListing('seats', { search: '', page: 1, cinema_id: '', screen_id: '' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [form, setForm] = useState({ id: null, screen_id: '', row_label: 'A', number: '1' });
    const access = listing.payload?.access || {};
    const screens = listing.payload?.screens || [];
    const editor = listing.payload?.editor;
    const visibleScreens = useMemo(
        () => screens.filter((screen) => !listing.query.cinema_id || String(screen.cinema_id) === String(listing.query.cinema_id)),
        [screens, listing.query.cinema_id],
    );

    const saveSeat = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            const body = { screen_id: Number(form.screen_id), row_label: form.row_label, number: Number(form.number) };
            if (form.id) {
                await adminApi.update(`seats/${form.id}`, body);
            } else {
                await adminApi.create('seats', body);
            }
            toast.success(form.id ? 'The seat record was updated.' : 'The seat was added to this screen.');
            setForm({ id: null, screen_id: '', row_label: 'A', number: '1' });
            listing.load();
        } catch (failure) {
            setFormError(failure.message || 'The seat could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="Seats">
            <div className="mb-4 grid gap-3">
                <SeatLayoutEditor
                    cinemas={listing.payload?.cinemas || []}
                    screens={screens}
                    editor={editor}
                    canEdit={Boolean(access.update)}
                    cinemaId={listing.query.cinema_id || ''}
                    onCinema={(cinemaId) => listing.setQuery({ ...listing.query, cinema_id: cinemaId, screen_id: '', page: 1 })}
                    onScreen={(screenId) => listing.setQuery({ ...listing.query, screen_id: screenId, page: 1 })}
                    onSaved={() => listing.load()}
                />
                {(access.create || form.id) && (
                    <form onSubmit={saveSeat} className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-[#1A2130]">Single seat</h2>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <select required value={form.screen_id} onChange={(event) => setForm({ ...form, screen_id: event.target.value })} className="admin-btn-secondary sm:col-span-3">
                                <option value="">Screen</option>
                                {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.label}</option>)}
                            </select>
                            <input required maxLength={8} value={form.row_label} onChange={(event) => setForm({ ...form, row_label: event.target.value })} className="admin-btn-secondary" aria-label="Row" />
                            <input required type="number" min="1" max="100" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} className="admin-btn-secondary" aria-label="Number" />
                            <button type="submit" disabled={saving} className="admin-btn">Save seat</button>
                        </div>
                    </form>
                )}
            </div>
            {formError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <AdminTable
                title="Seat records"
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    { key: 'cinema_id', label: 'All cinemas', options: (listing.payload?.cinemas || []).map((cinema) => ({ value: cinema.id, label: cinema.name })) },
                    { key: 'screen_id', label: 'All screens', options: visibleScreens.map((screen) => ({ value: screen.id, label: screen.label })) },
                ]}
                columns={[
                    { key: 'label', label: 'Seat' },
                    { key: 'screen', label: 'Screen' },
                    { key: 'cinema', label: 'Cinema' },
                    { key: 'booked', label: 'Used', render: (row) => (row.booked ? 'Has a booking' : 'Open') },
                    {
                        key: 'actions',
                        label: '',
                        render: (row) => access.update && !row.booked ? (
                            <button type="button" className="admin-link" onClick={() => setForm({ id: row.id, screen_id: String(row.screen_id), row_label: row.row_label, number: String(row.number) })}>Edit</button>
                        ) : null,
                    },
                ]}
            />
        </AdminLayout>
    );
}
