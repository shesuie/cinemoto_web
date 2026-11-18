import { useEffect, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import ConfirmDialog from './ConfirmDialog';
import SeatMap, { labelsIn, summarize } from './SeatMap';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function maxNumber(row) {
    return row.sections.reduce((max, section) => section.seats.reduce((inner, number) => (number == null ? inner : Math.max(inner, Number(number))), max), 0);
}

function rowHasBooked(row, booked) {
    return row.sections.some((section) => section.seats.some((number) => number != null && booked.has(`${row.label}${number}`)));
}

function builderFrom(map) {
    const rows = map?.rows || [];
    const first = rows[0];
    const numbers = [];
    const splits = [];
    (first?.sections || []).forEach((section, index, all) => {
        const seats = section.seats.filter((number) => number != null).map(Number);
        numbers.push(...seats);
        if (index < all.length - 1 && seats.length) {
            splits.push(seats[seats.length - 1]);
        }
    });

    return {
        rowCount: String(rows.length || 6),
        seatsPerRow: String(numbers.length || 10),
        startNumber: String(numbers[0] || 1),
        aisleAfter: splits.join(', '),
        left: Boolean(map?.aisle_left),
        right: Boolean(map?.aisle_right),
        crossEvery: '0',
    };
}

function buildLayout(builder) {
    const rowCount = Math.min(26, Math.max(1, Number(builder.rowCount) || 1));
    const seatsPerRow = Math.min(40, Math.max(1, Number(builder.seatsPerRow) || 1));
    const start = Math.min(100, Math.max(1, Number(builder.startNumber) || 1));
    const numbers = [];
    for (let index = 0; index < seatsPerRow && start + index <= 100; index += 1) {
        numbers.push(start + index);
    }
    const splits = new Set(
        String(builder.aisleAfter).split(/[^0-9]+/).map(Number).filter((number) => numbers.includes(number) && number !== numbers[numbers.length - 1]),
    );
    const groups = [[]];
    numbers.forEach((number) => {
        groups[groups.length - 1].push(number);
        if (splits.has(number)) {
            groups.push([]);
        }
    });
    const sections = groups.filter((group) => group.length).slice(0, 6).map((seats) => ({ seats }));
    const crossEvery = Math.max(0, Number(builder.crossEvery) || 0);

    return {
        aisle_left: Boolean(builder.left),
        aisle_right: Boolean(builder.right),
        rows: Array.from({ length: rowCount }, (_, index) => ({
            label: String.fromCharCode(65 + index),
            cross_aisle_after: crossEvery > 0 && (index + 1) % crossEvery === 0 && index < rowCount - 1,
            sections: sections.map((section) => ({ seats: [...section.seats] })),
        })),
    };
}

export default function SeatLayoutEditor({ cinemas = [], screens = [], editor = null, canEdit = false, cinemaId = '', onCinema, onScreen, onSaved }) {
    const [draft, setDraft] = useState(editor?.map ? clone(editor.map) : null);
    const [selected, setSelected] = useState(null);
    const [size, setSize] = useState(36);
    const [builder, setBuilder] = useState(builderFrom(editor?.map));
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const booked = new Set(editor?.booked || []);
    const cinemaScreens = screens.filter((screen) => String(screen.cinema_id) === String(cinemaId));
    const summary = draft ? summarize(draft.rows, { left: draft.aisle_left, right: draft.aisle_right }) : null;

    useEffect(() => {
        setDraft(editor?.map ? clone(editor.map) : null);
        setBuilder(builderFrom(editor?.map));
        setSelected(null);
    }, [editor]);

    const guard = (message) => toast.warning(message);
    const update = (recipe) => setDraft((current) => recipe(clone(current)));

    const previewBuild = () => {
        const next = buildLayout(builder);
        const labels = new Set(labelsIn(next.rows));
        const blocked = (editor?.booked || []).filter((label) => !labels.has(label));
        if (blocked.length) {
            toast.error(`Booked seats must stay: ${blocked.slice(0, 12).join(', ')}. Nothing was saved.`);

            return;
        }
        setDraft(next);
        setSelected(null);
    };

    const addSection = () => update((current) => {
        current.rows.forEach((row) => {
            const start = maxNumber(row);
            row.sections.push({ seats: [start + 1, start + 2, start + 3, start + 4] });
        });

        return current;
    });

    const removeSection = () => {
        if (!draft || draft.rows[0].sections.length < 2) {
            return;
        }
        const index = draft.rows[0].sections.length - 1;
        const blocked = draft.rows.some((row) => row.sections[index].seats.some((number) => number != null && booked.has(`${row.label}${number}`)));
        if (blocked) {
            guard('The last section includes a booked seat. Put that seat somewhere in the layout before removing the section.');

            return;
        }
        update((current) => {
            current.rows.forEach((row) => row.sections.pop());

            return current;
        });
    };

    const addRow = () => update((current) => {
        const used = new Set(current.rows.map((row) => row.label));
        let label = 'A';
        for (let index = 0; index < 26; index += 1) {
            const candidate = String.fromCharCode(65 + index);
            if (!used.has(candidate)) {
                label = candidate;
                break;
            }
        }
        current.rows.push({
            label,
            cross_aisle_after: false,
            sections: current.rows[0].sections.map(() => ({ seats: [1, 2, 3, 4] })),
        });

        return current;
    });

    const removeRow = () => {
        if (!draft || draft.rows.length < 2) {
            return;
        }
        const row = draft.rows[draft.rows.length - 1];
        if (rowHasBooked(row, booked)) {
            guard(`Row ${row.label} has a booked seat, so it cannot be removed from the layout.`);

            return;
        }
        update((current) => {
            current.rows.pop();

            return current;
        });
    };

    const onSelect = (target) => {
        if (target.add) {
            update((current) => {
                const row = current.rows[target.rowIndex];
                row.sections[target.sectionIndex].seats.push(Math.min(100, maxNumber(row) + 1));

                return current;
            });

            return;
        }
        setSelected(target);
    };

    const removeSelected = () => {
        if (!selected || selected.seatIndex < 0) {
            return;
        }
        if (selected.locked) {
            guard(`${selected.label} is already on a booking and cannot be removed.`);

            return;
        }
        update((current) => {
            current.rows[selected.rowIndex].sections[selected.sectionIndex].seats.splice(selected.seatIndex, 1);

            return current;
        });
        setSelected(null);
    };

    const gapAfterSelected = () => {
        if (!selected || selected.seatIndex < 0) {
            return;
        }
        update((current) => {
            current.rows[selected.rowIndex].sections[selected.sectionIndex].seats.splice(selected.seatIndex + 1, 0, null);

            return current;
        });
    };

    const rename = (rowIndex, label) => {
        const next = label.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        if (rowHasBooked(draft.rows[rowIndex], booked) && next !== draft.rows[rowIndex].label) {
            guard('This row has a booked seat. Its label cannot change, because the booking still points at that seat.');

            return;
        }
        update((current) => {
            current.rows[rowIndex].label = next;

            return current;
        });
    };

    const askSave = () => {
        if (!draft || !editor) {
            return;
        }
        const stats = summarize(draft.rows);
        if (stats.duplicates.length) {
            toast.error(`${stats.duplicates.join(', ')} appears more than once. Each label can be used once on a screen.`);

            return;
        }
        if (stats.seats < 1) {
            toast.error(MESSAGES.seatLayoutEmpty);

            return;
        }
        const next = new Set(labelsIn(draft.rows));
        const blocked = (editor.booked || []).filter((label) => !next.has(label));
        if (blocked.length) {
            toast.error(`${blocked.slice(0, 12).join(', ')} already belong to a booking. Put them back on the layout. Nothing was saved.`);

            return;
        }
        const omitted = (editor.labels || []).filter((label) => !next.has(label));
        const added = [...next].filter((label) => !(editor.labels || []).includes(label));
        setConfirm({
            title: 'Save this seating layout?',
            message: `${added.length} new seats will be added. ${stats.seats - added.length} seats already on this screen stay as they are. ${omitted.length ? `${omitted.slice(0, 8).join(', ')} will remain in the seat list but will not be shown on the map.` : 'No existing seat is left off the map.'} Booked seats are not changed or deleted.`,
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await adminApi.create('seats/layout', {
                cinema_id: editor.cinema_id,
                screen_id: editor.screen_id,
                layout: draft,
            });
            toast.success(MESSAGES.seatLayoutSaved);
            setConfirm(null);
            onSaved?.();
        } catch (failure) {
            toast.error(failure.message || MESSAGES.seatLayoutSaveFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-[#1A2130]">Seat layout</h2>
            <p className="mt-1 text-sm text-gray-600">Choose a screen, build its rows and aisles, then preview the map. Saving adds the new seats and leaves every existing seat, including booked seats, unchanged.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-600">Cinema
                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" value={cinemaId === '' || cinemaId == null ? '' : String(cinemaId)} onChange={(event) => onCinema?.(event.target.value)}>
                        <option value="">Choose</option>
                        {cinemas.map((cinema) => <option key={cinema.id} value={String(cinema.id)}>{cinema.name}</option>)}
                    </select>
                </label>
                <label className="text-sm text-gray-600">Screen
                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" value={editor?.screen_id == null ? '' : String(editor.screen_id)} onChange={(event) => onScreen?.(event.target.value)}>
                        <option value="">Choose</option>
                        {cinemaScreens.map((screen) => <option key={screen.id} value={String(screen.id)}>{screen.name}</option>)}
                    </select>
                </label>
            </div>
            {editor && draft && (
                <>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1">{summary.seats} seats</span>
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1">{summary.rows} rows</span>
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1">{summary.sections} sections</span>
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1">{summary.aisles} aisles</span>
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1">{editor.count} stored</span>
                        {!editor.saved && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">Not saved yet</span>}
                    </div>
                    {canEdit && (
                        <div className="mt-4 rounded-lg bg-[#f7f8fb] p-4">
                            <h3 className="text-sm font-semibold text-[#1A2130]">Build the layout</h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="text-sm">Rows<input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" type="number" min="1" max="26" value={builder.rowCount} onChange={(event) => setBuilder((current) => ({ ...current, rowCount: event.target.value }))} /></label>
                                <label className="text-sm">Seats per row<input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" type="number" min="1" max="40" value={builder.seatsPerRow} onChange={(event) => setBuilder((current) => ({ ...current, seatsPerRow: event.target.value }))} /></label>
                                <label className="text-sm">First number<input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" type="number" min="1" max="100" value={builder.startNumber} onChange={(event) => setBuilder((current) => ({ ...current, startNumber: event.target.value }))} /></label>
                                <label className="text-sm">Cross aisle every<input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" type="number" min="0" max="12" value={builder.crossEvery} onChange={(event) => setBuilder((current) => ({ ...current, crossEvery: event.target.value }))} /></label>
                                <label className="text-sm sm:col-span-2">Aisle after seat numbers<input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="4, 8" value={builder.aisleAfter} onChange={(event) => setBuilder((current) => ({ ...current, aisleAfter: event.target.value }))} /></label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={builder.left} onChange={(event) => setBuilder((current) => ({ ...current, left: event.target.checked }))} />Left aisle</label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={builder.right} onChange={(event) => setBuilder((current) => ({ ...current, right: event.target.checked }))} />Right aisle</label>
                            </div>
                            <button type="button" className="mt-3 admin-btn" onClick={previewBuild}>Preview layout</button>
                        </div>
                    )}
                    {canEdit && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" className="admin-btn-secondary" onClick={addSection}>Add section</button>
                            <button type="button" className="admin-btn-secondary" onClick={removeSection}>Remove last section</button>
                            <button type="button" className="admin-btn-secondary" onClick={addRow}>Add row</button>
                            <button type="button" className="admin-btn-secondary" onClick={removeRow}>Remove last row</button>
                            <button type="button" className="admin-btn-secondary" onClick={removeSelected}>Remove seat</button>
                            <button type="button" className="admin-btn-secondary" onClick={gapAfterSelected}>Gap after seat</button>
                            <button type="button" className="admin-btn-secondary" onClick={() => setDraft(clone(editor.map))}>Reset</button>
                        </div>
                    )}
                    {canEdit && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {draft.rows.map((row, index) => (
                                <div key={`label-${index}`} className="flex items-center gap-2 rounded-lg bg-[#f7f8fb] px-3 py-2">
                                    <label className="text-xs text-gray-500">Row
                                        <input className="mt-1 h-10 w-16 rounded-lg border border-gray-300 px-2 uppercase" maxLength={8} value={row.label} onChange={(event) => rename(index, event.target.value)} />
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                        <input type="checkbox" checked={row.cross_aisle_after} onChange={() => update((current) => { current.rows[index].cross_aisle_after = !current.rows[index].cross_aisle_after; return current; })} />
                                        Cross aisle after
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 rounded-lg bg-[#1A2130]">
                        <SeatMap rows={draft.rows} booked={editor.booked || []} aisleLeft={draft.aisle_left} aisleRight={draft.aisle_right} editable={canEdit} selectedKey={selected ? `${selected.rowIndex}-${selected.sectionIndex}-${selected.seatIndex}` : ''} onSelect={canEdit ? onSelect : undefined} size={size} />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">Amber rings are seats already used by a booking. A plus adds a seat to that section. Empty gaps are not stored as seats.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="admin-btn-secondary" onClick={() => setSize((current) => Math.max(28, current - 4))}>Smaller</button>
                        <button type="button" className="admin-btn-secondary" onClick={() => setSize((current) => Math.min(48, current + 4))}>Larger</button>
                        {canEdit && <button type="button" className="admin-btn" onClick={askSave}>Save layout</button>}
                    </div>
                </>
            )}
            {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel="Save layout" busy={saving} onClose={() => setConfirm(null)} onConfirm={save} />}
        </section>
    );
}
