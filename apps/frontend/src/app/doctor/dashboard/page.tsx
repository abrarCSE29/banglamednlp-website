'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Settings, LogOut, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SESSION_SIZES = [5, 10, 20, 50];

export default function DoctorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalRecords: 0, verifiedCount: 0, workerVerifiedCount: 0 });
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [bmdcRegNumber, setBmdcRegNumber] = useState('');
    const [sessionSize, setSessionSize] = useState(10);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/');
            return;
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setEmail(payload.email || '');
        } catch {}

        try {
            const worker = JSON.parse(localStorage.getItem('worker') || '{}');
            setBmdcRegNumber(worker.bmdc_reg_number || '');
        } catch {}

        const fetchProgress = async () => {
            try {
                const { data } = await api.get('/crowd/progress');
                setStats(data as any);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    const handleStart = () => {
        setStarting(true);
        router.push(`/doctor/verify/session?count=${sessionSize}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('worker');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const pending = Math.max(stats.totalRecords - stats.verifiedCount, 0);
    const allVerified = pending <= 0;

    return (
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top App Bar */}
            <header className="px-5 pt-6 pb-2 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">Welcome back,</p>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate max-w-[220px]">{email}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => toast.info('Settings', { description: 'Coming soon.' })}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 px-5 py-4 flex flex-col gap-4 max-w-sm w-full mx-auto">
                {/* Dataset Health Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Dataset Health</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                            Real-Time
                        </span>
                    </div>
                    <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{pending.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5">Pending Records</p>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Your Progress</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.workerVerifiedCount}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Total Verified</p>
                            <p className="text-xl font-black text-emerald-500 dark:text-emerald-400 mt-1">{stats.verifiedCount}</p>
                        </div>
                    </div>
                </div>

                {/* New Verification Session Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">New Verification Session</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                        Select the number of medical records you wish to validate in this session. 
                    </p>

                    <div className="grid grid-cols-4 gap-2 mt-4">
                        {SESSION_SIZES.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSessionSize(size)}
                                className={cn(
                                    "rounded-xl py-3 flex flex-col items-center justify-center border transition-all",
                                    sessionSize === size
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50"
                                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                            >
                                <span className="text-lg font-black leading-none">{size}</span>
                                <span className={cn(
                                    "text-[8px] font-bold uppercase tracking-wide mt-1",
                                    sessionSize === size ? "text-white/70" : "text-slate-400 dark:text-slate-500"
                                )}>Records</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={allVerified || starting}
                        className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                    >
                        {starting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : allVerified ? (
                            <span>All Caught Up</span>
                        ) : (
                            <>
                                <span>Start Validation Session</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Footer identity card */}
                {bmdcRegNumber && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">BMDC ID: {bmdcRegNumber}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verified Practitioner Session</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
