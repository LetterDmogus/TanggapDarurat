import { usePage } from '@inertiajs/react';

export default function ApplicationLogo({ className = '' }) {
    const { website } = usePage().props;
    const siteName = website?.site_name || 'TanggapDarurat';
    const logoUrl = website?.logo_url || null;
    const initials = siteName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (logoUrl) {
        return <img src={logoUrl} alt={`${siteName} logo`} className={className} />;
    }

    return (
        <span className={`inline-flex items-center justify-center rounded-md bg-primary-700 px-2 py-1 text-xs font-extrabold text-white ${className}`}>
            {initials || 'TD'}
        </span>
    );
}
