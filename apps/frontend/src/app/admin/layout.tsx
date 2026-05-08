'use client';

import { Activity, Users, Database, LogOut, Download } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api, { setAuthToken } from '@/lib/api';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        setAuthToken(null);
        localStorage.removeItem('role');
        router.push('/');
    };

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Activity },
        { name: 'Physicians', href: '/admin/physicians', icon: Users },
        { name: 'Dataset', href: '/admin/dataset', icon: Database },
        { name: 'Export', href: '/admin/export', icon: Download },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="w-64 glass-panel border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-primary">Admin</span> Portal
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Medical Triage Verification</p>
                </div>

                <div className="flex-1 py-6 flex flex-col gap-2 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
