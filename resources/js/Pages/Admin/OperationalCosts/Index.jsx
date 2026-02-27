import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import DataTable from '@/Components/Admin/DataTable';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Pagination from '@/Components/Admin/Pagination';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import FormModal from '@/Components/Admin/FormModal';
import Toast from '@/Components/Admin/Toast';
import { Plus, Edit2, Trash2, RotateCcw, Wallet, CreditCard, Calendar, ReceiptText } from 'lucide-react';

export default function Index({ items, filters, assignments }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isForceDeleteConfirmOpen, setIsForceDeleteConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        assignment_id: '',
        expense_type: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        notes: '',
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            assignment_id: item.assignment_id,
            expense_type: item.expense_type,
            expense_date: item.expense_date,
            amount: item.amount,
            notes: item.notes || '',
        });
        setIsEditOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.operational-costs.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.operational-costs.update', selectedItem.id), {
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
        destroy(route('admin.operational-costs.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteConfirmOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.operational-costs.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreConfirmOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.operational-costs.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteConfirmOpen(false),
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns = [
        {
            key: 'expense_type',
            label: 'Expense Type',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-surface-900">{item.expense_type}</p>
                        <p className="text-xs text-surface-400 font-medium truncate max-w-[200px]">{item.notes || 'No notes'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'assignment',
            label: 'Linked Assignment',
            render: (item) => (
                <div className="text-sm">
                    <p className="font-bold text-surface-900">#{item.assignment?.id}</p>
                    <p className="text-xs text-surface-400">{item.assignment?.report?.description?.substring(0, 30)}...</p>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Total Cost',
            sortable: true,
            render: (item) => (
                <span className="font-bold text-surface-900 text-sm">
                    {formatCurrency(item.amount)}
                </span>
            )
        },
        {
            key: 'expense_date',
            label: 'Transaction Date',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2 text-surface-500 font-medium text-sm">
                    <Calendar className="w-4 h-4 text-surface-300" />
                    {new Date(item.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            )
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
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Operational Costs</h2>
                </div>
            }
        >
            <Head title="Operational Costs" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-surface-500 font-medium">
                    Tracking of financial expenditures for emergency services and logistics.
                </p>
                <button onClick={openCreate} className="btn-primary bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-600">
                    <Plus className="w-4 h-4" />
                    Log New Expense
                </button>
            </div>

            <SearchFilter routeName="admin.operational-costs.index" filters={filters} />

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
                title="Log Operational Expense"
            >
                <form onSubmit={submitCreate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="form-label">Linked Assignment</label>
                            <select
                                className="form-input"
                                value={data.assignment_id}
                                onChange={e => setData('assignment_id', e.target.value)}
                                required
                            >
                                <option value="">Select Assignment</option>
                                {assignments.map(a => (
                                    <option key={a.id} value={a.id}>
                                        Assignment #{a.id} - {a.report?.description?.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                            {errors.assignment_id && <p className="text-xs text-red-500 mt-1">{errors.assignment_id}</p>}
                        </div>

                        <div>
                            <label className="form-label">Expense Type</label>
                            <select
                                className="form-input"
                                value={data.expense_type}
                                onChange={e => setData('expense_type', e.target.value)}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="BBM">BBM</option>
                                <option value="Alat Medis">Alat Medis</option>
                                <option value="Konsumsi">Konsumsi</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                            {errors.expense_type && <p className="text-xs text-red-500 mt-1">{errors.expense_type}</p>}
                        </div>

                        <div>
                            <label className="form-label">Amount (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    className="form-input pl-10"
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                        </div>

                        <div>
                            <label className="form-label">Transaction Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={data.expense_date}
                                onChange={e => setData('expense_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">Description / Notes</label>
                            <textarea
                                className="form-input min-h-[100px]"
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Add any additional details here..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary bg-emerald-600 border-emerald-600" disabled={processing}>Record Expense</button>
                    </div>
                </form>
            </FormModal>

            <FormModal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Expense Log"
            >
                <form onSubmit={submitEdit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="form-label">Linked Assignment</label>
                            <select
                                className="form-input"
                                value={data.assignment_id}
                                onChange={e => setData('assignment_id', e.target.value)}
                                required
                            >
                                <option value="">Select Assignment</option>
                                {assignments.map(a => (
                                    <option key={a.id} value={a.id}>
                                        Assignment #{a.id} - {a.report?.description?.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Expense Type</label>
                            <select
                                className="form-input"
                                value={data.expense_type}
                                onChange={e => setData('expense_type', e.target.value)}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="BBM">BBM</option>
                                <option value="Alat Medis">Alat Medis</option>
                                <option value="Konsumsi">Konsumsi</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Amount (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    className="form-input pl-10"
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Transaction Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={data.expense_date}
                                onChange={e => setData('expense_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">Description / Notes</label>
                            <textarea
                                className="form-input min-h-[100px]"
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update Record</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Trash this Expense?"
                message={`Move "${selectedItem?.expense_type}" log to the recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Expense Log"
                message={`Recover the expense log for "${selectedItem?.expense_type}"?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteConfirmOpen}
                onClose={() => setIsForceDeleteConfirmOpen(false)}
                onConfirm={executeForceDelete}
                title="Permanently Delete Log?"
                message={`Warning: This will permanently purge the expense record for "${selectedItem?.expense_type}". This cannot be undone.`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
