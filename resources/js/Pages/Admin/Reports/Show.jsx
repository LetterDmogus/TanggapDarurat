import AdminLayout from '@/Layouts/AdminLayout';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ClipboardList, MapPin, User, Building2, Calendar, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function Show({ report, emergencyTypes = [] }) {
    const hasCoordinate = report.latitude !== null && report.longitude !== null;
    const canValidate = report.status === 'resolved_waiting_validation';
    const [classifyMode, setClassifyMode] = useState('existing');
    const classifyForm = useForm({
        mode: 'existing',
        emergency_type_id: '',
        new_name: '',
        new_display_name: '',
        new_description: '',
        new_is_need_location: false,
        new_form_schema: [],
    });
    const [schemaRows, setSchemaRows] = useState([]);

    const submitValidation = (decision) => {
        router.patch(
            route('admin.reports.update-validation', report.id),
            { decision },
            { preserveScroll: true },
        );
    };

    const submitClassification = (event) => {
        event.preventDefault();
        const normalizedSchema = schemaRows
            .map((row) => ({
                title: (row.title || '').trim(),
                type: row.type || 'text',
                value_name: (row.value_name || '').trim(),
                options: row.type === 'select'
                    ? (row.options_text || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [],
            }));
        classifyForm.transform((payload) => ({
            ...payload,
            mode: classifyMode,
            new_form_schema: normalizedSchema,
        }));
        classifyForm.patch(route('admin.reports.classify-other', report.id), {
            preserveScroll: true,
        });
    };

    const addSchemaRow = () => {
        setSchemaRows((prev) => [...prev, { title: '', type: 'text', value_name: '', options_text: '' }]);
    };

    const updateSchemaRow = (index, key, value) => {
        setSchemaRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    };

    const removeSchemaRow = (index) => {
        setSchemaRows((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <ClipboardList className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Report Detail #{report.id}</h2>
                </div>
            }
        >
            <Head title={`Report #${report.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link href={route('admin.reports.index')} className="btn-secondary inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Laporan
                    </Link>
                    <StatusBadge type={report.status}>{report.status}</StatusBadge>
                </div>

                {canValidate && (
                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-surface-900">Laporan Menunggu Validasi Admin</p>
                                <p className="text-xs text-surface-600">Review hasil instansi dan pilih keputusan final.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => submitValidation('validation_failed')} className="btn-danger text-xs">
                                    Validation Fail
                                </button>
                                <button type="button" onClick={() => submitValidation('resolved')} className="btn-success text-xs">
                                    Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {report.is_other_emergency && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                        <p className="text-sm font-semibold text-indigo-900">Laporan Kategori Lainnya</p>
                        <p className="mt-1 text-xs text-indigo-700">
                            Judul dari pelapor: <span className="font-semibold">{report.other_emergency_title || '-'}</span>
                        </p>

                        <form onSubmit={submitClassification} className="mt-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" className={`btn-secondary text-xs ${classifyMode === 'existing' ? 'border-indigo-400 text-indigo-700' : ''}`} onClick={() => setClassifyMode('existing')}>
                                    Pilih Tipe Resmi
                                </button>
                                <button type="button" className={`btn-secondary text-xs ${classifyMode === 'new' ? 'border-indigo-400 text-indigo-700' : ''}`} onClick={() => setClassifyMode('new')}>
                                    Buat Emergency Type Baru
                                </button>
                            </div>

                            {classifyMode === 'existing' ? (
                                <div>
                                    <label className="form-label">Emergency Type Resmi</label>
                                    <select
                                        className="form-select"
                                        value={classifyForm.data.emergency_type_id}
                                        onChange={(e) => classifyForm.setData('emergency_type_id', e.target.value)}
                                    >
                                        <option value="">Pilih tipe</option>
                                        {emergencyTypes.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.display_name || item.name}
                                            </option>
                                        ))}
                                    </select>
                                    {classifyForm.errors.emergency_type_id && <p className="mt-1 text-xs text-red-500">{classifyForm.errors.emergency_type_id}</p>}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="form-label">Nama Sistem</label>
                                        <input className="form-input" value={classifyForm.data.new_name} onChange={(e) => classifyForm.setData('new_name', e.target.value)} placeholder="contoh: insiden_telekomunikasi" />
                                    </div>
                                    <div>
                                        <label className="form-label">Display Name</label>
                                        <input className="form-input" value={classifyForm.data.new_display_name} onChange={(e) => classifyForm.setData('new_display_name', e.target.value)} placeholder="Insiden Telekomunikasi" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">Deskripsi</label>
                                        <textarea className="form-input min-h-[80px]" value={classifyForm.data.new_description} onChange={(e) => classifyForm.setData('new_description', e.target.value)} placeholder="Deskripsi singkat tipe baru..." />
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-surface-700">
                                        <input
                                            type="checkbox"
                                            checked={classifyForm.data.new_is_need_location}
                                            onChange={(e) => classifyForm.setData('new_is_need_location', e.target.checked)}
                                        />
                                        Perlu koordinat lokasi
                                    </label>
                                    {(classifyForm.errors.new_name || classifyForm.errors.new_display_name) && (
                                        <p className="md:col-span-2 text-xs text-red-500">{classifyForm.errors.new_name || classifyForm.errors.new_display_name}</p>
                                    )}
                                </div>

                                    <div className="rounded-lg border border-surface-200 bg-white p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Form Builder</p>
                                            <button type="button" className="btn-secondary btn-sm" onClick={addSchemaRow}>+ Add Field</button>
                                        </div>

                                        {schemaRows.length === 0 ? (
                                            <p className="text-xs text-surface-500">Belum ada field tambahan.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {schemaRows.map((row, index) => (
                                                    <div key={index} className="grid gap-2 rounded-lg border border-surface-200 p-2 md:grid-cols-12">
                                                        <input
                                                            className="form-input md:col-span-3"
                                                            placeholder="Title"
                                                            value={row.title}
                                                            onChange={(e) => updateSchemaRow(index, 'title', e.target.value)}
                                                        />
                                                        <select
                                                            className="form-select md:col-span-2"
                                                            value={row.type}
                                                            onChange={(e) => updateSchemaRow(index, 'type', e.target.value)}
                                                        >
                                                            <option value="text">text</option>
                                                            <option value="number">number</option>
                                                            <option value="boolean">boolean</option>
                                                            <option value="date">date</option>
                                                            <option value="select">select</option>
                                                        </select>
                                                        <input
                                                            className="form-input md:col-span-3"
                                                            placeholder="Value name (snake_case)"
                                                            value={row.value_name}
                                                            onChange={(e) => updateSchemaRow(index, 'value_name', e.target.value)}
                                                        />
                                                        <input
                                                            className="form-input md:col-span-3"
                                                            placeholder="Options (comma) for select"
                                                            value={row.options_text}
                                                            onChange={(e) => updateSchemaRow(index, 'options_text', e.target.value)}
                                                            disabled={row.type !== 'select'}
                                                        />
                                                        <button type="button" className="btn-danger btn-sm md:col-span-1" onClick={() => removeSchemaRow(index)}>x</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="mt-2 text-xs text-surface-500">Field ini akan disimpan sebagai schema form emergency type baru.</p>
                                    </div>
                                </div>
                            )}

                            {classifyForm.errors.classification && <p className="text-xs text-red-500">{classifyForm.errors.classification}</p>}

                            <button type="submit" className="btn-primary text-xs" disabled={classifyForm.processing}>
                                {classifyForm.processing ? 'Memproses...' : 'Simpan Klasifikasi'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="card p-6 lg:col-span-2 space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Tipe Darurat</p>
                            <p className="mt-1 text-lg font-bold text-surface-900">{report.emergency_type?.display_name || report.emergency_type?.name || '-'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Deskripsi</p>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{report.description || '-'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Metadata</p>
                            <pre className="mt-2 overflow-auto rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-surface-700">
                                {JSON.stringify(report.metadata || {}, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <div className="flex items-start gap-3 text-sm text-surface-700">
                            <User className="mt-0.5 h-4 w-4 text-primary-600" />
                            <div>
                                <p className="font-semibold">Pelapor</p>
                                <p>{report.pelapor?.name || '-'}</p>
                                <p className="text-surface-500">{report.pelapor?.email || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-surface-700">
                            <Calendar className="mt-0.5 h-4 w-4 text-primary-600" />
                            <div>
                                <p className="font-semibold">Waktu Laporan</p>
                                <p>{report.created_at ? new Date(report.created_at).toLocaleString() : '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-surface-700">
                            <MapPin className="mt-0.5 h-4 w-4 text-primary-600" />
                            <div>
                                <p className="font-semibold">Lokasi</p>
                                <p>{report.location?.name || '-'}</p>
                                <p className="text-surface-500">
                                    {hasCoordinate ? `${report.latitude}, ${report.longitude}` : 'Koordinat tidak tersedia'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-surface-700">
                            <Building2 className="mt-0.5 h-4 w-4 text-primary-600" />
                            <div>
                                <p className="font-semibold">Agensi Area Lokasi</p>
                                <p>{report.location?.agency?.name || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="mb-4 text-base font-bold text-surface-900">Assignments</h3>
                    {report.assignments?.length ? (
                        <div className="space-y-3">
                            {report.assignments.map((assignment) => (
                                <div key={assignment.id} className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-surface-900">
                                            {assignment.agency?.name || '-'} {assignment.is_primary ? '(PRIMARY)' : '(SECONDARY)'}
                                        </p>
                                        <StatusBadge type={assignment.status}>{assignment.status}</StatusBadge>
                                    </div>
                                    <p className="mt-2 text-sm text-surface-600">{assignment.description || '-'}</p>
                                    <p className="mt-2 text-xs text-surface-500">
                                        {assignment.date ? new Date(assignment.date).toLocaleString() : '-'} | Verified: {assignment.admin_verification ? 'Ya' : 'Belum'}
                                    </p>

                                    {assignment.status === 'resolved' && assignment.photos?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Bukti Instansi</p>
                                            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                                                {assignment.photos.map((photo) => (
                                                    <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-surface-200 bg-white">
                                                        <img src={photo.url} alt={`assignment-photo-${photo.id}`} className="h-28 w-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-surface-500">Belum ada assignment untuk laporan ini.</p>
                    )}
                </div>

                <div className="card p-6">
                    <h3 className="mb-4 text-base font-bold text-surface-900">Foto Laporan</h3>
                    {report.photos?.length ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {report.photos.map((photo) => (
                                <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-surface-200 bg-surface-50">
                                    <img src={photo.url} alt={`report-photo-${photo.id}`} className="h-32 w-full object-cover" />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-surface-500">Tidak ada foto pada laporan ini.</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
