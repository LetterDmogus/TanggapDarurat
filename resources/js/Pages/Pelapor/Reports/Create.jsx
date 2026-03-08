import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MapPicker from '@/Components/Admin/MapPicker';
import Toast from '@/Components/Admin/Toast';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const OTHER_EMERGENCY_VALUE = 'others';

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

export default function Create({ emergencyTypes, locations = [] }) {
    const [metadataFields, setMetadataFields] = useState([]);
    const [metadataValues, setMetadataValues] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        emergency_type_id: '',
        other_emergency_title: '',
        description: '',
        latitude: '',
        longitude: '',
        metadata_text: '',
        photos: [],
    });

    const selectedEmergencyType = useMemo(() => {
        return emergencyTypes.find((item) => String(item.id) === String(data.emergency_type_id)) ?? null;
    }, [emergencyTypes, data.emergency_type_id]);

    const isOtherEmergency = String(data.emergency_type_id) === OTHER_EMERGENCY_VALUE;

    const locationPins = useMemo(
        () =>
            locations
                .map((location) => ({
                    id: location.id,
                    name: location.name,
                    location_type: location.location_type,
                    latitude: Number(location.latitude),
                    longitude: Number(location.longitude),
                    agency: location.agency,
                }))
                .filter((location) => !Number.isNaN(location.latitude) && !Number.isNaN(location.longitude)),
        [locations],
    );

    const previews = useMemo(
        () => data.photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        [data.photos],
    );

    const onEmergencyTypeChange = (value) => {
        setData('emergency_type_id', value);

        if (String(value) === OTHER_EMERGENCY_VALUE) {
            setMetadataFields([]);
            setMetadataValues({});
            setData('metadata_text', JSON.stringify({}));
            setData('latitude', '');
            setData('longitude', '');
            return;
        }

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
                    <h2 className="text-xl font-semibold leading-tight text-white">Buat Laporan Darurat</h2>
                    <Link
                        href={route('pelapor.reports.index')}
                        className="inline-flex items-center rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Daftar Laporan
                    </Link>
                </div>
            }
        >
            <Head title="Buat Laporan" />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-surface-200">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <label className="form-label">Tipe Darurat</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {emergencyTypes.map((item) => {
                                        const itemId = String(item.id);
                                        const isActive = String(data.emergency_type_id) === itemId;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => onEmergencyTypeChange(itemId)}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                                                    isActive
                                                        ? 'bg-red-50 border-red-300 text-red-700'
                                                        : 'bg-white border-surface-300 text-surface-700 hover:bg-surface-50'
                                                }`}
                                                aria-pressed={isActive}
                                            >
                                                {item.display_name || item.name}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => onEmergencyTypeChange(OTHER_EMERGENCY_VALUE)}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                                            isOtherEmergency
                                                ? 'bg-red-50 border-red-300 text-red-700'
                                                : 'bg-white border-surface-300 text-surface-700 hover:bg-surface-50'
                                        }`}
                                        aria-pressed={isOtherEmergency}
                                    >
                                        Lainnya
                                    </button>
                                </div>
                                <p className="text-xs text-surface-500 mt-2">Pilih salah satu jenis emergency.</p>
                                {errors.emergency_type_id && <p className="text-xs text-red-500 mt-1">{errors.emergency_type_id}</p>}
                            </div>

                            {isOtherEmergency && (
                                <div>
                                    <label className="form-label">Judul Emergency Lainnya</label>
                                    <input
                                        className="form-input"
                                        value={data.other_emergency_title}
                                        onChange={(event) => setData('other_emergency_title', event.target.value)}
                                        placeholder="Contoh: Kerusakan jaringan skala kota"
                                    />
                                    <p className="text-xs text-surface-500 mt-1">Admin akan klasifikasikan ke tipe resmi atau membuat tipe baru.</p>
                                    {errors.other_emergency_title && <p className="text-xs text-red-500 mt-1">{errors.other_emergency_title}</p>}
                                </div>
                            )}

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
                                        markers={locationPins}
                                    />
                                    <p className="text-xs text-surface-500">Pin merah menunjukkan titik lokasi/area agency dari data tabel lokasi.</p>
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
