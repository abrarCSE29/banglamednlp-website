'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileStack, CheckCircle2, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface DashboardStats {
    totalRecords: number;
    verifiedRecords: number;
    totalWorkers: number;
    workers: {
        id: number;
        email: string;
        bmdc_reg_number: string;
        created_at: string;
        verifications_count: number;
    }[];
    metrics: {
        acceptanceRate: number;
        fixRate: number;
        rejectionRate: number;
        cohenKappa: number;
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/admin/login');
            return;
        }

        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/dashboard');
                setStats(data as DashboardStats);
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const getStatusColor = (val: number, type: 'acceptance' | 'fix' | 'rejection' | 'kappa') => {
        if (type === 'acceptance') return val >= 80 ? 'text-emerald-500' : val >= 60 ? 'text-amber-500' : 'text-rose-500';
        if (type === 'fix') return val <= 15 ? 'text-emerald-500' : val <= 25 ? 'text-amber-500' : 'text-rose-500';
        if (type === 'rejection') return val <= 5 ? 'text-emerald-500' : val <= 10 ? 'text-amber-500' : 'text-rose-500';
        if (type === 'kappa') return val >= 0.75 ? 'text-emerald-500' : val >= 0.6 ? 'text-amber-500' : 'text-rose-500';
        return 'text-slate-900';
    };

    const completionPercentage = stats?.totalRecords
        ? Math.round((stats.verifiedRecords / stats.totalRecords) * 100)
        : 0;

    const sortedWorkers = stats?.workers
        ? [...stats.workers].sort((a, b) => b.verifications_count - a.verifications_count)
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">Real-time statistics for crowd verification.</p>
                </div>
            </div>

            {/* Quality Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Acceptance Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl md:text-3xl font-black ${getStatusColor(stats?.metrics.acceptanceRate || 0, 'acceptance')}`}>
                            {stats?.metrics.acceptanceRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Target ≥80%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.acceptanceRate || 0, 'acceptance').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.acceptanceRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Fix Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl md:text-3xl font-black ${getStatusColor(stats?.metrics.fixRate || 0, 'fix')}`}>
                            {stats?.metrics.fixRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Target ≤15%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.fixRate || 0, 'fix').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.fixRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Rejection Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl md:text-3xl font-black ${getStatusColor(stats?.metrics.rejectionRate || 0, 'rejection')}`}>
                            {stats?.metrics.rejectionRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Target ≤5%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.rejectionRate || 0, 'rejection').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.rejectionRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Cohen's Kappa</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl md:text-3xl font-black ${getStatusColor(stats?.metrics.cohenKappa || 0, 'kappa')}`}>
                            {stats?.metrics.cohenKappa || 0}
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Target ≥0.75</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.cohenKappa || 0, 'kappa').replace('text', 'bg')}`} style={{ width: `${(Number(stats?.metrics.cohenKappa) || 0) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <FileStack className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Records</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats?.totalRecords || 0}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-500 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verified</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats?.verifiedRecords || 0}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow group col-span-2 md:col-span-1">
                    <div className="p-2 md:p-3 bg-amber-50 dark:bg-amber-950 text-amber-500 dark:text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Workers</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats?.totalWorkers || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Overall Progress</h3>
                    <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400">{completionPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">Percentage of total records verified by crowd workers.</p>
            </div>

            {/* Crowd Workers Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-lg">Crowd Workers</h3>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-muted-foreground bg-slate-50 dark:bg-slate-800/60 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800">Email</th>
                                <th className="px-6 py-4 font-medium border-b border-slate-100 dark:border-slate-800">BMDC Reg #</th>
                                <th className="px-6 py-4 font-medium text-center border-b border-slate-100 dark:border-slate-800">Verifications</th>
                                <th className="px-6 py-4 font-medium text-right border-b border-slate-100 dark:border-slate-800">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedWorkers.map((worker) => (
                                <tr key={worker.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">{worker.email}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{worker.bmdc_reg_number || 'N/A'}</td>
                                    <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{worker.verifications_count}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">
                                        {new Date(worker.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {sortedWorkers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No workers registered yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedWorkers.map((worker) => (
                        <div key={worker.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-medium text-foreground">{worker.email}</p>
                                    <p className="text-xs text-muted-foreground">{worker.bmdc_reg_number || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{worker.verifications_count}</span>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">verifications</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Joined: <span className="font-bold text-slate-600 dark:text-slate-300">{new Date(worker.created_at).toLocaleDateString()}</span></span>
                            </div>
                        </div>
                    ))}
                    {sortedWorkers.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">No workers registered yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
