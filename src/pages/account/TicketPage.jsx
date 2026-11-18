import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../api/bookings';
import BookingStepper from '../../components/booking/BookingStepper';
import StatusMessage from '../../components/ui/StatusMessage';
import CustomerLayout from '../../layouts/CustomerLayout';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';
import { manilaWhen, pesos } from '../../utils/format';

export default function TicketPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const clearDraft = useCheckoutDraft((state) => state.clearDraft);
    const [ticket, setTicket] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        bookingApi.ticket(id)
            .then((data) => {
                setTicket(data);
                setState('ready');
                clearDraft();
            })
            .catch((error) => {
                if (error.status === 401) {
                    navigate('/login');
                    return;
                }
                setMessage(error.status === 404 ? 'A ticket is available after a successful test payment.' : error.message);
                setState('error');
            });
    }, [id, navigate, clearDraft]);

    const summary = ticket?.summary;
    const movieId = summary?.booking?.movie_id;
    const ticketReference = ticket?.ticket_reference || summary?.booking?.ticket_reference;
    const svg = typeof ticket?.qr_svg === 'string' && ticket.qr_svg.trimStart().startsWith('<svg') && !ticket.qr_svg.toLowerCase().includes('<script')
        ? ticket.qr_svg
        : null;

    return (
        <CustomerLayout>
            {movieId && <BookingStepper current="confirmation" movieId={movieId} bookingId={id} allowBack={false} />}
            <h1 className="cinema-section-title">Booking confirmed</h1>
            {state === 'loading' && <p className="mt-6 cinema-muted">Loading ticket…</p>}
            {state === 'error' && <div className="mt-6"><StatusMessage tone="error">{message}</StatusMessage></div>}
            {state === 'ready' && summary && (
                <article className="cinema-panel mt-6 max-w-xl">
                    <StatusMessage tone="success">Tickets and food on this checkout were confirmed. Show this QR or ticket reference at the door.</StatusMessage>

                    {ticketReference && (
                        <div className="mt-5 rounded-lg border border-brand/40 bg-brand/10 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Ticket reference</p>
                            <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-mist">{ticketReference}</p>
                            <p className="mt-1 text-xs text-white/55">Staff can type this code on Ticket check-in if the QR cannot be scanned.</p>
                        </div>
                    )}

                    <h2 className="mt-5 text-2xl font-semibold text-mist">{summary.booking?.movie}</h2>
                    <p className="mt-2 cinema-muted">{summary.booking?.cinema} · {summary.booking?.screen}</p>
                    <p className="cinema-muted">{manilaWhen(summary.booking?.starts_at)}</p>
                    <p className="mt-3 text-sm text-white/80">Booking #{summary.booking?.id}</p>
                    <p className="text-sm text-white/80">Seats {summary.booking?.seats?.map((seat) => seat.label).join(', ')}</p>
                    <p className="text-sm text-white/80">Ticket total {pesos(summary.booking?.subtotal_cents)}</p>
                    {summary.food && (
                        <div className="mt-4 rounded-lg border border-white/10 bg-navy-deep/50 p-3 text-sm">
                            <p className="font-semibold text-mist">Food order #{summary.food.id} · {summary.food.payment_status}</p>
                            <ul className="mt-2 space-y-1 text-white/75">
                                {(summary.food.items || []).map((item) => (
                                    <li key={`${item.name}-${item.quantity}`}>
                                        {item.quantity} × {item.name} · {pesos(item.line_total_cents)}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2 font-semibold text-mist">Food total {pesos(summary.food.subtotal_cents)}</p>
                        </div>
                    )}
                    {svg ? (
                        <div className="mt-5 max-w-[240px] rounded-lg bg-mist p-3" aria-label="Ticket QR code" dangerouslySetInnerHTML={{ __html: svg }} />
                    ) : (
                        <div className="mt-5"><StatusMessage tone="error">The ticket code could not be shown.</StatusMessage></div>
                    )}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/tickets" className="cinema-button">My Tickets</Link>
                        <Link to="/" className="cinema-button-secondary">Browse movies</Link>
                    </div>
                </article>
            )}
        </CustomerLayout>
    );
}
