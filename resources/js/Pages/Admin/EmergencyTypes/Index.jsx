import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, GripVertical, Plus, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import DataTable from '@/Components/Admin/DataTable';
import Pagination from '@/Components/Admin/Pagination';
import FormModal from '@/Components/Admin/FormModal';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Toast from '@/Components/Admin/Toast';

const EMPTY_FIELD_ROW = { title: '', type: 'text', name: '', options: '' };

function parseFormSchemaToRows(schema) {
    if (!schema) return [{ ...EMPTY_FIELD_ROW }];

    const fields = Array.isArray(schema) ? schema : schema.fields;
    if (!Array.isArray(fields) || fields.length === 0) return [{ ...EMPTY_FIELD_ROW }];

    return fields.map((item) => ({
        title: item.title || item.label || '',
        type: item.type || 'text',
        name: item.name || item.value_name || item.key || '',
        options: Array.isArray(item.options) ? item.options.join(', ') : '',
    }));
}

function rowsToFormSchema(rows) {
    const normalized = rows
        .filter((item) => item.title || item.type || item.name || item.options)
        .map((item) => {
            const result = {
                title: item.title,
                type: item.type || 'text',
                name: item.name,
            };

            if ((item.type || 'text') === 'select') {
                const options = (item.options || '')
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean);
                result.options = options;
            }

            return result;
        });

    return normalized.length ? JSON.stringify({ fields: normalized }) : '';
}

function reorder(list, fromIndex, toIndex) {
    const copy = [...list];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    return copy;
}

export default function Index({ items, filters, canViewRecycleBin }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [locationFilter, setLocationFilter] = useState(filters.is_need_location || '');
    const [schemaRows, setSchemaRows] = useState([{ ...EMPTY_FIELD_ROW }]);
    const [dragIndex, setDragIndex] = useState(null);

    const { data, setData, transform, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        display_name: '',
        description: '',
        is_need_location: false,
        form_schema_text: '',
    });

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(
            route('admin.emergency-types.index'),
            { search, is_need_location: locationFilter },
            { preserveState: true, replace: true },
        );
    };

    const resetFilter = () => {
        setSearch('');
        setLocationFilter('');
        router.get(route('admin.emergency-types.index'), {}, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        reset();
        setSchemaRows([{ ...EMPTY_FIELD_ROW }]);
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name || '',
            display_name: item.display_name || '',
            description: item.description || '',
            is_need_location: !!item.is_need_location,
            form_schema_text: '',
        });
        setSchemaRows(parseFormSchemaToRows(item.form_schema));
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

    const addSchemaRow = () => {
        setSchemaRows((prev) => [...prev, { ...EMPTY_FIELD_ROW }]);
    };

    const removeSchemaRow = (index) => {
        setSchemaRows((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const updateSchemaRow = (index, key, value) => {
        setSchemaRows((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    };

    const onRowDrop = (targetIndex) => {
        if (dragIndex === null || dragIndex === targetIndex) return;
        setSchemaRows((prev) => reorder(prev, dragIndex, targetIndex));
        setDragIndex(null);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        const formSchemaText = rowsToFormSchema(schemaRows);
        transform((current) => ({ ...current, form_schema_text: formSchemaText }));
        post(route('admin.emergency-types.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                setSchemaRows([{ ...EMPTY_FIELD_ROW }]);
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        const formSchemaText = rowsToFormSchema(schemaRows);
        transform((current) => ({ ...current, form_schema_text: formSchemaText }));
        patch(route('admin.emergency-types.update', selectedItem.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
                setSchemaRows([{ ...EMPTY_FIELD_ROW }]);
            },
        });
    };

    const executeDelete = () => {
        destroy(route('admin.emergency-types.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.emergency-types.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.emergency-types.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteOpen(false),
        });
    };

    const formatDeletedAt = (value) => (value ? new Date(value).toLocaleString() : '-');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'display_name', label: 'Display Name', render: (item) => item.display_name || '-' },
        { key: 'is_need_location', label: 'Needs Location', render: (item) => (item.is_need_location ? 'Yes' : 'No') },
        { key: 'form_schema', label: 'Form Schema', render: (item) => (item.form_schema ? 'Configured' : 'Not set') },
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

    const renderSchemaBuilder = (scope) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="form-label mb-0">Form Schema Builder</label>
                <button type="button" onClick={addSchemaRow} className="btn-secondary">
                    <Plus className="w-4 h-4" />
                    Add Field
                </button>
            </div>

            <div className="space-y-2">
                {schemaRows.map((row, idx) => (
                    <div
                        key={`${scope}-row-${idx}`}
                        className="grid md:grid-cols-12 gap-2 items-end p-2 rounded-lg border border-surface-200 bg-surface-50"
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onRowDrop(idx)}
                    >
                        <div className="md:col-span-1 flex items-center justify-center">
                            <GripVertical className="w-6 h-6 text-surface-500 cursor-move" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={row.title} onChange={(e) => updateSchemaRow(idx, 'title', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={row.type} onChange={(e) => updateSchemaRow(idx, 'type', e.target.value)}>
                                <option value="text">text</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                                <option value="date">date</option>
                                <option value="select">select</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="form-label">Value Name</label>
                            <input className="form-input" value={row.name} onChange={(e) => updateSchemaRow(idx, 'name', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Options</label>
                            <input
                                className="form-input"
                                placeholder="a,b,c (for select)"
                                value={row.options}
                                onChange={(e) => updateSchemaRow(idx, 'options', e.target.value)}
                                disabled={row.type !== 'select'}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button type="button" onClick={() => removeSchemaRow(idx)} className="btn-icon text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-surface-500">Drag rows to reorder. For `select` type, fill options as comma-separated values.</p>
            {errors.form_schema_text && <p className="text-xs text-red-500 mt-1">{errors.form_schema_text}</p>}
        </div>
    );

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Emergency Types</h2>
                </div>
            }
        >
            <Head title="Emergency Types" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Emergency Type
                </button>
            </div>

            <SearchFilter
                routeName="admin.emergency-types.index"
                filters={filters}
                includeTrashed={canViewRecycleBin}
                extraFilters={[
                    {
                        key: 'is_need_location',
                        label: 'All location requirements',
                        options: [
                            { value: '1', label: 'Need location' },
                            { value: '0', label: 'No location required' },
                        ],
                    },
                ]}
            />

            <DataTable columns={columns} items={items.data} actions={actions} />
            <Pagination links={items.links} />

            <FormModal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Emergency Type" maxWidth="2xl">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name</label>
                            <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="form-label">Display Name</label>
                            <input className="form-input" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="is_need_location_create"
                            type="checkbox"
                            checked={data.is_need_location}
                            onChange={(e) => setData('is_need_location', e.target.checked)}
                        />
                        <label htmlFor="is_need_location_create" className="text-sm text-surface-700">
                            This emergency type requires location
                        </label>
                    </div>

                    {renderSchemaBuilder('create')}

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Save</button>
                    </div>
                </form>
            </FormModal>

            <FormModal show={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Emergency Type" maxWidth="2xl">
                <form onSubmit={submitEdit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name</label>
                            <input className="form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="form-label">Display Name</label>
                            <input className="form-input" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="is_need_location_edit"
                            type="checkbox"
                            checked={data.is_need_location}
                            onChange={(e) => setData('is_need_location', e.target.checked)}
                        />
                        <label htmlFor="is_need_location_edit" className="text-sm text-surface-700">
                            This emergency type requires location
                        </label>
                    </div>

                    {renderSchemaBuilder('edit')}

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
                title="Move Emergency Type to Recycle Bin?"
                message={`Move emergency type "${selectedItem?.name}" to recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Emergency Type?"
                message={`Restore emergency type "${selectedItem?.name}" from recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteOpen}
                onClose={() => setIsForceDeleteOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Emergency Type Permanently?"
                message={`Permanently delete emergency type "${selectedItem?.name}"?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
