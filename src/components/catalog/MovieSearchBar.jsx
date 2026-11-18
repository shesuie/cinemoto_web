import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';
import { mediaUrl } from '../../utils/format';

export default function MovieSearchBar() {
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [movies, setMovies] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);

        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, []);

    const ensureMovies = async () => {
        if (loaded) return;
        try {
            const rows = await catalogApi.movies();
            setMovies(rows);
        } catch {
            setMovies([]);
        } finally {
            setLoaded(true);
        }
    };

    const matches = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (term.length < 1) {
            return [];
        }

        return movies
            .filter((movie) => {
                const haystack = [
                    movie.title,
                    movie.genres?.join(' '),
                    movie.synopsis,
                ].filter(Boolean).join(' ').toLowerCase();

                return haystack.includes(term);
            })
            .slice(0, 8);
    }, [movies, query]);

    const goSearch = (event) => {
        event.preventDefault();
        const term = query.trim();
        setOpen(false);
        if (!term) {
            navigate('/');
            return;
        }
        navigate(`/?q=${encodeURIComponent(term)}`);
    };

    return (
        <div ref={rootRef} className="relative w-full min-w-[11rem] max-w-xs sm:w-56 md:w-64">
            <form onSubmit={goSearch} className="relative">
                <label htmlFor="header-movie-search" className="sr-only">Search movies</label>
                <input
                    id="header-movie-search"
                    type="search"
                    value={query}
                    placeholder="Search movies…"
                    autoComplete="off"
                    className="w-full rounded-md border border-white/15 bg-navy-deep/80 py-2 pl-3 pr-9 text-sm text-mist placeholder:text-white/35 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                    onFocus={() => {
                        setOpen(true);
                        ensureMovies();
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                        ensureMovies();
                    }}
                />
                <button
                    type="submit"
                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-white/50 transition hover:text-brand"
                    aria-label="Search"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                    </svg>
                </button>
            </form>

            {open && query.trim() && (
                <div className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-white/10 bg-ink shadow-cinema">
                    {!loaded && <p className="px-3 py-3 text-sm text-white/50">Searching…</p>}
                    {loaded && matches.length === 0 && (
                        <p className="px-3 py-3 text-sm text-white/50">No movies match “{query.trim()}”.</p>
                    )}
                    {matches.length > 0 && (
                        <ul className="max-h-80 overflow-y-auto py-1">
                            {matches.map((movie) => (
                                <li key={movie.id}>
                                    <Link
                                        to={`/movies/${movie.id}`}
                                        className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/5"
                                        onClick={() => {
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        {movie.poster_url ? (
                                            <img src={mediaUrl(movie.poster_url)} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
                                        ) : (
                                            <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-navy-mid text-[10px] text-white/40">N/A</span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-mist">{movie.title}</span>
                                            <span className="block truncate text-xs text-white/45">
                                                {movie.genres?.join(' · ') || movie.status?.replace('_', ' ')}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
