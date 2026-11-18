import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import BookingGate from '../../components/booking/BookingGate';
import BookingHoldTimer from '../../components/booking/BookingHoldTimer';
import SeatMap from '../../components/booking/SeatMap';
import StatusMessage from '../../components/ui/StatusMessage';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';
import { manilaWhen, pesos } from '../../utils/format';

function sameIds(a = [], b = []) {
    if (a.length !== b.length) {
        return false;
    }

    const left = [...a].map(Number).sort((x, y) => x - y);
    const right = [...b].map(Number).sort((x, y) => x - y);

    return left.every((value, index) => value === right[index]);
}

export default function SeatSelectionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const [availability, setAvailability] = useState(null);
    const [seatsState, setSeatsState] = useState('loading');
    const [message, setMessage] = useState('');
    const [selected, setSelected] = useState(() => (draft?.seatIds || []).map(Number));
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const saved = (draft?.seatIds || []).map(Number);
        if (!sameIds(saved, selected)) {
            setSelected(saved);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- restore only when draft seat snapshot changes
    }, [draft?.seatIds]);

    useEffect(() => {
        if (!draft?.showtimeId) return undefined;

        let active = true;

        const load = () => {
            catalogApi.seats(draft.showtimeId)
                .then((board) => {
                    if (!active) return;
                    setAvailability(board);

                    const draftNow = useCheckoutDraft.getState().draft;
                    const saved = (draftNow?.seatIds || []).map(Number);
                    const stillOpen = saved.filter((seatId) => {
                        const seat = board.seats.find((row) => Number(row.id) === seatId);

                        return Boolean(seat) && !seat.taken;
                    });

                    setSelected((current) => (sameIds(stillOpen, current) ? current : stillOpen));

                    if (!sameIds(stillOpen, saved)) {
                        const labels = board.seats
                            .filter((seat) => stillOpen.includes(Number(seat.id)))
                            .map((seat) => seat.label);
                        patchDraft({ seatIds: stillOpen, seatLabels: labels });
                    }

                    setSeatsState('ready');
                })
                .catch((error) => {
                    if (active) {
                        setMessage(error.message);
                        setSeatsState('error');
                    }
                });
        };

        setSeatsState('loading');
        load();
        const timer = window.setInterval(load, 20000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [draft?.showtimeId, patchDraft]);

    const selectedSeats = availability?.seats?.filter((seat) => selected.includes(Number(seat.id))) || [];
    const estimate = (draft?.ticketUnitCents || 0) * selected.length;

    const persistSeats = (nextIds) => {
        const labels = (availability?.seats || [])
            .filter((seat) => nextIds.includes(Number(seat.id)))
            .map((seat) => seat.label);

        patchDraft({
            seatIds: nextIds,
            seatLabels: labels,
            holdMinutes: availability?.hold_minutes ?? draft?.holdMinutes ?? null,
            bookingId: null,
            expiresAt: null,
        });
    };

    const toggleSeat = (seat) => {
        if (seat.taken) return;

        const seatId = Number(seat.id);
        setSelected((current) => {
            const next = current.includes(seatId)
                ? current.filter((idValue) => idValue !== seatId)
                : [...current, seatId];
            persistSeats(next);

            return next;
        });
    };

    const continueNext = () => {
        setNotice('');
        if (selected.length === 0) {
            setNotice('Select at least one open seat.');
            return;
        }

        persistSeats(selected);
        navigate(`/movies/${id}/book/food`);
    };

    const goBack = () => {
        persistSeats(selected);
        navigate(`/movies/${id}/book/schedule`);
    };

    return (
        <BookingGate step="seats">
            <div className="space-y-6">
                <BookingHoldTimer preview holdMinutes={availability?.hold_minutes ?? draft?.holdMinutes ?? null} />
                <section className="cinema-panel">
                    <h1 className="cinema-section-title">Select your seats</h1>
                    <p className="mt-2 cinema-muted">
                        {draft?.cinemaName} · {manilaWhen(draft?.startsAt)} · {draft?.screenName}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
                        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-seat-open" /> Open</span>
                        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-brand" /> Selected</span>
                        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-amber-300" /> Held</span>
                        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-seat-taken" /> Taken</span>
                    </div>
                    {seatsState === 'loading' && <p className="mt-4 cinema-muted">Loading seats…</p>}
                    {seatsState === 'error' && <div className="mt-4"><StatusMessage tone="error">{message}</StatusMessage></div>}
                    {seatsState === 'ready' && availability?.seats?.length > 0 && (
                        <div className="mt-5">
                            {!availability.layout && (
                                <p className="mb-3 cinema-muted">This screen has no saved layout drawing. Seats are listed by row.</p>
                            )}
                            <SeatMap
                                seats={availability.seats}
                                layout={availability.layout}
                                selectedIds={selected}
                                onToggle={toggleSeat}
                            />
                        </div>
                    )}
                </section>

                <section className="cinema-panel">
                    <h2 className="text-lg font-semibold text-mist">Continue</h2>
                    <p className="mt-2 cinema-muted">
                        Ticket estimate: <span className="font-semibold text-mango-400">{pesos(estimate)}</span>
                        {selectedSeats.length > 0 ? ` · Seats ${selectedSeats.map((seat) => seat.label).join(', ')}` : ''}
                    </p>
                    {notice && <div className="mt-4"><StatusMessage tone="error">{notice}</StatusMessage></div>}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button type="button" className="cinema-button-secondary" onClick={goBack}>Back</button>
                        <button type="button" className="cinema-button" onClick={continueNext}>Continue to food</button>
                    </div>
                </section>
            </div>
        </BookingGate>
    );
}
