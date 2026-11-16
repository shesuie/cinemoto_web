import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/admin';
import AdminLayout from '../../layouts/AdminLayout';
import { pesos } from '../../utils/format';

const monthOptions = [
    { value: '', label: 'All months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const kpiTone = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
};

function Bars({ items, empty, money = false }) {
    if (!items?.length) {
        return <p className="py-8 text-center text-sm text-gray-500">{empty}</p>;
    }

    const max = Math.max(...items.map((item) => item.value), 1);

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={`${item.label}-${item.value}`}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="truncate text-[#1A2130]">
                            {item.href ? <Link className="admin-link" to={item.href}>{item.label}</Link> : item.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-500">
                            {money && item.value_cents != null
                                ? `${item.value} · ${pesos(item.value_cents)}`
                                : item.value}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                        <div
                            className="h-2 rounded-full bg-[#3FA2F6]"
                            style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function currentYear() {
    return new Date().getFullYear();
}

function yearOptions() {
    const year = currentYear();

    return Array.from({ length: 6 }, (_, index) => String(year - index));
}

function daysInMonth(year, month) {
    if (!year || !month) {
        return 31;
    }

    return new Date(Number(year), Number(month), 0).getDate();
}

export default function DashboardPage() {
    const [mode, setMode] = useState('specific');
    const [range, setRange] = useState('month');
    const [year, setYear] = useState(String(currentYear()));
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [day, setDay] = useState('');
    const [cinemaId, setCinemaId] = useState('');
    const [movieId, setMovieId] = useState('');
    const [cards, setCards] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const params = useMemo(() => {
        const query = {
            cinema_id: cinemaId,
            movie_id: movieId,
        };

        if (mode === 'specific') {
            query.year = year;
            query.month = month;
            query.day = day;
        } else {
            query.range = range;
        }

        return query;
    }, [mode, range, year, month, day, cinemaId, movieId]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        adminApi.dashboard(params)
            .then((data) => {
                if (!active) return;
                setCards(data.cards || []);
                setReport(data.report || null);
                setError('');
                if (data.report?.branch?.id && data.report?.cinemas?.length === 1) {
                    setCinemaId(String(data.report.branch.id));
                }
            })
            .catch((failure) => {
                if (active) {
                    setError(failure.message || 'The dashboard could not be loaded.');
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [params]);

    const dayCount = daysInMonth(year, month);
    const lockedBranch = Boolean(report?.branch && report?.cinemas?.length === 1);

    const downloadCsv = async () => {
        setExporting(true);
        try {
            await adminApi.dashboardExport(params);
            toast.success('CSV report downloaded.');
        } catch (failure) {
            toast.error(failure.message || 'The CSV report could not be downloaded.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <AdminLayout header="Dashboard">
            <div className="space-y-6">
                <section className="rounded-2xl border border-[#d7deea] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1A2130]">
                                Reports
                                {report?.label ? ` · ${report.label}` : ''}
                                {report?.branch ? ` · ${report.branch.name}` : cinemaId ? '' : ' · All branches'}
                            </h2>
                            <p className="mt-1 max-w-3xl text-sm text-gray-600">
                                Filter by cinema branch and a specific year, month, or day, then download a CSV of bookings, ticket references, seats, and food orders.
                            </p>
                        </div>
                        <button type="button" className="admin-btn shrink-0" disabled={exporting || loading} onClick={downloadCsv}>
                            {exporting ? 'Preparing CSV…' : 'Download CSV report'}
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <label className="block text-sm font-medium text-[#1A2130]">
                            Filter mode
                            <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}>
                                <option value="specific">Year / month / day</option>
                                <option value="preset">Quick range</option>
                            </select>
                        </label>

                        <label className="block text-sm font-medium text-[#1A2130]">
                            Cinema branch
                            <select
                                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                                value={cinemaId}
                                disabled={lockedBranch}
                                onChange={(event) => setCinemaId(event.target.value)}
                            >
                                {!lockedBranch && <option value="">All branches</option>}
                                {(report?.cinemas || []).map((cinema) => (
                                    <option key={cinema.id} value={cinema.id}>{cinema.name}</option>
                                ))}
                            </select>
                        </label>

                        {mode === 'specific' ? (
                            <>
                                <label className="block text-sm font-medium text-[#1A2130]">
                                    Year
                                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={year} onChange={(event) => { setYear(event.target.value); setDay(''); }}>
                                        {yearOptions().map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-[#1A2130]">
                                    Month
                                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={month} onChange={(event) => { setMonth(event.target.value); setDay(''); }}>
                                        {monthOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-[#1A2130]">
                                    Day
                                    <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={day} disabled={!month} onChange={(event) => setDay(event.target.value)}>
                                        <option value="">All days</option>
                                        {Array.from({ length: dayCount }, (_, index) => String(index + 1)).map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </label>
                            </>
                        ) : (
                            <label className="block text-sm font-medium text-[#1A2130] md:col-span-2">
                                Quick range
                                <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={range} onChange={(event) => setRange(event.target.value)}>
                                    <option value="today">Today</option>
                                    <option value="week">This week</option>
                                    <option value="month">This month</option>
                                    <option value="year">This year</option>
                                    <option value="all">All time</option>
                                </select>
                            </label>
                        )}

                        <label className="block text-sm font-medium text-[#1A2130]">
                            Movie
                            <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" value={movieId} onChange={(event) => setMovieId(event.target.value)}>
                                <option value="">All movies</option>
                                {(report?.movies || []).map((movie) => (
                                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                {loading && <p className="text-sm text-gray-500">Loading the dashboard…</p>}

                {!loading && (report?.kpis?.length > 0) && (
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {report.kpis.map((kpi) => (
                            <article key={kpi.label} className={`rounded-2xl border p-5 shadow-sm ${kpiTone[kpi.tone] || 'border-gray-200 bg-white text-[#1A2130]'}`}>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{kpi.label}</p>
                                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#1A2130]">{kpi.value}</p>
                                <p className="mt-1 text-sm opacity-80">{kpi.hint}</p>
                            </article>
                        ))}
                    </section>
                )}

                {!loading && (
                    <section>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Catalog overview</h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {cards.map((card) => (
                                <Link key={card.label} to={card.href} className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                    <p className="text-sm text-gray-500">{card.label}</p>
                                    <p className="mt-2 text-3xl font-semibold text-[#1A2130]">{card.value}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {report && (report.show_bookings || report.show_orders) && (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {report.show_bookings && (
                            <>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Booking trends</h3>
                                    <p className="mb-4 text-xs text-gray-500">Daily booking volume in the selected period.</p>
                                    <Bars items={report.trend || []} empty="No bookings in this range." />
                                </section>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Booking status</h3>
                                    <p className="mb-4 text-xs text-gray-500">Pending, confirmed, cancelled, and expired holds.</p>
                                    <Bars items={report.statuses || []} empty="No bookings in this range." />
                                </section>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Popular movies</h3>
                                    <p className="mb-4 text-xs text-gray-500">Top movies by bookings.</p>
                                    <Bars items={report.movies_booked || []} empty="No movie bookings in this range." />
                                </section>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Cinema branch performance</h3>
                                    <p className="mb-4 text-xs text-gray-500">Bookings and ticket value by branch.</p>
                                    <Bars items={report.branches || []} empty="No branch bookings in this range." money />
                                </section>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Tickets by movie</h3>
                                    <p className="mb-4 text-xs text-gray-500">Confirmed seat counts by movie title.</p>
                                    <Bars items={report.seats_by_movie || []} empty="No seats were booked in this range." />
                                </section>
                            </>
                        )}
                        {report.show_orders && (
                            <>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Food & drinks sales</h3>
                                    <p className="mb-4 text-xs text-gray-500">Popular snack items ordered with bookings.</p>
                                    <Bars items={report.food || []} empty="No food items were ordered in this range." money />
                                </section>
                                <section className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 font-semibold text-[#1A2130]">Order payment status</h3>
                                    <p className="mb-4 text-xs text-gray-500">Paid vs unpaid food orders.</p>
                                    <Bars items={report.payments || []} empty="No orders in this range." money />
                                </section>
                            </>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
