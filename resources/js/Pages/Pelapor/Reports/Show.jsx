import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Admin/StatusBadge';
import Modal from '@/Components/Modal';
import { Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function Show({ report }) {
    const metadataEntries = Object.entries(report.metadata || {});
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const steps = report.steps || [];

    const formatStepDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        const pad = (num) => String(num).padStart(2, '0');

        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-white">Detail Laporan #{report.id}</h2>
                    <Link
                        href={route('pelapor.reports.index')}
                        className="inline-flex items-center rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Kembali
                    </Link>
                </div>
            }
        >
            <Head title={`Laporan #${report.id}`} />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
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

                    <div className="card p-6">
                        <p className="text-sm font-semibold text-surface-700 mb-3">Tahapan Status</p>
                        {steps.length === 0 ? (
                            <p className="text-sm text-surface-400">Belum ada tahapan status.</p>
                        ) : (
                            <div className="space-y-0">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                                            {index < steps.length - 1 && <span className="w-px flex-1 bg-surface-300 min-h-8" />}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm text-surface-600">
                                                [{formatStepDate(step.created_at)}] {step.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                    <button
                                        key={photo.id}
                                        type="button"
                                        onClick={() => setSelectedPhoto(photo)}
                                        className="block rounded-lg overflow-hidden border border-surface-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                                    >
                                        <img src={photo.url} alt={`Report photo ${photo.id}`} className="w-full h-36 object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} maxWidth="5xl">
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
                    <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between bg-surface-50">
                        <h3 className="text-sm font-semibold text-surface-700">Preview Foto Laporan</h3>
                        <button type="button" onClick={() => setSelectedPhoto(null)} className="btn-icon">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 bg-black/95">
                        {selectedPhoto && (
                            <img
                                src={selectedPhoto.url}
                                alt={`Report photo ${selectedPhoto.id}`}
                                className="w-full max-h-[78vh] object-contain"
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
