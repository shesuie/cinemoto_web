import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
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
            if (files.poster || files.banner) {
                const body = new FormData();
                Object.entries(fields).forEach(([key, value]) => body.append(key, value));
                form.genre_ids.forEach((genreId) => body.append('genre_ids[]', genreId));
                if (files.poster) {
                    body.append('poster', files.poster);
                }
                if (files.banner) {
                    body.append('banner', files.banner);
                }
                if (id) {
                    await adminApi.post(`movies/${id}`, body);
                } else {
                    await adminApi.create('movies', body);
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
                await adminApi.create('movies', {
                    ...fields,
                    is_published: Boolean(form.is_published),
                    genre_ids: form.genre_ids.map(Number),
                    release_date: form.release_date || null,
                    trailer_url: form.trailer_url || null,
                });
            }
            toast.success(id ? 'The movie details were saved.' : 'The movie was added.');
            navigate('/admin/movies');
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
            toast.error(failure.message || 'Publication could not be changed.');
        }
    };

    return (
        <AdminLayout header={id ? 'Edit movie' : 'Add movie'}>
            {loading ? <p className="text-sm text-gray-500">Loading the movie…</p> : (
                <form onSubmit={save} className="grid max-w-3xl gap-3 rounded-lg bg-white p-4 shadow-sm">
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    <input required maxLength={50} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Title" className="admin-btn-secondary" />
                    <textarea maxLength={1000} value={form.synopsis || ''} onChange={(event) => set('synopsis', event.target.value)} placeholder="Synopsis" className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input required type="number" min="1" max="500" value={form.duration_minutes} onChange={(event) => set('duration_minutes', event.target.value)} aria-label="Duration minutes" className="admin-btn-secondary" placeholder="Duration (minutes)" />
                        <input maxLength={20} value={form.rating || ''} onChange={(event) => set('rating', event.target.value)} placeholder="Star rating (e.g. 9.2)" className="admin-btn-secondary" />
                        <select value={form.resolution || 'HD'} onChange={(event) => set('resolution', event.target.value)} className="admin-btn-secondary" aria-label="Resolution">
                            {resolutionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <input type="date" value={form.release_date || ''} onChange={(event) => set('release_date', event.target.value)} aria-label="Release date" className="admin-btn-secondary" />
                    </div>
                    <p className="text-xs text-gray-500">Resolution (HD / 2D / 3D / IMAX) shows on movie cards and banners. Year comes from the release date.</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <input maxLength={50} value={form.director || ''} onChange={(event) => set('director', event.target.value)} placeholder="Director" className="admin-btn-secondary" />
                        <input maxLength={80} value={form.language || ''} onChange={(event) => set('language', event.target.value)} placeholder="Language" className="admin-btn-secondary" />
                        <select value={form.status} onChange={(event) => set('status', event.target.value)} className="admin-btn-secondary" aria-label="Status">
                            {movieStatusOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>
                    <input maxLength={500} value={form.cast || ''} onChange={(event) => set('cast', event.target.value)} placeholder="Cast" className="admin-btn-secondary" />
                    <input value={form.trailer_url || ''} onChange={(event) => set('trailer_url', event.target.value)} placeholder="Trailer URL" className="admin-btn-secondary" />
                    <label className="text-sm text-gray-600">Poster
                        {images.poster_url && <img src={mediaUrl(images.poster_url)} alt="" className="mt-2 h-40 rounded-lg object-cover" />}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block text-sm" onChange={(event) => setFiles((current) => ({ ...current, poster: event.target.files?.[0] || null }))} />
                        <span className="mt-1 block text-xs text-gray-500">JPG, PNG, or WebP under 2 MB.</span>
                    </label>
                    <label className="text-sm text-gray-600">Banner
                        {images.banner_url && <img src={mediaUrl(images.banner_url)} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block text-sm" onChange={(event) => setFiles((current) => ({ ...current, banner: event.target.files?.[0] || null }))} />
                        <span className="mt-1 block text-xs text-gray-500">JPG, PNG, or WebP under 2 MB.</span>
                    </label>
                    <fieldset>
                        <legend className="text-sm text-gray-600">Genres</legend>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {genres.length === 0 && <p className="text-sm text-gray-500">No genres yet.</p>}
                            {genres.map((genre) => (
                                <label key={genre.id} className="flex items-center gap-2 text-sm">
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
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => set('is_published', event.target.checked)} />
                        Published on the public site
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save movie'}</button>
                        {id && (
                            <button type="button" className="admin-btn-secondary" onClick={() => publish(!form.is_published)}>
                                {form.is_published ? 'Hide from public' : 'Publish'}
                            </button>
                        )}
                    </div>
                </form>
            )}
        </AdminLayout>
    );
}
