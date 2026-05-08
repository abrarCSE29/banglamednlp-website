'use client';

import { useState, useEffect } from 'react';
import { FileStack, CheckCircle2, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface DashboardStats {
    totalRecords: number;
    verifiedRecords: number;
    totalAssignments: number;
    assignedRecordsCount: number;
    unassignedRecordsCount: number;
    doctors: {
        id: number;
        name: string;
        specialty: string;
        is_active: boolean;
        _count: {
            verifications: number;
            assigned_records: number;
        };
    }[];
    metrics: {
        acceptanceRate: number;
        fixRate: number;
        rejectionRate: number;
        cohenKappa: number;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    const assignmentPercentage = stats?.totalRecords
        ? Math.round((stats.assignedRecordsCount / stats.totalRecords) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">Real-time statistics for dataset verification.</p>
                </div>
            </div>

            {/* Quality Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acceptance Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-black ${getStatusColor(stats?.metrics.acceptanceRate || 0, 'acceptance')}`}>
                            {stats?.metrics.acceptanceRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">Target ≥80%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.acceptanceRate || 0, 'acceptance').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.acceptanceRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doctor Fix Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-black ${getStatusColor(stats?.metrics.fixRate || 0, 'fix')}`}>
                            {stats?.metrics.fixRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">Target ≤15%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.fixRate || 0, 'fix').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.fixRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejection Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-black ${getStatusColor(stats?.metrics.rejectionRate || 0, 'rejection')}`}>
                            {stats?.metrics.rejectionRate || 0}%
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">Target ≤5%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.rejectionRate || 0, 'rejection').replace('text', 'bg')}`} style={{ width: `${stats?.metrics.rejectionRate || 0}%` }} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cohen's Kappa</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-black ${getStatusColor(stats?.metrics.cohenKappa || 0, 'kappa')}`}>
                            {stats?.metrics.cohenKappa || 0}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">Target ≥0.75</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getStatusColor(stats?.metrics.cohenKappa || 0, 'kappa').replace('text', 'bg')}`} style={{ width: `${(stats?.metrics.cohenKappa || 0) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <FileStack className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{stats?.totalRecords || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned</p>
                        <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{stats?.assignedRecordsCount || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                        <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{stats?.verifiedRecords || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-all">
                        <FileStack className="w-6 h-6 opacity-50" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                        <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{stats?.unassignedRecordsCount || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Progress */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Overall Progress</h3>
                        <span className="text-xl font-black text-emerald-600">{completionPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">Percentage of total records verified by doctors.</p>
                </div>

                {/* Assignment Progress */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Assignment Coverage</h3>
                        <span className="text-xl font-black text-indigo-600">{assignmentPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                            style={{ width: `${assignmentPercentage}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">Percentage of records distributed to the physician panel.</p>
                </div>
            </div>

            {/* Doctor Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-lg">Physician Workload</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-muted-foreground bg-slate-50 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium border-b border-slate-100">Name</th>
                                <th className="px-6 py-4 font-medium border-b border-slate-100">Specialty</th>
                                <th className="px-6 py-4 font-medium text-center border-b border-slate-100">Assigned</th>
                                <th className="px-6 py-4 font-medium text-center border-b border-slate-100">Verified</th>
                                <th className="px-6 py-4 font-medium text-right border-b border-slate-100">Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.doctors
                                .sort((a, b) => b._count.verifications - a._count.verifications)
                                .map((doctor) => {
                                    const personalProgress = doctor._count.assigned_records > 0
                                        ? Math.round((doctor._count.verifications / doctor._count.assigned_records) * 100)
                                        : 0;
                                    return (
                                        <tr key={doctor.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{doctor.name}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{doctor.specialty || 'N/A'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{doctor._count.assigned_records}</td>
                                            <td className="px-6 py-4 text-center font-bold text-indigo-600">{doctor._count.verifications}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs font-bold text-slate-400">{personalProgress}%</span>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${personalProgress}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {stats?.doctors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No doctors registered yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
