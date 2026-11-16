import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import BookingGate from '../../components/BookingGate';
import DateCalendar from '../../components/DateCalendar';
import StatusMessage from '../../components/StatusMessage';
import { useCheckoutDraft } from '../../stores/checkoutDraft';
import { manilaDateKey, manilaDateLabel, manilaTime, pesos } from '../../utils/format';

export default function BookSchedulePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const [movie, setMovie] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [date, setDate] = useState(draft?.date || '');
    const [showtimeId, setShowtimeId] = useState(draft?.showtimeId || null);

    useEffect(() => {
        let active = true;
        catalogApi.movie(id)
            .then((row) => {
                if (!active) return;
                setMovie(row);
                setState('ready');
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.message);
                    setState('error');
                }
            });

        return () => { active = false; };
    }, [id]);

    const branchShowtimes = useMemo(
        () => (movie?.showtimes || []).filter((showtime) => String(showtime.cinema_id) === String(draft?.cinemaId)),
        [movie, draft?.cinemaId],
    );

    const dates = useMemo(() => {
        const values = new Set(branchShowtimes.map((showtime) => manilaDateKey(showtime.starts_at)));

        return [...values].sort();
    }, [branchShowtimes]);

    const showtimes = useMemo(() => {
        if (!date) {
            return [];
        }

        return branchShowtimes
            .filter((showtime) => manilaDateKey(showtime.starts_at) === date)
            .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    }, [branchShowtimes, date]);

    useEffect(() => {
        if (dates.length && !dates.includes(date)) {
            setDate(dates[0]);
        }
    }, [dates, date]);

    useEffect(() => {
        if (!date) {
            setShowtimeId(null);
            return;
        }

        if (showtimes.length && !showtimes.some((row) => Number(row.id) === Number(showtimeId))) {
            setShowtimeId(showtimes[0].id);
        }
        if (!showtimes.length) {
            setShowtimeId(null);
        }
    }, [showtimes, showtimeId, date]);

    const pickDate = (nextDate) => {
        setDate(nextDate);
        setShowtimeId(null);
    };

    const continueNext = () => {
        const showtime = showtimes.find((row) => Number(row.id) === Number(showtimeId));
        if (!showtime || !date) return;

        const sameShowtime = Number(draft?.showtimeId) === Number(showtime.id);

        if (sameShowtime) {
            patchDraft({
                date,
                showtimeId: showtime.id,
                screenName: showtime.screen,
                startsAt: showtime.starts_at,
                ticketUnitCents: showtime.price_cents,
            });
        } else {
            patchDraft({
                date,
                showtimeId: showtime.id,
                screenName: showtime.screen,
                startsAt: showtime.starts_at,
                ticketUnitCents: showtime.price_cents,
                seatIds: [],
                seatLabels: [],
                bookingId: null,
                expiresAt: null,
            });
        }

        navigate(`/movies/${id}/book/seats`);
    };

    return (
        <BookingGate step="schedule">
            <section className="cinema-panel">
                <h1 className="cinema-section-title">Select date & showtime</h1>
                <p className="mt-2 cinema-muted">
                    Branch: <span className="text-mist">{draft?.cinemaName}</span>
                </p>
                <p className="mt-1 text-sm text-white/55">
                    Pick a screening date first, then choose one of the times available that day (set in Admin → Showtimes).
                </p>
                {state === 'loading' && <p className="mt-4 cinema-muted">Loading schedule…</p>}
                {state === 'error' && <div className="mt-4"><StatusMessage tone="error">{message}</StatusMessage></div>}
                {state === 'ready' && (
                    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
                        <div>
                            <p className="mb-2 text-sm font-semibold text-white/80">1. Date</p>
                            <DateCalendar availableDates={dates} value={date} onChange={pickDate} />
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold text-white/80">2. Time</p>
                            {date ? (
                                <p className="mb-3 text-sm text-white/55">
                                    Times for <span className="text-mist">{manilaDateLabel(date)}</span>
                                </p>
                            ) : (
                                <p className="mb-3 cinema-muted">Select a date to see available times.</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {showtimes.map((row) => {
                                    const active = Number(row.id) === Number(showtimeId);

                                    return (
                                        <button
                                            key={row.id}
                                            type="button"
                                            className={active ? 'cinema-button-mango' : 'cinema-button-secondary'}
                                            onClick={() => setShowtimeId(row.id)}
                                        >
                                            <span className="text-base font-semibold">{manilaTime(row.starts_at)}</span>
                                            <span className="ml-2 text-xs opacity-80">{row.screen}</span>
                                            <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-ink text-mango-400' : 'bg-mango-500 text-ink'}`}>
                                                {pesos(row.price_cents)}
                                            </span>
                                        </button>
                                    );
                                })}
                                {date && showtimes.length === 0 && (
                                    <p className="cinema-muted">No showtimes on this date for this branch.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="cinema-button-secondary" onClick={() => navigate(`/movies/${id}/book/cinema`)}>Back</button>
                    <button type="button" className="cinema-button" disabled={!showtimeId || !date} onClick={continueNext}>Continue to seats</button>
                </div>
            </section>
        </BookingGate>
    );
}
