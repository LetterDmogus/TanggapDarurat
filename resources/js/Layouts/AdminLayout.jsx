import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Tags,
    Truck,
    Users,
    Box,
    Wallet,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    ChevronRight,
    Search,
    Bell
} from 'lucide-react';

const SidebarLink = ({ href, active, icon: Icon, children }) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-white text-primary-600 shadow-md font-semibold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
    >
        <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`} />
        <span className="flex-1 text-sm">{children}</span>
        {active && <ChevronRight className="w-4 h-4" />}
    </Link>
);

export default function AdminLayout({ header, children }) {
    const { auth } = usePage().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigation = [
        { name: 'Dashboard', href: route('admin.dashboard'), icon: LayoutDashboard, active: route().current('admin.dashboard') },
        { name: 'Categories', href: route('admin.categories.index'), icon: Tags, active: route().current('admin.categories.*') },
        { name: 'Emergency Units', href: route('admin.emergency-units.index'), icon: Truck, active: route().current('admin.emergency-units.*') },
        { name: 'Users', href: route('admin.users.index'), icon: Users, active: route().current('admin.users.*') },
        { name: 'Inventory', href: route('admin.inventory.index'), icon: Box, active: route().current('admin.inventory.*') },
        { name: 'Operational Costs', href: route('admin.operational-costs.index'), icon: Wallet, active: route().current('admin.operational-costs.*') },
    ];

    return (
        <div className="min-h-screen bg-surface-100 flex font-sans">
            {/* ─── Sidebar ─── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-sidebar text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-sidebar' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-primary-600 font-extrabold text-xl">TD</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">TanggapDarurat</h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest px-4 mb-4">Main Menu</p>
                        {navigation.map((item) => (
                            <SidebarLink
                                key={item.name}
                                href={item.href}
                                active={item.active}
                                icon={item.icon}
                            >
                                {item.name}
                            </SidebarLink>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 text-sm group"
                        >
                            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            Log Out
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Overlay */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Top Header */}
                <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="btn-icon lg:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {header && (
                            <div className="animate-fadeIn">
                                {header}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn-icon relative">
                            <Bell className="w-5 h-5 text-surface-400" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-surface-200 mx-2"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-surface-800 leading-none">{auth.user.name}</p>
                                <p className="text-[10px] text-surface-400 uppercase font-bold mt-1 tracking-wider">{auth.user.role}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center border-2 border-primary-100 overflow-hidden shadow-sm">
                                <UserIcon className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-100 p-6 lg:p-8 animate-fadeIn">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 px-8 text-center text-xs text-surface-400 border-t border-surface-200 bg-white">
                    &copy; {new Date().getFullYear()} TanggapDarurat AI System. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
