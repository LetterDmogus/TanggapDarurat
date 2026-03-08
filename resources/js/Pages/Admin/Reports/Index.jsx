import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import SearchFilter from '@/Components/Admin/SearchFilter';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Eye } from 'lucide-react';

export default function Index({ items, filters, statuses }) {
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

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Reports</h2>
                </div>
            }
        >
            <Head title="Reports" />

            <SearchFilter
                routeName="admin.reports.index"
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

            <DataTable
                columns={columns}
                items={items.data}
                actions={(item) => (
                    <Link
                        href={route('admin.reports.show', item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                    </Link>
                )}
            />
            <Pagination links={items.links} />
        </AdminLayout>
    );
}
