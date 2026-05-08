'use client';

import { Activity, PlaySquare, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api, { setAuthToken } from '@/lib/api';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch { }
        setAuthToken(null);
        localStorage.removeItem('role');
        router.push('/');
    };

    const isVerificationPage = pathname.includes('/verify');

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Top Navbar */}
            <div className="glass-panel border-b border-white/5 py-4 px-6 flex justify-between items-center z-20">
                <div className="flex flex-col">
                    <Link href="/doctor/dashboard" className="text-xl font-bold tracking-tight">
                        Bangla Medical <span className="text-primary">Triage</span>
                    </Link>
                    <span className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wider">Physician Portal</span>
                </div>

                <div className="flex items-center gap-4">
                    {!isVerificationPage && (
                        <Link
                            href="/doctor/dashboard"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/doctor/dashboard' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
                                }`}
                        >
                            <Activity className="w-4 h-4" /> Dashboard
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-2 border border-transparent hover:border-destructive/20"
                    >
                        <LogOut className="w-4 h-4" /> Exit
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
                {children}
            </div>
        </div>
    );
}
