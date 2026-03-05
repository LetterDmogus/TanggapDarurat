import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Pelapor Dashboard
                </h2>
            }
        >
            <Head title="Pelapor Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="space-y-3">
                                <p>Portal pelapor aktif.</p>
                                <div className="flex gap-3">
                                    <Link href={route('pelapor.reports.create')} className="btn-primary">Buat Laporan</Link>
                                    <Link href={route('pelapor.reports.index')} className="btn-secondary">Lihat Laporan</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
