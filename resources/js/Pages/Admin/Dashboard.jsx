import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl font-bold text-surface-900 tracking-tight">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="card p-6">
                <h3 className="text-lg font-semibold text-surface-900">Phase 1 Skeleton</h3>
                <p className="mt-2 text-sm text-surface-600">
                    Authentication and role routing are active. Feature modules will be added in Phase 2+.
                </p>
            </div>
        </AdminLayout>
    );
}
