import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import { resumeStepId, stepPath } from '../../booking/steps';
import BookingStepper from '../../components/booking/BookingStepper';
import { ClockIcon, PlayIcon, StarIcon } from '../../components/catalog/MovieDetailIcons';
import StatusMessage from '../../components/ui/StatusMessage';
import CustomerLayout from '../../layouts/CustomerLayout';
import { useCheckoutDraft } from '../../stores/checkoutDraftStore';
import { formatDuration, manilaWhen, mediaUrl, pesos } from '../../utils/format';

function cleanText(text) {
    if (!text || /failed to upload/i.test(text)) {
        return '';
    }

    return String(text).trim();
}

export default function MoviePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const draft = useCheckoutDraft((state) => state.draft);
    const startBooking = useCheckoutDraft((state) => state.startBooking);
    const [movie, setMovie] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');
    const savedProgress = draft && Number(draft.movieId) === Number(id) && resumeStepId(draft, id) !== 'movie'
        && resumeStepId(draft, id) !== 'cinema';

    useEffect(() => {
        let active = true;
        setState('loading');
        catalogApi.movie(id)
            .then((row) => {
                if (!active) return;
                setMovie(row);
                setState('ready');
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.status === 404 ? 'That movie is not available.' : error.message);
                    setState('error');
                }
            });

        return () => { active = false; };
    }, [id]);

    const synopsis = cleanText(movie?.synopsis);
    const backdrop = mediaUrl(movie?.banner_url || movie?.poster_url);
    const next = movie?.showtimes?.[0];
    const canBook = (movie?.showtimes || []).length > 0;
    const genres = movie?.genres?.join('/') || '';
    const duration = formatDuration(movie?.duration_minutes);
    const resolution = movie?.resolution || 'HD';

    const bookNow = ({ restart = false } = {}) => {
        if (!restart && savedProgress) {
            const stepId = resumeStepId(draft, id);
            navigate(stepPath(stepId, id, draft.bookingId));
            return;
        }

        startBooking(movie);
        navigate(`/movies/${id}/book/cinema`);
    };

    return (
        <CustomerLayout flush>
            {state === 'loading' && (
                <div className="mx-auto max-w-6xl px-4 py-10"><p className="cinema-muted">Loading movie…</p></div>
            )}
            {state === 'error' && (
                <div className="mx-auto max-w-6xl px-4 py-10"><StatusMessage tone="error">{message}</StatusMessage></div>
            )}
            {state === 'ready' && movie && (
                <>
                    <section className="relative overflow-hidden border-b border-white/10">
                        <div className="absolute inset-0">
                            {backdrop ? (
                                <img src={backdrop} alt="" className="h-full w-full scale-105 object-cover" />
                            ) : (
                                <div className="h-full w-full bg-navy-mid" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                        </div>
                        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pb-14 sm:pt-12">
                            <p className="text-sm text-white/55">
                                <Link to="/" className="transition hover:text-brand">Movies</Link>
                                <span className="mx-2 text-white/25">/</span>
                                <span className="text-mist">{movie.title}</span>
                            </p>
                            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-10">
                                {movie.poster_url ? (
                                    <div className="mx-auto w-44 shrink-0 overflow-hidden rounded-xl shadow-cinema sm:mx-0 sm:w-52">
                                        <img
                                            src={mediaUrl(movie.poster_url)}
                                            alt=""
                                            className="aspect-[2/3] w-full object-cover"
                                        />
                                    </div>
                                ) : null}
                                <div className="min-w-0 max-w-3xl flex-1">
                                    <h1 className="text-4xl font-bold tracking-tight text-mist sm:text-5xl lg:text-6xl">{movie.title}</h1>
                                    <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-white/90 sm:text-base">
                                        {movie.rating && (
                                            <span className="inline-flex items-center gap-1.5 text-brand">
                                                <StarIcon className="h-4 w-4" />
                                                {movie.rating}
                                            </span>
                                        )}
                                        {movie.rating && <span className="text-white/35">|</span>}
                                        <span className="rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-mist">
                                            {resolution}
                                        </span>
                                        {duration && <span className="text-white/35">|</span>}
                                        {duration && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <ClockIcon className="h-4 w-4 text-white/80" />
                                                {duration}
                                            </span>
                                        )}
                                        {genres && <span className="text-white/35">|</span>}
                                        {genres && <span className="text-white/85">{genres}</span>}
                                    </div>
                                    {synopsis && (
                                        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{synopsis}</p>
                                    )}
                                    {next && (
                                        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                            <span>Next: {manilaWhen(next.starts_at)} · {next.cinema}</span>
                                            <span className="rounded-md bg-brand px-2.5 py-1 text-sm font-bold text-mist">
                                                {pesos(next.price_cents)}
                                            </span>
                                        </p>
                                    )}
                                    <div className="mt-7 flex flex-wrap items-center gap-3">
                                        {movie.trailer_url ? (
                                            <a
                                                href={movie.trailer_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-[#2b8fe0]"
                                                aria-label="Play trailer"
                                            >
                                                <PlayIcon />
                                            </a>
                                        ) : null}
                                        {canBook ? (
                                            <button
                                                type="button"
                                                className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-navy-mid"
                                                onClick={() => bookNow()}
                                            >
                                                {savedProgress ? 'Continue booking' : 'Buy Your Ticket Now'}
                                            </button>
                                        ) : (
                                            <StatusMessage>No upcoming showtimes for this movie.</StatusMessage>
                                        )}
                                        {savedProgress && (
                                            <button
                                                type="button"
                                                className="cinema-button-secondary !py-2.5"
                                                onClick={() => bookNow({ restart: true })}
                                            >
                                                Start over
                                            </button>
                                        )}
                                        <Link to="/" className="cinema-button-secondary !py-2.5">Browse movies</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mx-auto max-w-6xl px-4 py-8">
                        <BookingStepper current="movie" movieId={id} allowBack={Boolean(savedProgress)} />
                        <section className="cinema-panel">
                            <h2 className="cinema-section-title">How booking works</h2>
                            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/75">
                                <li>Choose a cinema branch</li>
                                <li>Pick a date and showtime</li>
                                <li>Select seats</li>
                                <li>Optionally add food & drinks</li>
                                <li>Review, pay once, then get your QR ticket</li>
                            </ol>
                            {savedProgress && (
                                <p className="mt-4 text-sm text-white/65">
                                    You still have saved choices for this movie. Continue to pick up where you left off, or start over.
                                </p>
                            )}
                            {canBook && (
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button type="button" className="cinema-button" onClick={() => bookNow()}>
                                        {savedProgress ? 'Continue booking' : 'Start booking'}
                                    </button>
                                    {savedProgress && (
                                        <button type="button" className="cinema-button-secondary" onClick={() => bookNow({ restart: true })}>
                                            Start over
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </>
            )}
        </CustomerLayout>
    );
}
