import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats, attention_items: attentionItems = [] }) {
    const attentionCount = stats?.attention_count ?? 0;
    const pendingCount = stats?.pending_count ?? 0;
    const queuedCount = stats?.queued_count ?? 0;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-white">
                        Dashboard Instansi
                    </h2>
                    <p className="mt-1 text-sm text-red-100">
                        Pantau dan proses assignment secepat mungkin.
                    </p>
                </div>
            }
        >
            <Head title="Instansi Dashboard" />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    {attentionCount > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow">
                            <p className="text-sm font-bold">
                                Perhatian: {attentionCount} assignment belum diproses.
                            </p>
                            <p className="mt-1 text-sm">
                                Pending: {pendingCount} | Queued: {queuedCount}
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-red-100 bg-white p-6 shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-surface-700">
                                Buka daftar assignment untuk mulai penanganan.
                            </p>
                            <Link
                                href={route('instansi.assignments.index')}
                                className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Buka Assignment Instansi
                            </Link>
                        </div>
                    </div>

                    {attentionItems.length > 0 && (
                        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow">
                            <p className="mb-3 text-sm font-semibold text-surface-800">Perlu Ditindaklanjuti</p>
                            <div className="space-y-2">
                                {attentionItems.map((item) => (
                                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                                        <p className="text-sm text-surface-700">
                                            Laporan #{item.report?.id || '-'} - {item.report?.emergency_type?.display_name || item.report?.emergency_type?.name || '-'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={
                                                    item.status === 'pending'
                                                        ? 'rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800'
                                                        : 'rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800'
                                                }
                                            >
                                                {item.status}
                                            </span>
                                            {item.report?.id && (
                                                <Link
                                                    href={route('instansi.reports.show', item.report.id)}
                                                    className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
                                                >
                                                    Buka Detail
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
