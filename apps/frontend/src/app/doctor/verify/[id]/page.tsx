'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
    'medicine', 'neurology', 'surgery', 'gastroenterology', 'pediatrics',
    'cardiology', 'ent', 'orthopedics', 'endocrinology', 'nephrology',
    'psychiatry', 'dermatology', 'pulmonology', 'ophthalmology',
    'hematology', 'urology', 'gynecology', 'rheumatology'
];

export default function VerificationInterface({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    const [selections, setSelections] = useState<Record<string, boolean>>({});
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, boolean>>({});
    const [progress, setProgress] = useState({ completed: 0, total: 0 });

    const selectionsRef = useRef<Record<string, boolean>>({});
    const lastSavedRef = useRef<string>('');
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const response = await api.get(`/crowd/records/${id}`);
                const data = response.data as any;
                setRecord(data.record);

                const initialSelections: Record<string, boolean> = {};
                const suggestions: Record<string, boolean> = {};
                DEPARTMENTS.forEach(dep => {
                    suggestions[dep] = data.record[dep] === 1;
                });
                setAiSuggestions(suggestions);

                if (data.verification && (data.verification.draft || Object.keys(data.verification.verified_departments || {}).length > 0)) {
                    const state = data.verification.draft || data.verification.verified_departments || suggestions;
                    DEPARTMENTS.forEach(dep => { initialSelections[dep] = !!state[dep]; });
                } else {
                    DEPARTMENTS.forEach(dep => { initialSelections[dep] = suggestions[dep]; });
                }

                setSelections(initialSelections);
                lastSavedRef.current = JSON.stringify(initialSelections);
            } catch (error) {
                toast.error('Failed to load record');
                router.push('/doctor/dashboard');
            } finally {
                setLoading(false);
            }
        };

        const fetchProgress = async () => {
            try {
                const { data } = await api.get('/crowd/progress') as { data: any };
                setProgress({ completed: Number(data.verifiedCount) || 0, total: Number(data.totalRecords) || 0 });
            } catch (e) { }
        };

        fetchRecord();
        fetchProgress();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, router]);

    useEffect(() => { selectionsRef.current = selections; }, [selections]);

    useEffect(() => {
        if (loading) return;
        timerRef.current = setInterval(async () => {
            const payload = JSON.stringify(selectionsRef.current);
            if (payload === lastSavedRef.current) return;
            setSavingDraft(true);
            try {
                await api.put(`/crowd/draft/${id}`, { draft: selectionsRef.current });
                lastSavedRef.current = payload;
            } catch (e) { }
            setTimeout(() => setSavingDraft(false), 1500);
        }, 30000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [loading, id]);

    const handleCheckbox = (dep: string) => {
        setSelections(prev => ({ ...prev, [dep]: !prev[dep] }));
    };

    const handleSubmit = async () => {
        const selectedCount = Object.values(selections).filter(Boolean).length;
        if (timerRef.current) clearInterval(timerRef.current);
        setSubmitting(true);
        try {
            await api.post('/crowd/verify', {
                record_id: id,
                verified_departments: selections,
                is_unable_to_assess: selectedCount === 0,
            });
            toast.success('Submitted', { duration: 1500 });
            const queueRes = await api.get('/crowd/next');
            const queueData = queueRes.data as any;
            if (queueData.record) {
                router.replace(`/doctor/verify/${queueData.record.id}`);
            } else {
                router.push('/doctor/dashboard');
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

    const mappedCount = Object.values(selections).filter(Boolean).length;

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
                <div className="flex items-center gap-2">
                    {savingDraft && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                            Saving...
                        </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {progress.completed}/{progress.total}
                    </span>
                </div>
            </header>

            {/* Symptom Card */}
            <div className="px-4 pt-3">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Input</span>
                    </div>
                    <p
                        className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium"
                        style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                    >
                        {record?.symptom_text}
                    </p>
                    {record?.departments && (
                        <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800">
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">AI: </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.departments}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Grid */}
            <div className="flex-1 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Departments</h3>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                        {mappedCount} selected
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {DEPARTMENTS.map((dep) => {
                        const isSelected = selections[dep];
                        const isAi = aiSuggestions[dep];
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
                                    "w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all",
                                    isSelected ? "bg-white border-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                )}>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs font-bold capitalize truncate block">{dep}</span>
                                    {isAi && (
                                        <span className={cn(
                                            "text-[8px] font-black uppercase",
                                            isSelected ? "text-white/60" : "text-amber-600 dark:text-amber-400"
                                        )}>AI</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Submit Bar */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                >
                    {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>Submit Verification</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
