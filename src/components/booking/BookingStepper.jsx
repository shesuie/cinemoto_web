import { Link } from 'react-router-dom';
import { BOOKING_STEPS, STEP_HINTS, draftReadyFor, seatsStepHint, stepIndex } from '../../booking/steps';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';

export default function BookingStepper({
    current,
    movieId,
    bookingId = null,
    allowBack = true,
}) {
    const currentIndex = stepIndex(current);
    const draft = useCheckoutDraft((state) => state.draft);
    const hint = current === 'seats' ? seatsStepHint(draft?.holdMinutes) : STEP_HINTS[current];

    return (
        <div className="mb-6 space-y-4">
            <nav aria-label="Booking progress" className="overflow-x-auto">
                <ol className="flex min-w-max items-center gap-1 sm:gap-2">
                    {BOOKING_STEPS.map((step, index) => {
                        const done = index < currentIndex;
                        const active = index === currentIndex;
                        const upcoming = index > currentIndex;
                        const ready = draftReadyFor(step.id, draft, movieId);
                        const canJump = allowBack
                            && step.id !== current
                            && step.id !== 'payment'
                            && step.id !== 'confirmation'
                            && ready;
                        const href = step.path(movieId, bookingId);
                        const classes = [
                            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 sm:text-sm',
                            active ? 'bg-brand text-mist shadow-ticket' : '',
                            !active && done ? 'bg-brand/20 text-brand hover:bg-brand/30' : '',
                            !active && !done && ready && upcoming ? 'bg-brand/15 text-brand/90 hover:bg-brand/25' : '',
                            !active && !done && !ready ? 'bg-white/5 text-white/40' : '',
                        ].filter(Boolean).join(' ');

                        const content = (
                            <>
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${active || done ? 'bg-white/20' : 'bg-white/10'}`}>
                                    {done ? '✓' : index + 1}
                                </span>
                                <span>{step.label}</span>
                                {index < BOOKING_STEPS.length - 1 && (
                                    <span className="ml-1 hidden text-white/25 sm:inline" aria-hidden>→</span>
                                )}
                            </>
                        );

                        return (
                            <li key={step.id}>
                                {canJump ? (
                                    <Link to={href} className={classes} title={upcoming ? 'Continue from saved choices' : undefined}>{content}</Link>
                                ) : (
                                    <span className={classes} aria-current={active ? 'step' : undefined}>{content}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
            <p className="rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-mist">
                <span className="font-semibold text-brand">Next: </span>
                {hint}
            </p>
        </div>
    );
}
