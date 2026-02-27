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
import { Plus, Edit2, Trash2, RotateCcw, Box, Package, Archive, AlertTriangle } from 'lucide-react';

export default function Index({ items, filters }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isForceDeleteConfirmOpen, setIsForceDeleteConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        item_name: '',
        sku: '',
        stock_quantity: 0,
        unit_price: 0,
        unit: 'pcs',
        min_stock: 10,
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            item_name: item.item_name,
            sku: item.sku || '',
            stock_quantity: item.stock_quantity,
            unit_price: item.unit_price,
            unit: item.unit,
            min_stock: item.min_stock,
        });
        setIsEditOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.inventory.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.inventory.update', selectedItem.id), {
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
        destroy(route('admin.inventory.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteConfirmOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.inventory.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreConfirmOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.inventory.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteConfirmOpen(false),
        });
    };

    const columns = [
        {
            key: 'item_name',
            label: 'Item Details',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-surface-900">{item.item_name}</p>
                        <p className="text-xs text-surface-400 font-mono uppercase tracking-tighter">{item.sku || 'No SKU'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'stock_quantity',
            label: 'Stock Level',
            render: (item) => {
                const isLow = item.stock_quantity <= item.min_stock;
                return (
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-surface-900">
                            {item.stock_quantity} <span className="text-surface-400 font-medium">{item.unit}</span>
                        </div>
                        {isLow && (
                            <div className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase border border-red-100 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Low Stock
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'min_stock',
            label: 'Min Alert',
            render: (item) => <span className="text-surface-500 font-medium text-sm">{item.min_stock} {item.unit}</span>
        },
        {
            key: 'unit_price',
            label: 'Unit Price',
            sortable: true,
            render: (item) => (
                <span className="font-bold text-surface-900 text-sm">
                    {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                    }).format(item.unit_price)}
                </span>
            )
        },
        {
            key: 'updated_at',
            label: 'Last Updated',
            render: (item) => <span className="text-surface-400 text-xs font-semibold">{new Date(item.updated_at).toLocaleString()}</span>
        }
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
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Archive className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Inventory Management</h2>
                </div>
            }
        >
            <Head title="Inventory" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-surface-500 font-medium">
                    Supply tracking for emergency response materials and assets.
                </p>
                <button onClick={openCreate} className="btn-primary bg-gradient-to-r from-amber-600 to-amber-500 border-amber-600">
                    <Plus className="w-4 h-4" />
                    Add Supply Item
                </button>
            </div>

            <SearchFilter routeName="admin.inventory.index" filters={filters} />

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
                title="Register New Supply Item"
            >
                <form onSubmit={submitCreate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="form-label">Item Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.item_name}
                                onChange={e => setData('item_name', e.target.value)}
                                placeholder="e.g. Paracetamol, Fire Extinguisher"
                                required
                            />
                            {errors.item_name && <p className="text-xs text-red-500 mt-1">{errors.item_name}</p>}
                        </div>

                        <div>
                            <label className="form-label">SKU / Code</label>
                            <input
                                type="text"
                                className="form-input font-mono uppercase"
                                value={data.sku}
                                onChange={e => setData('sku', e.target.value)}
                                placeholder="INV-001"
                            />
                        </div>

                        <div>
                            <label className="form-label">Unit of Measure</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.unit}
                                onChange={e => setData('unit', e.target.value)}
                                placeholder="pcs, box, liter"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Initial Quantity</label>
                            <input
                                type="number"
                                className="form-input"
                                value={data.stock_quantity}
                                onChange={e => setData('stock_quantity', e.target.value)}
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Unit Price (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    className="form-input pl-10"
                                    value={data.unit_price}
                                    onChange={e => setData('unit_price', e.target.value)}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            {errors.unit_price && <p className="text-xs text-red-500 mt-1">{errors.unit_price}</p>}
                        </div>

                        <div>
                            <label className="form-label">Minimum Stock Alert</label>
                            <input
                                type="number"
                                className="form-input"
                                value={data.min_stock}
                                onChange={e => setData('min_stock', e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary bg-amber-600 border-amber-600" disabled={processing}>Add to Inventory</button>
                    </div>
                </form>
            </FormModal>

            <FormModal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Stock Item"
            >
                <form onSubmit={submitEdit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="form-label">Item Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.item_name}
                                onChange={e => setData('item_name', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">SKU / Code</label>
                            <input
                                type="text"
                                className="form-input font-mono uppercase"
                                value={data.sku}
                                onChange={e => setData('sku', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">Unit of Measure</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.unit}
                                onChange={e => setData('unit', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Current Quantity</label>
                            <input
                                type="number"
                                className="form-input"
                                value={data.stock_quantity}
                                onChange={e => setData('stock_quantity', e.target.value)}
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Unit Price (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    className="form-input pl-10"
                                    value={data.unit_price}
                                    onChange={e => setData('unit_price', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Minimum Stock Alert</label>
                            <input
                                type="number"
                                className="form-input"
                                value={data.min_stock}
                                onChange={e => setData('min_stock', e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update Item</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Remove from Active Inventory?"
                message={`Move "${selectedItem?.item_name}" to the recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Inventory Item"
                message={`Return "${selectedItem?.item_name}" to active stock tracking?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteConfirmOpen}
                onClose={() => setIsForceDeleteConfirmOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Permanently?"
                message={`Warning: This will permanently delete item "${selectedItem?.item_name}" and all historical movements. Proceed?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
