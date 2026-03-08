import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ShieldAlert,
    MapPinned,
    Send,
    Activity,
    Camera,
    LayoutDashboard,
    FilePlus2,
    Cog,
    ClipboardCheck,
    Siren,
    CheckCircle2,
    Zap,
    Handshake,
    Eye,
    Database,
    Users,
    Building2,
    UserCog,
    ListChecks,
    Phone,
    Mail,
    Flag,
} from 'lucide-react';

const defaultSlides = ['/images/slide-1.jpg', '/images/slide-2.jpg', '/images/slide-3.jpg'];

const navItems = [
    { id: 'services', label: 'Services' },
    { id: 'workflow', label: 'Cara Kerja' },
    { id: 'goals', label: 'Tujuan' },
    { id: 'contact', label: 'Contact' },
];

const services = [
    {
        title: 'Pelaporan Darurat Cepat',
        description: 'Laporkan kejadian darurat hanya dalam beberapa langkah.',
        icon: ShieldAlert,
    },
    {
        title: 'Penentuan Lokasi Otomatis',
        description: 'Peta interaktif membantu menentukan lokasi kejadian secara akurat.',
        icon: MapPinned,
    },
    {
        title: 'Pengiriman ke Instansi Terkait',
        description: 'Laporan otomatis diteruskan ke instansi sesuai jenis kejadian dan wilayah.',
        icon: Send,
    },
    {
        title: 'Pembaruan Status Real-Time',
        description: 'Pelapor bisa memantau perkembangan laporan dari awal hingga selesai.',
        icon: Activity,
    },
    {
        title: 'Bukti dan Dokumentasi',
        description: 'Pelapor dan petugas dapat mengunggah foto sebagai bukti lapangan.',
        icon: Camera,
    },
    {
        title: 'Dashboard Monitoring',
        description: 'Manajer dan admin memantau statistik serta performa penanganan.',
        icon: LayoutDashboard,
    },
];

const workflow = [
    { title: 'Buat Laporan', desc: 'Pilih jenis kejadian dan lengkapi informasi.', icon: FilePlus2 },
    { title: 'Sistem Memproses Laporan', desc: 'Sistem menentukan instansi yang bertanggung jawab.', icon: Cog },
    { title: 'Instansi Menerima Tugas', desc: 'Instansi menerima laporan dan melakukan verifikasi.', icon: ClipboardCheck },
    { title: 'Penanganan di Lapangan', desc: 'Petugas melakukan tindakan dan update status.', icon: Siren },
    { title: 'Laporan Selesai', desc: 'Status diperbarui agar pelapor mengetahui hasilnya.', icon: CheckCircle2 },
];

const goals = [
    { title: 'Meningkatkan Kecepatan Respon', icon: Zap },
    { title: 'Meningkatkan Koordinasi', icon: Handshake },
    { title: 'Transparansi Informasi', icon: Eye },
    { title: 'Peningkatan Manajemen Data', icon: Database },
];

const audience = [
    { title: 'Masyarakat', desc: 'Melaporkan kejadian darurat dengan cepat dan mudah.', icon: Users },
    { title: 'Instansi Penanganan', desc: 'Menerima laporan terstruktur dan memprioritaskan penanganan.', icon: Building2 },
    { title: 'Manajer Operasional', desc: 'Memantau laporan dan kinerja penanganan melalui dashboard.', icon: LayoutDashboard },
    { title: 'Administrator Sistem', desc: 'Mengelola konfigurasi, instansi, dan pengaturan sistem.', icon: UserCog },
];

const features = [
    'Pelaporan kejadian darurat berbasis web',
    'Penentuan lokasi menggunakan peta',
    'Sistem routing otomatis ke instansi terkait',
    'Pembaruan status secara real-time',
    'Dashboard monitoring dan statistik',
    'Dokumentasi laporan melalui foto',
    'Manajemen pengguna dan instansi',
];

export default function Welcome({ auth, website }) {
    const [activeSlide, setActiveSlide] = useState(0);
    const siteName = website?.site_name || 'TanggapDarurat';
    const contactText = website?.contact_text || '';
    const slidesSource =
        Array.isArray(website?.hero_image_urls) && website.hero_image_urls.length > 0
            ? website.hero_image_urls
            : defaultSlides;
    const slides = slidesSource.map((src, index) => ({
        src,
        alt: `Emergency coordination scene ${index + 1}`,
    }));

    useEffect(() => {
        if (slides.length <= 1) return undefined;
        const slideTimer = setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, 4500);

        return () => clearInterval(slideTimer);
    }, [slides.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            },
            { threshold: 0.22, rootMargin: '0px 0px -10% 0px' },
        );

        const targets = document.querySelectorAll('.scroll-reveal');
        targets.forEach((target) => observer.observe(target));

        return () => observer.disconnect();
    }, []);

    const goTo = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const nextSlide = () => setActiveSlide((current) => (current + 1) % slides.length);
    const prevSlide = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);

    return (
        <>
            <Head title={`${siteName} - Emergency Response`} />
            <div className="relative overflow-hidden text-white selection:bg-white selection:text-primary-700">
                <section className="relative min-h-[92vh]">
                    <div className="absolute inset-0">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.src}
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                                    activeSlide === index ? 'opacity-100' : 'opacity-0'
                                }`}
                                style={{ backgroundImage: `url(${slide.src})` }}
                                role="img"
                                aria-label={slide.alt}
                            />
                        ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(127,29,29,0.78)_0%,rgba(220,38,38,0.62)_45%,rgba(220,38,38,0.52)_100%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_35rem_at_12%_14%,rgba(255,255,255,0.12),transparent),radial-gradient(50rem_30rem_at_92%_88%,rgba(127,29,29,0.24),transparent)]" />

                    <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col px-6 pb-16 pt-8 lg:px-8">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {website?.logo_url ? (
                                    <img src={website.logo_url} alt={`${siteName} logo`} className="h-10 w-auto rounded-md bg-white/90 p-1" />
                                ) : (
                                    <div className="text-3xl font-extrabold tracking-tight">TD</div>
                                )}
                                <div className="text-xl font-extrabold tracking-tight sm:text-2xl">{siteName}</div>
                            </div>
                            <nav className="hidden items-center gap-10 text-base font-semibold text-white/90 lg:flex">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => goTo(item.id)}
                                        className="border-b border-transparent pb-1 transition hover:border-white hover:text-white"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl bg-[#a21f64] px-8 py-2 text-lg font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110"
                                    >
                                        Login
                                    </Link>

                            </nav>
                        </header>

                        <main className="mt-16 flex flex-1 items-center">
                            <section className="scroll-reveal max-w-4xl" style={{ '--reveal-delay': '70ms' }}>
                                <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                                    Respon Cepat untuk Situasi Darurat
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 lg:text-lg">
                                    Platform pelaporan darurat yang menghubungkan masyarakat dengan instansi terkait secara cepat, akurat, dan real-time.
                                </p>
                                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 lg:text-base">
                                    Ketika keadaan darurat terjadi, setiap detik sangat berarti. Sistem ini memungkinkan masyarakat melaporkan kejadian darurat
                                    dengan mudah melalui ponsel atau komputer, sementara instansi terkait menerima informasi secara langsung untuk memberikan respon
                                    yang lebih cepat dan tepat.
                                </p>
                                <div className="mt-10 flex flex-wrap items-center gap-4">
                                    <Link
                                        href={auth.user ? route('dashboard') : route('register')}
                                        className="rounded-xl bg-[#a21f64] px-8 py-3 text-lg font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110"
                                    >
                                        Laporkan Kejadian
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => goTo('workflow')}
                                        className="rounded-xl border border-white/50 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Pelajari Cara Kerjanya
                                    </button>
                                </div>
                            </section>
                        </main>

                        <div className="scroll-reveal flex items-center justify-between rounded-2xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur" style={{ '--reveal-delay': '140ms' }}>
                            <div className="flex items-center gap-2">
                                {slides.map((slide, index) => (
                                    <button
                                        type="button"
                                        key={slide.src + '-dot'}
                                        onClick={() => setActiveSlide(index)}
                                        className={`h-2.5 rounded-full transition ${activeSlide === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'}`}
                                        aria-label={`Slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={prevSlide}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 text-sm font-bold text-white transition hover:bg-white/20"
                                    aria-label="Previous"
                                >
                                    {'<'}
                                </button>
                                <button
                                    type="button"
                                    onClick={nextSlide}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 text-sm font-bold text-white transition hover:bg-white/20"
                                    aria-label="Next"
                                >
                                    {'>'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="bg-white py-20 text-surface-800 lg:py-24">
                <div className="mx-auto max-w-7xl space-y-24 px-6 lg:px-8">
                    <section id="services" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 shadow-sm lg:p-10" style={{ '--reveal-delay': '60ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Services</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {services.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
                                        <Icon className="h-6 w-6 text-primary-700" />
                                        <h3 className="mt-3 text-lg font-bold text-surface-900">{item.title}</h3>
                                        <p className="mt-2 text-sm text-surface-600">{item.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section id="workflow" className="scroll-reveal rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-8 lg:p-10" style={{ '--reveal-delay': '80ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Cara Kerja Sistem</h2>
                        <div className="mt-6 space-y-3">
                            {workflow.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="flex items-start gap-4 rounded-xl border border-primary-100 bg-white p-4">
                                        <div className="mt-0.5 rounded-lg bg-primary-100 p-2">
                                            <Icon className="h-5 w-5 text-primary-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-surface-900">{index + 1}. {item.title}</p>
                                            <p className="text-sm text-surface-600">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section id="goals" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 shadow-sm lg:p-10" style={{ '--reveal-delay': '100ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Tujuan Sistem</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {goals.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5">
                                        <Icon className="h-6 w-6 text-primary-700" />
                                        <p className="mt-3 text-base font-bold text-surface-900">{item.title}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section id="audience" className="scroll-reveal rounded-3xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-8 lg:p-10" style={{ '--reveal-delay': '120ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Untuk Siapa Sistem Ini</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {audience.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="rounded-2xl border border-primary-100 bg-white p-5">
                                        <Icon className="h-6 w-6 text-primary-700" />
                                        <h3 className="mt-3 text-lg font-bold text-surface-900">{item.title}</h3>
                                        <p className="mt-2 text-sm text-surface-600">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section id="features" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 shadow-sm lg:p-10" style={{ '--reveal-delay': '140ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Fitur Utama</h2>
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {features.map((feature) => (
                                <div key={feature} className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/40 px-4 py-3">
                                    <ListChecks className="h-5 w-5 text-primary-700" />
                                    <p className="text-sm font-medium text-surface-700">{feature}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="contact" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 lg:p-10" style={{ '--reveal-delay': '160ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Contact</h2>
                        <p className="mt-4 text-base text-surface-600">
                            Jika Anda memiliki pertanyaan atau membutuhkan informasi lebih lanjut mengenai sistem ini, silakan hubungi kami.
                        </p>
                        <div className="mt-5 space-y-2">
                            <p className="flex items-center gap-2 text-sm text-surface-700"><Mail className="h-4 w-4 text-primary-700" /> support@example.com</p>
                            <p className="flex items-center gap-2 text-sm text-surface-700"><Phone className="h-4 w-4 text-primary-700" /> +62 000 0000 0000</p>
                        </div>
                        {contactText && <p className="mt-4 text-sm text-surface-600">{contactText}</p>}
                    </section>

                    <section id="closing" className="scroll-reveal rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-8 lg:p-10" style={{ '--reveal-delay': '180ms' }}>
                        <div className="flex items-start gap-3">
                            <Flag className="mt-1 h-6 w-6 text-primary-700" />
                            <div>
                                <h2 className="text-3xl font-black text-primary-700">Penutup</h2>
                                <p className="mt-4 max-w-4xl text-base leading-relaxed text-surface-600">
                                    Sistem ini dirancang untuk membantu meningkatkan kecepatan respon terhadap kejadian darurat serta mempermudah koordinasi antara
                                    masyarakat dan instansi terkait. Dengan dukungan teknologi dan integrasi sistem yang baik, diharapkan penanganan kejadian dapat
                                    dilakukan dengan lebih cepat, efektif, dan transparan.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
