import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import BookingGate from '../../components/booking/BookingGate';
import StatusMessage from '../../components/ui/StatusMessage';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';

export default function CinemaSelectionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const [movie, setMovie] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [cinemaId, setCinemaId] = useState(draft?.cinemaId ? String(draft.cinemaId) : '');

    useEffect(() => {
        let active = true;
        catalogApi.movie(id)
            .then((row) => {
                if (!active) return;
                setMovie(row);
                setState('ready');
                if (!cinemaId && row.showtimes?.[0]) {
                    setCinemaId(String(row.showtimes[0].cinema_id));
                }
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.message);
                    setState('error');
                }
            });

        return () => { active = false; };
    }, [id]);

    const cinemas = useMemo(() => {
        const rows = new Map();
        movie?.showtimes?.forEach((showtime) => {
            if (!rows.has(showtime.cinema_id)) {
                rows.set(showtime.cinema_id, showtime.cinema);
            }
        });

        return [...rows.entries()].map(([value, label]) => ({ value: String(value), label }));
    }, [movie]);

    const continueNext = () => {
        const selected = cinemas.find((row) => row.value === cinemaId);
        if (!selected) return;

        const sameCinema = String(draft?.cinemaId) === selected.value;

        if (sameCinema) {
            patchDraft({
                cinemaId: Number(selected.value),
                cinemaName: selected.label,
            });
        } else {
            patchDraft({
                cinemaId: Number(selected.value),
                cinemaName: selected.label,
                date: '',
                showtimeId: null,
                screenName: '',
                startsAt: null,
                ticketUnitCents: 0,
                seatIds: [],
                seatLabels: [],
                items: [],
                itemDetails: [],
                bookingId: null,
                expiresAt: null,
            });
        }

        navigate(`/movies/${id}/book/schedule`);
    };

    return (
        <BookingGate step="cinema">
            <section className="cinema-panel">
                <h1 className="cinema-section-title">Select cinema branch</h1>
                <p className="mt-2 cinema-muted">Movie: <span className="text-mist">{draft?.movieTitle}</span></p>
                {state === 'loading' && <p className="mt-4 cinema-muted">Loading branches…</p>}
                {state === 'error' && <div className="mt-4"><StatusMessage tone="error">{message}</StatusMessage></div>}
                {state === 'ready' && cinemas.length === 0 && (
                    <div className="mt-4"><StatusMessage>No cinema branches have showtimes for this movie.</StatusMessage></div>
                )}
                {state === 'ready' && cinemas.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {cinemas.map((cinema) => {
                            const active = cinema.value === cinemaId;

                            return (
                                <button
                                    key={cinema.value}
                                    type="button"
                                    className={`rounded-xl border p-4 text-left transition duration-200 ${active ? 'border-brand bg-brand/20 shadow-ticket' : 'border-white/15 bg-navy-deep/50 hover:border-brand/50'}`}
                                    onClick={() => setCinemaId(cinema.value)}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Cinema branch</p>
                                    <p className="mt-2 text-lg font-semibold text-mist">{cinema.label}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="cinema-button-secondary" onClick={() => navigate(`/movies/${id}`)}>Back</button>
                    <button type="button" className="cinema-button" disabled={!cinemaId} onClick={continueNext}>Continue to schedule</button>
                </div>
            </section>
        </BookingGate>
    );
}
