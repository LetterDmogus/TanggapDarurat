import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Activity, Filter, Search } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import StatusBadge from '@/Components/Admin/StatusBadge';

export default function Index({ items, filters, roles, methods }) {
    const safeItems = items?.data || [];
    const safeLinks = items?.links || [];

    const [form, setForm] = useState({
        search: filters?.search || '',
        role: filters?.role || '',
        method: filters?.method || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        per_page: String(filters?.per_page || '10'),
    });

    const applyFilter = (overrides = {}) => {
        router.get(route('admin.activity-logs.index'), { ...form, ...overrides }, { preserveState: true, replace: true });
    };

    const columns = [
        {
            key: 'actor',
            label: 'User',
            render: (item) => (
                <div>
                    <p className="font-semibold text-surface-900">{item.actor_name || '-'}</p>
                    <p className="text-xs text-surface-500">{item.actor_email || '-'}</p>
                </div>
            ),
        },
        {
            key: 'actor_role',
            label: 'Role',
            render: (item) => <StatusBadge type={item.actor_role}>{item.actor_role || '-'}</StatusBadge>,
        },
        {
            key: 'action',
            label: 'Action',
            render: (item) => (
                <div>
                    <p className="font-medium text-surface-900">{item.action}</p>
                    <p className="text-xs text-surface-500">{item.path}</p>
                </div>
            ),
        },
        {
            key: 'method',
            label: 'Method',
            render: (item) => {
                const method = item?.method || '-';
                return <StatusBadge type={String(method).toLowerCase()}>{method}</StatusBadge>;
            },
        },
        { key: 'status_code', label: 'Status', render: (item) => item.status_code },
        { key: 'ip_address', label: 'IP', render: (item) => item.ip_address || '-' },
        {
            key: 'created_at',
            label: 'Waktu',
            render: (item) => (item.created_at ? new Date(item.created_at).toLocaleString() : '-'),
        },
    ];

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary-100 p-2">
                        <Activity className="h-5 w-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Activity Logs</h2>
                </div>
            }
        >
            <Head title="Activity Logs" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    applyFilter();
                }}
                className="space-y-4 rounded-xl border border-surface-200 bg-white p-4 shadow-sm"
            >
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
                    <div className="relative lg:col-span-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                        <input
                            className="form-input pl-10"
                            placeholder="Cari user/action/path"
                            value={form.search}
                            onChange={(e) => setForm((prev) => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <select className="form-select" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                        <option value="">Semua Role</option>
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                    <select className="form-select" value={form.method} onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}>
                        <option value="">Semua Method</option>
                        {methods.map((method) => (
                            <option key={method} value={method}>
                                {method}
                            </option>
                        ))}
                    </select>
                    <input type="date" className="form-input" value={form.date_from} onChange={(e) => setForm((prev) => ({ ...prev, date_from: e.target.value }))} />
                    <input type="date" className="form-input" value={form.date_to} onChange={(e) => setForm((prev) => ({ ...prev, date_to: e.target.value }))} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <div className="flex gap-2">
                        <button type="submit" className="btn-primary inline-flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                                const reset = { search: '', role: '', method: '', date_from: '', date_to: '', per_page: '10' };
                                setForm(reset);
                                router.get(route('admin.activity-logs.index'), reset, { preserveState: true, replace: true });
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </form>

            <DataTable columns={columns} items={safeItems} />
            <Pagination links={safeLinks} />
        </AdminLayout>
    );
}
