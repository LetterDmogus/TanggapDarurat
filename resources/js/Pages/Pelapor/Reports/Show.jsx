import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link } from '@inertiajs/react';

export default function Show({ report }) {
    const metadataEntries = Object.entries(report.metadata || {});

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Detail Laporan #{report.id}</h2>
                    <Link href={route('pelapor.reports.index')} className="btn-secondary">Kembali</Link>
                </div>
            }
        >
            <Head title={`Laporan #${report.id}`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    <div className="card p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-surface-700">Status:</p>
                            <StatusBadge type={report.status}>{report.status}</StatusBadge>
                        </div>
                        <p className="text-sm text-surface-500">
                            Tipe Darurat: <span className="font-semibold text-surface-700">{report.emergency_type?.display_name || report.emergency_type?.name || '-'}</span>
                        </p>
                        <p className="text-sm text-surface-500">
                            Dibuat: <span className="font-semibold text-surface-700">{report.created_at ? new Date(report.created_at).toLocaleString() : '-'}</span>
                        </p>
                        <div>
                            <p className="text-sm font-semibold text-surface-700 mb-1">Deskripsi</p>
                            <p className="text-sm text-surface-600 whitespace-pre-wrap">{report.description}</p>
                        </div>
                    </div>

                    {metadataEntries.length > 0 && (
                        <div className="card p-6">
                            <p className="text-sm font-semibold text-surface-700 mb-3">Metadata</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {metadataEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                                        <p className="text-xs uppercase tracking-wider text-surface-500">{key}</p>
                                        <p className="text-sm font-semibold text-surface-700">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(report.latitude || report.longitude) && (
                        <div className="card p-6">
                            <p className="text-sm font-semibold text-surface-700 mb-3">Koordinat</p>
                            <p className="text-sm text-surface-600">
                                Latitude: <span className="font-semibold">{report.latitude ?? '-'}</span>
                            </p>
                            <p className="text-sm text-surface-600">
                                Longitude: <span className="font-semibold">{report.longitude ?? '-'}</span>
                            </p>
                        </div>
                    )}

                    <div className="card p-6">
                        <p className="text-sm font-semibold text-surface-700 mb-3">Foto Laporan</p>
                        {report.photos.length === 0 ? (
                            <p className="text-sm text-surface-400">Tidak ada foto.</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {report.photos.map((photo) => (
                                    <a
                                        key={photo.id}
                                        href={photo.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-lg overflow-hidden border border-surface-200"
                                    >
                                        <img src={photo.url} alt={`Report photo ${photo.id}`} className="w-full h-36 object-cover" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
