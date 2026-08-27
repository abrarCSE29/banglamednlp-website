"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function WorkersPage() {
    const router = useRouter();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkers = async () => {
        try {
            const { data } = await api.get('/admin/workers');
            if (Array.isArray(data)) {
                setWorkers(data);
            } else {
                setWorkers([]);
            }
        } catch (e) {
            console.error('Failed to fetch workers');
            setWorkers([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/admin/login');
        }
    }, [router]);

    useEffect(() => { fetchWorkers(); }, []);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Crowd Workers</h1>
                    <p className="text-muted-foreground mt-1">Workers who have participated in verification.</p>
                </div>
            </div>

            {/* Desktop Table - md+ */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-xs text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800">Email</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800">BMDC Reg #</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800 text-center">Verifications</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800 text-right">Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(worker => (
                            <tr key={worker.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                <td className="px-6 py-4 font-medium text-foreground">{worker.email}</td>
                                <td className="px-6 py-4 text-muted-foreground">{worker.bmdc_reg_number}</td>
                                <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{worker._count?.verifications ?? 0}</td>
                                <td className="px-6 py-4 text-right text-muted-foreground">{new Date(worker.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {workers.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No workers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards - below md */}
            <div className="md:hidden space-y-3">
                {workers.map(worker => (
                    <div key={worker.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
                        <div className="font-medium text-foreground truncate">{worker.email}</div>
                        <div className="text-sm text-muted-foreground">BMDC Reg #: {worker.bmdc_reg_number}</div>
                        <div className="flex gap-4 text-xs">
                            <span className="text-indigo-600 dark:text-indigo-400">Verifications: <strong>{worker._count?.verifications ?? 0}</strong></span>
                        </div>
                        <div className="text-xs text-muted-foreground">Joined: {new Date(worker.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
                {workers.length === 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center text-muted-foreground">No workers found.</div>
                )}
            </div>
        </div>
    );
}
