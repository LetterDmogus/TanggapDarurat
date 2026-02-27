import { ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, items, actions }) {
    return (
        <div className="table-container bg-white">
            <table className="w-full min-w-full">
                <thead className="table-header">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>
                                <div className="flex items-center gap-2">
                                    {column.label}
                                    {column.sortable && (
                                        <div className="flex flex-col opacity-50">
                                            <ChevronUp className="w-3 h-3 -mb-1" />
                                            <ChevronDown className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            </th>
                        ))}
                        {actions && <th className="text-right px-6">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                    {items.map((item, index) => (
                        <tr key={item.id || index} className="table-row">
                            {columns.map((column) => (
                                <td key={column.key}>
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                            {actions && (
                                <td className="text-right px-6 whitespace-nowrap">
                                    <div className="flex justify-end gap-2">
                                        {actions(item)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-surface-400">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm font-medium">No data found</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
