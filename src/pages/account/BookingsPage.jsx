import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/bookings';
import StatusMessage from '../../components/ui/StatusMessage';
import CustomerLayout from '../../layouts/CustomerLayout';
import { manilaWhen, pesos } from '../../utils/format';

export default function BookingsPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        bookingApi.list()
            .then((data) => {
                setRows(data);
                setState('ready');
            })
            .catch((error) => {
                if (error.status === 401) {
                    navigate('/login');
                    return;
                }
                setMessage(error.message);
                setState('error');
            });
    }, [navigate]);

    return (
        <CustomerLayout>
            <h1 className="cinema-section-title">My Tickets</h1>
            <p className="mt-2 cinema-muted">Your booking history and QR tickets.</p>
            {state === 'loading' && <p className="mt-6 cinema-muted">Loading tickets…</p>}
            {state === 'error' && <div className="mt-6"><StatusMessage tone="error">{message}</StatusMessage></div>}
            {state === 'ready' && rows.length === 0 && <div className="mt-6"><StatusMessage>You have no tickets yet. Book a movie to get started.</StatusMessage></div>}
            {state === 'ready' && rows.length > 0 && (
                <ul className="mt-6 space-y-4">
                    {rows.map((booking) => (
                        <li key={booking.id} className="cinema-panel">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-mist">{booking.movie}</h2>
                                    <p className="mt-1 cinema-muted">{booking.cinema} · {booking.screen}</p>
                                    <p className="cinema-muted">{manilaWhen(booking.starts_at)}</p>
                                    <p className="mt-2 text-sm text-white/80">
                                        Seats {booking.seats.map((seat) => seat.label).join(', ')} · {pesos(booking.total_cents)}
                                    </p>
                                </div>
                                <p className="rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                                    {booking.status}
                                </p>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Link to={`/bookings/${booking.id}`} className="cinema-button-secondary">Details</Link>
                                {booking.status === 'pending' && <Link to={`/bookings/${booking.id}/payment`} className="cinema-button">Review payment</Link>}
                                {booking.status === 'confirmed' && <Link to={`/bookings/${booking.id}/ticket`} className="cinema-button">Ticket</Link>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </CustomerLayout>
    );
}
