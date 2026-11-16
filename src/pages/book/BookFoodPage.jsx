import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import { siteApi } from '../../api/site';
import BookingGate from '../../components/BookingGate';
import StatusMessage from '../../components/StatusMessage';
import { useCheckoutDraft } from '../../stores/checkoutDraft';
import { mediaUrl, pesos } from '../../utils/format';

export default function BookFoodPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const patchDraft = useCheckoutDraft((state) => state.patchDraft);
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [foodTab, setFoodTab] = useState('all');
    const [paymentMethod, setPaymentMethod] = useState(draft?.paymentMethod || 'cash');
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const [siteLimit, setSiteLimit] = useState(null);

    useEffect(() => {
        let active = true;
        setQuantities(Object.fromEntries((draft?.items || []).map((item) => [item.product_id, item.quantity])));
        catalogApi.food(draft.cinemaId)
            .then((rows) => {
                if (!active) return;
                setProducts(rows);
                setState('ready');
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.message || 'Food could not be loaded.');
                    setState('error');
                }
            });

        return () => { active = false; };
    }, [draft?.cinemaId]);

    useEffect(() => {
        if (draft?.orderQuantityLimit) {
            return undefined;
        }

        let active = true;
        siteApi.content()
            .then((data) => {
                if (!active) return;
                const next = data.limits?.order_quantity_limit ?? null;
                setSiteLimit(next);
                if (next != null) {
                    patchDraft({ orderQuantityLimit: next });
                }
            })
            .catch(() => {});

        return () => { active = false; };
    }, [draft?.orderQuantityLimit, patchDraft]);

    const foodCategories = useMemo(
        () => [...new Set(products.map((product) => product.category).filter(Boolean))],
        [products],
    );
    const visibleProducts = useMemo(() => {
        if (foodTab === 'all') return products;

        return products.filter((product) => product.category === foodTab);
    }, [products, foodTab]);

    const limit = draft?.orderQuantityLimit ?? siteLimit;
    const snackLines = products
        .map((product) => ({ product, quantity: quantities[product.id] || 0 }))
        .filter((line) => line.quantity > 0);
    const foodTotal = snackLines.reduce((sum, line) => sum + line.product.price_cents * line.quantity, 0);
    const ticketTotal = (draft?.ticketUnitCents || 0) * (draft?.seatIds?.length || 0);

    const bumpQty = (productId, delta) => {
        if (limit == null) {
            return;
        }

        setQuantities((current) => ({
            ...current,
            [productId]: Math.min(limit, Math.max(0, (current[productId] || 0) + delta)),
        }));
    };

    const saveAndGo = (includeFood) => {
        const lines = includeFood ? snackLines : [];
        patchDraft({
            items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
            itemDetails: lines.map((line) => ({
                product_id: line.product.id,
                name: line.product.name,
                quantity: line.quantity,
                price_cents: line.product.price_cents,
            })),
            paymentMethod,
        });
        navigate(`/movies/${id}/book/review`);
    };

    return (
        <BookingGate step="food">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <section className="cinema-panel">
                    <h1 className="cinema-section-title">Food & drinks</h1>
                    <p className="mt-2 cinema-muted">
                        Optional for <span className="text-mist">{draft?.cinemaName}</span>. You can skip and pay for tickets only.
                    </p>
                    {state === 'loading' && <p className="mt-4 cinema-muted">Loading food…</p>}
                    {state === 'error' && <div className="mt-4"><StatusMessage tone="error">{message}</StatusMessage></div>}
                    {state === 'ready' && products.length === 0 && (
                        <div className="mt-4"><StatusMessage>No food listed for this branch. Continue to review.</StatusMessage></div>
                    )}
                    {state === 'ready' && products.length > 0 && (
                        <>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <button type="button" className={foodTab === 'all' ? 'cinema-button !py-2' : 'cinema-button-secondary !py-2'} onClick={() => setFoodTab('all')}>All</button>
                                {foodCategories.map((name) => (
                                    <button key={name} type="button" className={foodTab === name ? 'cinema-button !py-2' : 'cinema-button-secondary !py-2'} onClick={() => setFoodTab(name)}>{name}</button>
                                ))}
                            </div>
                            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                                {visibleProducts.map((product) => {
                                    const qty = quantities[product.id] || 0;

                                    return (
                                        <li key={product.id} className="overflow-hidden rounded-xl border border-white/10 bg-mist text-ink">
                                            <div className="aspect-[4/3] bg-navy-mid/20">
                                                {product.image_url ? (
                                                    <img src={mediaUrl(product.image_url)} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-sm font-semibold text-navy-mid/70">{product.name}</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="mt-1 text-sm">{pesos(product.price_cents)}</p>
                                                <div className="mt-3 flex items-center justify-end gap-2">
                                                    <button type="button" className="cinema-stepper" onClick={() => bumpQty(product.id, -1)}>−</button>
                                                    <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                                                    <button type="button" className="cinema-stepper" onClick={() => bumpQty(product.id, 1)}>+</button>
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
                    <h2 className="text-lg font-semibold text-mist">Running total</h2>
                    <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-white/60">Tickets</dt><dd>{pesos(ticketTotal)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-white/60">Food</dt><dd>{pesos(foodTotal)}</dd></div>
                        <div className="flex justify-between gap-3 font-semibold text-mist"><dt>Combined</dt><dd>{pesos(ticketTotal + foodTotal)}</dd></div>
                    </dl>
                    <div className="mt-5 space-y-3">
                        <button type="button" className="cinema-button w-full" onClick={() => saveAndGo(true)}>
                            {snackLines.length ? 'Continue to review' : 'Skip food, continue'}
                        </button>
                        {snackLines.length > 0 && (
                            <button type="button" className="cinema-button-secondary w-full" onClick={() => saveAndGo(false)}>Clear food & continue</button>
                        )}
                        <button
                            type="button"
                            className="cinema-button-secondary w-full"
                            onClick={() => {
                                const lines = snackLines;
                                patchDraft({
                                    items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
                                    itemDetails: lines.map((line) => ({
                                        product_id: line.product.id,
                                        name: line.product.name,
                                        quantity: line.quantity,
                                        price_cents: line.product.price_cents,
                                    })),
                                    paymentMethod,
                                });
                                navigate(`/movies/${id}/book/seats`);
                            }}
                        >
                            Back to seats
                        </button>
                    </div>
                </aside>
            </div>
        </BookingGate>
    );
}
