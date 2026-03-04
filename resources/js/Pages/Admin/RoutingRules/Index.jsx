import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Edit2, Plus, RotateCcw, Route as RouteIcon, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import FormModal from '@/Components/Admin/FormModal';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Toast from '@/Components/Admin/Toast';

export default function Index({ items, filters, emergencyTypes, agencies, canViewRecycleBin }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        emergency_type_id: '',
        agency_id: '',
        priority: 1,
        is_primary: false,
        area: '',
    });

    const openCreate = () => {
        reset();
        setData({
            emergency_type_id: '',
            agency_id: '',
            priority: 1,
            is_primary: false,
            area: '',
        });
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            emergency_type_id: item.emergency_type_id || '',
            agency_id: item.agency_id || '',
            priority: item.priority || 1,
            is_primary: !!item.is_primary,
            area: item.area || '',
        });
        setIsEditOpen(true);
    };

    const openDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteOpen(true);
    };

    const openRestore = (item) => {
        setSelectedItem(item);
        setIsRestoreOpen(true);
    };

    const openForceDelete = (item) => {
        setSelectedItem(item);
        setIsForceDeleteOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.routing-rules.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.routing-rules.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.routing-rules.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.routing-rules.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.routing-rules.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteOpen(false),
        });
    };

    const formatDeletedAt = (value) => (value ? new Date(value).toLocaleString() : '-');

    const columns = [
        {
            key: 'emergency_type',
            label: 'Emergency Type',
            render: (item) => item.emergency_type?.display_name || item.emergency_type?.name || '-',
        },
        { key: 'agency', label: 'Agency', render: (item) => item.agency?.name || '-' },
        { key: 'priority', label: 'Priority' },
        { key: 'is_primary', label: 'Primary', render: (item) => (item.is_primary ? 'Yes' : 'No') },
        { key: 'area', label: 'Area', render: (item) => item.area || '-' },
        { key: 'deleted_at', label: 'Deleted At', render: (item) => formatDeletedAt(item.deleted_at) },
    ];

    const actions = (item) => (
        <>
            {!item.deleted_at ? (
                <>
                    <button onClick={() => openEdit(item)} className="btn-icon text-blue-500 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDelete(item)} className="btn-icon text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            ) : (
                <>
                    <button onClick={() => openRestore(item)} className="btn-icon text-emerald-500 hover:bg-emerald-50">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => openForceDelete(item)} className="btn-icon text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            )}
        </>
    );

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <RouteIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Routing Rules</h2>
                </div>
            }
        >
            <Head title="Routing Rules" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Rule
                </button>
            </div>

            <SearchFilter
                routeName="admin.routing-rules.index"
                filters={filters}
                includeTrashed={canViewRecycleBin}
                extraFilters={[
                    {
                        key: 'emergency_type_id',
                        label: 'All emergency types',
                        options: emergencyTypes.map((item) => ({ value: String(item.id), label: item.display_name || item.name })),
                    },
                    {
                        key: 'agency_id',
                        label: 'All agencies',
                        options: agencies.map((item) => ({ value: String(item.id), label: item.name })),
                    },
                ]}
            />

            <DataTable columns={columns} items={items.data} actions={actions} />
            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Routing Rule" maxWidth="lg">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div>
                        <label className="form-label">Emergency Type</label>
                        <select className="form-select" value={data.emergency_type_id} onChange={(e) => setData('emergency_type_id', e.target.value)}>
                            <option value="">Select emergency type</option>
                            {emergencyTypes.map((item) => (
                                <option key={item.id} value={item.id}>{item.display_name || item.name}</option>
                            ))}
                        </select>
                        {errors.emergency_type_id && <p className="text-xs text-red-500 mt-1">{errors.emergency_type_id}</p>}
                    </div>
                    <div>
                        <label className="form-label">Agency</label>
                        <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                            <option value="">Select agency</option>
                            {agencies.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        {errors.agency_id && <p className="text-xs text-red-500 mt-1">{errors.agency_id}</p>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Priority</label>
                            <input className="form-input" type="number" min="1" value={data.priority} onChange={(e) => setData('priority', e.target.value)} />
                            {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
                        </div>
                        <div>
                            <label className="form-label">Area</label>
                            <input className="form-input" value={data.area} onChange={(e) => setData('area', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="is_primary_create"
                            type="checkbox"
                            checked={data.is_primary}
                            onChange={(e) => setData('is_primary', e.target.checked)}
                        />
                        <label htmlFor="is_primary_create" className="text-sm text-surface-700">Primary rule</label>
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Save</button>
                    </div>
                </form>
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Routing Rule" maxWidth="lg">
                <form onSubmit={submitEdit} className="space-y-4">
                    <div>
                        <label className="form-label">Emergency Type</label>
                        <select className="form-select" value={data.emergency_type_id} onChange={(e) => setData('emergency_type_id', e.target.value)}>
                            <option value="">Select emergency type</option>
                            {emergencyTypes.map((item) => (
                                <option key={item.id} value={item.id}>{item.display_name || item.name}</option>
                            ))}
                        </select>
                        {errors.emergency_type_id && <p className="text-xs text-red-500 mt-1">{errors.emergency_type_id}</p>}
                    </div>
                    <div>
                        <label className="form-label">Agency</label>
                        <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                            <option value="">Select agency</option>
                            {agencies.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        {errors.agency_id && <p className="text-xs text-red-500 mt-1">{errors.agency_id}</p>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Priority</label>
                            <input className="form-input" type="number" min="1" value={data.priority} onChange={(e) => setData('priority', e.target.value)} />
                            {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
                        </div>
                        <div>
                            <label className="form-label">Area</label>
                            <input className="form-input" value={data.area} onChange={(e) => setData('area', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="is_primary_edit"
                            type="checkbox"
                            checked={data.is_primary}
                            onChange={(e) => setData('is_primary', e.target.checked)}
                        />
                        <label htmlFor="is_primary_edit" className="text-sm text-surface-700">Primary rule</label>
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Move Routing Rule to Recycle Bin?"
                message="Move this routing rule to recycle bin?"
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Routing Rule?"
                message="Restore this routing rule from recycle bin?"
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteOpen}
                onClose={() => setIsForceDeleteOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Routing Rule Permanently?"
                message="Permanently delete this routing rule?"
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
