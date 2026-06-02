'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'doctor';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar — slide in from left */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
                mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar role={role} onClose={() => setMobileSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar — always visible */}
            <div className="hidden md:block">
                <Sidebar role={role} />
            </div>

            {/* Main Content — full width on mobile, offset on desktop */}
            <div className="flex-1 flex flex-col md:ml-[265px]">
                <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
