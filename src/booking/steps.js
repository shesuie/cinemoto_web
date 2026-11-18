export const BOOKING_STEPS = [
    { id: 'movie', label: 'Movie', path: (movieId) => `/movies/${movieId}` },
    { id: 'cinema', label: 'Cinema', path: (movieId) => `/movies/${movieId}/book/cinema` },
    { id: 'schedule', label: 'Schedule', path: (movieId) => `/movies/${movieId}/book/schedule` },
    { id: 'seats', label: 'Seats', path: (movieId) => `/movies/${movieId}/book/seats` },
    { id: 'food', label: 'Food', path: (movieId) => `/movies/${movieId}/book/food` },
    { id: 'review', label: 'Review', path: (movieId) => `/movies/${movieId}/book/review` },
    { id: 'payment', label: 'Payment', path: (_movieId, bookingId) => `/bookings/${bookingId}/payment` },
    { id: 'confirmation', label: 'Done', path: (_movieId, bookingId) => `/bookings/${bookingId}/ticket` },
];

export const STEP_HINTS = {
    movie: 'Pick a movie, then tap Book Now to start.',
    cinema: 'Choose the cinema branch where you want to watch.',
    schedule: 'Pick a screening date, then choose a time for that day (for example 9:00 AM, 1:00 PM, 7:00 PM).',
    seats: 'Select open seats. They will be held for a short time after you confirm on Review.',
    food: 'Optional — add snacks for this branch, or skip.',
    review: 'Check everything, then hold seats and continue to payment.',
    payment: 'Complete the test payment for tickets and any food.',
    confirmation: 'Your booking is confirmed. Save or show your QR ticket.',
};

export function seatsStepHint(holdMinutes) {
    if (!holdMinutes) {
        return STEP_HINTS.seats;
    }

    return `Select open seats. They will be held for ${holdMinutes} minutes after you confirm on Review.`;
}

export function stepIndex(stepId) {
    return BOOKING_STEPS.findIndex((step) => step.id === stepId);
}

export function draftReadyFor(stepId, draft, movieId) {
    if (!draft || Number(draft.movieId) !== Number(movieId)) {
        return stepId === 'movie';
    }

    switch (stepId) {
        case 'movie':
        case 'cinema':
            return true;
        case 'schedule':
            return Boolean(draft.cinemaId);
        case 'seats':
            return Boolean(draft.cinemaId && draft.showtimeId && draft.date);
        case 'food':
            return Boolean(draft.showtimeId && draft.seatIds?.length);
        case 'review':
            return Boolean(draft.showtimeId && draft.seatIds?.length);
        case 'payment':
        case 'confirmation':
            return Boolean(draft.bookingId);
        default:
            return false;
    }
}

/** Furthest step the shopper can open from the saved draft (skips payment/done). */
export function resumeStepId(draft, movieId) {
    const order = ['review', 'food', 'seats', 'schedule', 'cinema'];

    for (const stepId of order) {
        if (draftReadyFor(stepId, draft, movieId)) {
            return stepId;
        }
    }

    return 'movie';
}

export function stepPath(stepId, movieId, bookingId = null) {
    const step = BOOKING_STEPS.find((row) => row.id === stepId);

    return step ? step.path(movieId, bookingId) : `/movies/${movieId}`;
}
