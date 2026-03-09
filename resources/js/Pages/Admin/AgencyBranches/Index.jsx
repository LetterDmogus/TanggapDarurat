import { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Edit2, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Admin/Pagination';
import FormModal from '@/Components/Admin/FormModal';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Toast from '@/Components/Admin/Toast';
import MapPreview from '@/Components/Admin/MapPreview';

export default function Index({ items, filters, agencies, instansiUsers }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        agency_id: '',
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        is_active: true,
        coverage_radius_km: '',
        member_user_ids: [],
    });

    const eligibleUsers = useMemo(() => {
        const agencyId = Number(data.agency_id);
        if (!agencyId) return [];
        return instansiUsers.filter((user) => Number(user.agency_id) === agencyId);
    }, [instansiUsers, data.agency_id]);

    const groupedForDiagram = useMemo(() => {
        const map = new Map();
        for (const item of items.data) {
            const agencyId = item.agency?.id ?? 0;
            const agencyName = item.agency?.name || 'Unknown Agency';
            if (!map.has(agencyId)) {
                map.set(agencyId, { agencyId, agencyName, branches: [] });
            }
            map.get(agencyId).branches.push(item);
        }
        return Array.from(map.values());
    }, [items.data]);

    const mapPreviewPoints = useMemo(
        () =>
            (items?.data || [])
                .filter((item) => item.latitude !== null && item.longitude !== null)
                .map((item) => ({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    name: item.name || 'Unnamed branch',
                    subtitle: item.agency?.name || '',
                })),
        [items],
    );

    const openCreate = () => {
        reset();
        setData({
            agency_id: '',
            name: '',
            address: '',
            latitude: '',
            longitude: '',
            is_active: true,
            coverage_radius_km: '',
            member_user_ids: [],
        });
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            agency_id: item.agency?.id ? String(item.agency.id) : '',
            name: item.name || '',
            address: item.address || '',
            latitude: item.latitude ?? '',
            longitude: item.longitude ?? '',
            is_active: !!item.is_active,
            coverage_radius_km: item.coverage_radius_km ?? '',
            member_user_ids: (item.members || []).map((member) => member.id),
        });
        setIsEditOpen(true);
    };

    const openDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteOpen(true);
    };

    const toggleMember = (userId) => {
        const next = data.member_user_ids.includes(userId)
            ? data.member_user_ids.filter((id) => id !== userId)
            : [...data.member_user_ids, userId];
        setData('member_user_ids', next);
    };

    const submitCreate = (event) => {
        event.preventDefault();
        post(route('admin.agency-branches.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (event) => {
        event.preventDefault();
        patch(route('admin.agency-branches.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.agency-branches.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const renderForm = (onSubmit) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="form-label">Agency</label>
                <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                    <option value="">Select agency</option>
                    {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                            {agency.name}
                        </option>
                    ))}
                </select>
                {errors.agency_id && <p className="mt-1 text-xs text-red-500">{errors.agency_id}</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="form-label">Branch Name</label>
                    <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                    <label className="form-label">Coverage Radius (km)</label>
                    <input className="form-input" type="number" min="0" step="0.1" value={data.coverage_radius_km} onChange={(e) => setData('coverage_radius_km', e.target.value)} />
                </div>
            </div>

            <div>
                <label className="form-label">Address</label>
                <input className="form-input" value={data.address} onChange={(e) => setData('address', e.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" value={data.latitude} onChange={(e) => setData('latitude', e.target.value)} />
                </div>
                <div>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" value={data.longitude} onChange={(e) => setData('longitude', e.target.value)} />
                </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-surface-700">
                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                Branch active
            </label>

            <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Assign Instansi Users</p>
                {eligibleUsers.length === 0 ? (
                    <p className="mt-2 text-xs text-surface-500">Tidak ada user instansi untuk agency ini.</p>
                ) : (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {eligibleUsers.map((user) => (
                            <label key={user.id} className="inline-flex items-center gap-2 text-sm text-surface-700">
                                <input
                                    type="checkbox"
                                    checked={data.member_user_ids.includes(user.id)}
                                    onChange={() => toggleMember(user.id)}
                                />
                                {user.name}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                    Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                    Save
                </button>
            </div>
        </form>
    );

    return (
        <AdminLayout
            header={(
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <Building2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Agency Branches</h2>
                </div>
            )}
        >
            <Head title="Agency Branches" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Add Branch
                </button>
                <div className="inline-flex rounded-lg border border-surface-200 bg-white p-1">
                    <button type="button" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${viewMode === 'table' ? 'bg-red-50 text-red-700' : 'text-surface-600'}`} onClick={() => setViewMode('table')}>Table</button>
                    <button type="button" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${viewMode === 'diagram' ? 'bg-red-50 text-red-700' : 'text-surface-600'}`} onClick={() => setViewMode('diagram')}>Diagram</button>
                </div>
            </div>

            <SearchFilter
                routeName="admin.agency-branches.index"
                filters={filters}
                extraFilters={[
                    {
                        key: 'agency_id',
                        label: 'All agencies',
                        options: agencies.map((agency) => ({ value: String(agency.id), label: agency.name })),
                    },
                ]}
            />

            <div className="mb-6 p-4 bg-white rounded-xl border border-surface-200 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-surface-800">Branch Location Preview</h3>
                    <span className="text-xs text-surface-500">
                        {mapPreviewPoints.length} branch(es) with coordinates on this page
                    </span>
                </div>
                <MapPreview points={mapPreviewPoints} markerVariant="red-dot" />
            </div>

            {viewMode === 'table' ? (
                <div className="table-container bg-white">
                    <table className="min-w-full">
                        <thead className="table-header">
                            <tr>
                                <th>Agency</th>
                                <th>Branch</th>
                                <th>Address</th>
                                <th>Coordinates</th>
                                <th>Members</th>
                                <th>Status</th>
                                <th className="text-right px-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item) => (
                                <tr key={item.id} className="table-row">
                                    <td>{item.agency?.name || '-'}</td>
                                    <td>{item.name}</td>
                                    <td>{item.address || '-'}</td>
                                    <td>{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '-'}</td>
                                    <td>{item.members?.map((member) => member.name).join(', ') || '-'}</td>
                                    <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                                    <td className="px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(item)} className="btn-icon text-blue-500 hover:bg-blue-50">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => openDelete(item)} className="btn-icon text-red-500 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedForDiagram.length === 0 ? (
                        <div className="card p-8 text-center text-sm text-surface-500">No branch data to render.</div>
                    ) : groupedForDiagram.map((group) => (
                        <div key={group.agencyId} className="card p-4">
                            <h3 className="text-sm font-bold text-surface-900">{group.agencyName}</h3>
                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {group.branches.map((branch) => (
                                    <div key={branch.id} className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                                        <p className="text-sm font-semibold text-surface-900">{branch.name}</p>
                                        <p className="mt-1 text-xs text-surface-600">{branch.address || '-'}</p>
                                        <p className="mt-1 text-xs text-surface-500">Members: {branch.members?.map((member) => member.name).join(', ') || '-'}</p>
                                        <p className="mt-1 text-xs text-surface-500">Status: {branch.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Branch" maxWidth="2xl">
                {renderForm(submitCreate)}
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Branch" maxWidth="2xl">
                {renderForm(submitEdit)}
            </FormModal>

            <ConfirmModal
                show={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Delete Branch?"
                message={`Delete branch "${selectedItem?.name}"?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
