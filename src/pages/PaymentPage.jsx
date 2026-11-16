import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../api/bookings';
import BookingStepper from '../components/BookingStepper';
import HoldCountdown from '../components/HoldCountdown';
import StatusMessage from '../components/StatusMessage';
import CustomerLayout from '../layouts/CustomerLayout';
import { useCheckoutDraft } from '../stores/checkoutDraft';
import { manilaWhen, pesos } from '../utils/format';

export default function PaymentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const clearDraft = useCheckoutDraft((state) => state.clearDraft);
    const [record, setRecord] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = () => bookingApi.show(id)
        .then((data) => {
            setRecord(data);
            setState('ready');
        })
        .catch((error) => {
            if (error.status === 401) {
                navigate('/login');
                return;
            }
            setMessage(error.status === 404 ? 'That booking was not found.' : error.message);
            setState('error');
        });

    useEffect(() => {
        load();
    }, [id]);

    const summary = record?.summary;
    const booking = record?.booking;
    const expired = booking?.status === 'expired'
        || (booking?.expires_at && new Date(booking.expires_at).getTime() <= Date.now());
    const movieId = draft?.movieId || summary?.booking?.movie_id || booking?.movie_id;

    const pay = async (outcome) => {
        if (submitting) return;
        setSubmitting(true);
        setNotice('');

        try {
            const result = await bookingApi.pay(id, {
                method: record?.snack_order?.payment_method || 'cash',
                outcome,
                idempotency_key: crypto.randomUUID(),
            });
            setNotice(result.message);

            if (result.data.result === 'succeeded') {
                clearDraft();
                navigate(`/bookings/${id}/ticket`);
                return;
            }

            await load();
        } catch (error) {
            setNotice(error.message || 'The test payment could not be recorded.');
            await load();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CustomerLayout>
            {movieId && <BookingStepper current="payment" movieId={movieId} bookingId={id} allowBack={false} />}
            <h1 className="cinema-section-title">Payment</h1>
            <p className="mt-2 max-w-2xl cinema-muted">
                One checkout for tickets and food. Test mode confirms without collecting real money.
            </p>

            {booking?.status === 'pending' && booking?.expires_at && (
                <div className="mt-5">
                    <HoldCountdown expiresAt={booking.expires_at} />
                </div>
            )}

            {state === 'loading' && <p className="mt-6 cinema-muted">Loading the server total…</p>}
            {state === 'error' && <div className="mt-6"><StatusMessage tone="error">{message}</StatusMessage></div>}
            {state === 'ready' && summary && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                    <section className="cinema-panel">
                        <h2 className="text-2xl font-semibold text-mist">{summary.booking?.movie}</h2>
                        <p className="mt-2 cinema-muted">{summary.booking?.cinema} · {summary.booking?.screen}</p>
                        <p className="cinema-muted">{manilaWhen(summary.booking?.starts_at)}</p>
                        <ul className="mt-4 space-y-1 text-sm text-white/80">
                            {summary.booking?.seats?.map((seat) => (
                                <li key={seat.label} className="flex justify-between gap-4">
                                    <span>Seat {seat.label}</span>
                                    <span>{pesos(seat.price_cents)}</span>
                                </li>
                            ))}
                        </ul>
                        {summary.food && (
                            <div className="mt-5 border-t border-white/10 pt-4">
                                <h3 className="font-semibold text-mist">Food order #{summary.food.id}</h3>
                                <p className="cinema-muted">Included in this payment · {summary.food.payment_status}</p>
                                <ul className="mt-2 space-y-1 text-sm text-white/80">
                                    {summary.food.items.map((item) => (
                                        <li key={item.name} className="flex justify-between gap-4">
                                            <span>{item.quantity} × {item.name}</span>
                                            <span>{pesos(item.line_total_cents)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                    <aside className="cinema-panel">
                        <p className="text-sm text-white/80">Tickets {pesos(summary.booking?.subtotal_cents)}</p>
                        <p className="text-sm text-white/80">Food {pesos(summary.food?.subtotal_cents || 0)}</p>
                        <p className="mt-3 text-2xl font-semibold text-mist">Total {pesos(summary.total_cents)}</p>
                        {summary.blocked_reason && <div className="mt-3"><StatusMessage tone="error">{summary.blocked_reason}</StatusMessage></div>}
                        {notice && <div className="mt-3"><StatusMessage tone={notice.includes('not completed') || notice.includes('expired') ? 'error' : 'success'}>{notice}</StatusMessage></div>}
                        {summary.payable && !expired && (
                            <div className="mt-5 space-y-3">
                                <button type="button" className="cinema-button-secondary w-full" disabled={submitting} onClick={() => pay('failed')}>
                                    {submitting ? 'Recording…' : 'Record a failed test'}
                                </button>
                                <button type="button" className="cinema-button w-full" disabled={submitting} onClick={() => pay('succeeded')}>
                                    {submitting ? 'Recording…' : 'Pay & confirm'}
                                </button>
                            </div>
                        )}
                        {booking?.status === 'confirmed' && <Link to={`/bookings/${id}/ticket`} className="cinema-button mt-5 inline-flex">View ticket</Link>}
                        {booking?.status === 'pending' && (
                            <button
                                type="button"
                                className="mt-4 text-sm text-white/60 underline hover:text-brand"
                                onClick={async () => {
                                    await bookingApi.cancel(id);
                                    clearDraft();
                                    navigate('/tickets');
                                }}
                            >
                                Cancel hold
                            </button>
                        )}
                    </aside>
                </div>
            )}
        </CustomerLayout>
    );
}
