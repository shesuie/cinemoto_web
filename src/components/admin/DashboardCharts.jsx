import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { pesos } from '../../utils/format';

const BRAND = '#3FA2F6';
const GRID = '#e8edf5';
const AXIS = '#6b7280';

const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#ef4444',
    expired: '#64748b',
    unpaid: '#f59e0b',
    paid: '#10b981',
    checked_in: '#10b981',
    awaiting_check_in: '#f59e0b',
};

const STATUS_LABELS = {
    checked_in: 'Checked in',
    awaiting_check_in: 'Awaiting check-in',
};

const PALETTE = ['#3FA2F6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#14b8a6', '#f97316'];

function statusColor(label, index = 0) {
    const key = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    return STATUS_COLORS[key] || PALETTE[index % PALETTE.length];
}

function EmptyState({ message }) {
    return <p className="flex h-56 items-center justify-center text-sm text-gray-500">{message}</p>;
}

function ChartTooltip({ active, payload, label, money = false }) {
    if (!active || !payload?.length) {
        return null;
    }

    const row = payload[0]?.payload || {};
    const value = payload[0]?.value;

    return (
        <div className="rounded-lg border border-[#d7deea] bg-white px-3 py-2 text-sm shadow-md">
            <p className="font-medium text-[#1A2130]">{label || row.label || row.name}</p>
            <p className="mt-0.5 tabular-nums text-gray-600">
                {money && row.value_cents != null
                    ? `${value} · ${pesos(row.value_cents)}`
                    : value}
            </p>
        </div>
    );
}

export function TrendChart({ items, empty }) {
    if (!items?.length) {
        return <EmptyState message={empty} />;
    }

    const data = items.map((item) => ({
        ...item,
        name: String(item.label || '').slice(5) || item.label,
    }));

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="bookingTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2.5} fill="url(#bookingTrend)" name="Bookings" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DonutChart({ items, empty }) {
    if (!items?.length) {
        return <EmptyState message={empty} />;
    }

    const data = items.map((item, index) => {
        const key = String(item.label || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');

        return {
            ...item,
            name: STATUS_LABELS[key] || item.label,
            fill: statusColor(item.label, index),
        };
    });
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
        <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="78%"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
                <div className="text-center">
                    <p className="text-2xl font-semibold tabular-nums text-[#1A2130]">{total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </div>
            </div>
        </div>
    );
}

export function RankedBarChart({ items, empty, money = false, color = BRAND }) {
    if (!items?.length) {
        return <EmptyState message={empty} />;
    }

    const data = items.map((item) => ({
        ...item,
        name: item.label.length > 18 ? `${item.label.slice(0, 16)}…` : item.label,
        fullLabel: item.label,
    }));
    const height = Math.max(220, data.length * 36);

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0].payload;
                            return (
                                <div className="rounded-lg border border-[#d7deea] bg-white px-3 py-2 text-sm shadow-md">
                                    <p className="font-medium text-[#1A2130]">{row.fullLabel}</p>
                                    <p className="mt-0.5 tabular-nums text-gray-600">
                                        {money && row.value_cents != null
                                            ? `${row.value} · ${pesos(row.value_cents)}`
                                            : row.value}
                                    </p>
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
