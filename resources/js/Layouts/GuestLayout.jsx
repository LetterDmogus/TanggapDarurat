import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { website } = usePage().props;
    const siteName = website?.site_name || 'TanggapDarurat';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-100 px-4 py-8">
            <div className="pointer-events-none absolute -left-28 -top-24 h-72 w-72 rounded-full bg-red-200/55 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-red-300/45 blur-3xl" />

            <div className="relative w-full max-w-md">
                <div className="mb-6 text-center">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 p-2.5 shadow-lg shadow-red-300/60">
                            <ApplicationLogo className="h-10 w-10 object-contain" />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-extrabold tracking-tight text-surface-900">{siteName}</p>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Emergency Platform</p>
                        </div>
                    </Link>
                </div>

                <div className="w-full overflow-hidden rounded-2xl border border-red-100 bg-white px-7 py-8 shadow-[0_20px_45px_-25px_rgba(127,29,29,0.45)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
