import { useEffect, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

export default function FoodProductFormPage() {
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
            toast.success(id ? MESSAGES.foodProductSaved : MESSAGES.foodProductAdded);
            navigate('/admin/food');
        } catch (failure) {
            setError(failure.message || 'The product could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const previewSrc = image ? URL.createObjectURL(image) : (imageUrl ? mediaUrl(imageUrl) : null);

    return (
        <AdminLayout header={id ? 'Edit product' : 'Add product'}>
            {loading ? <p className="text-sm text-gray-500">Loading the product…</p> : (
                <form onSubmit={save} className="mx-auto grid w-full max-w-4xl gap-5">
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                    <section className="grid gap-4 rounded-xl border border-[#d7deea] bg-white p-5 shadow-sm">
                        <h2 className="text-base font-semibold text-[#1A2130]">Product details</h2>
                        {options.branch ? (
                            <p className="text-sm text-gray-600">Branch · {options.branch.name}</p>
                        ) : (
                            <label className="grid gap-1.5 text-sm text-[#1A2130]">
                                <span className="font-medium">Branch</span>
                                <select required value={form.cinema_id} onChange={(event) => setForm({ ...form, cinema_id: event.target.value })} className="admin-btn-secondary">
                                    <option value="">Select branch</option>
                                    {options.cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
                                </select>
                            </label>
                        )}
                        <label className="grid gap-1.5 text-sm text-[#1A2130]">
                            <span className="font-medium">Category</span>
                            <select required value={form.food_category_id} onChange={(event) => setForm({ ...form, food_category_id: event.target.value })} className="admin-btn-secondary">
                                <option value="">Select category</option>
                                {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-sm text-[#1A2130]">
                            <span className="font-medium">Name</span>
                            <input required maxLength={50} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-btn-secondary" />
                        </label>
                        <label className="grid gap-1.5 text-sm text-[#1A2130]">
                            <span className="font-medium">Description</span>
                            <textarea maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-1.5 text-sm text-[#1A2130]">
                                <span className="font-medium">Price (₱)</span>
                                <input required inputMode="decimal" value={form.price_pesos} onChange={(event) => setForm({ ...form, price_pesos: event.target.value })} className="admin-btn-secondary" />
                            </label>
                            <label className="grid gap-1.5 text-sm text-[#1A2130]">
                                <span className="font-medium">Quantity limit</span>
                                <input type="number" min="0" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} placeholder="Blank for no limit" className="admin-btn-secondary" />
                            </label>
                        </div>
                        <label className="grid gap-1.5 text-sm text-[#1A2130]">
                            <span className="font-medium">Photo</span>
                            <div className="relative overflow-hidden rounded-lg border border-[#e5ebf3] bg-[#f8fafc]">
                                {previewSrc ? (
                                    <img src={previewSrc} alt="" className={`h-48 w-full object-cover ${form.is_available ? '' : 'brightness-50 grayscale'}`} />
                                ) : (
                                    <div className="flex h-40 items-center justify-center text-sm text-gray-500">No photo yet</div>
                                )}
                                {!form.is_available && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="-rotate-12 rounded-md border-2 border-white/80 bg-black/50 px-3 py-1.5 text-sm font-bold uppercase tracking-[0.18em] text-white">
                                            Not available
                                        </span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block text-sm" onChange={(event) => setImage(event.target.files?.[0] || null)} />
                        </label>
                    </section>

                    <section className="grid gap-3 rounded-xl border border-[#d7deea] bg-white p-5 shadow-sm">
                        <h2 className="text-base font-semibold text-[#1A2130]">Availability</h2>
                        <p className="text-sm text-gray-600">
                            Not available items stay on the public menu with a watermark and cannot be ordered.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${form.is_available ? 'border-[#1A2130] bg-[#eef2f7]' : 'border-[#e5ebf3]'}`}>
                                <input
                                    type="radio"
                                    name="availability"
                                    checked={form.is_available}
                                    onChange={() => setForm({ ...form, is_available: true })}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block font-medium text-[#1A2130]">Available</span>
                                    <span className="text-gray-600">Customers can add this item.</span>
                                </span>
                            </label>
                            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${!form.is_available ? 'border-red-700 bg-red-50' : 'border-[#e5ebf3]'}`}>
                                <input
                                    type="radio"
                                    name="availability"
                                    checked={!form.is_available}
                                    onChange={() => setForm({ ...form, is_available: false })}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block font-medium text-[#1A2130]">Not available</span>
                                    <span className="text-gray-600">Shown with a watermark; ordering is blocked.</span>
                                </span>
                            </label>
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-[#e5ebf3] pt-4">
                            <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save product'}</button>
                            <Link to="/admin/food" className="admin-btn-secondary">Cancel</Link>
                        </div>
                    </section>
                </form>
            )}
        </AdminLayout>
    );
}
