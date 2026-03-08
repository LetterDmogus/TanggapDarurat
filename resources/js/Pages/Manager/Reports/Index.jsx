import ManagerLayout from '@/Layouts/ManagerLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, router } from '@inertiajs/react';
import { Download, FileSpreadsheet, FileText, Filter, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const periodOptions = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'this_week', label: 'Minggu Ini' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'custom', label: 'Custom Tanggal' },
];

export default function Index({ items, filters, statuses, summary }) {
    const [form, setForm] = useState({
        search: filters?.search || '',
        status: filters?.status || '',
        period: filters?.period || 'this_month',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        per_page: String(filters?.per_page || '10'),
    });

    const exportParams = useMemo(
        () => ({
            search: form.search || undefined,
            status: form.status || undefined,
            period: form.period,
            date_from: form.date_from || undefined,
            date_to: form.date_to || undefined,
        }),
        [form],
    );

    const columns = [
        { key: 'id', label: 'ID', render: (item) => `#${item.id}` },
        {
            key: 'emergency_type',
            label: 'Emergency Type',
            render: (item) => item.emergency_type?.display_name || item.emergency_type?.name || '-',
        },
        { key: 'pelapor', label: 'Pelapor', render: (item) => item.pelapor?.name || '-' },
        { key: 'status', label: 'Status', render: (item) => <StatusBadge type={item.status}>{item.status}</StatusBadge> },
        { key: 'created_at', label: 'Created At', render: (item) => (item.created_at ? new Date(item.created_at).toLocaleString() : '-') },
    ];

    const applyFilter = (overrides = {}) => {
        const payload = { ...form, ...overrides };
        router.get(route('manager.reports.index'), payload, { preserveState: true, replace: true });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        applyFilter({ per_page: form.per_page || '10' });
    };

    const handleReset = () => {
        const reset = {
            search: '',
            status: '',
            period: 'this_month',
            date_from: filters?.date_from || '',
            date_to: filters?.date_to || '',
            per_page: '10',
        };
        setForm(reset);
        router.get(route('manager.reports.index'), reset, { preserveState: true, replace: true });
    };

    return (
        <ManagerLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Laporan Manager</h2>
                </div>
            }
        >
            <Head title="Laporan Manager" />

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
                    <div className="relative lg:col-span-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                        <input
                            type="text"
                            className="form-input pl-10"
                            placeholder="Cari deskripsi/pelapor..."
                            value={form.search}
                            onChange={(e) => setForm((prev) => ({ ...prev, search: e.target.value }))}
                        />
                    </div>

                    <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Semua Status</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <select
                        className="form-select"
                        value={form.period}
                        onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))}
                    >
                        {periodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="form-input"
                        value={form.date_from}
                        onChange={(e) => setForm((prev) => ({ ...prev, date_from: e.target.value }))}
                        disabled={form.period !== 'custom'}
                    />

                    <input
                        type="date"
                        className="form-input"
                        value={form.date_to}
                        onChange={(e) => setForm((prev) => ({ ...prev, date_to: e.target.value }))}
                        disabled={form.period !== 'custom'}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-surface-500">
                        Periode aktif: <span className="font-semibold text-surface-700">{summary?.date_from}</span> s/d{' '}
                        <span className="font-semibold text-surface-700">{summary?.date_to}</span> | Total:{' '}
                        <span className="font-semibold text-surface-700">{summary?.total_reports || 0}</span> laporan
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="form-select h-10 py-0"
                            value={form.per_page}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm((prev) => ({ ...prev, per_page: value }));
                                applyFilter({ per_page: value });
                            }}
                        >
                            <option value="10">10 / page</option>
                            <option value="25">25 / page</option>
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                        </select>
                        <button type="submit" className="btn-primary inline-flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Tampilkan
                        </button>
                        <button type="button" onClick={handleReset} className="btn-secondary">
                            Reset
                        </button>
                    </div>
                </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
                <a
                    href={route('manager.reports.print', exportParams)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-50"
                >
                    <Printer className="h-4 w-4" />
                    Print
                </a>
                <a
                    href={route('manager.reports.export.excel', exportParams)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                </a>
                <a
                    href={route('manager.reports.export.pdf', exportParams)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                    <Download className="h-4 w-4" />
                    Export PDF
                </a>
            </div>

            <DataTable columns={columns} items={items.data} />
            <Pagination links={items.links} />
        </ManagerLayout>
    );
}
