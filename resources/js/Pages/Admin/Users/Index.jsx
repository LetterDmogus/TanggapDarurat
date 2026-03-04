import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Edit2, Mail, Plus, RotateCcw, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Pagination from '@/Components/Admin/Pagination';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import FormModal from '@/Components/Admin/FormModal';
import StatusBadge from '@/Components/Admin/StatusBadge';
import Toast from '@/Components/Admin/Toast';

export default function Index({ items, filters, agencies, roles, canViewRecycleBin }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'pelapor',
        agency_id: '',
    });

    const openCreate = () => {
        reset();
        setData({
            name: '',
            email: '',
            password: '',
            role: 'pelapor',
            agency_id: '',
        });
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name || '',
            email: item.email || '',
            password: '',
            role: item.role || 'pelapor',
            agency_id: item.agency_id || '',
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
        post(route('admin.users.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.users.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.users.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.users.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.users.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteOpen(false),
        });
    };

    const extraFilters = [
        {
            key: 'role',
            label: 'All Roles',
            options: roles.map((role) => ({ value: role, label: role })),
        },
        {
            key: 'agency_id',
            label: 'All Agencies',
            options: agencies.map((agency) => ({ value: String(agency.id), label: agency.name })),
        },
    ];

    const formatDeletedAt = (value) => (value ? new Date(value).toLocaleString() : '-');

    const columns = [
        {
            key: 'name',
            label: 'User',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center border-2 border-primary-100 overflow-hidden shadow-sm">
                        <UserIcon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                        <p className="font-bold text-surface-900">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-surface-400 font-medium">
                            <Mail className="w-3 h-3" />
                            {item.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (item) => <StatusBadge type={item.role}>{item.role}</StatusBadge>,
        },
        {
            key: 'agency',
            label: 'Agency',
            render: (item) => item.agency?.name || '-',
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (item) => new Date(item.created_at).toLocaleDateString(),
        },
        {
            key: 'deleted_at',
            label: 'Deleted At',
            render: (item) => formatDeletedAt(item.deleted_at),
        },
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
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">User Management</h2>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-surface-500 font-medium">
                    Manage role access and agency affiliation.
                </p>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create User
                </button>
            </div>

            <SearchFilter routeName="admin.users.index" filters={filters} extraFilters={extraFilters} includeTrashed={canViewRecycleBin} />

            <DataTable columns={columns} items={items.data} actions={actions} />
            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create User" maxWidth="2xl">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name</label>
                            <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="form-label">Role</label>
                            <select className="form-select" value={data.role} onChange={(e) => setData('role', e.target.value)} required>
                                {roles.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                        </div>
                        <div>
                            <label className="form-label">Agency (optional)</label>
                            <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                                <option value="">No agency</option>
                                {agencies.map((agency) => (
                                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                                ))}
                            </select>
                            {errors.agency_id && <p className="text-xs text-red-500 mt-1">{errors.agency_id}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Create</button>
                    </div>
                </form>
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User" maxWidth="2xl">
                <form onSubmit={submitEdit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name</label>
                            <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="form-label">Role</label>
                            <select className="form-select" value={data.role} onChange={(e) => setData('role', e.target.value)} required>
                                {roles.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                        </div>
                        <div>
                            <label className="form-label">Agency (optional)</label>
                            <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                                <option value="">No agency</option>
                                {agencies.map((agency) => (
                                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                                ))}
                            </select>
                            {errors.agency_id && <p className="text-xs text-red-500 mt-1">{errors.agency_id}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">New Password (optional)</label>
                            <input className="form-input" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
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
                title="Move User to Recycle Bin?"
                message={`Are you sure you want to remove "${selectedItem?.name}"?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore User?"
                message={`Restore "${selectedItem?.name}" account?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteOpen}
                onClose={() => setIsForceDeleteOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete User Permanently?"
                message={`This will permanently delete "${selectedItem?.name}".`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
