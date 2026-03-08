import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { getRecaptchaV3Token, preloadRecaptchaV3 } from '@/Utils/recaptchaV3';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset, transform, setError, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
        recaptcha_token: '',
    });
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        preloadRecaptchaV3(recaptchaSiteKey);
    }, [recaptchaSiteKey]);

    const submit = async (e) => {
        e.preventDefault();

        clearErrors('recaptcha_token');
        const token = await getRecaptchaV3Token(recaptchaSiteKey, 'login');
        if (!token) {
            setError('recaptcha_token', 'Gagal memproses reCAPTCHA. Silakan muat ulang halaman.');
            return;
        }

        transform((form) => ({
            ...form,
            recaptcha_token: token,
        }));

        post(route('login'), {
            onFinish: () => {
                reset('password', 'recaptcha_token');
                transform((form) => form);
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-surface-900">Welcome Back</h1>
                <p className="mt-1 text-sm text-surface-600">Masuk untuk melanjutkan ke dashboard tanggap darurat.</p>
            </div>

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-surface-700" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full rounded-xl border-red-100 bg-red-50/30 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" className="text-surface-700" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full rounded-xl border-red-100 bg-red-50/30 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="border-red-300 text-primary-600 focus:ring-primary-500"
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-surface-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <input type="hidden" name="recaptcha_token" value={data.recaptcha_token} />
                <InputError message={errors.recaptcha_token} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm font-medium text-primary-700 underline underline-offset-4 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4 rounded-xl border-none bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-2.5 text-[11px] shadow-md shadow-red-200 hover:from-primary-800 hover:to-primary-700 focus:bg-primary-700 focus:ring-primary-500 active:bg-primary-900"
                        disabled={processing}
                    >
                        Log in
                    </PrimaryButton>
                </div>

                <p className="pt-2 text-center text-sm text-surface-600">
                    Belum punya akun?{' '}
                    <Link href={route('register')} className="font-semibold text-primary-700 hover:text-primary-800">
                        Daftar sekarang
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
