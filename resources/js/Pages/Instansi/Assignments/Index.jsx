import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Admin/StatusBadge';
import Pagination from '@/Components/Admin/Pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ items, filters, statuses, emergency_types: emergencyTypes = [] }) {
    const { errors } = usePage().props;
    const [notes, setNotes] = useState({});
    const [completionNotes, setCompletionNotes] = useState({});
    const [completionPhotos, setCompletionPhotos] = useState({});
    const [fileInputKeys, setFileInputKeys] = useState({});
    const [searchText, setSearchText] = useState(filters.q || '');

    const applyFilters = (nextFilters) => {
        router.get(
            route('instansi.assignments.index'),
            {
                status: nextFilters.status || undefined,
                q: nextFilters.q || undefined,
                emergency_type_id: nextFilters.emergency_type_id || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const updateStatus = (assignmentId, status) => {
        const assignment = items.data.find((item) => item.id === assignmentId);
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
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Assignment Instansi
                </h2>
            }
        >
            <Head title="Assignment Instansi" />

            <div className="min-h-[calc(100vh-9rem)] w-full bg-gradient-to-b from-red-700 via-red-600 to-red-700 py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-red-100 bg-white p-4 shadow">
                        <div className="grid gap-3 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium text-surface-700">Cari Deskripsi:</label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        className="form-input"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="contoh: kebakaran rumah"
                                    />
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                        onClick={() => applyFilters({ ...filters, q: searchText })}
                                    >
                                        Cari
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-surface-700">Tipe Emergency:</label>
                                <select
                                    className="form-select mt-1"
                                    value={filters.emergency_type_id || ''}
                                    onChange={(e) => applyFilters({ ...filters, emergency_type_id: e.target.value })}
                                >
                                    <option value="">Semua tipe</option>
                                    {emergencyTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.display_name || type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-surface-700">Filter Status:</label>
                                <select
                                    className="form-select mt-1"
                                    value={filters.status || ''}
                                    onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">Semua status</option>
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-center rounded-lg bg-surface-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-surface-800"
                                    onClick={() => {
                                        setSearchText('');
                                        applyFilters({});
                                    }}
                                >
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {items.data.length === 0 ? (
                        <div className="rounded-2xl border border-red-100 bg-white p-10 text-center text-sm text-surface-500 shadow">
                            Belum ada assignment untuk instansi Anda.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.data.map((assignment) => (
                                <div key={assignment.id} className="rounded-2xl border border-red-100 bg-white p-5 shadow">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-surface-900">
                                                Laporan #{assignment.report?.id} - {assignment.report?.emergency_type?.display_name || assignment.report?.emergency_type?.name || '-'}
                                            </p>
                                            <p className="text-xs text-surface-500">
                                                Pelapor: {assignment.report?.pelapor?.name || '-'} | Instansi: {assignment.agency?.name || '-'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {assignment.is_primary ? (
                                                <span className="text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">PRIMARY</span>
                                            ) : (
                                                <span className="text-[11px] px-2 py-1 rounded-full bg-surface-100 text-surface-600 font-semibold">SECONDARY</span>
                                            )}
                                            <StatusBadge type={assignment.status}>{assignment.status}</StatusBadge>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm text-surface-700">
                                        {assignment.report?.description || '-'}
                                    </p>

                                    <div className="mt-3">
                                        <Link
                                            href={route('instansi.reports.show', assignment.report?.id)}
                                            className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
                                        >
                                            Lihat Detail Laporan
                                        </Link>
                                    </div>

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
                                        <div className="mt-4 rounded-lg border border-surface-200 bg-surface-50 p-3">
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
                                        <div className="flex flex-col sm:flex-row gap-2">
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
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination links={items.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
