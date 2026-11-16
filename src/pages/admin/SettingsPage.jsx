import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import { siteApi } from '../../api/site';
import AdminLayout from '../../layouts/AdminLayout';

function FieldControl({ field, editing, value, onChange }) {
    const locked = !editing;
    const shared = {
        id: field.key,
        disabled: locked,
        value: value ?? '',
        onChange: locked ? undefined : onChange,
        required: editing && (field.required !== false),
        tabIndex: locked ? -1 : undefined,
        maxLength: field.input === 'number' ? undefined : field.max,
        className: field.input === 'textarea'
            ? 'mt-1 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-700'
            : 'mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-700',
    };

    if (field.input === 'textarea') {
        return <textarea {...shared} rows={6} />;
    }

    const type = field.input === 'number'
        ? 'number'
        : field.input === 'email'
            ? 'email'
            : field.input === 'url'
                ? 'url'
                : 'text';

    return (
        <input
            {...shared}
            type={type}
            min={field.min ?? undefined}
            max={field.input === 'number' ? field.max ?? undefined : undefined}
            placeholder={editing && field.input === 'url' ? 'https://…' : undefined}
        />
    );
}

export default function SettingsPage() {
    const [modules, setModules] = useState([]);
    const [values, setValues] = useState({});
    const [draft, setDraft] = useState({});
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        const payload = await adminApi.show('settings');
        setModules(payload.modules || []);
        setValues(payload.data || {});
        setDraft(payload.data || {});

        return payload.data || {};
    };

    useEffect(() => {
        load()
            .catch((failure) => setError(failure.message || 'The settings could not be loaded.'))
            .finally(() => setLoading(false));
    }, []);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const result = await adminApi.update('settings', draft);
            siteApi.clear();
            await load();
            setEditing(false);
            toast.success(result.message || 'The system settings were updated.');
        } catch (failure) {
            setError(failure.message || 'The settings could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="General Settings">
            {loading ? <p className="text-sm text-gray-500">Loading settings…</p> : (
                <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Footer contact, social links, and public pages are edited here. Leave a social URL blank to hide that icon.
                        </p>
                        {editing ? (
                            <button type="button" className="admin-btn-secondary" onClick={() => { setDraft(values); setEditing(false); setError(''); }}>Cancel</button>
                        ) : (
                            <button type="button" className="admin-btn" onClick={() => setEditing(true)}>Edit</button>
                        )}
                    </div>
                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    {modules.map((group) => (
                        <section key={group.module} className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="border-b border-gray-200 pb-2 text-lg font-semibold text-[#1A2130]">{group.module}</h2>
                            {group.items.map((field) => (
                                <label key={field.key} className="block text-sm font-medium text-[#1A2130]" htmlFor={field.key}>
                                    {field.label}
                                    <FieldControl
                                        field={field}
                                        editing={editing}
                                        value={draft[field.key]}
                                        onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                                    />
                                    <span className="mt-1 block font-normal text-gray-600">{field.description}</span>
                                </label>
                            ))}
                        </section>
                    ))}
                    {editing && <button type="submit" disabled={saving} className="admin-btn">{saving ? 'Saving…' : 'Save settings'}</button>}
                </form>
            )}
        </AdminLayout>
    );
}
