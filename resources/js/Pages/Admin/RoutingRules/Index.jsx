import { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Edit2, Plus, RotateCcw, Route as RouteIcon, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
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
    const [viewMode, setViewMode] = useState('grouped');
    const [collapsedGroups, setCollapsedGroups] = useState({});

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

    const groupedItems = useMemo(() => {
        const map = new Map();

        for (const item of items.data) {
            const emergencyTypeId = item.emergency_type?.id ?? item.emergency_type_id ?? 'unknown';
            const emergencyTypeName = item.emergency_type?.display_name || item.emergency_type?.name || 'Unknown emergency type';

            if (!map.has(emergencyTypeId)) {
                map.set(emergencyTypeId, {
                    id: emergencyTypeId,
                    name: emergencyTypeName,
                    rules: [],
                });
            }

            map.get(emergencyTypeId).rules.push(item);
        }

        return Array.from(map.values()).map((group) => ({
            ...group,
            rules: [...group.rules].sort((a, b) => Number(a.priority || 9999) - Number(b.priority || 9999)),
        }));
    }, [items.data]);

    const diagramData = useMemo(() => {
        const leftNodes = [];
        const rightNodes = [];
        const leftMap = new Map();
        const rightMap = new Map();
        const edges = [];

        groupedItems.forEach((group) => {
            const leftId = `et-${group.id}`;
            leftMap.set(group.id, leftId);
            leftNodes.push({ id: leftId, name: group.name });
        });

        for (const item of items.data) {
            const agencyId = item.agency?.id ?? item.agency_id ?? `unknown-${item.id}`;
            if (!rightMap.has(agencyId)) {
                const rightId = `ag-${agencyId}`;
                rightMap.set(agencyId, rightId);
                rightNodes.push({ id: rightId, name: item.agency?.name || 'Unknown agency' });
            }

            const emergencyTypeId = item.emergency_type?.id ?? item.emergency_type_id ?? 'unknown';
            edges.push({
                id: `edge-${item.id}`,
                from: leftMap.get(emergencyTypeId),
                to: rightMap.get(agencyId),
                priority: item.priority,
                isPrimary: item.is_primary,
                deletedAt: item.deleted_at,
            });
        }

        return { leftNodes, rightNodes, edges };
    }, [groupedItems, items.data]);

    const toggleGroup = (groupId) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

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

    const renderGroupedView = () => {
        if (groupedItems.length === 0) {
            return (
                <div className="bg-white border border-surface-200 rounded-xl p-8 text-center text-surface-500">
                    No routing rules found for current filters.
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {groupedItems.map((group) => {
                    const isCollapsed = !!collapsedGroups[group.id];

                    return (
                        <div key={group.id} className="bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className="w-full px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-surface-500" /> : <ChevronDown className="w-4 h-4 text-surface-500" />}
                                    <p className="font-semibold text-surface-800">{group.name}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-white border border-surface-200 text-surface-600">
                                    {group.rules.length} rule(s)
                                </span>
                            </button>

                            {!isCollapsed && (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[780px]">
                                        <thead className="table-header">
                                            <tr>
                                                <th>Agency</th>
                                                <th>Priority</th>
                                                <th>Primary</th>
                                                <th>Area</th>
                                                <th>Deleted At</th>
                                                <th className="text-right px-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {group.rules.map((item) => (
                                                <tr key={item.id} className="table-row">
                                                    <td>{item.agency?.name || '-'}</td>
                                                    <td>{item.priority ?? '-'}</td>
                                                    <td>{item.is_primary ? 'Yes' : 'No'}</td>
                                                    <td>{item.area || '-'}</td>
                                                    <td>{formatDeletedAt(item.deleted_at)}</td>
                                                    <td className="text-right px-6 whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">{actions(item)}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDiagramView = () => {
        if (diagramData.leftNodes.length === 0 || diagramData.rightNodes.length === 0) {
            return (
                <div className="bg-white border border-surface-200 rounded-xl p-8 text-center text-surface-500">
                    No routing rules to render.
                </div>
            );
        }

        const rowHeight = 78;
        const topOffset = 28;
        const leftX = 140;
        const rightX = 780;
        const nodeWidth = 190;
        const nodeHeight = 42;
        const totalRows = Math.max(diagramData.leftNodes.length, diagramData.rightNodes.length);
        const svgHeight = Math.max(320, topOffset * 2 + totalRows * rowHeight);

        const leftNodeY = new Map(diagramData.leftNodes.map((node, index) => [node.id, topOffset + index * rowHeight]));
        const rightNodeY = new Map(diagramData.rightNodes.map((node, index) => [node.id, topOffset + index * rowHeight]));

        return (
            <div className="bg-white border border-surface-200 rounded-xl shadow-sm p-4 overflow-x-auto">
                <div className="min-w-[980px] relative" style={{ height: `${svgHeight}px` }}>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {diagramData.edges.map((edge) => {
                            const startY = (leftNodeY.get(edge.from) ?? topOffset) + nodeHeight / 2;
                            const endY = (rightNodeY.get(edge.to) ?? topOffset) + nodeHeight / 2;
                            const startX = leftX + nodeWidth;
                            const endX = rightX;

                            return (
                                <g key={edge.id}>
                                    <line
                                        x1={startX}
                                        y1={startY}
                                        x2={endX}
                                        y2={endY}
                                        stroke={edge.deletedAt ? '#9ca3af' : edge.isPrimary ? '#dc2626' : '#f59e0b'}
                                        strokeWidth={edge.isPrimary ? 3 : 2}
                                        strokeDasharray={edge.deletedAt ? '6 4' : 'none'}
                                    />
                                    <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 6} textAnchor="middle" fontSize="11" fill="#334155">
                                        P{edge.priority}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {diagramData.leftNodes.map((node) => (
                        <div
                            key={node.id}
                            className="absolute px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium shadow-sm"
                            style={{ left: `${leftX}px`, top: `${leftNodeY.get(node.id)}px`, width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
                            title={node.name}
                        >
                            <p className="truncate">{node.name}</p>
                        </div>
                    ))}

                    {diagramData.rightNodes.map((node) => (
                        <div
                            key={node.id}
                            className="absolute px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-medium shadow-sm"
                            style={{ left: `${rightX}px`, top: `${rightNodeY.get(node.id)}px`, width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
                            title={node.name}
                        >
                            <p className="truncate">{node.name}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-surface-600">
                    <span className="inline-flex items-center gap-1"><span className="w-5 h-[2px] bg-red-600" /> Primary</span>
                    <span className="inline-flex items-center gap-1"><span className="w-5 h-[2px] bg-amber-500" /> Secondary</span>
                    <span className="inline-flex items-center gap-1"><span className="w-5 h-[2px] border-t-2 border-dashed border-slate-400" /> Trashed</span>
                </div>
            </div>
        );
    };

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
                <div className="inline-flex p-1 rounded-lg border border-surface-200 bg-white">
                    <button
                        type="button"
                        onClick={() => setViewMode('grouped')}
                        className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-red-50 text-red-700' : 'text-surface-600'}`}
                    >
                        Grouped
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('diagram')}
                        className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'diagram' ? 'bg-red-50 text-red-700' : 'text-surface-600'}`}
                    >
                        Diagram
                    </button>
                </div>
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

            {viewMode === 'grouped' ? renderGroupedView() : renderDiagramView()}
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
