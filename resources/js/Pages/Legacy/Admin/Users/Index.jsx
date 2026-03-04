import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import DataTable from '@/Components/Admin/DataTable';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Pagination from '@/Components/Admin/Pagination';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import FormModal from '@/Components/Admin/FormModal';
import StatusBadge from '@/Components/Admin/StatusBadge';
import Toast from '@/Components/Admin/Toast';
import { Plus, Edit2, Trash2, RotateCcw, User as UserIcon, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function Index({ items, filters }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isForceDeleteConfirmOpen, setIsForceDeleteConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name,
            email: item.email,
            password: '',
            role: item.role,
            phone: item.phone || '',
        });
        setIsEditOpen(true);
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

    const confirmDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteConfirmOpen(true);
    };

    const confirmRestore = (item) => {
        setSelectedItem(item);
        setIsRestoreConfirmOpen(true);
    };

    const confirmForceDelete = (item) => {
        setSelectedItem(item);
        setIsForceDeleteConfirmOpen(true);
    };

    const executeDelete = () => {
        destroy(route('admin.users.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteConfirmOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.users.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreConfirmOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.users.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteConfirmOpen(false),
        });
    };

    const columns = [
        {
            key: 'name',
            label: 'User Info',
            sortable: true,
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
            )
        },
        {
            key: 'role',
            label: 'System Access',
            render: (item) => <StatusBadge type={item.role}>{item.role}</StatusBadge>
        },
        {
            key: 'phone',
            label: 'Contact',
            render: (item) => (
                <div className="flex items-center gap-2 text-surface-500 font-medium text-sm">
                    <Phone className="w-4 h-4 text-surface-300" />
                    {item.phone || <span className="text-surface-300 italic">No phone</span>}
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Member Since',
            render: (item) => <span className="text-surface-500 font-medium text-sm">{new Date(item.created_at).toLocaleDateString()}</span>
        }
    ];

    const extraFilters = [
        {
            key: 'role',
            label: 'All Roles',
            options: [
                { value: 'user', label: 'User' },
                { value: 'responder', label: 'Responder' },
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'super_admin', label: 'Super Admin' },
            ]
        },
    ];

    const actions = (item) => (
        <div className="flex justify-end gap-2">
            {!item.deleted_at ? (
                <>
                    <button onClick={() => openEdit(item)} className="btn-icon text-blue-500 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirmDelete(item)} className="btn-icon text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            ) : (
                <>
                    <button onClick={() => confirmRestore(item)} className="btn-icon text-emerald-500 hover:bg-emerald-50" title="Restore">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirmForceDelete(item)} className="btn-icon text-red-600 hover:bg-red-50" title="Delete Permanently">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
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
                    Manage system users, assigned roles, and access credentials.
                </p>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create New Account
                </button>
            </div>

            <SearchFilter
                routeName="admin.users.index"
                filters={filters}
                extraFilters={extraFilters}
            />

            <div className="animate-scaleIn">
                <DataTable
                    columns={columns}
                    items={items.data}
                    actions={actions}
                />
                <Pagination links={items.links} />
            </div>

            {/* ─── Modals ─── */}
            <FormModal
                show={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create System Account"
            >
                <form onSubmit={submitCreate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="08123456789"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="form-label">System Role</label>
                            <select
                                className="form-select"
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                            >
                                <option value="user">User / Reporter</option>
                                <option value="responder">Field Responder</option>
                                <option value="admin">System Admin</option>
                                <option value="manager">Crisis Manager</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">Initial Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Create Account</button>
                    </div>
                </form>
            </FormModal>

            <FormModal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit User Account"
            >
                <form onSubmit={submitEdit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">System Role</label>
                            <select
                                className="form-select"
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                            >
                                <option value="user">User / Reporter</option>
                                <option value="responder">Field Responder</option>
                                <option value="admin">System Admin</option>
                                <option value="manager">Crisis Manager</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">New Password (leave blank to keep current)</label>
                            <input
                                type="password"
                                className="form-input"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update Account</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Deactivate Account?"
                message={`Are you sure you want to move "${selectedItem?.name}" to the recycle bin? They will lose access to the system.`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Account"
                message={`Re-activate account for "${selectedItem?.name}"?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteConfirmOpen}
                onClose={() => setIsForceDeleteConfirmOpen(false)}
                onConfirm={executeForceDelete}
                title="Permanently Delete Account?"
                message={`Warning: This will permanently remove user "${selectedItem?.name}" and all their associated data. This cannot be undone.`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
