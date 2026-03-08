import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, ChartNoAxesCombined, Siren, TrendingUp } from 'lucide-react';

const chartTypeOptions = [
    { value: 'line', label: 'Line' },
    { value: 'bar', label: 'Bar' },
    { value: 'area', label: 'Area' },
];

const dailyPeriodOptions = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'yesterday', label: 'Kemarin' },
];

const weeklyPeriodOptions = [
    { value: 'this_week', label: 'Minggu Ini' },
    { value: 'last_week', label: 'Minggu Lalu' },
];

function buildChartPoints(data, width, height, padding) {
    const safeData = Array.isArray(data) ? data : [];
    if (safeData.length === 0) {
        return { points: [], maxValue: 1 };
    }

    const maxValue = Math.max(...safeData.map((item) => Number(item.value) || 0), 1);
    const stepX = safeData.length > 1 ? (width - padding * 2) / (safeData.length - 1) : 0;
    const chartHeight = height - padding * 2;

    const points = safeData.map((item, index) => {
        const value = Number(item.value) || 0;
        const x = padding + index * stepX;
        const y = padding + (1 - value / maxValue) * chartHeight;

        return {
            ...item,
            x,
            y,
            value,
        };
    });

    return { points, maxValue };
}

function SimpleChart({ data, type }) {
    const width = 760;
    const height = 260;
    const padding = 28;
    const [activePoint, setActivePoint] = useState(null);

    const { points, maxValue } = useMemo(() => buildChartPoints(data, width, height, padding), [data]);

    if (!points.length) {
        return <p className="text-sm text-surface-500">Belum ada data.</p>;
    }

    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    const barWidth = Math.max(8, Math.floor((width - padding * 2) / Math.max(points.length, 1)) - 4);

    return (
        <div className="space-y-3">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-64 w-full rounded-xl border border-surface-200 bg-white"
                onMouseLeave={() => setActivePoint(null)}
            >
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />

                {type === 'bar' &&
                    points.map((point) => (
                        <rect
                            key={`bar-${point.label}-${point.x}`}
                            x={point.x - barWidth / 2}
                            y={point.y}
                            width={barWidth}
                            height={height - padding - point.y}
                            fill="#ef4444"
                            opacity="0.85"
                            rx="3"
                            onMouseEnter={() => setActivePoint(point)}
                        />
                    ))}

                {type === 'area' && (
                    <>
                        <path d={areaPath} fill="#fecaca" opacity="0.8" />
                        <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2.5" />
                    </>
                )}

                {type === 'line' && <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2.5" />}

                {(type === 'line' || type === 'area') &&
                    points.map((point) => (
                        <g key={`dot-${point.label}-${point.x}`}>
                            <circle cx={point.x} cy={point.y} r="3" fill="#b91c1c" />
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="10"
                                fill="transparent"
                                onMouseEnter={() => setActivePoint(point)}
                            />
                        </g>
                    ))}

                {activePoint && (
                    <g pointerEvents="none">
                        <rect
                            x={Math.max(padding, Math.min(width - 188, activePoint.x - 92))}
                            y={Math.max(6, activePoint.y - 44)}
                            width="184"
                            height="34"
                            rx="7"
                            fill="#111827"
                            opacity="0.94"
                        />
                        <text
                            x={Math.max(padding + 8, Math.min(width - 180, activePoint.x - 84))}
                            y={Math.max(26, activePoint.y - 22)}
                            fill="#f9fafb"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {`${activePoint.label}: ${activePoint.value} laporan`}
                        </text>
                    </g>
                )}
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-surface-500">
                <div className="flex flex-wrap gap-3">
                    {points.filter((_, index) => index % Math.ceil(points.length / 6) === 0 || index === points.length - 1).map((point) => (
                        <span key={`label-${point.label}-${point.x}`}>{point.label}</span>
                    ))}
                </div>
                <span className="font-semibold text-surface-600">Max: {maxValue}</span>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon }) {
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-surface-600">{title}</p>
                <div className="rounded-lg bg-red-100 p-2">
                    <Icon className="h-4 w-4 text-red-600" />
                </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-surface-900">{value}</p>
        </div>
    );
}

export default function Dashboard({ analytics }) {
    const [dailyPeriod, setDailyPeriod] = useState('today');
    const [dailyChartType, setDailyChartType] = useState('line');
    const [weeklyPeriod, setWeeklyPeriod] = useState('this_week');
    const [weeklyChartType, setWeeklyChartType] = useState('bar');

    const dailySeries = analytics?.daily?.[dailyPeriod] ?? [];
    const weeklySeries = analytics?.weekly?.[weeklyPeriod] ?? [];

    return (
        <AdminLayout
            header={
                <h2 className="text-xl font-bold tracking-tight text-surface-900">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            {(analytics?.summary?.triage_reports ?? 0) > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                            <Siren className="mt-0.5 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Laporan Triage Baru</p>
                                <p className="text-sm text-blue-700">
                                    Ada <span className="font-bold">{analytics.summary.triage_reports}</span> laporan kategori Lainnya yang perlu diklasifikasikan.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.reports.index', { status: 'triage' })}
                            className="btn-primary text-xs"
                        >
                            Buka Antrian Triage
                        </Link>
                    </div>
                </div>
            )}

            {(analytics?.summary?.waiting_validation_reports ?? 0) > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Validasi Admin Dibutuhkan</p>
                                <p className="text-sm text-amber-700">
                                    Ada <span className="font-bold">{analytics.summary.waiting_validation_reports}</span> laporan menunggu validasi.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.reports.index', { status: 'resolved_waiting_validation' })}
                            className="btn-primary text-xs"
                        >
                            Buka Laporan Validasi
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Laporan Hari Ini" value={analytics?.summary?.today_reports ?? 0} icon={CalendarDays} />
                <SummaryCard title="Laporan Kemarin" value={analytics?.summary?.yesterday_reports ?? 0} icon={TrendingUp} />
                <SummaryCard title="Laporan Bulan Lalu" value={analytics?.summary?.last_month_reports ?? 0} icon={ChartNoAxesCombined} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="card p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-surface-900">Grafik Laporan Harian</h3>
                        <div className="flex items-center gap-2">
                            <select className="form-select text-sm" value={dailyPeriod} onChange={(e) => setDailyPeriod(e.target.value)}>
                                {dailyPeriodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <select className="form-select text-sm" value={dailyChartType} onChange={(e) => setDailyChartType(e.target.value)}>
                                {chartTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <SimpleChart data={dailySeries} type={dailyChartType} />
                </div>

                <div className="card p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-surface-900">Grafik Laporan Mingguan</h3>
                        <div className="flex items-center gap-2">
                            <select className="form-select text-sm" value={weeklyPeriod} onChange={(e) => setWeeklyPeriod(e.target.value)}>
                                {weeklyPeriodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <select className="form-select text-sm" value={weeklyChartType} onChange={(e) => setWeeklyChartType(e.target.value)}>
                                {chartTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <SimpleChart data={weeklySeries} type={weeklyChartType} />
                </div>
            </div>

            <div className="card p-4 text-sm text-surface-500">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary-600" />
                    Data dihitung dari waktu pembuatan laporan (`created_at`).
                </div>
            </div>
        </AdminLayout>
    );
}
