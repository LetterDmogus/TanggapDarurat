import AdminLayout from '@/Layouts/AdminLayout';
import Toast from '@/Components/Admin/Toast';
import { Head, useForm } from '@inertiajs/react';
import { Image, Settings } from 'lucide-react';
import { useMemo } from 'react';

export default function Edit({ setting }) {
    const { data, setData, post, processing, errors } = useForm({
        site_name: setting.site_name || 'TanggapDarurat',
        contact_text: setting.contact_text || '',
        logo: null,
        hero_images: [],
        remove_logo: false,
        remove_hero_images: false,
    });

    const selectedLogoPreview = useMemo(() => {
        if (!data.logo) return null;
        return URL.createObjectURL(data.logo);
    }, [data.logo]);

    const selectedHeroPreviews = useMemo(() => {
        if (!data.hero_images?.length) return [];
        return data.hero_images.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
        }));
    }, [data.hero_images]);

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.website-settings.update'), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <Settings className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Website Settings</h2>
                </div>
            }
        >
            <Head title="Website Settings" />

            <div className="card p-6">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="form-label">Nama Website</label>
                        <input
                            className="form-input"
                            value={data.site_name}
                            onChange={(e) => setData('site_name', e.target.value)}
                            placeholder="Nama website"
                        />
                        {errors.site_name && <p className="mt-1 text-xs text-red-500">{errors.site_name}</p>}
                    </div>

                    <div>
                        <label className="form-label">Kontak Landing Page</label>
                        <textarea
                            className="form-input min-h-[120px]"
                            value={data.contact_text}
                            onChange={(e) => setData('contact_text', e.target.value)}
                            placeholder="Kontak/email/nomor yang ditampilkan di landing page"
                        />
                        {errors.contact_text && <p className="mt-1 text-xs text-red-500">{errors.contact_text}</p>}
                    </div>

                    <div className="rounded-xl border border-surface-200 p-4">
                        <label className="form-label">Logo Website</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                        />
                        <label className="mt-2 flex items-center gap-2 text-xs text-surface-600">
                            <input
                                type="checkbox"
                                checked={data.remove_logo}
                                onChange={(e) => setData('remove_logo', e.target.checked)}
                            />
                            Hapus logo saat ini
                        </label>
                        {errors.logo && <p className="mt-1 text-xs text-red-500">{errors.logo}</p>}

                        <div className="mt-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Preview</p>
                            {selectedLogoPreview ? (
                                <img src={selectedLogoPreview} alt="New logo preview" className="h-20 w-auto rounded-md border border-surface-200 bg-surface-50 p-2" />
                            ) : setting.logo_url ? (
                                <img src={setting.logo_url} alt="Current logo" className="h-20 w-auto rounded-md border border-surface-200 bg-surface-50 p-2" />
                            ) : (
                                <p className="text-sm text-surface-500">Belum ada logo.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Image className="h-4 w-4 text-surface-500" />
                            <label className="form-label mb-0">Foto Landing Page</label>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setData('hero_images', Array.from(e.target.files || []))}
                        />
                        <p className="mt-1 text-xs text-surface-500">Upload 1-6 foto. Jika diupload, foto lama akan diganti.</p>
                        <label className="mt-2 flex items-center gap-2 text-xs text-surface-600">
                            <input
                                type="checkbox"
                                checked={data.remove_hero_images}
                                onChange={(e) => setData('remove_hero_images', e.target.checked)}
                            />
                            Hapus semua foto landing saat ini
                        </label>
                        {(errors.hero_images || errors['hero_images.0']) && (
                            <p className="mt-1 text-xs text-red-500">{errors.hero_images || errors['hero_images.0']}</p>
                        )}

                        <div className="mt-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Preview</p>
                            {selectedHeroPreviews.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {selectedHeroPreviews.map((preview) => (
                                        <div key={preview.name} className="overflow-hidden rounded-lg border border-surface-200 bg-surface-50">
                                            <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : setting.hero_image_urls?.length ? (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {setting.hero_image_urls.map((url) => (
                                        <div key={url} className="overflow-hidden rounded-lg border border-surface-200 bg-surface-50">
                                            <img src={url} alt="Landing visual" className="h-28 w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-surface-500">Belum ada foto landing.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary" disabled={processing}>
                            {processing ? 'Saving...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>

            <Toast />
        </AdminLayout>
    );
}
