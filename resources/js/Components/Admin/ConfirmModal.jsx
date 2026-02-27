import Modal from '@/Components/Modal';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

export default function ConfirmModal({
    show,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Delete',
    processing = false
}) {
    const isDanger = type === 'danger';

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isDanger ? <Trash2 className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-surface-900 leading-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-surface-500 mt-2">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={isDanger ? 'btn-primary' : 'btn-primary bg-gradient-to-r from-blue-600 to-blue-500 text-white'}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
