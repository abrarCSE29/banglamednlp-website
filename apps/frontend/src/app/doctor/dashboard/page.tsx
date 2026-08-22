'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ListTodo, Loader2, ArrowRight, HeartPulse, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DoctorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalRecords: 0, verifiedCount: 0 });
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');

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

    const handleStart = async () => {
        try {
            const { data } = await api.get('/crowd/next') as { data: any };
            if (data.record) {
                router.push(`/doctor/verify/${data.record.id}`);
            } else {
                toast.info('All Done', {
                    description: 'No more records to verify right now.'
                });
            }
        } catch (e) {
            toast.error('Error', { description: 'Could not fetch records.' });
        }
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

    const pending = stats.totalRecords - stats.verifiedCount;
    const allVerified = pending <= 0;

    return (
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top App Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <HeartPulse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Triage Verify</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[140px]">{email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
                {/* Stats Cards */}
                <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <ListTodo className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{pending > 0 ? pending : 0}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Pending</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.verifiedCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Verified</p>
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={handleStart}
                    disabled={allVerified}
                    className="w-full max-w-sm py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                >
                    {allVerified ? (
                        <span>All Caught Up</span>
                    ) : (
                        <>
                            <span>Start Verifying</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {/* Footer */}
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium text-center mt-2">
                    v2.5.0 · Bangla Medical Triage
                </p>
            </div>
        </div>
    );
}
