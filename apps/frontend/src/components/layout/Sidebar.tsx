'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Database,
    Users,
    FileDown,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Stethoscope
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const ADMIN_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { name: 'Datasets', icon: Database, href: '/admin/dataset' },
    { name: 'Physicians', icon: Users, href: '/admin/physicians' },
    { name: 'Export', icon: FileDown, href: '/admin/export' },
];

const DOCTOR_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/doctor/dashboard' },
    { name: 'Verify Record', icon: Stethoscope, href: '/doctor/queue' },
];

export default function Sidebar({ role }: { role: 'admin' | 'doctor' }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const items = role === 'admin' ? ADMIN_ITEMS : DOCTOR_ITEMS;

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            router.push('/login');
        } catch (e) {
            window.location.href = '/login';
        }
    };

    return (
        <aside
            className={cn(
                "bg-[#1e1e2d] text-[#a2a3b7] flex flex-col transition-all duration-300 z-50 fixed inset-y-0",
                isCollapsed ? "w-[70px]" : "w-[265px]"
            )}
        >
            {/* Logo Section */}
            <div className="h-[75px] px-6 flex items-center justify-between border-b border-white/5">
                {!isCollapsed && (
                    <div className="font-extrabold text-white text-[15px] tracking-[0.15em] flex items-center gap-3 uppercase">
                        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">B</div>
                        <span className="font-poppins whitespace-nowrap">Med Triage</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors ml-auto"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                                isActive
                                    ? "bg-indigo-500/10 text-white fill-indigo-500"
                                    : "hover:bg-white/[0.03] hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-indigo-500" : "text-[#494b74] group-hover:text-indigo-400"
                            )} />
                            {!isCollapsed && <span className="font-semibold text-[13px] tracking-tight">{item.name}</span>}
                            {isActive && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                >
                    <LogOut className="w-5 h-5 text-[#494b74] group-hover:text-rose-400" />
                    {!isCollapsed && <span className="font-semibold text-[13px] tracking-tight">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
