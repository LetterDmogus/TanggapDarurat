import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { getRecaptchaV3Token, preloadRecaptchaV3 } from '@/Utils/recaptchaV3';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset, transform, setError, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '',
    });
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        preloadRecaptchaV3(recaptchaSiteKey);
    }, [recaptchaSiteKey]);

    const submit = async (e) => {
        e.preventDefault();

        clearErrors('recaptcha_token');
        const token = await getRecaptchaV3Token(recaptchaSiteKey, 'register');
        if (!token) {
            setError('recaptcha_token', 'Gagal memproses reCAPTCHA. Silakan muat ulang halaman.');
            return;
        }

        transform((form) => ({
            ...form,
            recaptcha_token: token,
        }));

        post(route('register'), {
            onFinish: () => {
                reset('password', 'password_confirmation', 'recaptcha_token');
                transform((form) => form);
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-surface-900">Create Account</h1>
                <p className="mt-1 text-sm text-surface-600">Daftarkan akun untuk mengakses sistem respons darurat.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Name" className="text-surface-700" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full rounded-xl border-red-100 bg-red-50/30 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" className="text-surface-700" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full rounded-xl border-red-100 bg-red-50/30 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
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
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full rounded-xl border-red-100 bg-red-50/30 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <input type="hidden" name="recaptcha_token" value={data.recaptcha_token} />
                <InputError message={errors.recaptcha_token} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm font-medium text-primary-700 underline underline-offset-4 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton
                        className="ms-4 rounded-xl border-none bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-2.5 text-[11px] shadow-md shadow-red-200 hover:from-primary-800 hover:to-primary-700 focus:bg-primary-700 focus:ring-primary-500 active:bg-primary-900"
                        disabled={processing}
                    >
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
