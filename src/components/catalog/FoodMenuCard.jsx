import { mediaUrl, pesos } from '../../utils/format';

export default function FoodMenuCard({ product, quantity = 0, onDecrease, onIncrease, canOrder = true }) {
    const available = product.is_available !== false;
    const interactive = available && canOrder;

    return (
        <li
            className={`flex flex-col overflow-hidden rounded-xl border bg-navy-deep/60 transition ${
                !available
                    ? 'border-white/10 opacity-90'
                    : quantity > 0
                        ? 'border-brand/60 shadow-ticket'
                        : 'border-white/10 hover:border-white/25'
            }`}
        >
            <div className="relative aspect-[4/3] bg-navy-mid">
                {product.image_url ? (
                    <img
                        src={mediaUrl(product.image_url)}
                        alt=""
                        className={`h-full w-full object-cover ${available ? '' : 'brightness-50 grayscale'}`}
                    />
                ) : (
                    <div className={`flex h-full flex-col items-center justify-center gap-2 px-4 text-center ${available ? '' : 'brightness-75'}`}>
                        <span className="rounded-full bg-brand/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                            {product.category || 'Item'}
                        </span>
                        <span className="text-sm font-semibold text-mist/80">{product.name}</span>
                    </div>
                )}
                {product.category && product.image_url ? (
                    <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-mist backdrop-blur">
                        {product.category}
                    </span>
                ) : null}
                {!available && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
                        <span className="-rotate-12 rounded-md border-2 border-white/80 bg-black/50 px-3 py-1.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-sm">
                            Not available
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <p className={`min-w-0 font-semibold leading-snug ${available ? 'text-mist' : 'text-white/55'}`}>{product.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${available ? 'bg-brand text-mist' : 'bg-white/15 text-white/55'}`}>
                        {pesos(product.price_cents)}
                    </span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                    {available ? (
                        <>
                            <span className="text-xs uppercase tracking-wide text-white/45">Qty</span>
                            <div className="flex items-center gap-2">
                                <button type="button" className="cinema-stepper" aria-label={`Decrease ${product.name}`} disabled={!interactive} onClick={onDecrease}>−</button>
                                <span className="w-6 text-center text-sm font-semibold text-mist">{quantity}</span>
                                <button type="button" className="cinema-stepper" aria-label={`Increase ${product.name}`} disabled={!interactive} onClick={onIncrease}>+</button>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-300/90">Not available for order</p>
                    )}
                </div>
            </div>
        </li>
    );
}
