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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Laporan Saya</h2>
                    <Link href={route('pelapor.reports.create')} className="btn-primary">Buat Laporan</Link>
                </div>
            }
        >
            <Head title="Laporan Saya" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    <div className="card p-4 grid md:grid-cols-4 gap-3">
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

                    <div className="card overflow-hidden">
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
