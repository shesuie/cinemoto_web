/** Shared domain values — keep aligned with app/Enums on the API. */

export const ROLE_CUSTOMER = 'customer';
export const ROLE_SUPER_ADMIN = 'super-admin';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'expired'];

export const ORDER_STATUSES = ['pending', 'confirmed'];

export const ORDER_PAYMENT_STATUSES = ['unpaid', 'paid'];

export const CHECKOUT_STATUSES = ['open', 'test_succeeded'];

export const SHOWTIME_STATUS_SCHEDULED = 'scheduled';
export const SHOWTIME_STATUS_CANCELLED = 'cancelled';
export const SHOWTIME_STATUSES = [SHOWTIME_STATUS_SCHEDULED, SHOWTIME_STATUS_CANCELLED];

export const MOVIE_STATUSES = [
    { value: 'now_showing', label: 'Now showing' },
    { value: 'coming_soon', label: 'Coming soon' },
    { value: 'ended', label: 'Ended' },
];

export const PAYMENT_OUTCOMES = ['succeeded', 'failed', 'cancelled'];

export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash at counter' },
    { value: 'card', label: 'Card at counter' },
];

export const DISPLAY_TIMEZONE = import.meta.env.VITE_DISPLAY_TIMEZONE || 'Asia/Manila';

export function movieStatusOptions() {
    return MOVIE_STATUSES;
}
