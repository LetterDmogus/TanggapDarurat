import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Admin/Pagination';
import SearchFilter from '@/Components/Admin/SearchFilter';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, ExternalLink } from 'lucide-react';

export default function Index({ items, filters, statuses }) {
    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <ClipboardCheck className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Assignments</h2>
                </div>
            }
        >
            <Head title="Assignments" />

            <SearchFilter
                routeName="admin.assignments.index"
                filters={filters}
                includeTrashed={false}
                extraFilters={[
                    {
                        key: 'status',
                        label: 'All statuses',
                        options: statuses.map((status) => ({ value: status, label: status })),
                    },
                ]}
            />

            <div className="space-y-4">
                {items.data.length === 0 && (
                    <div className="card p-10 text-center text-sm text-surface-500">Belum ada assignment yang dapat ditampilkan.</div>
                )}

                {items.data.map((report) => (
                    <div key={report.id} className="card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-200 pb-4">
                            <div>
                                <p className="text-sm font-bold text-surface-900">
                                    Laporan #{report.id} - {report.emergency_type?.display_name || report.emergency_type?.name || '-'}
                                </p>
                                <p className="mt-1 text-xs text-surface-500">
                                    Pelapor: {report.pelapor?.name || '-'} | Dibuat: {report.created_at ? new Date(report.created_at).toLocaleString() : '-'}
                                </p>
                                <p className="mt-2 text-sm text-surface-700">{report.description || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge type={report.status}>{report.status}</StatusBadge>
                                <Link href={route('admin.reports.show', report.id)} className="btn-secondary btn-sm inline-flex items-center gap-1">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Detail
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            {(report.assignments || []).map((assignment) => (
                                <div key={assignment.id} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-surface-900">{assignment.agency?.name || '-'}</p>
                                        <StatusBadge type={assignment.status}>{assignment.status}</StatusBadge>
                                    </div>
                                    <p className="mt-1 text-xs text-surface-500">
                                        {assignment.date ? new Date(assignment.date).toLocaleString() : '-'} | Verified: {assignment.admin_verification ? 'Ya' : 'Belum'}
                                    </p>
                                    <p className="mt-1 text-sm text-surface-700">{assignment.description || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Pagination links={items.links} />
        </AdminLayout>
    );
}
