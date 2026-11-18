import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const empty = () => ({
    movieId: null,
    movieTitle: '',
    posterUrl: null,
    cinemaId: null,
    cinemaName: '',
    date: '',
    showtimeId: null,
    screenName: '',
    startsAt: null,
    ticketUnitCents: 0,
    seatIds: [],
    seatLabels: [],
    items: [],
    itemDetails: [],
    paymentMethod: 'cash',
    orderQuantityLimit: null,
    bookingId: null,
    expiresAt: null,
    holdMinutes: null,
});

export const useCheckoutDraft = create(
    persist(
        (set, get) => ({
            draft: null,
            startBooking: (movie) => set({
                draft: {
                    ...empty(),
                    movieId: movie.id,
                    movieTitle: movie.title,
                    posterUrl: movie.poster_url || null,
                    orderQuantityLimit: movie.order_quantity_limit ?? null,
                },
            }),
            setDraft: (draft) => set({ draft }),
            patchDraft: (partial) => {
                const current = get().draft || empty();
                set({ draft: { ...current, ...partial } });
            },
            clearDraft: () => set({ draft: null }),
        }),
        { name: 'cinemoto-checkout-draft' },
    ),
);
