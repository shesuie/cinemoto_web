import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClockIcon, PlayIcon, StarIcon } from '../components/MovieMetaIcons';
import StatusMessage from '../components/StatusMessage';
import { MOVIE_STATUSES } from '../constants/domain';
import CustomerLayout from '../layouts/CustomerLayout';
import { catalogApi } from '../api/catalog';
import { formatDuration, mediaUrl, pesos, releaseYear } from '../utils/format';

const CAROUSEL_INTERVAL_MS = 2000;

function ChevronLeftIcon({ className = 'h-7 w-7' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ChevronRightIcon({ className = 'h-7 w-7' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const sectionMeta = {
    now_showing: { title: 'Now Showing', empty: 'No movies are showing right now.' },
    coming_soon: { title: 'Coming Soon', empty: 'No upcoming movies are listed yet.' },
    ended: { title: 'Past Movies', empty: '' },
};

const sections = MOVIE_STATUSES.map((item) => ({
    status: item.value,
    title: sectionMeta[item.value]?.title || item.label,
    empty: sectionMeta[item.value]?.empty ?? '',
}));

function cleanSynopsis(text) {
    if (!text || /failed to upload/i.test(text)) {
        return '';
    }

    return text.trim();
}

function MovieCard({ movie }) {
    const next = movie.showtimes?.[0];
    const genres = movie.genres?.join('/') || '';
    const year = releaseYear(movie.release_date);
    const durationLabel = movie.duration_minutes ? `${movie.duration_minutes}min` : '';
    const resolution = movie.resolution || 'N/A';

    return (
        <article className="group relative h-[420px] w-[260px] shrink-0 overflow-hidden rounded-2xl bg-navy-mid shadow-cinema">
            <Link
                to={`/movies/${movie.id}`}
                className="absolute inset-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={`View ${movie.title}`}
            >
                {movie.poster_url ? (
                    <img
                        src={mediaUrl(movie.poster_url)}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-end bg-navy-mid p-4 text-lg font-semibold text-mist">{movie.title}</div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-3 space-y-1.5 p-4 text-mist opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <p className="line-clamp-2 text-xl font-bold leading-snug">{movie.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-mist">
                            {resolution}
                        </span>
                        {year && <span className="font-semibold">{year}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                        {movie.rating && (
                            <span className="inline-flex items-center gap-1">
                                <StarIcon className="h-3.5 w-3.5 text-brand" />
                                {movie.rating}
                            </span>
                        )}
                        {durationLabel && (
                            <span className="inline-flex items-center gap-1">
                                <ClockIcon className="h-3.5 w-3.5 text-brand" />
                                {durationLabel}
                            </span>
                        )}
                    </div>
                    {genres && <p className="text-sm text-white/85">{genres}</p>}
                    <p className="pt-1 text-lg font-bold text-mist">
                        {next ? pesos(next.price_cents) : '—'}
                    </p>
                    <span className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-mist transition group-hover:bg-[#2b8fe0]">
                        Buy Ticket
                    </span>
                </div>
            </Link>
        </article>
    );
}

function FeaturedCarousel({ movies }) {
    const slides = movies.length > 0 ? movies : [];
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [details, setDetails] = useState({});

    useEffect(() => {
        setIndex(0);
    }, [slides.length]);

    useEffect(() => {
        if (slides.length <= 1 || paused) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % slides.length);
        }, CAROUSEL_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [slides.length, paused]);

    const safeIndex = slides.length ? Math.min(index, slides.length - 1) : 0;
    const movie = slides[safeIndex] || null;
    const movieId = movie?.id;

    useEffect(() => {
        if (!movieId || details[movieId]) {
            return undefined;
        }

        let active = true;
        catalogApi.movie(movieId)
            .then((row) => {
                if (!active) return;
                setDetails((prev) => (prev[movieId] ? prev : { ...prev, [movieId]: row }));
            })
            .catch(() => {});

        return () => { active = false; };
    }, [movieId, details]);

    if (!movie) {
        return null;
    }

    const resolved = details[movie.id] ? { ...movie, ...details[movie.id] } : movie;
    const backdrop = mediaUrl(resolved.banner_url || resolved.poster_url);
    const synopsis = cleanSynopsis(resolved.synopsis);
    const next = resolved.showtimes?.[0] || movie.showtimes?.[0];
    const genres = (resolved.genres || movie.genres)?.join('/') || '';
    const duration = formatDuration(resolved.duration_minutes || movie.duration_minutes).replace(/min\b/g, 'm');
    const resolution = resolved.resolution || movie.resolution || 'HD';

    const goTo = (nextIndex) => {
        setIndex((nextIndex + slides.length) % slides.length);
    };

    return (
        <section className="border-b border-white/10 bg-navy px-3 pb-2 pt-4 sm:px-4 sm:pt-6">
            <div
                className="relative mx-auto min-h-[440px] max-w-6xl overflow-hidden rounded-xl bg-navy-mid shadow-cinema sm:min-h-[500px] lg:min-h-[540px]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {backdrop ? (
                    <img
                        key={movie.id}
                        src={backdrop}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover animate-fade-up"
                    />
                ) : (
                    <div className="absolute inset-0 bg-navy-mid" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

                {slides.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-brand transition hover:bg-black/30 hover:text-[#7ec4ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:left-3"
                            aria-label="Previous featured movie"
                            onClick={() => goTo(index - 1)}
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-brand transition hover:bg-black/30 hover:text-[#7ec4ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:right-3"
                            aria-label="Next featured movie"
                            onClick={() => goTo(index + 1)}
                        >
                            <ChevronRightIcon />
                        </button>
                    </>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 px-10 pb-14 pt-20 sm:px-16 sm:pb-16 lg:px-20">
                    <div key={movie.id} className="max-w-2xl animate-fade-up">
                        <h1 className="text-3xl font-bold tracking-tight text-mist sm:text-4xl lg:text-5xl">
                            {resolved.title}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-white/90 sm:text-base">
                            {resolved.rating && (
                                <span className="inline-flex items-center gap-1.5 text-brand">
                                    <StarIcon className="h-4 w-4" />
                                    {resolved.rating}
                                </span>
                            )}
                            {resolved.rating && <span className="text-white/35">|</span>}
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
                        {synopsis ? (
                            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 line-clamp-3 sm:text-[15px]">
                                {synopsis}
                            </p>
                        ) : null}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            {resolved.trailer_url ? (
                                <a
                                    href={resolved.trailer_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-[#2b8fe0]"
                                    aria-label={`Play trailer for ${resolved.title}`}
                                >
                                    <PlayIcon />
                                </a>
                            ) : (
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand/50 text-white/50" aria-hidden>
                                    <PlayIcon />
                                </span>
                            )}
                            <Link
                                to={`/movies/${movie.id}`}
                                className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-mist shadow-ticket transition hover:-translate-y-0.5 hover:bg-navy-mid"
                            >
                                Buy Your Ticket Now
                            </Link>
                        </div>
                        {next && (
                            <span className="mt-4 inline-flex rounded-md bg-mango-500 px-2.5 py-1 text-xs font-bold text-ink">
                                from {pesos(next.price_cents)}
                            </span>
                        )}
                    </div>
                </div>

                {slides.length > 1 && (
                    <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2.5" role="tablist" aria-label="Featured movies">
                        {slides.map((slide, slideIndex) => {
                            const active = slideIndex === index;

                            return (
                                <button
                                    key={slide.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    aria-label={`Show ${slide.title}`}
                                    className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                                        active
                                            ? 'border-brand bg-brand'
                                            : 'border-white/45 bg-transparent hover:border-brand/70'
                                    }`}
                                    onClick={() => goTo(slideIndex)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function MoviesPage() {
    const [searchParams] = useSearchParams();
    const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();
    const [movies, setMovies] = useState([]);
    const [state, setState] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        catalogApi.movies()
            .then((rows) => {
                if (active) {
                    setMovies(rows);
                    setState('ready');
                }
            })
            .catch((error) => {
                if (active) {
                    setMessage(error.message);
                    setState('error');
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const visibleMovies = useMemo(() => {
        if (!searchQuery) {
            return movies;
        }

        return movies.filter((movie) => {
            const haystack = [
                movie.title,
                movie.synopsis,
                movie.genres?.join(' '),
            ].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(searchQuery);
        });
    }, [movies, searchQuery]);

    const featured = useMemo(() => {
        const pool = searchQuery ? visibleMovies : movies;
        const nowShowing = pool.filter((movie) => movie.status === 'now_showing');
        if (nowShowing.length > 0) {
            return nowShowing;
        }

        return pool.slice(0, 5);
    }, [movies, visibleMovies, searchQuery]);

    return (
        <CustomerLayout flush>
            {state === 'ready' && <FeaturedCarousel movies={featured} />}

            <div className="mx-auto max-w-6xl px-4 py-10">
                {state === 'loading' && <p className="cinema-muted">Loading movies…</p>}
                {state === 'error' && <StatusMessage tone="error">{message}</StatusMessage>}
                {state === 'ready' && searchQuery && (
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-white/70">
                            Search results for <span className="font-semibold text-mist">“{searchParams.get('q')}”</span>
                            {' '}· {visibleMovies.length} movie{visibleMovies.length === 1 ? '' : 's'}
                        </p>
                        <Link to="/" className="text-sm font-semibold text-brand transition hover:text-[#7ec4ff]">Clear search</Link>
                    </div>
                )}
                {state === 'ready' && movies.length === 0 && (
                    <StatusMessage>No published movies are available.</StatusMessage>
                )}
                {state === 'ready' && movies.length > 0 && visibleMovies.length === 0 && (
                    <StatusMessage>No movies matched that search.</StatusMessage>
                )}
                {state === 'ready' && sections.map((section) => {
                    const rows = visibleMovies.filter((movie) => movie.status === section.status);

                    if (rows.length === 0 && (section.empty === '' || searchQuery)) {
                        return null;
                    }

                    return (
                        <section key={section.status} className="mb-12">
                            <div className="mb-5 flex items-end justify-between gap-4">
                                <h2 className="cinema-section-title">{section.title}</h2>
                                <div className="hidden h-px flex-1 bg-gradient-to-r from-brand/50 to-transparent sm:block" />
                            </div>
                            {rows.length === 0 ? (
                                <p className="cinema-muted">{section.empty}</p>
                            ) : (
                                <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {rows.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </CustomerLayout>
    );
}
