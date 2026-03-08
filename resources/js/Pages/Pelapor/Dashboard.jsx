import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-bold leading-tight text-white">
                        Dashboard Pelapor
                    </h2>
                    <p className="mt-1 text-sm text-red-100">
                        Laporkan kejadian darurat secepatnya.
                    </p>
                </div>
            }
        >
            <Head title="Pelapor Dashboard" />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 px-6 py-8 sm:px-10">
                <div className="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-3xl flex-col items-center justify-center text-center">
                    <h1 className="text-3xl font-extrabold text-white sm:text-5xl">
                        Butuh kirim laporan cepat?
                    </h1>
                    <p className="mt-3 max-w-xl text-sm text-red-100 sm:text-base">
                        Tekan tombol di bawah untuk membuat laporan baru sekarang.
                    </p>
                    <Link
                        href={route('pelapor.reports.create')}
                        className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-10 py-5 text-lg font-bold text-red-700 shadow-xl transition hover:scale-[1.02] hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-14 sm:py-6 sm:text-2xl"
                    >
                        Buat Laporan Baru
                    </Link>
                    <Link
                        href={route('pelapor.reports.index')}
                        className="mt-4 text-sm font-semibold text-red-100 underline underline-offset-4 transition hover:text-white"
                    >
                        Lihat laporan saya
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
