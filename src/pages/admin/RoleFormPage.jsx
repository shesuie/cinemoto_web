import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';

export default function RoleFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [groups, setGroups] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const request = id ? adminApi.show(`roles/${id}`) : adminApi.show('roles/options');
        request
            .then((payload) => {
                setGroups(payload.groups || []);
                if (payload.data) {
                    setName(payload.data.name);
                    setSelected(payload.data.permissions || []);
                }
            })
            .catch((failure) => setError(failure.message || 'The role could not be loaded.'))
            .finally(() => setLoading(false));
    }, [id]);

    const toggle = (permission) => {
        setSelected((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
    };

    const save = async (event) => {
        event.preventDefault();
        if (selected.length === 0) {
            setError('Please check at least one module.');
            return;
        }
        setSaving(true);
        setError('');
        const body = { name, permissions: selected };
        try {
            if (id) {
                await adminApi.update(`roles/${id}`, body);
                toast.success('The role and its permissions were saved.');
            } else {
                await adminApi.create('roles', body);
                toast.success('The role and its permissions were added.');
            }
            navigate('/admin/roles');
        } catch (failure) {
            setError(failure.message || 'The role could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header={id ? 'Edit role' : 'Create role'}>
            {loading ? <p className="text-sm text-gray-500">Loading permissions…</p> : (
                <form onSubmit={save} className="grid max-w-3xl gap-3 rounded-lg bg-white p-4 shadow-sm">
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    <input required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="Role name" className="admin-btn-secondary" />
                    <p className="text-sm text-gray-600">Role management stays with Super Admin and is not on this list. An account keeps one role.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {groups.map((group) => (
                            <label key={group.module} className="flex items-center gap-2 text-sm font-semibold text-[#1A2130]">
                                <input
                                    type="checkbox"
                                    checked={group.items.every((item) => selected.includes(item.name))}
                                    onChange={() => group.items.forEach((item) => toggle(item.name))}
                                />
                                {group.module}
                            </label>
                        ))}
                    </div>
                    <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save role'}</button>
                </form>
            )}
        </AdminLayout>
    );
}
