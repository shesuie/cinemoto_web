import { Link, Navigate, useParams } from 'react-router-dom';
import { draftReadyFor } from '../booking/steps';
import { useCheckoutDraft } from '../stores/checkoutDraft';
import StatusMessage from './StatusMessage';
import BookingStepper from './BookingStepper';
import CustomerLayout from '../layouts/CustomerLayout';

export default function BookingGate({ step, children }) {
    const { id } = useParams();
    const draft = useCheckoutDraft((state) => state.draft);

    if (!draftReadyFor(step, draft, id)) {
        return (
            <CustomerLayout>
                <StatusMessage tone="error">Start from the movie page and follow each booking step in order.</StatusMessage>
                <Link to={id ? `/movies/${id}` : '/'} className="cinema-button mt-5 inline-flex">Back to movie</Link>
            </CustomerLayout>
        );
    }

    if (step === 'cinema' && Number(draft.movieId) !== Number(id)) {
        return <Navigate to={`/movies/${draft.movieId}/book/cinema`} replace />;
    }

    return (
        <CustomerLayout>
            <BookingStepper current={step} movieId={id} bookingId={draft?.bookingId} />
            {children}
        </CustomerLayout>
    );
}
