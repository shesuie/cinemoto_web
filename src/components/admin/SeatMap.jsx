export function labelsIn(rows) {
    const labels = [];
    rows.forEach((row) => {
        row.sections.forEach((section) => {
            section.seats.forEach((number) => {
                if (number !== null && number !== '') {
                    labels.push(`${String(row.label).toUpperCase()}${number}`);
                }
            });
        });
    });

    return labels;
}

export function summarize(rows, edges = {}) {
    const labels = labelsIn(rows);
    const sections = rows[0]?.sections?.length || 0;
    const cross = rows.filter((row) => row.cross_aisle_after).length;

    return {
        seats: labels.length,
        rows: rows.length,
        sections,
        aisles: Math.max(0, sections - 1) + cross + (edges.left ? 1 : 0) + (edges.right ? 1 : 0),
        duplicates: [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))],
    };
}

function AisleLabel() {
    return <span className="w-8 shrink-0 text-center text-[9px] font-semibold uppercase tracking-wider text-[#8b97ad]">Aisle</span>;
}

export default function SeatMap({ rows = [], booked = [], selectedKey = '', onSelect, editable = false, size = 36, aisleLeft = false, aisleRight = false }) {
    const bookedSet = new Set(booked);

    return (
        <div className="overflow-x-auto">
            <div className="mx-auto w-max min-w-full px-2 py-4">
                <div className="mx-auto mb-6 flex h-10 w-[min(100%,28rem)] items-center justify-center rounded-t-[2rem] bg-white text-xs font-semibold tracking-[0.25em] text-[#1A2130]">SCREEN</div>
                <div className="space-y-2">
                    {rows.map((row, rowIndex) => (
                        <div key={`${row.label}-${rowIndex}`}>
                            <div className="flex items-center justify-center gap-3">
                                <span className="w-6 shrink-0 text-center text-xs font-semibold text-[#c084fc]">{row.label}</span>
                                {aisleLeft && <AisleLabel />}
                                {row.sections.map((section, sectionIndex) => (
                                    <div key={`${row.label}-section-${sectionIndex}`} className="flex items-center gap-3">
                                        {sectionIndex > 0 && <AisleLabel />}
                                        <div className="flex gap-1">
                                            {section.seats.map((number, seatIndex) => {
                                                const key = `${rowIndex}-${sectionIndex}-${seatIndex}`;
                                                if (number === null || number === '') {
                                                    return <span key={key} style={{ width: size, height: size }} className="inline-block shrink-0" />;
                                                }
                                                const label = `${row.label}${number}`;
                                                const locked = bookedSet.has(label);

                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        title={label}
                                                        style={{ width: size, height: size }}
                                                        className={`inline-flex shrink-0 items-center justify-center rounded bg-[#304463] text-[10px] font-medium text-white ${locked ? 'ring-2 ring-amber-400' : ''} ${selectedKey === key ? 'outline outline-2 outline-offset-2 outline-[#3FA2F6]' : ''}`}
                                                        onClick={() => onSelect?.({ rowIndex, sectionIndex, seatIndex, label, locked })}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                            {editable && (
                                                <button type="button" style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded border border-dashed border-white/30 text-xs text-white/70" onClick={() => onSelect?.({ rowIndex, sectionIndex, seatIndex: -1, add: true })}>+</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {aisleRight && <AisleLabel />}
                            </div>
                            {row.cross_aisle_after && (
                                <div className="mx-auto my-3 w-[min(100%,36rem)] border-y border-white/20 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9aa6bd]">Cross aisle</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
