'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'doctor';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50/50 flex transition-all duration-300">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — hidden on mobile, slides in when open */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <Sidebar role={role} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content — no left margin on mobile */}
            <div className="flex-1 flex flex-col transition-all duration-300 md:ml-[265px]">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
