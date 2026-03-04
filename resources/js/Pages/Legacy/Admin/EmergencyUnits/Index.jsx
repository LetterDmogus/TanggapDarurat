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
import { Plus, Edit2, Trash2, RotateCcw, Truck, MapPin, User as UserIcon } from 'lucide-react';
import MapPicker from '@/Components/Admin/MapPicker';

export default function Index({ items, filters, responders }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isForceDeleteConfirmOpen, setIsForceDeleteConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        unit_name: '',
        type: 'ambulance',
        status: 'available',
        user_id: '',
        location_name: '',
        current_latitude: 1.14179057,
        current_longitude: 104.01543149,
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            unit_name: item.unit_name,
            type: item.type,
            status: item.status,
            user_id: item.user_id || '',
            location_name: item.location_name || '',
            current_latitude: item.current_latitude ?? 1.14179057,
            current_longitude: item.current_longitude ?? 104.01543149,
        });
        setIsEditOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.emergency-units.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.emergency-units.update', selectedItem.id), {
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
        destroy(route('admin.emergency-units.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteConfirmOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.emergency-units.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreConfirmOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.emergency-units.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteConfirmOpen(false),
        });
    };

    const columns = [
        {
            key: 'unit_name',
            label: 'Unit Name',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-surface-900">{item.unit_name}</p>
                        <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">{item.type}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Current Status',
            render: (item) => <StatusBadge type={item.status}>{item.status}</StatusBadge>
        },
        {
            key: 'location_name',
            label: 'Current Location',
            render: (item) => (
                <div className="flex items-center gap-2 text-surface-500 font-medium">
                    <MapPin className="w-4 h-4 text-surface-300" />
                    <span className="truncate max-w-[150px]">{item.location_name || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'user',
            label: 'Assigned Responder',
            render: (item) => item.user ? (
                <div className="flex items-center gap-2 font-semibold text-surface-700">
                    <UserIcon className="w-4 h-4 text-surface-300" />
                    {item.user.name}
                </div>
            ) : <span className="text-surface-300 italic text-xs font-semibold uppercase tracking-tighter">No Responder</span>
        }
    ];

    const extraFilters = [
        {
            key: 'type',
            label: 'All Types',
            options: [
                { value: 'ambulance', label: 'Ambulance' },
                { value: 'fire_truck', label: 'Fire Truck' },
                { value: 'police_car', label: 'Police Car' },
            ]
        },
        {
            key: 'status',
            label: 'All Statuses',
            options: [
                { value: 'available', label: 'Available' },
                { value: 'busy', label: 'Busy' },
                { value: 'offline', label: 'Offline' },
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
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Emergency Units</h2>
                </div>
            }
        >
            <Head title="Unit Management" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-surface-500 font-medium">
                    Monitor and manage active emergency response vehicles.
                </p>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add New Unit
                </button>
            </div>

            <SearchFilter
                routeName="admin.emergency-units.index"
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
                title="Register New Unit"
                maxWidth="5xl"
            >
                <form onSubmit={submitCreate} className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="form-label">Unit Identification Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.unit_name}
                                onChange={e => setData('unit_name', e.target.value)}
                                placeholder="e.g. AMBULANCE-01, DAMKAR-UTARA"
                                required
                            />
                            {errors.unit_name && <p className="text-xs text-red-500 mt-1">{errors.unit_name}</p>}

                            <label className="form-label">Vehicle Type</label>
                            <select
                                className="form-select"
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                            >
                                <option value="ambulance">Ambulance</option>
                                <option value="fire_truck">Fire Truck</option>
                                <option value="police_car">Police Car</option>
                            </select>

                            <label className="form-label">Initial Status</label>
                            <select
                                className="form-select"
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                            >
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="offline">Offline</option>
                            </select>

                            <label className="form-label">Assigned Responder</label>
                            <select
                                className="form-select"
                                value={data.user_id}
                                onChange={e => setData('user_id', e.target.value)}
                            >
                                <option value="">No Assignment</option>
                                {responders.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <label className="form-label">Location Name / Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.location_name}
                                onChange={e => setData('location_name', e.target.value)}
                                placeholder="Headquarters, District A, etc."
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="form-label flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Location Selection (Pick on Map)
                            </label>
                            <MapPicker
                                lat={data.current_latitude}
                                lng={data.current_longitude}
                                onChange={(lat, lng) => {
                                    setData(d => ({ ...d, current_latitude: lat, current_longitude: lng }));
                                }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input bg-surface-50"
                                        value={data.current_latitude}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input bg-surface-50"
                                        value={data.current_longitude}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Register Unit</button>
                    </div>
                </form>
            </FormModal>

            <FormModal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Unit Details"
                maxWidth="5xl"
            >
                <form onSubmit={submitEdit} className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="form-label">Unit Identification Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.unit_name}
                                onChange={e => setData('unit_name', e.target.value)}
                            />
                            {errors.unit_name && <p className="text-xs text-red-500 mt-1">{errors.unit_name}</p>}

                            <label className="form-label">Vehicle Type</label>
                            <select
                                className="form-select"
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                            >
                                <option value="ambulance">Ambulance</option>
                                <option value="fire_truck">Fire Truck</option>
                                <option value="police_car">Police Car</option>
                            </select>

                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                            >
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="offline">Offline</option>
                            </select>

                            <label className="form-label">Assigned Responder</label>
                            <select
                                className="form-select"
                                value={data.user_id}
                                onChange={e => setData('user_id', e.target.value)}
                            >
                                <option value="">No Assignment</option>
                                {responders.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <label className="form-label">Location Name / Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.location_name}
                                onChange={e => setData('location_name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="form-label flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Current Location (Update on Map)
                            </label>
                            <MapPicker
                                lat={data.current_latitude}
                                lng={data.current_longitude}
                                onChange={(lat, lng) => {
                                    setData(d => ({ ...d, current_latitude: lat, current_longitude: lng }));
                                }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input bg-surface-50"
                                        value={data.current_latitude}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input bg-surface-50"
                                        value={data.current_longitude}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update Details</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Decommission Unit?"
                message={`Move unit "${selectedItem?.unit_name}" to the recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Unit"
                message={`Re-activate unit "${selectedItem?.unit_name}"?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteConfirmOpen}
                onClose={() => setIsForceDeleteConfirmOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Unit Permanently?"
                message={`Warning: This will permanently remove "${selectedItem?.unit_name}" data. Continue?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
