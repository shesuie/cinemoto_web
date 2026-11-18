import { useEffect, useMemo, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import { SHOWTIME_STATUS_CANCELLED } from '../../constants/domain';
import { pesos } from '../../utils/format';

const empty = { id: null, cinema_id: '', screen_id: '', date: '', time: '', price_pesos: '' };

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

export default function MovieShowtimesPanel({ movieId, movieTitle }) {
    const [rows, setRows] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [access, setAccess] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const screens = useMemo(() => {
        const cinema = cinemas.find((item) => String(item.id) === String(form.cinema_id));

        return cinema?.screens || [];
    }, [cinemas, form.cinema_id]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await adminApi.list('showtimes', { movie_id: movieId, per_page: 50, page: 1 });
            setRows(payload.listing?.data || []);
            setCinemas(payload.cinemas || []);
            setAccess(payload.access || {});
        } catch (failure) {
            setError(failure.message || 'Screenings could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [movieId]);

    const resetForm = () => {
        setForm(empty);
        setFormError('');
    };

    const save = async (event) => {
        event.preventDefault();
        const startsAt = combineStartsAt(form.date, form.time);
        if (!startsAt) {
            setFormError('Choose both a screening date and a time.');
            return;
        }
        setSaving(true);
        setFormError('');
        const body = {
            movie_id: Number(movieId),
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
            toast.success(form.id ? MESSAGES.showtimeSaved : MESSAGES.showtimeAdded);
            resetForm();
            load();
        } catch (failure) {
            setFormError(failure.message || 'The screening could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const cancel = async (row) => {
        if (!window.confirm(`Cancel this screening at ${row.cinema}? Pending holds will be released.`)) {
            return;
        }
        try {
            const result = await adminApi.post(`showtimes/${row.id}/cancel`);
            toast.success(result.message);
            load();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.showtimeCancelFailed);
        }
    };

    return (
        <section className="rounded-xl border border-[#d7deea] bg-white shadow-sm">
            <div className="border-b border-[#e5ebf3] px-5 py-4">
                <h2 className="text-base font-semibold text-[#1A2130]">Screenings by branch</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Assign {movieTitle || 'this movie'} to different cinema branches with their own dates, times, screens, and prices. Add one row per clock time.
                </p>
            </div>

            <div className="space-y-5 px-5 py-5">
                {(access.create || form.id) && (
                    <form onSubmit={save} className="grid gap-3 rounded-lg border border-[#e5ebf3] bg-[#f8fafc] p-4 md:grid-cols-3">
                        <label className="grid gap-1 text-sm text-[#1A2130]">
                            <span className="font-medium">Cinema branch</span>
                            <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value, screen_id: '' })} className="admin-btn-secondary">
                                <option value="">Select branch</option>
                                {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm text-[#1A2130]">
                            <span className="font-medium">Screen</span>
                            <select required value={form.screen_id} onChange={(event) => setForm({ ...form, screen_id: event.target.value })} className="admin-btn-secondary">
                                <option value="">Select screen</option>
                                {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.name}</option>)}
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm text-[#1A2130]">
                            <span className="font-medium">Ticket price (₱)</span>
                            <input required inputMode="decimal" value={form.price_pesos} onChange={(event) => setForm({ ...form, price_pesos: event.target.value })} placeholder="0.00" className="admin-btn-secondary" />
                        </label>
                        <label className="grid gap-1 text-sm text-[#1A2130]">
                            <span className="font-medium">Date</span>
                            <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="admin-btn-secondary" />
                        </label>
                        <label className="grid gap-1 text-sm text-[#1A2130]">
                            <span className="font-medium">Time</span>
                            <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="admin-btn-secondary" />
                        </label>
                        <div className="flex flex-wrap items-end gap-2">
                            <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : (form.id ? 'Update screening' : 'Add screening')}</button>
                            {form.id && (
                                <button type="button" className="admin-btn-secondary" onClick={resetForm}>Cancel</button>
                            )}
                        </div>
                        {formError && <p className="text-sm text-red-700 md:col-span-3">{formError}</p>}
                    </form>
                )}

                {loading ? (
                    <p className="text-sm text-gray-500">Loading screenings…</p>
                ) : error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm text-gray-500">No screenings yet. Add a branch, screen, date, and time above.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#e5ebf3]">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-[#f3f6fb] text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90]">
                                <tr>
                                    <th className="px-3 py-2">Branch</th>
                                    <th className="px-3 py-2">Screen</th>
                                    <th className="px-3 py-2">Starts</th>
                                    <th className="px-3 py-2">Price</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-t border-[#e5ebf3]">
                                        <td className="px-3 py-2.5 text-[#1A2130]">{row.cinema}</td>
                                        <td className="px-3 py-2.5 text-[#1A2130]">{row.screen}</td>
                                        <td className="px-3 py-2.5 text-[#1A2130]">{row.starts_at}</td>
                                        <td className="px-3 py-2.5 text-[#1A2130]">{pesos(row.price_cents)}</td>
                                        <td className="px-3 py-2.5 capitalize text-[#1A2130]">{row.status}</td>
                                        <td className="px-3 py-2.5">
                                            <span className="flex justify-end gap-3">
                                                {access.update && row.status !== SHOWTIME_STATUS_CANCELLED && (
                                                    <button
                                                        type="button"
                                                        className="admin-link"
                                                        onClick={() => {
                                                            const parts = splitStartsAt(row.starts_at_input);
                                                            setForm({
                                                                id: row.id,
                                                                cinema_id: String(row.cinema_id),
                                                                screen_id: String(row.screen_id),
                                                                date: parts.date,
                                                                time: parts.time,
                                                                price_pesos: (row.price_cents / 100).toFixed(2),
                                                            });
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {access.cancel && row.status !== SHOWTIME_STATUS_CANCELLED && (
                                                    <button type="button" className="admin-link-danger" onClick={() => cancel(row)}>Cancel</button>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
