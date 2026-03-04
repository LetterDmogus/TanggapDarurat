import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Edit2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import FormModal from '@/Components/Admin/FormModal';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Toast from '@/Components/Admin/Toast';

export default function Index({ items, filters, canViewRecycleBin }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        type: '',
        area: '',
        contact: '',
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name || '',
            type: item.type || '',
            area: item.area || '',
            contact: item.contact || '',
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
        post(route('admin.agencies.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.agencies.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.agencies.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.agencies.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.agencies.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteOpen(false),
        });
    };

    const formatDeletedAt = (value) => (value ? new Date(value).toLocaleString() : '-');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', render: (item) => item.type || '-' },
        { key: 'area', label: 'Area', render: (item) => item.area || '-' },
        { key: 'contact', label: 'Contact', render: (item) => item.contact || '-' },
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
                        <Building2 className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Agencies</h2>
                </div>
            }
        >
            <Head title="Agencies" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Agency
                </button>
            </div>

            <SearchFilter routeName="admin.agencies.index" filters={filters} includeTrashed={canViewRecycleBin} />

            <DataTable columns={columns} items={items.data} actions={actions} />
            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Agency" maxWidth="md">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div>
                        <label className="form-label">Name</label>
                        <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <input className="form-input" value={data.type} onChange={(e) => setData('type', e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Area</label>
                        <input className="form-input" value={data.area} onChange={(e) => setData('area', e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Contact</label>
                        <input className="form-input" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Save</button>
                    </div>
                </form>
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Agency" maxWidth="md">
                <form onSubmit={submitEdit} className="space-y-4">
                    <div>
                        <label className="form-label">Name</label>
                        <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <input className="form-input" value={data.type} onChange={(e) => setData('type', e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Area</label>
                        <input className="form-input" value={data.area} onChange={(e) => setData('area', e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Contact</label>
                        <input className="form-input" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
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
                title="Move Agency to Recycle Bin?"
                message={`Move agency "${selectedItem?.name}" to recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Agency?"
                message={`Restore agency "${selectedItem?.name}" from recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteOpen}
                onClose={() => setIsForceDeleteOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Agency Permanently?"
                message={`Permanently delete agency "${selectedItem?.name}"?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
