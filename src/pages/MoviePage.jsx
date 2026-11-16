import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../api/catalog';
import BookingStepper from '../components/BookingStepper';
import { ClockIcon, PlayIcon, StarIcon } from '../components/MovieMetaIcons';
import StatusMessage from '../components/StatusMessage';
import CustomerLayout from '../layouts/CustomerLayout';
import { useCheckoutDraft } from '../stores/checkoutDraft';
import { formatDuration, manilaWhen, mediaUrl, pesos } from '../utils/format';

function cleanText(text) {
    if (!text || /failed to upload/i.test(text)) {
        return '';
    }

    return String(text).trim();
}

export default function MoviePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const startBooking = useCheckoutDraft((state) => state.startBooking);
    const [movie, setMovie] = useState(null);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

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

    const bookNow = () => {
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
                                <img src={backdrop} alt="" className="h-full w-full scale-105 object-cover blur-[2px]" />
                            ) : (
                                <div className="h-full w-full bg-navy-mid" />
                            )}
                            <div className="absolute inset-0 bg-black/65" />
                            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/75 to-transparent" />
                        </div>
                        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-14">
                            <p className="text-sm text-white/55">
                                <Link to="/" className="transition hover:text-brand">Movies</Link>
                                <span className="mx-2 text-white/25">/</span>
                                <span className="text-mist">{movie.title}</span>
                            </p>
                            <div className="mt-6 max-w-3xl">
                                <h1 className="text-4xl font-bold tracking-tight text-mist sm:text-5xl lg:text-6xl">{movie.title}</h1>
                                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-brand sm:text-base">
                                    {movie.rating && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <StarIcon className="h-4 w-4" />
                                            {movie.rating}
                                        </span>
                                    )}
                                    {movie.rating && <span className="text-white/30">|</span>}
                                    <span>{resolution}</span>
                                    {duration && <span className="text-white/30">|</span>}
                                    {duration && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <ClockIcon className="h-4 w-4" />
                                            {duration}
                                        </span>
                                    )}
                                    {genres && <span className="text-white/30">|</span>}
                                    {genres && <span>{genres}</span>}
                                </div>
                                {synopsis && (
                                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{synopsis}</p>
                                )}
                                {next && (
                                    <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                        <span>Next: {manilaWhen(next.starts_at)} · {next.cinema}</span>
                                        <span className="rounded-md bg-mango-500 px-2.5 py-1 text-base font-bold text-ink">
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
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-ink text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-navy-mid"
                                            aria-label="Play trailer"
                                        >
                                            <PlayIcon />
                                        </a>
                                    ) : null}
                                    {canBook ? (
                                        <button type="button" className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-navy-mid" onClick={bookNow}>
                                            Buy Your Ticket Now
                                        </button>
                                    ) : (
                                        <StatusMessage>No upcoming showtimes for this movie.</StatusMessage>
                                    )}
                                    <Link to="/" className="cinema-button-secondary !py-2.5">Browse movies</Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mx-auto max-w-6xl px-4 py-8">
                        <BookingStepper current="movie" movieId={id} allowBack={false} />
                        <section className="cinema-panel">
                            <h2 className="cinema-section-title">How booking works</h2>
                            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/75">
                                <li>Choose a cinema branch</li>
                                <li>Pick a date and showtime</li>
                                <li>Select seats</li>
                                <li>Optionally add food & drinks</li>
                                <li>Review, pay once, then get your QR ticket</li>
                            </ol>
                            {canBook && (
                                <button type="button" className="cinema-button mt-6" onClick={bookNow}>Start booking</button>
                            )}
                        </section>
                    </div>
                </>
            )}
        </CustomerLayout>
    );
}
