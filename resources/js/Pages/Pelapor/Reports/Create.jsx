import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MapPicker from '@/Components/Admin/MapPicker';
import Toast from '@/Components/Admin/Toast';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function normalizeSchema(formSchema) {
    const fields = Array.isArray(formSchema?.fields) ? formSchema.fields : [];

    return fields
        .map((field) => ({
            name: field?.name ?? field?.value_name ?? field?.key ?? '',
            title: field?.title ?? field?.label ?? field?.name ?? '',
            type: (field?.type ?? 'text').toLowerCase(),
            options: Array.isArray(field?.options) ? field.options : [],
        }))
        .filter((field) => field.name && field.title);
}

export default function Create({ emergencyTypes }) {
    const [metadataFields, setMetadataFields] = useState([]);
    const [metadataValues, setMetadataValues] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        emergency_type_id: '',
        description: '',
        latitude: '',
        longitude: '',
        metadata_text: '',
        photos: [],
    });

    const selectedEmergencyType = useMemo(() => {
        return emergencyTypes.find((item) => String(item.id) === String(data.emergency_type_id)) ?? null;
    }, [emergencyTypes, data.emergency_type_id]);

    const previews = useMemo(
        () => data.photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        [data.photos],
    );

    const onEmergencyTypeChange = (value) => {
        setData('emergency_type_id', value);
        const selected = emergencyTypes.find((item) => String(item.id) === String(value));
        const fields = normalizeSchema(selected?.form_schema);
        setMetadataFields(fields);
        const nextValues = fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
        setMetadataValues(nextValues);
        setData('metadata_text', JSON.stringify(nextValues));

        if (!selected?.is_need_location) {
            setData('latitude', '');
            setData('longitude', '');
        }
    };

    const onMetadataChange = (name, value, type) => {
        const normalizedValue = type === 'number' && value !== '' ? Number(value) : value;
        const next = { ...metadataValues, [name]: normalizedValue };
        setMetadataValues(next);
        setData('metadata_text', JSON.stringify(next));
    };

    const onPhotoChange = (event) => {
        const files = Array.from(event.target.files ?? []);
        setData('photos', files);
    };

    const onMapChange = (lat, lng) => {
        setData('latitude', String(lat));
        setData('longitude', String(lng));
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('pelapor.reports.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Buat Laporan Darurat</h2>
                    <Link href={route('pelapor.reports.index')} className="btn-secondary">Daftar Laporan</Link>
                </div>
            }
        >
            <Head title="Buat Laporan" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-surface-200">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <label className="form-label">Tipe Darurat</label>
                                <select
                                    className="form-select"
                                    value={data.emergency_type_id}
                                    onChange={(event) => onEmergencyTypeChange(event.target.value)}
                                >
                                    <option value="">Pilih tipe darurat</option>
                                    {emergencyTypes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.display_name || item.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.emergency_type_id && <p className="text-xs text-red-500 mt-1">{errors.emergency_type_id}</p>}
                            </div>

                            {selectedEmergencyType && (
                                <div className="p-4 rounded-lg bg-surface-50 border border-surface-200">
                                    <p className="text-sm font-semibold text-surface-700">{selectedEmergencyType.display_name || selectedEmergencyType.name}</p>
                                    <p className="text-sm text-surface-500">{selectedEmergencyType.description || '-'}</p>
                                </div>
                            )}

                            <div>
                                <label className="form-label">Deskripsi Kejadian</label>
                                <textarea
                                    className="form-input min-h-[120px]"
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    placeholder="Jelaskan kejadian secara ringkas dan jelas..."
                                />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                            </div>

                            {metadataFields.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-surface-700">Data Tambahan</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {metadataFields.map((field) => (
                                            <div key={field.name}>
                                                <label className="form-label">{field.title}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        className="form-select"
                                                        value={metadataValues[field.name] ?? ''}
                                                        onChange={(event) => onMetadataChange(field.name, event.target.value, field.type)}
                                                    >
                                                        <option value="">Pilih opsi</option>
                                                        {field.options.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                ) : field.type === 'date' ? (
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={metadataValues[field.name] ?? ''}
                                                        onChange={(event) => onMetadataChange(field.name, event.target.value, field.type)}
                                                    />
                                                ) : field.type === 'number' ? (
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={metadataValues[field.name] ?? ''}
                                                        onChange={(event) => onMetadataChange(field.name, event.target.value, field.type)}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={metadataValues[field.name] ?? ''}
                                                        onChange={(event) => onMetadataChange(field.name, event.target.value, field.type)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {errors.metadata_text && <p className="text-xs text-red-500">{errors.metadata_text}</p>}
                                </div>
                            )}

                            {selectedEmergencyType?.is_need_location && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-surface-700">Lokasi Kejadian</h3>
                                    <MapPicker
                                        lat={data.latitude ? Number(data.latitude) : null}
                                        lng={data.longitude ? Number(data.longitude) : null}
                                        onChange={onMapChange}
                                    />
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="form-label">Latitude</label>
                                            <input className="form-input" value={data.latitude} readOnly />
                                            {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Longitude</label>
                                            <input className="form-input" value={data.longitude} readOnly />
                                            {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="form-label">Upload Foto (Maks 8 foto)</label>
                                <input type="file" accept="image/*" multiple onChange={onPhotoChange} />
                                {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
                                {errors['photos.0'] && <p className="text-xs text-red-500 mt-1">{errors['photos.0']}</p>}
                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        {previews.map((preview) => (
                                            <div key={preview.name} className="rounded-lg overflow-hidden border border-surface-200 bg-surface-50">
                                                <img src={preview.url} alt={preview.name} className="w-full h-28 object-cover" />
                                                <p className="px-2 py-1 text-xs text-surface-500 truncate">{preview.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Link href={route('pelapor.reports.index')} className="btn-secondary">Batal</Link>
                                <button type="submit" className="btn-primary" disabled={processing}>
                                    {processing ? 'Mengirim...' : 'Kirim Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Toast />
        </AuthenticatedLayout>
    );
}
