import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { DatabaseBackup, Download, RefreshCcw, ShieldAlert, Trash2, Upload } from 'lucide-react';

function ImportCard({ title, description, action, processing, onFileChange }) {
    return (
        <form onSubmit={action} className="card space-y-3 p-4">
            <div>
                <h3 className="text-sm font-bold text-surface-900">{title}</h3>
                <p className="text-xs text-surface-500">{description}</p>
            </div>
            <input type="file" accept=".csv,text/csv" onChange={onFileChange} className="form-input text-sm" />
            <button type="submit" className="btn-primary inline-flex items-center gap-2 text-sm" disabled={processing}>
                <Upload className="h-4 w-4" />
                Import CSV
            </button>
        </form>
    );
}

export default function Index({ backups = [] }) {
    const { flash } = usePage().props;
    const coreImport = useForm({ file: null });
    const emergencyImport = useForm({ file: null });

    const submitCoreImport = (e) => {
        e.preventDefault();
        coreImport.post(route('admin.maintenance.import-core'));
    };

    const submitEmergencyImport = (e) => {
        e.preventDefault();
        emergencyImport.post(route('admin.maintenance.import-emergency-routing'));
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <DatabaseBackup className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Maintenance</h2>
                </div>
            }
        >
            <Head title="Maintenance" />

            {flash?.success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {flash.success}
                </div>
            )}

            {flash?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="card space-y-3 p-4">
                    <h3 className="text-sm font-bold text-surface-900">Backup Database</h3>
                    <p className="text-xs text-surface-500">Generate file SQL backup terbaru.</p>
                    <button
                        type="button"
                        onClick={() => router.post(route('admin.maintenance.run-backup'))}
                        className="btn-primary inline-flex items-center gap-2 text-sm"
                    >
                        <DatabaseBackup className="h-4 w-4" />
                        Jalankan Backup
                    </button>
                </div>

                <div className="card space-y-3 p-4">
                    <h3 className="text-sm font-bold text-surface-900">Export Core Data</h3>
                    <p className="text-xs text-surface-500">Users + Instansi + Locations dalam 1 file CSV.</p>
                    <a href={route('admin.maintenance.export-core')} className="btn-primary inline-flex items-center gap-2 text-sm">
                        <Download className="h-4 w-4" />
                        Export Core CSV
                    </a>
                </div>

                <div className="card space-y-3 p-4">
                    <h3 className="text-sm font-bold text-surface-900">Export Emergency Routing</h3>
                    <p className="text-xs text-surface-500">Emergency Types + Routing Rules dalam 1 file CSV.</p>
                    <a href={route('admin.maintenance.export-emergency-routing')} className="btn-primary inline-flex items-center gap-2 text-sm">
                        <Download className="h-4 w-4" />
                        Export Emergency CSV
                    </a>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ImportCard
                    title="Import Core CSV"
                    description="Import users, instansi, dan locations."
                    action={submitCoreImport}
                    processing={coreImport.processing}
                    onFileChange={(e) => coreImport.setData('file', e.target.files[0])}
                />

                <ImportCard
                    title="Import Emergency Routing CSV"
                    description="Import emergency types dan routing rules."
                    action={submitEmergencyImport}
                    processing={emergencyImport.processing}
                    onFileChange={(e) => emergencyImport.setData('file', e.target.files[0])}
                />
            </div>

            <div className="card space-y-3 p-4">
                <h3 className="text-sm font-bold text-surface-900">Reset System</h3>
                <p className="text-xs text-red-600">
                    <ShieldAlert className="mr-1 inline h-4 w-4" />
                    Ini akan menjalankan migrate:fresh --seed. Semua data akan terhapus.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Yakin reset sistem? Semua data akan hilang.')) {
                            router.post(route('admin.maintenance.reset'));
                        }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Reset System
                </button>
            </div>

            <div className="card overflow-hidden">
                <div className="border-b border-surface-200 px-4 py-3">
                    <h3 className="text-sm font-bold text-surface-900">Backup Files</h3>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs uppercase tracking-wide text-surface-500">
                        <tr>
                            <th className="px-4 py-3">Filename</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3">Created At</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-surface-500" colSpan={4}>
                                    Belum ada file backup.
                                </td>
                            </tr>
                        )}
                        {backups.map((item) => (
                            <tr key={item.filename} className="border-t border-surface-100">
                                <td className="px-4 py-3">{item.filename}</td>
                                <td className="px-4 py-3">{item.size}</td>
                                <td className="px-4 py-3">{item.created_at}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <a
                                            href={route('admin.maintenance.download-backup', item.filename)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Download
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm(`Hapus backup ${item.filename}?`)) {
                                                    router.delete(route('admin.maintenance.delete-backup', item.filename));
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
