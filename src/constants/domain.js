/** Shared domain values — keep aligned with app/Enums on the API. */

export const ROLE_CUSTOMER = 'customer';
export const ROLE_SUPER_ADMIN = 'super-admin';

export const BOOKING_STATUS = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled',
    expired: 'expired',
};

export const BOOKING_STATUSES = Object.values(BOOKING_STATUS);

export const ORDER_STATUS = {
    pending: 'pending',
    confirmed: 'confirmed',
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

export const ORDER_PAYMENT_STATUS = {
    unpaid: 'unpaid',
    paid: 'paid',
};

export const ORDER_PAYMENT_STATUSES = Object.values(ORDER_PAYMENT_STATUS);

export const CHECKOUT_STATUS = {
    open: 'open',
    testSucceeded: 'test_succeeded',
};

export const CHECKOUT_STATUSES = Object.values(CHECKOUT_STATUS);

export const SHOWTIME_STATUS_SCHEDULED = 'scheduled';
export const SHOWTIME_STATUS_CANCELLED = 'cancelled';
export const SHOWTIME_STATUSES = [SHOWTIME_STATUS_SCHEDULED, SHOWTIME_STATUS_CANCELLED];

export const MOVIE_STATUS = {
    nowShowing: 'now_showing',
    comingSoon: 'coming_soon',
    ended: 'ended',
};

export const MOVIE_STATUSES = [
    { value: MOVIE_STATUS.nowShowing, label: 'Now showing' },
    { value: MOVIE_STATUS.comingSoon, label: 'Coming soon' },
    { value: MOVIE_STATUS.ended, label: 'Ended' },
];

export const PAYMENT_OUTCOME = {
    succeeded: 'succeeded',
    failed: 'failed',
    cancelled: 'cancelled',
};

export const PAYMENT_OUTCOMES = Object.values(PAYMENT_OUTCOME);

export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash at counter' },
    { value: 'card', label: 'Card at counter' },
];

export const TICKET_CHECK_STATUS = {
    valid: 'valid',
    used: 'used',
    unpaid: 'unpaid',
    pending: 'pending',
    cancelled: 'cancelled',
    expired: 'expired',
    wrongShowtime: 'wrong_showtime',
    admitted: 'admitted',
};

export const TICKET_CHECK_STATUSES = Object.values(TICKET_CHECK_STATUS);

export const DISPLAY_TIMEZONE = import.meta.env.VITE_DISPLAY_TIMEZONE || 'Asia/Manila';

export function movieStatusOptions() {
    return MOVIE_STATUSES;
}
