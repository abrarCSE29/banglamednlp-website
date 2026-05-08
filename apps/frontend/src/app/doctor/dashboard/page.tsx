'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ListTodo, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function DoctorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalRecords: 0, verifiedCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const { data } = await api.get('/doctor/progress');
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
            const { data } = await api.get('/doctor/queue');
            const queueData = data as any;
            if (queueData.record) {
                router.push(`/doctor/verify/${queueData.record.id}`);
            } else {
                alert('You have verified all available records!');
            }
        } catch (e) {
            alert('Error fetching queue.');
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const completionPercentage = stats.totalRecords
        ? Math.round((stats.verifiedCount / stats.totalRecords) * 100)
        : 0;

    return (
        <div className="max-w-4xl mx-auto p-8 pt-12 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome to the Verification Queue</h1>
                <p className="text-muted-foreground mt-2 text-lg">Your expert input ensures our AI models learn precise, localized medical associations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center space-y-4 shadow-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary/20 text-primary rounded-xl">
                            <ListTodo className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-muted-foreground">Pending Queue</h3>
                    </div>
                    <p className="text-4xl font-bold text-foreground">
                        {stats.totalRecords - stats.verifiedCount} <span className="text-lg font-normal text-muted-foreground">records left</span>
                    </p>
                </div>

                <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center space-y-4 shadow-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-muted-foreground">Your Contributions</h3>
                    </div>
                    <p className="text-4xl font-bold text-foreground">
                        {stats.verifiedCount} <span className="text-lg font-normal text-muted-foreground">verified</span>
                    </p>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl mt-8 shadow-xl border border-white/10">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-semibold text-xl">Overall Progress</h3>
                    <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                </div>
                <div className="w-full h-6 bg-secondary/60 rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleStart}
                        disabled={stats.totalRecords === stats.verifiedCount}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 flex items-center gap-3"
                    >
                        {stats.totalRecords === stats.verifiedCount ? 'Queue Complete 🎉' : 'Start Verification'}
                        {stats.totalRecords !== stats.verifiedCount && <ArrowRight className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
