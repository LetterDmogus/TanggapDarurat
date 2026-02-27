import Modal from '@/Components/Modal';
import { X } from 'lucide-react';

export default function FormModal({
    show,
    onClose,
    title,
    children,
    maxWidth = '2xl'
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth={maxWidth}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
                <div className="px-6 py-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-surface-900 tracking-tight">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </Modal>
    );
}
