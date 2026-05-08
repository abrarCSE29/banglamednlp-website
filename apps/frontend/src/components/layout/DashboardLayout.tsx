'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'doctor';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Sidebar — completely removed on mobile, visible only md+ */}
            <div className="hidden md:block">
                <Sidebar role={role} />
            </div>

            {/* Main Content — full width on mobile, offset on desktop */}
            <div className="flex-1 flex flex-col md:ml-[265px]">
                <Navbar />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
