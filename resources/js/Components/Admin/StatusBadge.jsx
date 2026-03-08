export default function StatusBadge({ type, children, className = '' }) {
    const getStyles = () => {
        switch (type) {
            case 'primary':
            case 'admin':
            case 'super_admin':
            case 'superadmin':
            case 'manager':
                return 'badge-primary';
            case 'instansi':
                return 'badge-info';
            case 'pelapor':
                return 'badge-neutral';
            case 'success':
            case 'resolved':
            case 'available':
                return 'badge-success';
            case 'warning':
            case 'pending':
            case 'queued':
            case 'triage':
            case 'submitted':
            case 'on_site':
            case 'busy':
                return 'badge-warning';
            case 'danger':
            case 'rejected':
            case 'validation_failed':
            case 'fake':
            case 'critical':
            case 'high':
                return 'badge-danger';
            case 'info':
            case 'assigned':
            case 'resolved_waiting_validation':
            case 'in_progress':
            case 'on_progress':
            case 'low':
                return 'badge-info';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <span className={`${getStyles()} ${className} uppercase tracking-wider`}>
            {children}
        </span>
    );
}
