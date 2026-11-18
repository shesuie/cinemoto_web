import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../api/bookings';
import BookingGate from '../../components/booking/BookingGate';
import StatusMessage from '../../components/ui/StatusMessage';
import { useAuthStore } from '../../stores/authStore';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';
import { loginPath } from '../../utils/authRedirect';
import { manilaWhen, mediaUrl, pesos } from '../../utils/format';

export default function BookingReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const [submitting, setSubmitting] = useState(false);
    const [notice, setNotice] = useState('');

    const reviewPath = `/movies/${id}/book/review`;
    const customer = user?.roles?.includes('customer');
    const ticketTotal = (draft?.ticketUnitCents || 0) * (draft?.seatIds?.length || 0);
    const foodTotal = (draft?.itemDetails || []).reduce((sum, item) => sum + item.price_cents * item.quantity, 0);

    const goAuth = () => {
        navigate(loginPath(reviewPath), { state: { from: reviewPath } });
    };

    const holdAndPay = async () => {
        setNotice('');

        if (!user) {
            goAuth();
            return;
        }

        if (!customer) {
            setNotice('Sign in with a customer account to hold seats. Staff/admin accounts cannot book tickets.');
            return;
        }

        if (!user.verified) {
            setNotice('Confirm your email before holding seats.');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                showtime_id: draft.showtimeId,
                seat_ids: draft.seatIds,
            };

            if (draft.items?.length) {
                payload.items = draft.items;
                payload.payment_method = draft.paymentMethod || 'cash';
                payload.idempotency_key = crypto.randomUUID();
            }

            const result = await bookingApi.hold(payload);
            patchDraft({
                bookingId: result.data.id,
                expiresAt: result.data.expires_at,
                holdMinutes: result.data.hold_minutes ?? null,
            });
            navigate(`/bookings/${result.data.id}/payment`);
        } catch (error) {
            if (error.status === 401) {
                goAuth();
                return;
            }
            setNotice(error.message || 'Those seats could not be held.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BookingGate step="review">
            <section className="cinema-panel">
                <h1 className="cinema-section-title">Review booking</h1>
                <p className="mt-2 cinema-muted">
                    Confirm details below. Holding seats starts your
                    {draft?.holdMinutes ? ` ${draft.holdMinutes}-minute` : ''} payment timer.
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-[160px_1fr]">
                    {draft?.posterUrl ? (
                        <img src={mediaUrl(draft.posterUrl)} alt="" className="w-full rounded-lg object-cover shadow-cinema" />
                    ) : (
                        <div className="flex aspect-[2/3] items-end rounded-lg bg-navy-deep p-3 text-sm font-semibold">{draft?.movieTitle}</div>
                    )}
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-brand">Movie</p>
                            <p className="mt-1 text-lg font-semibold text-mist">{draft?.movieTitle}</p>
                        </div>
                        <p><span className="text-white/50">Cinema branch:</span> {draft?.cinemaName}</p>
                        <p><span className="text-white/50">Schedule:</span> {manilaWhen(draft?.startsAt)} · {draft?.screenName}</p>
                        <p><span className="text-white/50">Seats:</span> {(draft?.seatLabels || []).join(', ')}</p>
                        {(draft?.itemDetails || []).length > 0 && (
                            <div>
                                <p className="text-white/50">Food</p>
                                <ul className="mt-1 space-y-1">
                                    {draft.itemDetails.map((item) => (
                                        <li key={item.product_id}>{item.quantity} × {item.name} · {pesos(item.price_cents * item.quantity)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <dl className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-white/60">Tickets</dt><dd>{pesos(ticketTotal)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-white/60">Food</dt><dd>{pesos(foodTotal)}</dd></div>
                    <div className="flex justify-between gap-3 text-lg font-semibold text-mist"><dt>Total due</dt><dd>{pesos(ticketTotal + foodTotal)}</dd></div>
                </dl>

                {!user && (
                    <p className="mt-4 text-sm text-white/70">
                        <Link to={loginPath(reviewPath)} state={{ from: reviewPath }} className="font-semibold text-brand underline">
                            Sign in
                        </Link>
                        {' '}or create an account to continue — your movie, seats, and food stay saved.
                    </p>
                )}
                {user && !customer && (
                    <div className="mt-4">
                        <StatusMessage tone="error">
                            You are signed in as staff/admin. Use a customer account to book tickets, or open My Tickets after booking as a customer.
                        </StatusMessage>
                    </div>
                )}
                {customer && !user.verified && (
                    <div className="mt-4">
                        <StatusMessage>
                            Confirm your email before holding seats.
                            {' '}
                            <Link to="/verify-email" className="font-semibold underline">Resend verification</Link>
                        </StatusMessage>
                    </div>
                )}
                {notice && <div className="mt-4"><StatusMessage tone="error">{notice}</StatusMessage></div>}

                <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="cinema-button-secondary" onClick={() => navigate(`/movies/${id}/book/food`)}>Back</button>
                    <button type="button" className="cinema-button" disabled={submitting || (user && !customer)} onClick={holdAndPay}>
                        {submitting ? 'Holding seats…' : 'Hold seats & go to payment'}
                    </button>
                </div>
            </section>
        </BookingGate>
    );
}
