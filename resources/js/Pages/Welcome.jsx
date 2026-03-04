import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const slides = [
    {
        src: '/images/slide-1.jpg',
        alt: 'Emergency coordination scene one',
    },
    {
        src: '/images/slide-2.jpg',
        alt: 'Emergency coordination scene two',
    },
    {
        src: '/images/slide-3.jpg',
        alt: 'Emergency coordination scene three',
    },
];

const navItems = [
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' },
];

export default function Welcome({ auth }) {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const slideTimer = setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, 4500);

        return () => clearInterval(slideTimer);
    }, []);

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

    const nextSlide = () => {
        setActiveSlide((current) => (current + 1) % slides.length);
    };

    const prevSlide = () => {
        setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
    };

    return (
        <>
            <Head title="TanggapDarurat - Emergency Response" />
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
                            <div className="text-3xl font-extrabold tracking-tight">LOGO</div>
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
                            </nav>
                        </header>

                        <main className="mt-16 flex flex-1 items-center">
                            <section className="scroll-reveal max-w-3xl" style={{ '--reveal-delay': '70ms' }}>
                                <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">Landing Page</h1>
                                <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 lg:text-lg">
                                    Fast and reliable emergency response platform with AI-supported routing, live operational updates, and coordinated dispatch in one unified system.
                                </p>
                                <div className="mt-10 flex flex-wrap items-center gap-4">
                                    <Link href={auth.user ? route('dashboard') : route('register')} className="rounded-xl bg-[#a21f64] px-8 py-3 text-lg font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110">
                                        {auth.user ? 'Go to Dashboard' : 'Get Started'}
                                    </Link>
                                    {!auth.user && (
                                        <Link href={route('login')} className="rounded-xl border border-white/50 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10">
                                            Log in
                                        </Link>
                                    )}
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
                    <section id="about" className="scroll-reveal rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-8 lg:p-10" style={{ '--reveal-delay': '60ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">About</h2>
                        <p className="mt-4 max-w-3xl text-base leading-relaxed text-surface-600">
                            Built for emergency command teams, TanggapDarurat centralizes incident intake, prioritization, and agency collaboration with transparent operational visibility.
                        </p>
                    </section>

                    <section id="services" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 shadow-sm lg:p-10" style={{ '--reveal-delay': '80ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Services</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
                                <h3 className="text-lg font-bold text-surface-900">Incident Intake</h3>
                                <p className="mt-2 text-sm text-surface-600">Structured public reporting with location and evidence attachment support.</p>
                            </div>
                            <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
                                <h3 className="text-lg font-bold text-surface-900">Dispatch Guidance</h3>
                                <p className="mt-2 text-sm text-surface-600">Priority scoring and route suggestions to accelerate response mobilization.</p>
                            </div>
                            <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
                                <h3 className="text-lg font-bold text-surface-900">Situation Monitoring</h3>
                                <p className="mt-2 text-sm text-surface-600">Real-time tracking for field status, updates, and resolution timelines.</p>
                            </div>
                        </div>
                    </section>

                    <section id="pricing" className="scroll-reveal rounded-3xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-8 lg:p-10" style={{ '--reveal-delay': '100ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Pricing</h2>
                        <p className="mt-4 max-w-2xl text-base text-surface-600">Flexible deployment packages for local agencies, city command centers, and national emergency operations.</p>
                        <div className="mt-6 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white">
                            Contact us for institutional quote
                        </div>
                    </section>

                    <section id="contact" className="scroll-reveal rounded-3xl border border-primary-100 bg-white p-8 lg:p-10" style={{ '--reveal-delay': '120ms' }}>
                        <h2 className="text-3xl font-black text-primary-700">Contact</h2>
                        <p className="mt-4 text-base text-surface-600">Need rollout planning or a live demo for your response team? Reach us at command@tanggapdarurat.id.</p>
                    </section>
                </div>
            </div>
        </>
    );
}
