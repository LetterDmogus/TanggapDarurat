import { Search, RotateCcw } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function SearchFilter({ routeName, filters, extraFilters = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [trashed, setTrashed] = useState(filters.trashed || '');
    const [others, setOthers] = useState(
        extraFilters.reduce((acc, f) => ({ ...acc, [f.key]: filters[f.key] || '' }), {})
    );

    const prevSearch = useRef(search);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...others, [key]: value };
        setOthers(newFilters);
        applyFilters({ ...newFilters, search, trashed });
    };

    const applyFilters = (params) => {
        router.get(route(routeName), params, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch('');
        setTrashed('');
        const resetOthers = extraFilters.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
        setOthers(resetOthers);
        applyFilters({});
    };

    // Use a delay for search to avoid too many requests
    useEffect(() => {
        if (prevSearch.current !== search) {
            const timer = setTimeout(() => {
                applyFilters({ ...others, search, trashed });
            }, 500);
            prevSearch.current = search;
            return () => clearTimeout(timer);
        }
    }, [search, others, trashed]);

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-surface-200 shadow-sm animate-fadeIn">
            <div className="flex-1 min-w-[240px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="form-input pl-10 h-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {extraFilters.map((f) => (
                <div key={f.key} className="min-w-[140px]">
                    <select
                        className="form-select h-10 py-0"
                        value={others[f.key]}
                        onChange={(e) => handleFilterChange(f.key, e.target.value)}
                    >
                        <option value="">{f.label}</option>
                        {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}

            <div className="min-w-[140px]">
                <select
                    className="form-select h-10 py-0"
                    value={trashed}
                    onChange={(e) => {
                        setTrashed(e.target.value);
                        applyFilters({ ...others, search, trashed: e.target.value });
                    }}
                >
                    <option value="">Active Items</option>
                    <option value="true">Recycle Bin</option>
                </select>
            </div>

            <button
                onClick={handleReset}
                className="btn-secondary h-10 px-3 flex items-center gap-2"
                title="Reset Filters"
            >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
            </button>
        </div>
    );
}
