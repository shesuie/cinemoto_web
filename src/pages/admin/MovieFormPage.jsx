import { useEffect, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import MovieShowtimesPanel from '../../components/admin/MovieShowtimesPanel';
import AdminLayout from '../../layouts/AdminLayout';
import { mediaUrl } from '../../utils/format';
import { movieStatusOptions } from '../../constants/domain';

const empty = {
    title: '',
    synopsis: '',
    duration_minutes: 120,
    rating: '',
    resolution: 'HD',
    release_date: '',
    director: '',
    cast: '',
    language: '',
    status: movieStatusOptions()[0]?.value || 'now_showing',
    is_published: false,
    trailer_url: '',
    genre_ids: [],
};

const resolutionOptions = ['HD', '2D', '3D', 'IMAX', '4DX', 'N/A'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function Field({ label, hint, children }) {
    return (
        <label className="grid gap-1.5 text-sm text-[#1A2130]">
            <span className="font-medium">{label}</span>
            {children}
            {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
        </label>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="rounded-xl border border-[#d7deea] bg-white shadow-sm">
            <div className="border-b border-[#e5ebf3] px-5 py-4">
                <h2 className="text-base font-semibold text-[#1A2130]">{title}</h2>
                {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
            </div>
            <div className="grid gap-4 px-5 py-5">{children}</div>
        </section>
    );
}

export default function MovieFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(empty);
    const [genres, setGenres] = useState([]);
    const [images, setImages] = useState({ poster_url: null, banner_url: null });
    const [files, setFiles] = useState({ poster: null, banner: null });
    const [loading, setLoading] = useState(Boolean(id));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            adminApi.list('genres', { per_page: 50 })
                .then((payload) => setGenres(payload.listing?.data || []))
                .catch((failure) => setError(failure.message));
            return;
        }

        adminApi.show(`movies/${id}`)
            .then((payload) => {
                setGenres(payload.genres || []);
                setForm({ ...empty, ...payload.data, genre_ids: payload.data.genre_ids || [] });
                setImages({ poster_url: payload.data.poster_url, banner_url: payload.data.banner_url });
            })
            .catch((failure) => setError(failure.message || 'The movie could not be loaded.'))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        const fields = {
            title: form.title,
            synopsis: form.synopsis || '',
            duration_minutes: Number(form.duration_minutes),
            rating: form.rating || '',
            resolution: form.resolution || '',
            release_date: form.release_date || '',
            director: form.director || '',
            cast: form.cast || '',
            language: form.language || '',
            status: form.status,
            is_published: form.is_published ? 1 : 0,
            trailer_url: form.trailer_url || '',
        };
        try {
            let movieId = id;
            if (files.poster || files.banner) {
                for (const [label, file] of [['Poster', files.poster], ['Banner', files.banner]]) {
                    if (file && file.size > MAX_IMAGE_BYTES) {
                        setError(`${label} must be under 5 MB.`);
                        setSaving(false);
                        return;
                    }
                }
                const body = new FormData();
                Object.entries(fields).forEach(([key, value]) => body.append(key, value ?? ''));
                form.genre_ids.forEach((genreId) => body.append('genre_ids[]', genreId));
                if (files.poster) {
                    body.append('poster', files.poster, files.poster.name);
                }
                if (files.banner) {
                    body.append('banner', files.banner, files.banner.name);
                }
                if (id) {
                    await adminApi.post(`movies/${id}`, body);
                } else {
                    movieId = (await adminApi.create('movies', body)).data?.id;
                }
            } else if (id) {
                await adminApi.update(`movies/${id}`, {
                    ...fields,
                    is_published: Boolean(form.is_published),
                    genre_ids: form.genre_ids.map(Number),
                    release_date: form.release_date || null,
                    trailer_url: form.trailer_url || null,
                });
            } else {
                movieId = (await adminApi.create('movies', {
                    ...fields,
                    is_published: Boolean(form.is_published),
                    genre_ids: form.genre_ids.map(Number),
                    release_date: form.release_date || null,
                    trailer_url: form.trailer_url || null,
                })).data?.id;
            }
            toast.success(id ? MESSAGES.movieSaved : MESSAGES.movieAdded);
            if (id) {
                setFiles({ poster: null, banner: null });
            } else if (movieId) {
                navigate(`/admin/movies/${movieId}/edit`);
            } else {
                navigate('/admin/movies');
            }
        } catch (failure) {
            setError(failure.message || 'The movie could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const publish = async (published) => {
        try {
            const result = await adminApi.patch(`movies/${id}/publication`, { is_published: published });
            set('is_published', published);
            toast.success(result.message);
        } catch (failure) {
            toast.error(failure.message || MESSAGES.moviePublishFailed);
        }
    };

    return (
        <AdminLayout header={id ? 'Edit movie' : 'Add movie'}>
            {loading ? <p className="text-sm text-gray-500">Loading the movie…</p> : (
                <div className="mx-auto grid w-full max-w-6xl gap-5">
                    <form onSubmit={save} className="grid gap-5">
                        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                        <Section title="Movie details" description="Basic information shown on the public site and booking flow.">
                            <Field label="Title">
                                <input required maxLength={50} value={form.title} onChange={(event) => set('title', event.target.value)} className="admin-btn-secondary w-full" />
                            </Field>
                            <Field label="Synopsis">
                                <textarea maxLength={1000} value={form.synopsis || ''} onChange={(event) => set('synopsis', event.target.value)} className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Field label="Duration (minutes)">
                                    <input required type="number" min="1" max="500" value={form.duration_minutes} onChange={(event) => set('duration_minutes', event.target.value)} className="admin-btn-secondary w-full" />
                                </Field>
                                <Field label="Star rating" hint="Example: 9.2">
                                    <input maxLength={20} value={form.rating || ''} onChange={(event) => set('rating', event.target.value)} className="admin-btn-secondary w-full" />
                                </Field>
                                <Field label="Resolution" hint="Shown on cards and banners.">
                                    <select value={form.resolution || 'HD'} onChange={(event) => set('resolution', event.target.value)} className="admin-btn-secondary w-full">
                                        {resolutionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </Field>
                                <Field label="Release date" hint="Year comes from this date.">
                                    <input type="date" value={form.release_date || ''} onChange={(event) => set('release_date', event.target.value)} className="admin-btn-secondary w-full" />
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Director">
                                    <input maxLength={50} value={form.director || ''} onChange={(event) => set('director', event.target.value)} className="admin-btn-secondary w-full" />
                                </Field>
                                <Field label="Language">
                                    <input maxLength={80} value={form.language || ''} onChange={(event) => set('language', event.target.value)} className="admin-btn-secondary w-full" />
                                </Field>
                                <Field label="Status">
                                    <select value={form.status} onChange={(event) => set('status', event.target.value)} className="admin-btn-secondary w-full">
                                        {movieStatusOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Cast">
                                <input maxLength={500} value={form.cast || ''} onChange={(event) => set('cast', event.target.value)} className="admin-btn-secondary w-full" />
                            </Field>
                            <Field label="Trailer URL">
                                <input value={form.trailer_url || ''} onChange={(event) => set('trailer_url', event.target.value)} className="admin-btn-secondary w-full" />
                            </Field>
                        </Section>

                        <Section title="Artwork" description="Poster and banner images for the public movie pages.">
                            <div className="grid gap-5 lg:grid-cols-2">
                                <Field label="Poster" hint="JPG, JPEG, PNG, or WebP under 5 MB.">
                                    {images.poster_url && <img src={mediaUrl(images.poster_url)} alt="" className="mb-2 h-48 rounded-lg object-cover" />}
                                    <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={(event) => setFiles((current) => ({ ...current, poster: event.target.files?.[0] || null }))} />
                                </Field>
                                <Field label="Banner" hint="JPG, JPEG, PNG, or WebP under 5 MB.">
                                    {images.banner_url && <img src={mediaUrl(images.banner_url)} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />}
                                    <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={(event) => setFiles((current) => ({ ...current, banner: event.target.files?.[0] || null }))} />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Genres & visibility">
                            <fieldset>
                                <legend className="mb-2 text-sm font-medium text-[#1A2130]">Genres</legend>
                                <div className="flex flex-wrap gap-3">
                                    {genres.length === 0 && <p className="text-sm text-gray-500">No genres yet.</p>}
                                    {genres.map((genre) => (
                                        <label key={genre.id} className="flex items-center gap-2 rounded-lg border border-[#e5ebf3] bg-[#f8fafc] px-3 py-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={form.genre_ids.map(Number).includes(Number(genre.id))}
                                                onChange={(event) => {
                                                    const current = form.genre_ids.map(Number);
                                                    set('genre_ids', event.target.checked ? [...current, genre.id] : current.filter((item) => item !== genre.id));
                                                }}
                                            />
                                            {genre.name}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <label className="flex items-center gap-2 text-sm text-[#1A2130]">
                                <input type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => set('is_published', event.target.checked)} />
                                Published on the public site
                            </label>
                            <div className="flex flex-wrap gap-2 border-t border-[#e5ebf3] pt-4">
                                <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save movie'}</button>
                                {id && (
                                    <button type="button" className="admin-btn-secondary" onClick={() => publish(!form.is_published)}>
                                        {form.is_published ? 'Hide from public' : 'Publish'}
                                    </button>
                                )}
                                <Link to="/admin/movies" className="admin-btn-secondary">Back to movie list</Link>
                            </div>
                        </Section>
                    </form>

                    {id ? (
                        <MovieShowtimesPanel movieId={id} movieTitle={form.title} />
                    ) : (
                        <section className="rounded-xl border border-dashed border-[#c9d4e4] bg-white/70 px-5 py-4 text-sm text-gray-600">
                            Save the movie first, then you can assign screenings for each cinema branch with their own times and prices.
                        </section>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
