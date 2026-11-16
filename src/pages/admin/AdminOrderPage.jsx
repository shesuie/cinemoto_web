import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';

function methodLabel(method) {
    if (method === 'card') {
        return 'Card at the cinema';
    }
    if (method === 'cash') {
        return 'Cash at the cinema';
    }

    return 'Not recorded';
}

export default function AdminOrderPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.show(`orders/${id}`)
            .then((payload) => setOrder(payload.data))
            .catch((failure) => setError(failure.message || 'The order could not be loaded.'));
    }, [id]);

    return (
        <AdminLayout header={order ? `Order ${order.id}` : 'Order'}>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {!order && !error && <p className="text-sm text-gray-500">Loading the order…</p>}
            {order && (
                <div className="mx-auto max-w-3xl space-y-4">
                    <section className="rounded-lg bg-white p-5 shadow-sm">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-gray-500">Customer</dt><dd>{order.customer} · {order.email}</dd></div>
                            <div><dt className="text-gray-500">Branch</dt><dd>{order.cinema || 'Not recorded'}</dd></div>
                            <div><dt className="text-gray-500">Order status</dt><dd>{order.status}</dd></div>
                            <div><dt className="text-gray-500">Payment status</dt><dd>{order.payment_status}</dd></div>
                            <div><dt className="text-gray-500">Payment method</dt><dd>{methodLabel(order.payment_method)}</dd></div>
                            <div><dt className="text-gray-500">Provider</dt><dd>{order.provider || 'No payment gateway is connected.'}</dd></div>
                            <div><dt className="text-gray-500">Total</dt><dd>{pesos(order.total_cents)}</dd></div>
                            <div>
                                <dt className="text-gray-500">Booking</dt>
                                <dd>{order.booking_id ? <Link className="admin-link" to={`/admin/bookings/${order.booking_id}`}>Booking #{order.booking_id}</Link> : 'No ticket booking'}</dd>
                            </div>
                        </dl>
                    </section>
                    <section className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-[#1A2130]">Items</h2>
                        {order.items.length === 0 ? <p className="mt-2 text-sm text-gray-500">This order has no items.</p> : (
                            <ul className="mt-3 space-y-2 text-sm">
                                {order.items.map((item) => (
                                    <li key={item.id}>{item.product_name} × {item.quantity} · {pesos(item.unit_price_cents)} each · {pesos(item.line_total_cents)}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
