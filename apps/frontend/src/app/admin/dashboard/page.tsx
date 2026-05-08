'use client';

import { useState, useEffect } from 'react';
import { FileStack, CheckCircle2, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface DashboardStats {
    totalRecords: number;
    verifiedRecords: number;
    doctors: {
        id: number;
        name: string;
        specialty: string;
        is_active: boolean;
        _count: { verifications: number };
    }[];
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

    const completionPercentage = stats?.totalRecords
        ? Math.round((stats.verifiedRecords / stats.totalRecords) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">Real-time statistics for dataset verification.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
                    <div className="p-4 bg-primary/20 text-primary rounded-full">
                        <FileStack className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                        <h3 className="text-2xl font-bold">{stats?.totalRecords || 0}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/20 text-emerald-500 rounded-full">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Verified Records</p>
                        <h3 className="text-2xl font-bold">{stats?.verifiedRecords || 0}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
                    <div className="p-4 bg-amber-500/20 text-amber-500 rounded-full">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Doctors</p>
                        <h3 className="text-2xl font-bold">{stats?.doctors.filter(d => d.is_active).length || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-panel p-6 rounded-xl">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="font-semibold text-lg">Overall Progress</h3>
                    <span className="text-xl font-bold text-primary">{completionPercentage}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Doctor Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8 shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-lg">Top Annotators</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-muted-foreground bg-slate-50 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium border-b border-slate-100">Name</th>
                                <th className="px-6 py-4 font-medium border-b border-slate-100">Specialty</th>
                                <th className="px-6 py-4 font-medium border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 font-medium text-right border-b border-slate-100">Verifications Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.doctors
                                .sort((a, b) => b._count.verifications - a._count.verifications)
                                .map((doctor) => (
                                    <tr key={doctor.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{doctor.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{doctor.specialty || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${doctor.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                                                }`}>
                                                {doctor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-primary">{doctor._count.verifications}</td>
                                    </tr>
                                ))}
                            {stats?.doctors.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No doctors registered yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
