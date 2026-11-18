import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../api/bookings';
import StatusMessage from '../../components/ui/StatusMessage';
import CustomerLayout from '../../layouts/CustomerLayout';
import { manilaWhen, pesos } from '../../utils/format';

export default function BookingDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [record, setRecord] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        bookingApi.show(id)
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
    }, [id, navigate]);

    const booking = record?.booking;

    return (
        <CustomerLayout>
            <p className="text-sm text-white/55">
                <Link to="/bookings" className="transition hover:text-brand">Bookings</Link>
            </p>
            {state === 'loading' && <p className="mt-6 cinema-muted">Loading booking…</p>}
            {state === 'error' && <div className="mt-6"><StatusMessage tone="error">{message}</StatusMessage></div>}
            {state === 'ready' && booking && (
                <article className="cinema-panel mt-4">
                    <h1 className="text-3xl font-semibold text-mist">{booking.movie}</h1>
                    <p className="mt-2 cinema-muted">{booking.cinema} · {booking.screen} · {manilaWhen(booking.starts_at)}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand">{booking.status}</p>
                    <p className="mt-4 text-sm text-white/80">Seats {booking.seats.map((seat) => seat.label).join(', ')}</p>
                    <p className="text-sm text-white/80">Ticket total {pesos(booking.total_cents)}</p>
                    {booking.status === 'pending' && booking.expires_at && (
                        <p className="mt-2 text-sm font-semibold text-mango-400">Hold expires {manilaWhen(booking.expires_at)}.</p>
                    )}
                    {record.snack_order && (
                        <div className="mt-5 border-t border-white/10 pt-4">
                            <h2 className="font-semibold text-mist">Food order #{record.snack_order.id}</h2>
                            <p className="cinema-muted">Payment status: {record.snack_order.payment_status}</p>
                            <ul className="mt-2 space-y-1 text-sm text-white/80">
                                {record.snack_order.items.map((item) => (
                                    <li key={item.id}>{item.quantity} × {item.name} · {pesos(item.line_total_cents)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                        {booking.status === 'pending' && <Link to={`/bookings/${booking.id}/payment`} className="cinema-button">Review payment</Link>}
                        {booking.status === 'confirmed' && <Link to={`/bookings/${booking.id}/ticket`} className="cinema-button">View ticket</Link>}
                    </div>
                </article>
            )}
        </CustomerLayout>
    );
}
