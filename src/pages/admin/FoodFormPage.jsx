import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';
import { mediaUrl } from '../../utils/format';

const empty = {
    cinema_id: '',
    food_category_id: '',
    name: '',
    description: '',
    price_pesos: '',
    stock_quantity: '',
    is_available: true,
};

export default function FoodFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(empty);
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [options, setOptions] = useState({ categories: [], cinemas: [], branch: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const request = id ? adminApi.show(`food/${id}`) : adminApi.list('food', { per_page: 10 });
        request
            .then((payload) => {
                setOptions({
                    categories: payload.categories || [],
                    cinemas: payload.cinemas || [],
                    branch: payload.branch || null,
                });
                if (payload.data) {
                    setForm({
                        cinema_id: String(payload.data.cinema_id || ''),
                        food_category_id: String(payload.data.food_category_id || ''),
                        name: payload.data.name || '',
                        description: payload.data.description || '',
                        price_pesos: (payload.data.price_cents / 100).toFixed(2),
                        stock_quantity: payload.data.stock_quantity ?? '',
                        is_available: Boolean(payload.data.is_available),
                    });
                    setImageUrl(payload.data.image_url);
                } else if (payload.branch) {
                    setForm((current) => ({ ...current, cinema_id: String(payload.branch.id) }));
                }
            })
            .catch((failure) => setError(failure.message || 'The product could not be loaded.'))
            .finally(() => setLoading(false));
    }, [id]);

    const save = async (event) => {
        event.preventDefault();
        const cents = Math.round(Number(form.price_pesos) * 100);
        if (!Number.isFinite(cents) || cents < 0) {
            setError('Enter a price of zero pesos or more.');
            return;
        }
        setSaving(true);
        setError('');
        const fields = {
            cinema_id: options.branch?.id ?? form.cinema_id,
            food_category_id: form.food_category_id,
            name: form.name,
            description: form.description,
            price_cents: cents,
            stock_quantity: form.stock_quantity === '' ? '' : form.stock_quantity,
            is_available: form.is_available ? 1 : 0,
        };
        try {
            if (image) {
                const body = new FormData();
                Object.entries(fields).forEach(([key, value]) => body.append(key, value));
                body.append('image', image);
                if (id) {
                    await adminApi.post(`food/${id}`, body);
                } else {
                    await adminApi.create('food', body);
                }
            } else if (id) {
                await adminApi.update(`food/${id}`, {
                    ...fields,
                    stock_quantity: form.stock_quantity === '' ? null : Number(form.stock_quantity),
                    is_available: Boolean(form.is_available),
                });
            } else {
                await adminApi.create('food', {
                    ...fields,
                    stock_quantity: form.stock_quantity === '' ? null : Number(form.stock_quantity),
                    is_available: Boolean(form.is_available),
                });
            }
            toast.success(id ? 'The menu item was saved.' : 'The menu item was added.');
            navigate('/admin/food');
        } catch (failure) {
            setError(failure.message || 'The product could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header={id ? 'Edit product' : 'Add product'}>
            {loading ? <p className="text-sm text-gray-500">Loading the product…</p> : (
                <form onSubmit={save} className="grid max-w-3xl gap-3 rounded-lg bg-white p-4 shadow-sm">
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    {options.branch ? (
                        <p className="text-sm text-gray-600">Branch · {options.branch.name}</p>
                    ) : (
                        <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value })} className="admin-btn-secondary" aria-label="Branch">
                            <option value="">Branch</option>
                            {options.cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                        </select>
                    )}
                    <select required value={form.food_category_id} onChange={(event) => setForm({ ...form, food_category_id: event.target.value })} className="admin-btn-secondary" aria-label="Category">
                        <option value="">Category</option>
                        {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="admin-btn-secondary" />
                    <textarea maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input required inputMode="decimal" value={form.price_pesos} onChange={(event) => setForm({ ...form, price_pesos: event.target.value })} placeholder="Price in pesos" className="admin-btn-secondary" />
                    <input type="number" min="0" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} placeholder="Quantity limit, blank for none" className="admin-btn-secondary" aria-label="Quantity limit" />
                    {imageUrl && <img src={mediaUrl(imageUrl)} alt="" className="h-40 w-full rounded-lg object-cover" />}
                    <label className="text-sm text-gray-600">Photo
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" onChange={(event) => setImage(event.target.files?.[0] || null)} />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_available} onChange={(event) => setForm({ ...form, is_available: event.target.checked })} />
                        Available on the public menu
                    </label>
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save product'}</button>
                </form>
            )}
        </AdminLayout>
    );
}
