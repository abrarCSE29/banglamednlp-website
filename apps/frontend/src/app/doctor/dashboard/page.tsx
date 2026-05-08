'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ListTodo, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

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
                toast.info('Verification Complete', {
                    description: 'You have verified all available records!'
                });
            }
        } catch (e) {
            toast.error('Error fetching queue');
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const completionPercentage = stats.totalRecords
        ? Math.round((stats.verifiedCount / stats.totalRecords) * 100)
        : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome to the Verification Queue</h1>
                <p className="text-muted-foreground mt-2 text-lg">Your expert input ensures our AI models learn precise, localized medical associations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-10 rounded-3xl flex flex-col justify-center space-y-4 shadow-sm border border-slate-200 group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                            <ListTodo className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pending Queue</h3>
                    </div>
                    <p className="text-5xl font-black text-slate-900 leading-none">
                        {stats.totalRecords - stats.verifiedCount} <span className="text-lg font-medium text-slate-400 uppercase tracking-tighter">records left</span>
                    </p>
                </div>

                <div className="bg-white p-10 rounded-3xl flex flex-col justify-center space-y-4 shadow-sm border border-slate-200 group hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Impact</h3>
                    </div>
                    <p className="text-5xl font-black text-slate-900 leading-none">
                        {stats.verifiedCount} <span className="text-lg font-medium text-slate-400 uppercase tracking-tighter">verified</span>
                    </p>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] mt-8 shadow-sm border border-slate-200 flex flex-col items-center">
                <div className="w-full flex justify-between items-end mb-5 px-2">
                    <h3 className="font-black text-2xl text-slate-900 tracking-tight">Queue Progress</h3>
                    <span className="text-3xl font-black text-indigo-600">{completionPercentage}%</span>
                </div>
                <div className="w-full h-8 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1.5 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                <div className="mt-12 w-full max-w-sm">
                    <button
                        onClick={handleStart}
                        disabled={stats.totalRecords === stats.verifiedCount}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-24 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-tighter"
                    >
                        {stats.totalRecords === stats.verifiedCount ? 'All Verified 🏆' : 'Open Verification Deck'}
                        {stats.totalRecords !== stats.verifiedCount && <ArrowRight className="w-7 h-7" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
