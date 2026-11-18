function AisleGap() {
    return (
        <span className="w-8 shrink-0 text-center text-[9px] font-semibold uppercase tracking-wider text-white/40">
            Aisle
        </span>
    );
}

function CrossAisle() {
    return (
        <div className="mx-auto my-3 w-[min(100%,36rem)] border-y border-white/20 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Cross aisle
        </div>
    );
}

function rowsFromSeats(seats = []) {
    const grouped = new Map();

    seats.forEach((seat) => {
        const key = seat.row || '?';
        const numbers = grouped.get(key) || [];
        numbers.push(seat.number);
        grouped.set(key, numbers);
    });

    return [...grouped.entries()].map(([label, numbers]) => ({
        label,
        cross_aisle_after: false,
        sections: [{ seats: numbers }],
    }));
}

function SeatButton({ seat, selected, onToggle }) {
    if (!seat) {
        return <span className="inline-block h-10 w-10 shrink-0" />;
    }

    const held = seat.state === 'held';
    const taken = seat.taken && !held;
    let tone = 'bg-seat-open text-ink hover:-translate-y-0.5 hover:bg-seat-hover hover:text-mist hover:shadow-md';

    if (taken) {
        tone = 'cursor-not-allowed bg-seat-taken text-white/80';
    } else if (held) {
        tone = 'cursor-not-allowed bg-amber-300/80 text-ink';
    } else if (selected) {
        tone = 'bg-brand text-mist ring-2 ring-white/40 hover:-translate-y-0.5';
    }

    return (
        <button
            type="button"
            aria-label={`Seat ${seat.label}`}
            aria-pressed={selected}
            disabled={seat.taken}
            className={`h-10 w-10 rounded-md text-xs font-semibold transition duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tone}`}
            onClick={() => onToggle(seat)}
        >
            {seat.number}
        </button>
    );
}

export default function SeatMap({ seats = [], layout = null, selectedIds = [], onToggle }) {
    const byLabel = new Map(seats.map((seat) => [seat.label, seat]));
    const selected = new Set(selectedIds.map(Number));
    const rows = layout?.rows?.length ? layout.rows : rowsFromSeats(seats);
    const aisleLeft = Boolean(layout?.aisle_left);
    const aisleRight = Boolean(layout?.aisle_right);

    return (
        <div className="space-y-4 overflow-x-auto rounded-xl bg-navy-deep/60 p-4 sm:p-6">
            <div className="mx-auto mb-6 h-3 max-w-md rounded-[50%] bg-seat-screen shadow-[0_0_24px_rgba(41,128,185,0.55)]" />
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Screen</p>
            <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                    <div key={`${row.label}-${rowIndex}`}>
                        <div className="flex min-w-max items-center justify-center gap-3">
                            <span className="w-6 shrink-0 text-center text-xs font-semibold text-white/50">{row.label}</span>
                            {aisleLeft && <AisleGap />}
                            {(row.sections || []).map((section, sectionIndex) => (
                                <div key={`${row.label}-section-${sectionIndex}`} className="flex items-center gap-3">
                                    {sectionIndex > 0 && <AisleGap />}
                                    <div className="flex gap-1">
                                        {(section.seats || []).map((number, seatIndex) => {
                                            const key = `${row.label}-${sectionIndex}-${seatIndex}`;
                                            if (number === null || number === '') {
                                                return <span key={key} className="inline-block h-10 w-10 shrink-0" />;
                                            }

                                            const seat = byLabel.get(`${row.label}${number}`);

                                            return (
                                                <SeatButton
                                                    key={key}
                                                    seat={seat}
                                                    selected={seat ? selected.has(Number(seat.id)) : false}
                                                    onToggle={onToggle}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {aisleRight && <AisleGap />}
                        </div>
                        {row.cross_aisle_after && <CrossAisle />}
                    </div>
                ))}
            </div>
        </div>
    );
}
