import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links }) {
    const safeLinks = Array.isArray(links) ? links : [];
    if (safeLinks.length <= 3) return null;

    const previous = safeLinks[0];
    const next = safeLinks[safeLinks.length - 1];

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-surface-200 rounded-xl sm:px-6 shadow-sm mt-6">
            <div className="flex justify-between flex-1 sm:hidden">
                {previous?.url ? (
                    <Link href={previous.url} className="btn-secondary btn-sm">
                        Previous
                    </Link>
                ) : (
                    <span className="btn-secondary btn-sm opacity-50 cursor-not-allowed">Previous</span>
                )}
                {next?.url ? (
                    <Link href={next.url} className="btn-secondary btn-sm">
                        Next
                    </Link>
                ) : (
                    <span className="btn-secondary btn-sm opacity-50 cursor-not-allowed">Next</span>
                )}
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    {/* Optionally add "Showing X to Y of Z results" here if meta is provided */}
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                        {safeLinks.map((link, key) => {
                            if (link.url === null) {
                                return (
                                    <span
                                        key={key}
                                        className="relative inline-flex items-center px-4 py-2 border border-surface-200 bg-surface-50 text-sm font-medium text-surface-400 cursor-default first:rounded-l-lg last:rounded-r-lg"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }

                            return (
                                <Link
                                    key={key}
                                    href={link.url}
                                    className={`relative inline-flex items-center px-4 py-2 border border-surface-200 text-sm font-medium first:rounded-l-lg last:rounded-r-lg transition-colors ${link.active
                                            ? 'z-10 bg-primary-50 border-primary-200 text-primary-600'
                                            : 'bg-white text-surface-500 hover:bg-surface-50'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
