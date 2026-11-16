import { useEffect, useState } from 'react';

export default function AdminTable({
    title,
    description,
    columns,
    listing,
    query,
    onQuery,
    filters = [],
    loading,
    error,
    empty = 'No records match this view.',
    toolbar,
}) {
    const [search, setSearch] = useState(query.search ?? '');

    useEffect(() => {
        setSearch(query.search ?? '');
    }, [query.search]);

    const rows = listing?.data || [];

    return (
        <section className="rounded-lg bg-white shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-4 py-4">
                <div>
                    <h2 className="text-base font-semibold text-[#1A2130]">{title}</h2>
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
                {toolbar}
            </div>
            <form
                className="flex flex-wrap gap-2 px-4 py-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    onQuery({ ...query, search, page: 1 });
                }}
            >
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="h-10 min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 text-sm"
                />
                {filters.map((filter) => (
                    filter.type === 'date' ? (
                        <input
                            key={filter.key}
                            type="date"
                            aria-label={filter.label}
                            value={query[filter.key] ?? ''}
                            onChange={(event) => onQuery({ ...query, [filter.key]: event.target.value, page: 1 })}
                            className="admin-btn-secondary"
                        />
                    ) : (
                        <select
                            key={filter.key}
                            value={query[filter.key] ?? ''}
                            onChange={(event) => onQuery({ ...query, [filter.key]: event.target.value, page: 1 })}
                            className="admin-btn-secondary"
                            aria-label={filter.label}
                        >
                            <option value="">{filter.label}</option>
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    )
                ))}
                <button type="submit" className="admin-btn">Search</button>
            </form>
            {error && <p className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                            {columns.map((column) => <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td className="px-4 py-6 text-gray-500" colSpan={columns.length}>Loading records…</td></tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr><td className="px-4 py-6 text-gray-500" colSpan={columns.length}>{empty}</td></tr>
                        )}
                        {!loading && rows.map((row) => (
                            <tr key={row.id} className="border-t border-gray-100">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-4 py-3 align-middle">
                                        {column.render ? column.render(row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {listing && listing.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                    <span>{listing.from}–{listing.to} of {listing.total}</span>
                    <div className="flex gap-2">
                        <button type="button" className="rounded-lg border px-3 py-1 disabled:opacity-40" disabled={listing.current_page <= 1} onClick={() => onQuery({ ...query, page: listing.current_page - 1 })}>Previous</button>
                        <button type="button" className="rounded-lg border px-3 py-1 disabled:opacity-40" disabled={listing.current_page >= listing.last_page} onClick={() => onQuery({ ...query, page: listing.current_page + 1 })}>Next</button>
                    </div>
                </div>
            )}
        </section>
    );
}
