import { useEffect, useState } from 'react';
import { MESSAGES } from '../../constants/messages';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import { siteApi } from '../../api/site';
import AdminLayout from '../../layouts/AdminLayout';
import { mediaUrl } from '../../utils/format';

const DEFAULT_LOGO = '/images/film-reel.png';

function FieldControl({ field, editing, value, onChange, onFile, logoPreview }) {
    const locked = !editing;
    const shared = {
        id: field.key,
        disabled: locked,
        value: value ?? '',
        onChange: locked ? undefined : onChange,
        required: editing && (field.required !== false) && field.input !== 'image',
        tabIndex: locked ? -1 : undefined,
        maxLength: field.input === 'number' || field.input === 'select' || field.input === 'image' ? undefined : field.max,
        className: field.input === 'textarea'
            ? 'mt-1 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-700'
            : 'mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm disabled:cursor-default disabled:bg-gray-100 disabled:text-gray-700',
    };

    if (field.input === 'textarea') {
        return <textarea {...shared} rows={6} />;
    }

    if (field.input === 'select') {
        return (
            <select {...shared}>
                {Object.entries(field.options || {}).map(([optionValue, label]) => (
                    <option key={optionValue} value={optionValue}>{label}</option>
                ))}
            </select>
        );
    }

    if (field.input === 'image') {
        const preview = logoPreview || (value ? mediaUrl(`/storage/${value}`) : mediaUrl(DEFAULT_LOGO));

        return (
            <div className="mt-2 space-y-3">
                <div className="flex items-center gap-4">
                    {preview ? (
                        <img src={preview} alt="" className="h-16 w-16 rounded-lg border border-gray-200 object-contain bg-gray-50 p-1" />
                    ) : null}
                    <div className="text-xs font-normal text-gray-500">
                        {value ? 'Custom logo on file.' : 'Using the default film-reel logo.'}
                    </div>
                </div>
                {editing && (
                    <input
                        id={field.key}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1A2130] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                        onChange={onFile}
                    />
                )}
            </div>
        );
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
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        const payload = await adminApi.show('settings');
        setModules(payload.modules || []);
        setValues(payload.data || {});
        setDraft(payload.data || {});
        setLogoFile(null);
        setLogoPreview('');

        return payload.data || {};
    };

    useEffect(() => {
        load()
            .catch((failure) => setError(failure.message || 'The settings could not be loaded.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => () => {
        if (logoPreview) URL.revokeObjectURL(logoPreview);
    }, [logoPreview]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const body = new FormData();
            Object.entries(draft).forEach(([key, value]) => {
                if (key === 'app_logo_path') {
                    return;
                }
                body.append(key, value == null ? '' : String(value));
            });
            if (logoFile) {
                body.append('app_logo', logoFile);
            } else if (draft.app_logo_path != null) {
                body.append('app_logo_path', draft.app_logo_path);
            }

            const result = await adminApi.post('settings', body);
            siteApi.clear();
            await load();
            setEditing(false);
            toast.success(result.message || MESSAGES.settingsSaved);
        } catch (failure) {
            setError(failure.message || 'The settings could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout header="General Settings">
            {loading ? <p className="text-sm text-gray-500">Loading settings…</p> : (
                <form onSubmit={save} className="mx-auto max-w-3xl space-y-6" encType="multipart/form-data">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Branding, footer contact, social links, and public pages are edited here. Leave a social URL blank to hide that icon.
                        </p>
                        {editing ? (
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => {
                                    setDraft(values);
                                    setLogoFile(null);
                                    setLogoPreview('');
                                    setEditing(false);
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
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
                                        logoPreview={field.input === 'image' ? logoPreview : ''}
                                        onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                                        onFile={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            setLogoFile(file);
                                            setLogoPreview(file ? URL.createObjectURL(file) : '');
                                        }}
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
