'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Database, Download, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { name: 'Workers', icon: Users, href: '/admin/physicians' },
    { name: 'Dataset', icon: Database, href: '/admin/dataset' },
    { name: 'Export', icon: Download, href: '/admin/export' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/admin/login';
    };

    return (
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top App Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white dark:text-slate-900" />
                    </div>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white">Admin Panel</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 pb-24 overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1 safe-area-pb z-10">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <button
                            key={tab.href}
                            onClick={() => router.push(tab.href)}
                            className={cn(
                                "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px]",
                                isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 dark:text-slate-600"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.name}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
