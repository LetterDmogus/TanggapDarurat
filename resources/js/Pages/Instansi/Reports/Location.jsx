import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MapPreview from '@/Components/Admin/MapPreview';
import { Head, Link } from '@inertiajs/react';

export default function Location({ report }) {
    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);
    const hasCoordinate = !Number.isNaN(latitude) && !Number.isNaN(longitude);

    const destination = hasCoordinate ? `${latitude},${longitude}` : '';
    const navLink = (mode) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-white">
                        Lokasi Laporan #{report.id}
                    </h2>
                    <Link
                        href={route('instansi.reports.show', report.id)}
                        className="inline-flex items-center rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Kembali ke Detail
                    </Link>
                </div>
            }
        >
            <Head title={`Lokasi Laporan #${report.id}`} />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-red-100 bg-white p-6 shadow">
                        <p className="text-sm text-surface-700">
                            Tipe: <span className="font-semibold">{report.emergency_type?.display_name || report.emergency_type?.name || '-'}</span>
                        </p>
                        <p className="mt-1 text-sm text-surface-700">
                            Latitude: <span className="font-semibold">{report.latitude ?? '-'}</span>
                        </p>
                        <p className="mt-1 text-sm text-surface-700">
                            Longitude: <span className="font-semibold">{report.longitude ?? '-'}</span>
                        </p>
                    </div>

                    <div className="rounded-2xl border border-red-100 bg-white p-6 shadow">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Peta Lokasi</p>
                        {hasCoordinate ? (
                            <MapPreview
                                points={[
                                    {
                                        latitude,
                                        longitude,
                                        name: `Laporan #${report.id}`,
                                    },
                                ]}
                                heightClass="h-[420px]"
                            />
                        ) : (
                            <p className="text-sm text-surface-500">Koordinat laporan belum tersedia.</p>
                        )}
                    </div>

                    {hasCoordinate && (
                        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow">
                            <p className="mb-3 text-sm font-semibold text-surface-700">Mode Navigasi</p>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={navLink('driving')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Navigasi Mobil
                                </a>
                                <a
                                    href={navLink('walking')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    Navigasi Jalan Kaki
                                </a>
                                <a
                                    href={navLink('transit')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                                >
                                    Navigasi Transit
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
