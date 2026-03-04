import { useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, GripVertical, MapPinned, Plus, RotateCcw, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import FormModal from '@/Components/Admin/FormModal';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Toast from '@/Components/Admin/Toast';
import MapPicker from '@/Components/Admin/MapPicker';
import MapPreview from '@/Components/Admin/MapPreview';

const EMPTY_METADATA_ROW = { name: '', value: '' };

function parseMetadataToRows(metadata) {
    if (!metadata) return [{ ...EMPTY_METADATA_ROW }];

    if (Array.isArray(metadata)) {
        if (!metadata.length) return [{ ...EMPTY_METADATA_ROW }];
        return metadata.map((item) => ({
            name: item?.name || '',
            value: item?.value || '',
        }));
    }

    if (typeof metadata === 'object') {
        const entries = Object.entries(metadata);
        if (!entries.length) return [{ ...EMPTY_METADATA_ROW }];
        return entries.map(([key, value]) => ({ name: key, value: String(value ?? '') }));
    }

    return [{ ...EMPTY_METADATA_ROW }];
}

function rowsToMetadataJson(rows) {
    const objectValue = {};
    rows.forEach((row) => {
        const key = row.name?.trim();
        if (key) {
            objectValue[key] = row.value ?? '';
        }
    });

    return Object.keys(objectValue).length ? JSON.stringify(objectValue) : '';
}

function reorder(list, fromIndex, toIndex) {
    const copy = [...list];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    return copy;
}

export default function Index({ items, filters, agencies, canViewRecycleBin }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [agencyFilter, setAgencyFilter] = useState(filters.agency_id || '');
    const [metadataRows, setMetadataRows] = useState([{ ...EMPTY_METADATA_ROW }]);
    const [dragIndex, setDragIndex] = useState(null);

    const { data, setData, transform, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        location_type: '',
        longitude: '',
        latitude: '',
        agency_id: '',
        metadata_text: '',
    });

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(
            route('admin.locations.index'),
            { search, agency_id: agencyFilter },
            { preserveState: true, replace: true },
        );
    };

    const resetFilter = () => {
        setSearch('');
        setAgencyFilter('');
        router.get(route('admin.locations.index'), {}, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        reset();
        setMetadataRows([{ ...EMPTY_METADATA_ROW }]);
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name || '',
            location_type: item.location_type || '',
            longitude: item.longitude ?? '',
            latitude: item.latitude ?? '',
            agency_id: item.agency_id || '',
            metadata_text: '',
        });
        setMetadataRows(parseMetadataToRows(item.metadata));
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

    const addMetadataRow = () => {
        setMetadataRows((prev) => [...prev, { ...EMPTY_METADATA_ROW }]);
    };

    const removeMetadataRow = (index) => {
        setMetadataRows((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const updateMetadataRow = (index, key, value) => {
        setMetadataRows((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    };

    const onMetadataDrop = (targetIndex) => {
        if (dragIndex === null || dragIndex === targetIndex) return;
        setMetadataRows((prev) => reorder(prev, dragIndex, targetIndex));
        setDragIndex(null);
    };

    const handleMapChange = (lat, lng) => {
        setData('latitude', Number(lat).toFixed(7));
        setData('longitude', Number(lng).toFixed(7));
    };

    const submitCreate = (e) => {
        e.preventDefault();
        const metadataText = rowsToMetadataJson(metadataRows);
        transform((current) => ({ ...current, metadata_text: metadataText }));
        post(route('admin.locations.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                setMetadataRows([{ ...EMPTY_METADATA_ROW }]);
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        const metadataText = rowsToMetadataJson(metadataRows);
        transform((current) => ({ ...current, metadata_text: metadataText }));
        patch(route('admin.locations.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
                setMetadataRows([{ ...EMPTY_METADATA_ROW }]);
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.locations.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.locations.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.locations.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteOpen(false),
        });
    };

    const formatDeletedAt = (value) => (value ? new Date(value).toLocaleString() : '-');
    const mapPreviewPoints = useMemo(
        () =>
            (items?.data || []).filter(
                (item) =>
                    item.latitude !== null &&
                    item.latitude !== undefined &&
                    item.longitude !== null &&
                    item.longitude !== undefined,
            ),
        [items],
    );

    const columns = [
        { key: 'name', label: 'Name', render: (item) => item.name || '-' },
        { key: 'location_type', label: 'Type', render: (item) => item.location_type || '-' },
        { key: 'agency', label: 'Agency', render: (item) => item.agency?.name || '-' },
        { key: 'coordinate', label: 'Coordinates', render: (item) => `${item.latitude ?? '-'}, ${item.longitude ?? '-'}` },
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

    const renderMetadataBuilder = () => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="form-label mb-0">Metadata Builder</label>
                <button type="button" onClick={addMetadataRow} className="btn-secondary">
                    <Plus className="w-4 h-4" />
                    Add Row
                </button>
            </div>
            <div className="space-y-2">
                {metadataRows.map((row, idx) => (
                    <div
                        key={`metadata-row-${idx}`}
                        className="grid md:grid-cols-12 gap-2 items-end p-2 rounded-lg border border-surface-200 bg-surface-50"
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onMetadataDrop(idx)}
                    >
                        <div className="md:col-span-1 flex items-center justify-center">
                            <GripVertical className="w-6 h-6 text-surface-500 cursor-move" />
                        </div>
                        <div className="md:col-span-4">
                            <label className="form-label">Name</label>
                            <input className="form-input" value={row.name} onChange={(e) => updateMetadataRow(idx, 'name', e.target.value)} />
                        </div>
                        <div className="md:col-span-6">
                            <label className="form-label">Value</label>
                            <input className="form-input" value={row.value} onChange={(e) => updateMetadataRow(idx, 'value', e.target.value)} />
                        </div>
                        <div className="md:col-span-1">
                            <button type="button" onClick={() => removeMetadataRow(idx)} className="btn-icon text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-surface-500">Drag rows to reorder metadata entries.</p>
            {errors.metadata_text && <p className="text-xs text-red-500 mt-1">{errors.metadata_text}</p>}
        </div>
    );

    const renderLocationForm = (onSubmit, closeHandler, submitText) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Name</label>
                    <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                </div>
                <div>
                    <label className="form-label">Type</label>
                    <input className="form-input" value={data.location_type} onChange={(e) => setData('location_type', e.target.value)} />
                </div>
            </div>

            <div>
                <label className="form-label">Agency</label>
                <select className="form-select" value={data.agency_id} onChange={(e) => setData('agency_id', e.target.value)}>
                    <option value="">No agency</option>
                    {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" value={data.latitude} onChange={(e) => setData('latitude', e.target.value)} />
                    {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>}
                </div>
                <div>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" value={data.longitude} onChange={(e) => setData('longitude', e.target.value)} />
                    {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>}
                </div>
            </div>

            <div>
                <label className="form-label">Pick Coordinate on Map</label>
                <MapPicker
                    lat={data.latitude ? Number(data.latitude) : null}
                    lng={data.longitude ? Number(data.longitude) : null}
                    onChange={handleMapChange}
                />
                <p className="text-xs text-surface-500 mt-2">Click map, drag marker, or search address to set coordinates.</p>
            </div>

            {renderMetadataBuilder()}

            <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={closeHandler} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={processing}>{submitText}</button>
            </div>
        </form>
    );

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <MapPinned className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Locations</h2>
                </div>
            }
        >
            <Head title="Locations" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Location
                </button>
            </div>

            <SearchFilter
                routeName="admin.locations.index"
                filters={filters}
                includeTrashed={canViewRecycleBin}
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
                    <h3 className="text-sm font-semibold text-surface-800">Map Preview</h3>
                    <span className="text-xs text-surface-500">
                        {mapPreviewPoints.length} location(s) with coordinates on this page
                    </span>
                </div>
                <MapPreview points={mapPreviewPoints} />
            </div>

            <DataTable columns={columns} items={items.data} actions={actions} />
            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Location" maxWidth="5xl">
                {renderLocationForm(submitCreate, () => setIsCreateOpen(false), 'Save')}
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Location" maxWidth="5xl">
                {renderLocationForm(submitEdit, () => setIsEditOpen(false), 'Update')}
            </FormModal>

            <ConfirmModal
                show={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Move Location to Recycle Bin?"
                message={`Move location "${selectedItem?.name || '-'}" to recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Location?"
                message={`Restore location "${selectedItem?.name || '-'}" from recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteOpen}
                onClose={() => setIsForceDeleteOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Location Permanently?"
                message={`Permanently delete location "${selectedItem?.name || '-'}"?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
