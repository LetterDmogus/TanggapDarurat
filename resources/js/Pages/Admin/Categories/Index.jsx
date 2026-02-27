import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import DataTable from '@/Components/Admin/DataTable';
import SearchFilter from '@/Components/Admin/SearchFilter';
import Pagination from '@/Components/Admin/Pagination';
import ConfirmModal from '@/Components/Admin/ConfirmModal';
import FormModal from '@/Components/Admin/FormModal';
import Toast from '@/Components/Admin/Toast';
import {
    Plus,
    Edit2,
    Trash2,
    RotateCcw,
    Tags,
    Tag,
    HeartPulse,
    Flame,
    ShieldAlert,
    CloudLightning,
    Car,
    Ambulance,
    Siren,
    Building2,
    Droplets,
    House,
    Mountain,
    TrafficCone,
    Radio,
    PhoneCall,
    TriangleAlert,
    Stethoscope,
    Truck,
    Bike,
    Users
} from 'lucide-react';

const ICON_OPTIONS = [
    { value: 'tag', label: 'Tag', component: Tag },
    { value: 'heart-pulse', label: 'Heart Pulse', component: HeartPulse },
    { value: 'flame', label: 'Flame', component: Flame },
    { value: 'shield-alert', label: 'Shield Alert', component: ShieldAlert },
    { value: 'cloud-lightning', label: 'Cloud Lightning', component: CloudLightning },
    { value: 'car', label: 'Car', component: Car },
    { value: 'ambulance', label: 'Ambulance', component: Ambulance },
    { value: 'siren', label: 'Siren', component: Siren },
    { value: 'building-2', label: 'Building', component: Building2 },
    { value: 'droplets', label: 'Droplets', component: Droplets },
    { value: 'house', label: 'House', component: House },
    { value: 'mountain', label: 'Mountain', component: Mountain },
    { value: 'traffic-cone', label: 'Traffic Cone', component: TrafficCone },
    { value: 'radio', label: 'Radio', component: Radio },
    { value: 'phone-call', label: 'Phone Call', component: PhoneCall },
    { value: 'triangle-alert', label: 'Triangle Alert', component: TriangleAlert },
    { value: 'stethoscope', label: 'Stethoscope', component: Stethoscope },
    { value: 'truck', label: 'Truck', component: Truck },
    { value: 'bike', label: 'Bike', component: Bike },
    { value: 'users', label: 'Users', component: Users },
];

const ICON_COMPONENTS = Object.fromEntries(
    ICON_OPTIONS.map((item) => [item.value, item.component]),
);

const ALLOWED_ICONS = new Set(ICON_OPTIONS.map((item) => item.value));

export default function Index({ items, filters }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isForceDeleteConfirmOpen, setIsForceDeleteConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        icon: '',
        color: '#DC2626',
    });

    const openCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setData({
            name: item.name,
            icon: item.icon && ALLOWED_ICONS.has(item.icon) ? item.icon : '',
            color: item.color || '#DC2626',
        });
        setIsEditOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.categories.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patch(route('admin.categories.update', selectedItem.id), {
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
        destroy(route('admin.categories.destroy', selectedItem.id), {
            onSuccess: () => setIsDeleteConfirmOpen(false),
        });
    };

    const executeRestore = () => {
        post(route('admin.categories.restore', selectedItem.id), {
            onSuccess: () => setIsRestoreConfirmOpen(false),
        });
    };

    const executeForceDelete = () => {
        destroy(route('admin.categories.force-delete', selectedItem.id), {
            onSuccess: () => setIsForceDeleteConfirmOpen(false),
        });
    };

    const DynamicIcon = ({ name, color }) => {
        const IconComponent = ICON_COMPONENTS[name] || Tag;
        return <IconComponent className="w-5 h-5" style={{ color }} />;
    };

    const columns = [
        {
            key: 'name',
            label: 'Category Name',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-surface-100 bg-surface-50">
                        <DynamicIcon name={item.icon} color={item.color} />
                    </div>
                    <div>
                        <p className="font-bold text-surface-900">{item.name}</p>
                        <p className="text-xs text-surface-400 font-medium tracking-tight uppercase">{item.icon || 'No Icon'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'color',
            label: 'Color Code',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: item.color }}></div>
                    <code className="text-xs font-mono text-surface-500 uppercase">{item.color}</code>
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Added On',
            render: (item) => <span className="text-surface-500 font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
        }
    ];

    const actions = (item) => (
        <>
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
        </>
    );

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Tags className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900">Manage Categories</h2>
                </div>
            }
        >
            <Head title="Category Management" />

            {/* ─── Page Actions ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-surface-500 font-medium">
                    Configure emergency categories used for report classification.
                </p>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Category
                </button>
            </div>

            {/* ─── Search & Filters ─── */}
            <SearchFilter routeName="admin.categories.index" filters={filters} />

            {/* ─── Data Table ─── */}
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
                title="Add New Category"
                maxWidth="md"
            >
                <form onSubmit={submitCreate} className="space-y-5">
                    <div>
                        <label className="form-label">Category Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g. Medis, Kebakaran"
                            required
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Category Icon</label>
                            <select
                                className="form-select"
                                value={data.icon}
                                onChange={e => setData('icon', e.target.value)}
                            >
                                <option value="">No Icon</option>
                                {ICON_OPTIONS.map((icon) => (
                                    <option key={icon.value} value={icon.value}>
                                        {icon.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Theme Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="w-10 h-10 p-0 rounded-lg border-surface-300 cursor-pointer"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="form-input flex-1 uppercase font-mono"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Save Category</button>
                    </div>
                </form>
            </FormModal>

            <FormModal
                show={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Category"
                maxWidth="md"
            >
                <form onSubmit={submitEdit} className="space-y-5">
                    <div>
                        <label className="form-label">Category Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Category Icon</label>
                            <select
                                className="form-select"
                                value={data.icon}
                                onChange={e => setData('icon', e.target.value)}
                            >
                                <option value="">No Icon</option>
                                {ICON_OPTIONS.map((icon) => (
                                    <option key={icon.value} value={icon.value}>
                                        {icon.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Theme Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="w-10 h-10 p-0 rounded-lg border-surface-300 cursor-pointer"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="form-input flex-1 uppercase font-mono"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing}>Update Category</button>
                    </div>
                </form>
            </FormModal>

            <ConfirmModal
                show={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Move to Trash?"
                message={`Are you sure you want to move the category "${selectedItem?.name}" to the recycle bin? It can be restored later.`}
                processing={processing}
            />

            <ConfirmModal
                show={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestore}
                type="info"
                confirmText="Restore"
                title="Restore Category"
                message={`Bring back the category "${selectedItem?.name}" from the recycle bin?`}
                processing={processing}
            />

            <ConfirmModal
                show={isForceDeleteConfirmOpen}
                onClose={() => setIsForceDeleteConfirmOpen(false)}
                onConfirm={executeForceDelete}
                title="Delete Permanently?"
                message={`This action is IRREVERSIBLE. Are you sure you want to permanently delete the category "${selectedItem?.name}"?`}
                processing={processing}
            />

            <Toast />
        </AdminLayout>
    );
}
