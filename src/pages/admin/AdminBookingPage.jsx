import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';

function Row({ label, children }) {
    return (
        <div>
            <dt className="text-gray-500">{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

export default function AdminBookingPage() {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.show(`bookings/${id}`)
            .then((payload) => setBooking(payload.data))
            .catch((failure) => setError(failure.message || 'The booking could not be loaded.'));
    }, [id]);

    return (
        <AdminLayout header={booking ? `Booking ${booking.id}` : 'Booking'}>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {!booking && !error && <p className="text-sm text-gray-500">Loading the booking…</p>}
            {booking && (
                <div className="mx-auto max-w-3xl space-y-4">
                    <section className="rounded-lg bg-white p-5 shadow-sm">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <Row label="Customer">{booking.customer} · {booking.email}</Row>
                            <Row label="Status">{booking.status}</Row>
                            <Row label="Payment">{booking.payment_status}</Row>
                            <Row label="Movie">{booking.movie}</Row>
                            <Row label="Cinema">{booking.cinema} · {booking.screen}</Row>
                            <Row label="Starts">{booking.starts_at}</Row>
                            <Row label="Hold expires">{booking.expires_at || 'No hold'}</Row>
                            <Row label="Mobile">{booking.phone || 'Not recorded'}</Row>
                            <Row label="Total">{pesos(booking.total_cents)}</Row>
                            <Row label="Ticket">
                                {booking.ticket.issued
                                    ? (booking.ticket.checked_in_at
                                        ? `Checked in ${booking.ticket.checked_in_at}${booking.ticket.checked_in_by ? ` by ${booking.ticket.checked_in_by}` : ''}${booking.ticket.checked_in_cinema ? ` at ${booking.ticket.checked_in_cinema}` : ''}`
                                        : 'Issued. Not checked in.')
                                    : 'No ticket has been issued.'}
                            </Row>
                        </dl>
                    </section>
                    <section className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-[#1A2130]">Seats</h2>
                        {booking.seats.length === 0 ? <p className="mt-2 text-sm text-gray-500">No seats are attached.</p> : (
                            <ul className="mt-3 space-y-2 text-sm">
                                {booking.seats.map((seat) => (
                                    <li key={seat.id}>{seat.label} · {pesos(seat.price_cents)} · {seat.state}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                    <section className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-[#1A2130]">Food order</h2>
                        {booking.food_order ? (
                            <p className="mt-2 text-sm">
                                <Link className="admin-link" to={`/admin/orders/${booking.food_order.id}`}>Order #{booking.food_order.id}</Link>
                                {' '}· {booking.food_order.status} · {booking.food_order.payment_status} · {pesos(booking.food_order.total_cents)}
                            </p>
                        ) : <p className="mt-2 text-sm text-gray-500">This booking has no food order.</p>}
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
