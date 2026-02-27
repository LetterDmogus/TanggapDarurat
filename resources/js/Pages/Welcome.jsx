import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="TanggapDarurat — AI Emergency Response" />
            <div className="min-h-screen bg-white font-sans selection:bg-primary-500 selection:text-white overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-50/50 to-transparent pointer-events-none"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <header className="flex items-center justify-between py-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-200 text-white font-black text-2xl">
                                TD
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-surface-900 tracking-tight leading-none uppercase">TanggapDarurat</h1>
                                <p className="text-[10px] font-bold text-primary-600 tracking-[0.2em] uppercase mt-1">AI Response System</p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-6">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="btn-primary"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-bold text-surface-600 hover:text-primary-600 transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="btn-primary px-8"
                                    >
                                        Register Now
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="animate-fadeIn">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold mb-6 border border-primary-100">
                                Phase 1 Initial Release
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-black text-surface-900 leading-[1.1] tracking-tight mb-8">
                                Rapid Response <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">Enhanced by AI.</span>
                            </h2>
                            <p className="text-lg text-surface-500 max-w-lg mb-10 leading-relaxed font-medium">
                                A cutting-edge emergency management system designed to streamline disaster reporting and optimize unit dispatch using real-time intelligence.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href={route('register')} className="btn-primary px-10 py-4 text-lg">
                                    Get Started
                                </Link>
                                <button className="btn-secondary px-10 py-4 text-lg border-2">
                                    System Status
                                </button>
                            </div>
                        </div>

                        <div className="relative animate-scaleIn">
                            <div className="bg-gradient-to-br from-white to-surface-50 rounded-[2.5rem] border border-surface-200 shadow-2xl p-4 md:p-8 aspect-square flex items-center justify-center overflow-hidden">
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                                        <svg className="w-16 h-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-surface-900 mb-2">Central Command</h3>
                                    <p className="text-surface-400 font-medium font-bold">System fully operational</p>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute top-10 right-10 w-20 h-20 bg-emerald-100 rounded-3xl rotate-12 blur-sm opacity-50"></div>
                                <div className="absolute bottom-10 left-10 w-16 h-16 bg-blue-100 rounded-full -rotate-12 blur-sm opacity-50"></div>
                            </div>
                        </div>
                    </main>

                    <footer className="py-20 border-t border-surface-100 text-center">
                        <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} TanggapDarurat AI Emergency Response System • Built for Impact
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
