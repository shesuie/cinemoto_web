import jsQR from 'jsqr';
import { MESSAGES } from '../../constants/messages';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';

const statusLabel = {
    valid: 'Valid',
    admitted: 'Checked in',
    used: 'Already used',
    unpaid: 'Unpaid',
    pending: 'Pending',
    expired: 'Expired',
    cancelled: 'Cancelled',
    invalid: 'Invalid',
    wrong_showtime: 'Different showtime',
};

const statusTone = {
    valid: 'border-emerald-600 bg-emerald-50 text-emerald-900',
    admitted: 'border-emerald-600 bg-emerald-50 text-emerald-900',
    used: 'border-amber-500 bg-amber-50 text-amber-950',
    unpaid: 'border-amber-500 bg-amber-50 text-amber-950',
    pending: 'border-amber-500 bg-amber-50 text-amber-950',
    expired: 'border-stone-400 bg-stone-100 text-stone-800',
    cancelled: 'border-red-600 bg-red-50 text-red-900',
    invalid: 'border-red-600 bg-red-50 text-red-900',
    wrong_showtime: 'border-red-600 bg-red-50 text-red-900',
};

function when(value) {
    if (!value) {
        return 'Time unavailable';
    }

    return new Date(value).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function ticketCode(value) {
    return String(value || '').trim().toLowerCase();
}

function fieldError(failure, field) {
    const lines = failure?.errors?.[field];

    return Array.isArray(lines) ? lines[0] : failure?.message || 'The ticket could not be checked.';
}

export default function TicketVerificationPage() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scanLock = useRef(false);
    const mounted = useRef(true);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraMessage, setCameraMessage] = useState('');
    const [codeMessage, setCodeMessage] = useState('');
    const [bookingMessage, setBookingMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [cinemas, setCinemas] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [filters, setFilters] = useState({ cinema_id: '', date: '', branch_locked: false });
    const [showtimeId, setShowtimeId] = useState('');
    const [token, setToken] = useState('');
    const [ticketReference, setTicketReference] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [lookupBy, setLookupBy] = useState('token');
    const [referenceMessage, setReferenceMessage] = useState('');
    const [result, setResult] = useState(null);

    const stopCamera = () => {
        scanLock.current = true;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOn(false);
    };

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, []);

    const loadScreenings = async (cinemaId, date) => {
        const body = await adminApi.list('tickets/check', { cinema_id: cinemaId, date });
        const data = body.data || {};
        setCinemas(data.cinemas || []);
        setShowtimes(data.showtimes || []);
        setFilters(data.filters || { cinema_id: '', date: '', branch_locked: false });
        setShowtimeId((current) => (data.showtimes || []).some((showtime) => String(showtime.id) === String(current)) ? current : '');

        return data;
    };

    useEffect(() => {
        loadScreenings('', '')
            .catch((failure) => setCodeMessage(failure.message || 'The screenings could not be loaded.'))
            .finally(() => setLoading(false));
    }, []);

    const inspect = async (code) => {
        const normalized = ticketCode(code);
        setToken(normalized);
        setLookupBy('token');
        setCodeMessage('');
        setResult(null);

        if (!/^[a-f0-9]{64}$/.test(normalized)) {
            setCodeMessage('That code is not a valid ticket.');

            return;
        }

        if (!showtimeId) {
            setCameraMessage('Choose the cinema, date, and showtime, then scan again.');

            return;
        }

        setBusy(true);
        try {
            const body = await adminApi.post('tickets/inspect', {
                token: normalized,
                showtime_id: Number(showtimeId),
                cinema_id: filters.cinema_id || null,
                date: filters.date || null,
            });
            setResult(body.data || null);
            setCameraMessage('');
        } catch (failure) {
            setCodeMessage(fieldError(failure, 'token'));
        } finally {
            setBusy(false);
        }
    };

    const startCamera = async () => {
        setCameraMessage('');

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraMessage('This browser cannot open a camera. Type the ticket code instead.');

            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: 'environment' } },
            });

            if (!mounted.current) {
                stream.getTracks().forEach((track) => track.stop());

                return;
            }

            streamRef.current = stream;
            scanLock.current = false;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraOn(true);
            const detector = 'BarcodeDetector' in window
                ? new window.BarcodeDetector({ formats: ['qr_code'] })
                : null;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            const tick = async () => {
                if (!mounted.current || !streamRef.current || scanLock.current) {
                    return;
                }

                const video = videoRef.current;
                let raw = '';

                try {
                    if (detector && video) {
                        const codes = await detector.detect(video);
                        raw = codes[0]?.rawValue || '';
                    }
                } catch {
                    raw = '';
                }

                if (!raw && video && context && video.readyState >= 2 && video.videoWidth > 0) {
                    try {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const image = context.getImageData(0, 0, canvas.width, canvas.height);
                        raw = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || '';
                    } catch {
                        raw = '';
                    }
                }

                if (raw) {
                    scanLock.current = true;
                    stopCamera();
                    inspect(raw);

                    return;
                }

                if (streamRef.current && !scanLock.current) {
                    window.setTimeout(tick, 250);
                }
            };
            window.setTimeout(tick, 250);
        } catch (error) {
            stopCamera();
            setCameraMessage(error?.name === 'NotAllowedError'
                ? 'Camera permission was blocked. Type the ticket code instead.'
                : 'The camera could not be started. Type the ticket code instead.');
        }
    };

    const applyFilters = async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
            await loadScreenings(filters.cinema_id, filters.date);
        } catch (failure) {
            setCodeMessage(failure.message || 'The screenings could not be loaded.');
        } finally {
            setBusy(false);
        }
    };

    const lookupReference = async (event) => {
        event.preventDefault();
        setReferenceMessage('');
        setResult(null);
        setLookupBy('reference');
        const reference = String(ticketReference || '').trim().toUpperCase();
        setTicketReference(reference);

        if (!showtimeId) {
            setReferenceMessage('Choose the showtime before looking up a ticket reference.');

            return;
        }

        setBusy(true);
        try {
            const body = await adminApi.post('tickets/find', {
                ticket_reference: reference,
                showtime_id: Number(showtimeId),
                cinema_id: filters.cinema_id || null,
                date: filters.date || null,
            });
            setResult(body.data || null);
        } catch (failure) {
            setReferenceMessage(fieldError(failure, 'ticket_reference'));
        } finally {
            setBusy(false);
        }
    };

    const lookupBooking = async (event) => {
        event.preventDefault();
        setBookingMessage('');
        setResult(null);
        setLookupBy('booking');

        if (!showtimeId) {
            setBookingMessage('Choose the showtime before looking up a booking.');

            return;
        }

        setBusy(true);
        try {
            const body = await adminApi.post('tickets/find', {
                booking_id: Number(bookingId),
                showtime_id: Number(showtimeId),
                cinema_id: filters.cinema_id || null,
                date: filters.date || null,
            });
            setResult(body.data || null);
        } catch (failure) {
            setBookingMessage(fieldError(failure, 'booking_id'));
        } finally {
            setBusy(false);
        }
    };

    const admit = async (event) => {
        event.preventDefault();
        setBusy(true);
        let payload = { showtime_id: Number(showtimeId) };
        let errorField = 'token';

        if (lookupBy === 'reference' || (!token && ticketReference)) {
            payload = { ...payload, ticket_reference: String(ticketReference || result?.ticket_reference || '').trim().toUpperCase() };
            errorField = 'ticket_reference';
        } else if (lookupBy === 'booking' && !token) {
            payload = { ...payload, booking_id: Number(bookingId || result?.booking_id) };
            errorField = 'booking_id';
        } else {
            payload = { ...payload, token: ticketCode(token) };
        }

        try {
            const body = await adminApi.post('tickets/check-in', payload);
            setResult(body.data || null);
            toast.success(body.message || MESSAGES.ticketCheckedIn);
        } catch (failure) {
            const message = fieldError(failure, errorField);
            setCodeMessage(message);
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    const money = (cents) => `₱${((Number(cents) || 0) / 100).toFixed(2)}`;

    const checkInText = result?.checked_in_at
        ? `Checked in ${when(result.checked_in_at)}${result.checked_in_by ? ` by ${result.checked_in_by}` : ''}${result.checked_in_cinema ? ` at ${result.checked_in_cinema}` : ''}`
        : 'Not checked in';

    return (
        <AdminLayout header="Ticket check-in">
            {loading ? <p className="text-sm text-gray-500">Loading check-in…</p> : (
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="grid items-start gap-6 lg:grid-cols-2">
                        <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="text-lg font-semibold text-[#1A2130]">Scan ticket</h2>
                            <p className="mt-1 text-sm text-[#1A2130]">Point the camera at the ticket QR code. The code is checked against the showtime you select.</p>
                            <div className="mt-4 overflow-hidden rounded-lg bg-stone-900">
                                <video ref={videoRef} className="aspect-[4/3] w-full object-cover sm:aspect-video" playsInline muted />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {cameraOn ? (
                                    <button type="button" className="admin-btn-secondary" onClick={stopCamera}>Stop camera</button>
                                ) : (
                                    <button type="button" className="admin-btn" onClick={startCamera} disabled={busy}>Start camera</button>
                                )}
                            </div>
                            {cameraMessage && <p className="mt-3 text-sm text-red-700">{cameraMessage}</p>}
                        </section>

                        <div className="space-y-6">
                            <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                                <h2 className="font-semibold text-[#1A2130]">Showtime</h2>
                                <form onSubmit={applyFilters} className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="block text-sm text-[#1A2130]">
                                        Cinema branch
                                        <select
                                            className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                                            value={filters.cinema_id}
                                            disabled={filters.branch_locked}
                                            onChange={(event) => setFilters({ ...filters, cinema_id: event.target.value })}
                                        >
                                            {!filters.branch_locked && <option value="">All branches</option>}
                                            {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-sm text-[#1A2130]">
                                        Date
                                        <input type="date" className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} required />
                                    </label>
                                    <div className="sm:col-span-2">
                                        <button type="submit" className="admin-btn-secondary" disabled={busy}>Show screenings</button>
                                    </div>
                                </form>
                                <label className="mt-3 block text-sm text-[#1A2130]">
                                    Screening
                                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={showtimeId} onChange={(event) => setShowtimeId(event.target.value)}>
                                        <option value="">Choose a showtime</option>
                                        {showtimes.map((showtime) => <option key={showtime.id} value={showtime.id}>{showtime.label}</option>)}
                                    </select>
                                </label>
                            </section>

                            <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                                <h2 className="font-semibold text-[#1A2130]">Ticket reference</h2>
                                <p className="mt-1 text-sm text-gray-600">Enter the printed code from the customer ticket (example CMT-A7K2M9QX).</p>
                                <form onSubmit={lookupReference} className="mt-4 space-y-3">
                                    <label className="block text-sm text-[#1A2130]">
                                        Ticket reference
                                        <input
                                            className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm uppercase"
                                            value={ticketReference}
                                            onChange={(event) => setTicketReference(event.target.value.toUpperCase())}
                                            placeholder="CMT-XXXXXXXX"
                                            autoComplete="off"
                                            required
                                        />
                                    </label>
                                    {referenceMessage && <p className="text-sm text-red-600">{referenceMessage}</p>}
                                    <button type="submit" className="admin-btn" disabled={busy}>{busy ? 'Checking…' : 'Look up ticket'}</button>
                                </form>
                            </section>

                            <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                                <h2 className="font-semibold text-[#1A2130]">Search by booking number</h2>
                                <form onSubmit={lookupBooking} className="mt-4 space-y-3">
                                    <label className="block text-sm text-[#1A2130]">
                                        Booking number
                                        <input className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={bookingId} onChange={(event) => setBookingId(event.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="off" required />
                                    </label>
                                    {bookingMessage && <p className="text-sm text-red-600">{bookingMessage}</p>}
                                    <button type="submit" className="admin-btn-secondary" disabled={busy}>Find booking</button>
                                </form>
                            </section>
                            {codeMessage && <p className="text-sm text-red-600">{codeMessage}</p>}
                        </div>
                    </div>

                    {result && (
                        <section className={`rounded-lg border-l-4 p-4 shadow-sm sm:p-6 ${statusTone[result.status] || statusTone.invalid}`}>
                            <p className="text-xs font-semibold uppercase tracking-wide">{statusLabel[result.status] || 'Invalid'}</p>
                            <h2 className="mt-1 text-xl font-semibold">{result.status === 'admitted' ? 'Checked in' : result.status === 'valid' ? 'Ready to check in' : statusLabel[result.status] || 'Cannot check in'}</h2>
                            {result.reasons?.length > 0 && (
                                <ul className="mt-3 list-disc pl-5 text-sm">
                                    {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                                </ul>
                            )}
                            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                                <div><dt className="text-gray-500">Ticket reference</dt><dd className="font-mono font-semibold tracking-wide">{result.ticket_reference || '—'}</dd></div>
                                <div><dt className="text-gray-500">Booking</dt><dd className="font-semibold">#{result.booking_id}</dd></div>
                                <div><dt className="text-gray-500">Customer</dt><dd className="font-semibold">{result.customer || 'Unknown'}</dd></div>
                                <div><dt className="text-gray-500">Movie</dt><dd className="font-semibold">{result.movie || 'Unknown'}</dd></div>
                                <div><dt className="text-gray-500">Cinema</dt><dd className="font-semibold">{result.cinema || 'Unknown'}</dd></div>
                                <div><dt className="text-gray-500">Screen</dt><dd className="font-semibold">{result.screen || 'Unknown'}</dd></div>
                                <div><dt className="text-gray-500">Showtime</dt><dd className="font-semibold">{when(result.starts_at)}</dd></div>
                                <div><dt className="text-gray-500">Seats</dt><dd className="font-semibold">{result.seats?.length ? result.seats.join(', ') : 'None'}</dd></div>
                                <div><dt className="text-gray-500">Payment</dt><dd className="font-semibold">{result.payment_status}</dd></div>
                                <div><dt className="text-gray-500">Check-in</dt><dd className="font-semibold">{checkInText}</dd></div>
                            </dl>
                            {result.food ? (
                                <div className="mt-5 rounded-lg border border-gray-200 bg-white/70 p-4 text-sm">
                                    <p className="font-semibold text-[#1A2130]">Food order #{result.food.id} · {result.food.payment_status}</p>
                                    <ul className="mt-2 space-y-1 text-[#1A2130]">
                                        {(result.food.items || []).map((item) => (
                                            <li key={`${item.name}-${item.quantity}`}>
                                                {item.quantity} × {item.name} · {money(item.line_total_cents)}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 font-semibold">Food total {money(result.food.subtotal_cents)}</p>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-gray-600">No food order on this ticket.</p>
                            )}
                            {result.status === 'valid' && (
                                <form onSubmit={admit} className="mt-5">
                                    <button type="submit" className="admin-btn-success w-full sm:w-auto" disabled={busy}>Check in</button>
                                </form>
                            )}
                        </section>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
