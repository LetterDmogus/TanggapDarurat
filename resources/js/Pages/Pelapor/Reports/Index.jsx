import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Admin/Pagination';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ items, filters, statuses }) {
    const applyFilters = (next) => {
        router.get(route('pelapor.reports.index'), next, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold leading-tight text-white">Laporan Saya</h2>
                    <Link
                        href={route('pelapor.reports.create')}
                        className="inline-flex items-center rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Buat Laporan
                    </Link>
                </div>
            }
        >
            <Head title="Laporan Saya" />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow md:grid-cols-4">
                        <div>
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status || ''}
                                onChange={(event) => applyFilters({ ...filters, status: event.target.value })}
                            >
                                <option value="">Semua status</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Dari Tanggal</label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.date_from || ''}
                                onChange={(event) => applyFilters({ ...filters, date_from: event.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Sampai Tanggal</label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.date_to || ''}
                                onChange={(event) => applyFilters({ ...filters, date_to: event.target.value })}
                            />
                        </div>
                        <div className="flex items-end">
                            <button type="button" className="btn-secondary w-full" onClick={() => applyFilters({})}>
                                Reset Filter
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow">
                        <div className="table-container bg-white">
                            <table className="w-full min-w-full">
                                <thead className="table-header">
                                    <tr>
                                        <th>ID</th>
                                        <th>Tipe Darurat</th>
                                        <th>Status</th>
                                        <th>Foto</th>
                                        <th>Dibuat</th>
                                        <th className="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-100">
                                    {items.data.map((item) => (
                                        <tr key={item.id} className="table-row">
                                            <td>#{item.id}</td>
                                            <td>{item.emergency_type?.display_name || item.emergency_type?.name || '-'}</td>
                                            <td><StatusBadge type={item.status}>{item.status}</StatusBadge></td>
                                            <td>{item.photos_count}</td>
                                            <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                                            <td className="text-right">
                                                <Link className="btn-secondary btn-sm" href={route('pelapor.reports.show', item.id)}>
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-surface-400">
                                                Belum ada laporan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4">
                            <Pagination links={items.links} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
