import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Admin/StatusBadge';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ report }) {
    const steps = report.steps || [];
    const metadataEntries = Object.entries(report.metadata || {});
    const { errors } = usePage().props;
    const [notes, setNotes] = useState({});
    const [completionNotes, setCompletionNotes] = useState({});
    const [completionPhotos, setCompletionPhotos] = useState({});
    const [fileInputKeys, setFileInputKeys] = useState({});

    const formatStepDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        const pad = (num) => String(num).padStart(2, '0');

        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    };

    const updateStatus = (assignmentId, status) => {
        const assignment = report.assignments?.find((item) => item.id === assignmentId);
        if (assignment?.is_primary && status === 'rejected') {
            const confirmed = window.confirm(
                'Primary menolak laporan. Semua assignment secondary yang belum final akan otomatis ditolak. Lanjutkan?',
            );
            if (!confirmed) return;
        }

        router.patch(
            route('instansi.assignments.update-status', assignmentId),
            { status },
            { preserveScroll: true },
        );
    };

    const addStep = (assignmentId) => {
        const message = (notes[assignmentId] || '').trim();
        if (!message) return;

        router.post(
            route('instansi.assignments.add-step', assignmentId),
            { message },
            {
                preserveScroll: true,
                onSuccess: () => setNotes((prev) => ({ ...prev, [assignmentId]: '' })),
            },
        );
    };

    const submitCompletion = (assignmentId) => {
        const note = (completionNotes[assignmentId] || '').trim();
        const photos = completionPhotos[assignmentId] || [];
        if (!note || photos.length === 0) {
            window.alert('Isi hasil penanganan dan upload minimal 1 foto bukti.');
            return;
        }

        router.post(
            route('instansi.assignments.submit-completion', assignmentId),
            { result_note: note, photos },
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    setCompletionNotes((prev) => ({ ...prev, [assignmentId]: '' }));
                    setCompletionPhotos((prev) => ({ ...prev, [assignmentId]: [] }));
                    setFileInputKeys((prev) => ({ ...prev, [assignmentId]: (prev[assignmentId] || 0) + 1 }));
                },
            },
        );
    };

    const getTransitionButtonClass = (nextStatus) => {
        if (nextStatus === 'on_progress') {
            return 'inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700';
        }

        if (nextStatus === 'rejected') {
            return 'inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700';
        }

        if (nextStatus === 'pending') {
            return 'inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600';
        }

        if (nextStatus === 'queued') {
            return 'inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700';
        }

        return 'inline-flex items-center rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-surface-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-white">Detail Laporan #{report.id}</h2>
                    <Link
                        href={route('instansi.assignments.index')}
                        className="inline-flex items-center rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Kembali
                    </Link>
                </div>
            }
        >
            <Head title={`Detail Laporan #${report.id}`} />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="card p-6 space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-surface-700">Status Laporan:</p>
                            <StatusBadge type={report.status}>{report.status}</StatusBadge>
                        </div>
                        <p className="text-sm text-surface-600">
                            Tipe: <span className="font-semibold">{report.emergency_type?.display_name || report.emergency_type?.name || '-'}</span>
                        </p>
                        <p className="text-sm text-surface-600">
                            Pelapor: <span className="font-semibold">{report.pelapor?.name || '-'}</span>
                        </p>
                        <p className="text-sm text-surface-600 whitespace-pre-wrap">{report.description || '-'}</p>
                    </div>

                    <div className="card p-6">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Assignment Terkait</p>
                        {report.assignments?.length ? (
                            <div className="space-y-3">
                                {report.assignments.map((assignment) => (
                                    <div key={assignment.id} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-surface-900">{assignment.agency?.name || '-'}</p>
                                                <p className="text-xs text-surface-500">{assignment.is_primary ? 'PRIMARY' : 'SECONDARY'}</p>
                                            </div>
                                            <StatusBadge type={assignment.status}>{assignment.status}</StatusBadge>
                                        </div>

                                        {assignment.can_manage && (
                                            <>
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    {assignment.available_transitions?.length ? (
                                                        assignment.available_transitions.map((nextStatus) => (
                                                            <button
                                                                key={nextStatus}
                                                                type="button"
                                                                onClick={() => updateStatus(assignment.id, nextStatus)}
                                                                className={getTransitionButtonClass(nextStatus)}
                                                            >
                                                                Set {nextStatus}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-surface-500">Status sudah final.</p>
                                                    )}
                                                </div>

                                                {assignment.can_submit_completion && (
                                                    <div className="mt-4 rounded-lg border border-surface-200 bg-white p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Submit Hasil Penanganan</p>
                                                        <textarea
                                                            className="form-input mt-2 min-h-[96px]"
                                                            value={completionNotes[assignment.id] || ''}
                                                            onChange={(e) => setCompletionNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                                                            placeholder="Jelaskan hasil tindakan instansi..."
                                                        />
                                                        <input
                                                            key={fileInputKeys[assignment.id] || 0}
                                                            type="file"
                                                            className="form-input mt-2"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                setCompletionPhotos((prev) => ({
                                                                    ...prev,
                                                                    [assignment.id]: Array.from(e.target.files || []),
                                                                }))
                                                            }
                                                        />
                                                        <p className="mt-1 text-xs text-surface-500">Wajib upload minimal 1 foto bukti.</p>
                                                        {errors.completion && <p className="mt-1 text-xs text-red-500">{errors.completion}</p>}
                                                        {(errors.result_note || errors.photos || errors['photos.0']) && (
                                                            <p className="mt-1 text-xs text-red-500">
                                                                {errors.result_note || errors.photos || errors['photos.0']}
                                                            </p>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                            onClick={() => submitCompletion(assignment.id)}
                                                        >
                                                            Submit Hasil ke Admin
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mt-4 border-t border-surface-200 pt-3">
                                                    <label className="form-label">Catatan Tahapan</label>
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <input
                                                            className="form-input"
                                                            value={notes[assignment.id] || ''}
                                                            onChange={(e) => setNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                                                            placeholder="Tulis catatan proses dari instansi..."
                                                        />
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                                                            onClick={() => addStep(assignment.id)}
                                                        >
                                                            Simpan Catatan
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-surface-500">Belum ada assignment.</p>
                        )}
                    </div>

                    <div className="card p-6">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Metadata Laporan</p>
                        {metadataEntries.length === 0 ? (
                            <p className="text-sm text-surface-500">Tidak ada metadata.</p>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {metadataEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                                        <p className="text-xs uppercase tracking-wider text-surface-500">{key}</p>
                                        <p className="text-sm font-semibold text-surface-700">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card p-6">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Lokasi Laporan</p>
                        {report.latitude || report.longitude ? (
                            <div className="space-y-3">
                                <p className="text-sm text-surface-600">
                                    Latitude: <span className="font-semibold">{report.latitude ?? '-'}</span>
                                </p>
                                <p className="text-sm text-surface-600">
                                    Longitude: <span className="font-semibold">{report.longitude ?? '-'}</span>
                                </p>
                                <Link
                                    href={route('instansi.reports.location', report.id)}
                                    target="_blank"
                                    className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
                                >
                                    Lihat Detail Lokasi
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-surface-500">Lokasi belum tersedia pada laporan ini.</p>
                        )}
                    </div>

                    <div className="card p-6">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Foto Laporan</p>
                        {report.photos?.length ? (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {report.photos.map((photo) => (
                                    <div key={photo.id} className="rounded-lg overflow-hidden border border-surface-200 bg-surface-50">
                                        <img src={photo.url} alt={`Report photo ${photo.id}`} className="h-36 w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-surface-500">Tidak ada foto laporan.</p>
                        )}
                    </div>

                    <div className="card p-6">
                        <p className="mb-3 text-sm font-semibold text-surface-700">Tahapan Status</p>
                        {steps.length === 0 ? (
                            <p className="text-sm text-surface-400">Belum ada tahapan status.</p>
                        ) : (
                            <div className="space-y-0">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                                            {index < steps.length - 1 && <span className="min-h-8 w-px flex-1 bg-surface-300" />}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm text-surface-600">
                                                [{formatStepDate(step.created_at)}] {step.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
