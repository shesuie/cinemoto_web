export default function SeatMap({ seats, selectedIds, onToggle }) {
    const rows = seats.reduce((groups, seat) => {
        const key = seat.row || '?';
        groups[key] = groups[key] || [];
        groups[key].push(seat);

        return groups;
    }, {});

    return (
        <div className="space-y-4 overflow-x-auto rounded-xl bg-navy-deep/60 p-4 sm:p-6">
            <div className="mx-auto mb-6 h-3 max-w-md rounded-[50%] bg-seat-screen shadow-[0_0_24px_rgba(41,128,185,0.55)]" />
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Screen</p>
            <div className="space-y-2">
                {Object.entries(rows).map(([row, rowSeats]) => (
                    <div key={row} className="flex min-w-max items-center justify-center gap-2">
                        <span className="w-6 text-center text-xs font-semibold text-white/50">{row}</span>
                        {rowSeats.map((seat) => {
                            const selected = selectedIds.map(Number).includes(Number(seat.id));
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
                                    key={seat.id}
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
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
