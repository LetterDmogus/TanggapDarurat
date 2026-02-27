import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    Users,
    AlertCircle,
    Truck,
    TrendingUp,
    Clock,
    CheckCircle2
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card-hover p-6 flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-surface-500">{title}</p>
            <h3 className="text-2xl font-bold text-surface-900 mt-1">{value}</h3>
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>{trend} vs last month</span>
                </div>
            )}
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl font-bold text-surface-900 tracking-tight">
                    Overview Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Reports"
                    value="12"
                    icon={AlertCircle}
                    color="bg-red-500"
                    trend="+5%"
                />
                <StatCard
                    title="Available Units"
                    value="8"
                    icon={Truck}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Responders"
                    value="24"
                    icon={Users}
                    color="bg-emerald-500"
                    trend="+12%"
                />
                <StatCard
                    title="Resolved Today"
                    value="45"
                    icon={CheckCircle2}
                    color="bg-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── Recent Activity ─── */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-surface-900">Recent Emergency Reports</h3>
                        <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-surface-900 truncate uppercase tracking-wide">Kebakaran Ruko</p>
                                    <p className="text-xs text-surface-500 mt-0.5 truncate">Jl. Jenderal Sudirman No. 45, Jakarta</p>
                                </div>
                                <div className="text-right">
                                    <span className="badge-danger">High Urgency</span>
                                    <p className="text-[10px] text-surface-400 mt-1 font-medium tracking-tighter uppercase flex items-center gap-1 justify-end">
                                        <Clock className="w-3 h-3" /> 2 mins ago
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AI Insights Placeholder ─── */}
                <div className="card bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">AI Dispatcher Assistant</h3>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <p className="text-sm leading-relaxed text-white/90 italic">
                            "Currently analyzing 3 incoming reports. 2 Medical emergencies detected. Suggested dispatch: Ambulance 01 and 05."
                        </p>
                    </div>
                    <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-xs font-medium">
                            <span>System Load</span>
                            <span>Low</span>
                        </div>
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full w-[15%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
