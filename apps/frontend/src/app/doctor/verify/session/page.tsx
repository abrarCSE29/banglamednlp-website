'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronLeft, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
    'medicine', 'neurology', 'surgery', 'gastroenterology', 'pediatrics',
    'cardiology', 'ent', 'orthopedics', 'endocrinology', 'nephrology',
    'psychiatry', 'dermatology', 'pulmonology', 'ophthalmology',
    'hematology', 'urology', 'gynecology', 'rheumatology'
];

function SessionVerification() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const count = parseInt(searchParams.get('count') || '10');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selections, setSelections] = useState<Record<string, boolean>>({});
    const [globalProgress, setGlobalProgress] = useState({ verifiedCount: 0, totalRecords: 0 });
    const [complete, setComplete] = useState(false);
    const [completionStats, setCompletionStats] = useState({ validated: 0, totalVerified: 0, remaining: 0 });
    const [countdown, setCountdown] = useState(2);

    useEffect(() => {
        const load = async () => {
            try {
                const [sessionRes, progressRes] = await Promise.all([
                    api.get(`/crowd/session?count=${count}`),
                    api.get('/crowd/progress'),
                ]);
                const sessionData = sessionRes.data as any;
                const progressData = progressRes.data as any;

                setGlobalProgress({ verifiedCount: progressData.verifiedCount, totalRecords: progressData.totalRecords });

                if (!sessionData.records || sessionData.records.length === 0) {
                    toast.info('All Done', { description: 'No more records to verify right now.' });
                    router.replace('/doctor/dashboard');
                    return;
                }
                setRecords(sessionData.records);
            } catch (error) {
                toast.error('Failed to start session');
                router.replace('/doctor/dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [count, router]);

    const currentRecord = records[currentIndex];

    useEffect(() => {
        if (!currentRecord) return;
        const initial: Record<string, boolean> = {};
        DEPARTMENTS.forEach(dep => { initial[dep] = currentRecord[dep] === 1; });
        setSelections(initial);
    }, [currentRecord]);

    useEffect(() => {
        if (!complete) return;
        if (countdown <= 0) {
            router.push('/doctor/dashboard');
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [complete, countdown, router]);

    const handleCheckbox = (dep: string) => {
        setSelections(prev => ({ ...prev, [dep]: !prev[dep] }));
    };

    const handleNext = async () => {
        const selectedCount = Object.values(selections).filter(Boolean).length;
        setSubmitting(true);
        try {
            await api.post('/crowd/verify', {
                record_id: currentRecord.id,
                verified_departments: selections,
                is_unable_to_assess: selectedCount === 0,
            });

            if (currentIndex < records.length - 1) {
                setCurrentIndex(i => i + 1);
                setSubmitting(false);
            } else {
                const { data } = await api.get('/crowd/progress') as { data: any };
                setCompletionStats({
                    validated: records.length,
                    totalVerified: data.verifiedCount,
                    remaining: Math.max(data.totalRecords - data.verifiedCount, 0),
                });
                setComplete(true);
            }
        } catch (error) {
            toast.error('Submission Failed');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (complete) {
        return (
            <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center mb-6">
                    <Check className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Thank You for Verifying!</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-2 max-w-xs leading-relaxed">
                    Your clinical validations have been saved to the dataset. Your contribution directly improves AI diagnostic triage accuracy for Bangla healthcare.
                </p>

                <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Validated this session</span>
                        <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">+{completionStats.validated} records</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total verified in dataset</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{completionStats.totalVerified}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Remaining pending records</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{completionStats.remaining}</span>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="w-full max-w-xs mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                >
                    <span>Back to Home ({countdown}s)</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    const mappedCount = Object.values(selections).filter(Boolean).length;
    const aiDepartments = DEPARTMENTS.filter(dep => currentRecord?.[dep] === 1);
    const isLast = currentIndex === records.length - 1;

    return (
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top App Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 flex items-center justify-between sticky top-0 z-20">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    Record {currentIndex + 1} of {records.length} ({globalProgress.verifiedCount}/{globalProgress.totalRecords})
                </span>
            </header>

            {/* Symptom Card */}
            <div className="px-4 pt-3">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Input</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">#R-{currentRecord?.id}</span>
                    </div>
                    <p
                        className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium"
                        style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                    >
                        {currentRecord?.symptom_text}
                    </p>

                    {aiDepartments.length > 0 && (
                        <div className="mt-3">
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">AI Model Prediction</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {aiDepartments.map(dep => (
                                    <span
                                        key={dep}
                                        className="text-[9px] font-black uppercase tracking-wide bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg"
                                    >
                                        {dep}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Grid */}
            <div className="flex-1 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Applicable Departments</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tap all medical specialties that apply for this clinical case</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {DEPARTMENTS.map((dep) => {
                        const isSelected = selections[dep];
                        const isAi = currentRecord?.[dep] === 1;
                        return (
                            <button
                                key={dep}
                                onClick={() => handleCheckbox(dep)}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border text-left transition-all min-h-[48px]",
                                    isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
                                    isAi && !isSelected && "border-dashed border-amber-300 dark:border-amber-700"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-all",
                                    isSelected ? "bg-white border-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                )}>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                </div>
                                <span className="text-xs font-bold capitalize truncate">{dep}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-3">{mappedCount} selected</p>
            </div>

            {/* Bottom Submit Bar */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                >
                    {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isLast ? (
                        <>
                            <span>Finish Session</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            <span>Next Record ({currentIndex + 1}/{records.length})</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function SessionVerificationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <SessionVerification />
        </Suspense>
    );
}
