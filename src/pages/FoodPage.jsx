import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../api/bookings';
import { catalogApi } from '../api/catalog';
import StatusMessage from '../components/StatusMessage';
import CustomerLayout from '../layouts/CustomerLayout';
import { useCheckoutDraft } from '../stores/checkoutDraft';
import { manilaWhen, mediaUrl, pesos } from '../utils/format';

export default function FoodPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const clearDraft = useCheckoutDraft((state) => state.clearDraft);
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [foodTab, setFoodTab] = useState('all');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [notice, setNotice] = useState('');

    const validDraft = draft
        && Number(draft.movieId) === Number(id)
        && draft.showtimeId
        && Array.isArray(draft.seatIds)
        && draft.seatIds.length > 0;

    useEffect(() => {
        if (!validDraft) {
            setState('missing');
            return undefined;
        }

        let active = true;
        setState('loading');
        setQuantities(
            Object.fromEntries((draft.items || []).map((item) => [item.product_id, item.quantity])),
        );
        setPaymentMethod(draft.paymentMethod || 'cash');

        catalogApi.food(draft.cinemaId)
            .then((rows) => {
                if (active) {
                    setProducts(rows);
                    setState('ready');
                }
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.message || 'Food could not be loaded for this branch.');
                    setState('error');
                }
            });

        return () => {
            active = false;
        };
    }, [validDraft, draft?.cinemaId, draft?.movieId, id]);

    const foodCategories = useMemo(
        () => [...new Set(products.map((product) => product.category).filter(Boolean))],
        [products],
    );

    const visibleProducts = useMemo(() => {
        if (foodTab === 'all') {
            return products;
        }

        return products.filter((product) => product.category === foodTab);
    }, [products, foodTab]);

    const limit = draft?.orderQuantityLimit || 20;
    const snackLines = products
        .map((product) => ({ product, quantity: quantities[product.id] || 0 }))
        .filter((line) => line.quantity > 0);
    const foodTotal = snackLines.reduce((sum, line) => sum + line.product.price_cents * line.quantity, 0);
    const ticketTotal = (draft?.ticketUnitCents || 0) * (draft?.seatIds?.length || 0);
    const combined = ticketTotal + foodTotal;

    const bumpQty = (productId, delta) => {
        setQuantities((current) => {
            const next = Math.min(limit, Math.max(0, (current[productId] || 0) + delta));

            return { ...current, [productId]: next };
        });
    };

    const checkout = async (includeFood) => {
        if (submitting || !validDraft) {
            return;
        }

        setSubmitting(true);
        setNotice('');

        const items = includeFood
            ? snackLines.map((line) => ({
                product_id: line.product.id,
                quantity: line.quantity,
            }))
            : [];

        patchDraft({
            items,
            paymentMethod,
        });

        try {
            const payload = {
                showtime_id: draft.showtimeId,
                seat_ids: draft.seatIds,
                phone: draft.phone,
            };

            if (items.length > 0) {
                payload.items = items;
                payload.payment_method = paymentMethod;
                payload.idempotency_key = crypto.randomUUID();
            }

            const result = await bookingApi.hold(payload);
            clearDraft();
            navigate(`/bookings/${result.data.id}/payment`);
        } catch (error) {
            if (error.status === 401) {
                navigate('/login');
                return;
            }

            setNotice(error.message || 'Those seats could not be held.');
        } finally {
            setSubmitting(false);
        }
    };

    if (state === 'missing') {
        return (
            <CustomerLayout>
                <StatusMessage tone="error">Start from a movie page, choose seats, then continue here.</StatusMessage>
                <Link to={id ? `/movies/${id}` : '/'} className="cinema-button mt-5 inline-flex">Back to movie</Link>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <p className="text-sm text-white/55">
                <Link to={`/movies/${id}`} className="transition hover:text-brand">Back to seats</Link>
                <span className="mx-2 text-white/25">/</span>
                Food
            </p>
            <h1 className="mt-2 cinema-section-title">Food, optional</h1>
            <p className="mt-2 max-w-2xl cinema-muted">
                Add snacks for <span className="text-mist">{draft?.cinemaName}</span>. Tickets and food are paid together on the next page.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                <section className="cinema-panel">
                    {state === 'loading' && <p className="cinema-muted">Loading food for this branch…</p>}
                    {state === 'error' && <StatusMessage tone="error">{message}</StatusMessage>}
                    {state === 'ready' && products.length === 0 && (
                        <StatusMessage>No food is listed for this cinema branch yet. You can continue with tickets only.</StatusMessage>
                    )}
                    {state === 'ready' && products.length > 0 && (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={foodTab === 'all' ? 'cinema-button !py-2' : 'cinema-button-secondary !py-2'}
                                    onClick={() => setFoodTab('all')}
                                >
                                    All
                                </button>
                                {foodCategories.map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        className={foodTab === name ? 'cinema-button !py-2' : 'cinema-button-secondary !py-2'}
                                        onClick={() => setFoodTab(name)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                            <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {visibleProducts.map((product) => {
                                    const qty = quantities[product.id] || 0;

                                    return (
                                        <li key={product.id} className="overflow-hidden rounded-xl border border-white/10 bg-mist text-ink shadow-cinema">
                                            <div className="aspect-[4/3] bg-navy-mid/20">
                                                {product.image_url ? (
                                                    <img src={mediaUrl(product.image_url)} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-sm font-semibold text-navy-mid/70">
                                                        {product.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <p className="font-semibold leading-snug">{product.name}</p>
                                                {product.category && (
                                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{product.category}</p>
                                                )}
                                                <p className="mt-2 text-sm font-medium text-navy-mid">{pesos(product.price_cents)}</p>
                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-navy-mid/70">Qty</span>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" className="cinema-stepper" onClick={() => bumpQty(product.id, -1)} aria-label={`Decrease ${product.name}`}>−</button>
                                                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                                                        <button type="button" className="cinema-stepper" onClick={() => bumpQty(product.id, 1)} aria-label={`Increase ${product.name}`}>+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {snackLines.length > 0 && (
                                <label className="mt-5 block text-sm font-semibold text-white/80">
                                    Payment method
                                    <select className="cinema-field mt-2 max-w-xs" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                    </select>
                                </label>
                            )}
                        </>
                    )}
                </section>

                <aside className="cinema-panel h-fit">
                    <h2 className="text-lg font-semibold text-mist">Your order</h2>
                    <p className="mt-2 text-sm text-white/80">{draft?.movieTitle}</p>
                    <p className="cinema-muted">{draft?.cinemaName}</p>
                    <p className="cinema-muted">{manilaWhen(draft?.startsAt)} · {draft?.screenName}</p>
                    <p className="mt-3 text-sm text-brand">Seats: {(draft?.seatLabels || []).join(', ')}</p>
                    <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-white/60">Tickets</dt><dd>{pesos(ticketTotal)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-white/60">Food</dt><dd>{pesos(foodTotal)}</dd></div>
                        <div className="flex justify-between gap-3 text-base font-semibold text-mist"><dt>Combined total</dt><dd>{pesos(combined)}</dd></div>
                    </dl>
                    {notice && <div className="mt-4"><StatusMessage tone="error">{notice}</StatusMessage></div>}
                    <div className="mt-5 space-y-3">
                        <button
                            type="button"
                            className="cinema-button w-full"
                            disabled={submitting || state === 'loading'}
                            onClick={() => checkout(true)}
                        >
                            {submitting ? 'Holding seats…' : snackLines.length > 0 ? 'Hold seats & food, then pay' : 'Hold seats, then pay'}
                        </button>
                        {snackLines.length > 0 && (
                            <button
                                type="button"
                                className="cinema-button-secondary w-full"
                                disabled={submitting}
                                onClick={() => checkout(false)}
                            >
                                Skip food, pay tickets only
                            </button>
                        )}
                    </div>
                </aside>
            </div>
        </CustomerLayout>
    );
}
