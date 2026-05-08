'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, AlertTriangle, ChevronLeft, CheckCircle2, ArrowRight, X } from 'lucide-react';
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

    // State for form
    const [selections, setSelections] = useState<Record<string, boolean>>({});
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, boolean>>({});
    const [note, setNote] = useState('');
    const [unableToAssess, setUnableToAssess] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });

    // Poll timer ref
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const response = await api.get(`/doctor/records/${id}`);
                const data = response.data as any;
                setRecord(data.record);

                // Setup initial selections based on AI or Draft/Previous Verification
                const initialSelections: Record<string, boolean> = {};
                const suggestions: Record<string, boolean> = {};

                DEPARTMENTS.forEach(dep => {
                    suggestions[dep] = data.record[dep] === 1;
                });
                setAiSuggestions(suggestions);

                if (data.verification) {
                    // Edit mode or Draft mode
                    const state = data.verification.draft || data.verification.verified_departments || suggestions;
                    DEPARTMENTS.forEach(dep => { initialSelections[dep] = !!state[dep]; });
                    setNote(data.verification.clinical_note || '');
                    setUnableToAssess(data.verification.is_unable_to_assess || false);
                } else {
                    // Fresh start, default to AI suggestions
                    DEPARTMENTS.forEach(dep => { initialSelections[dep] = suggestions[dep]; });
                }

                setSelections(initialSelections);
            } catch (error) {
                toast.error('Failed to load record');
                router.push('/doctor/dashboard');
            } finally {
                setLoading(false);
            }
        };

        const fetchProgress = async () => {
            try {
                const { data } = await api.get('/doctor/progress') as { data: any };
                setProgress({ completed: data.verifiedCount, total: data.totalRecords });
            } catch (e) { }
        };

        fetchRecord();
        fetchProgress();
        setCountdown(10);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, router]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [countdown]);


    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (loading) return;

        timerRef.current = setInterval(async () => {
            setSavingDraft(true);
            try {
                await api.put(`/doctor/verifications/${id}/draft`, {
                    draft: selections
                });
            } catch (e) { }
            setTimeout(() => setSavingDraft(false), 1500);
        }, 30000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [selections, loading, id]);

    const handleCheckbox = (dep: string) => {
        if (unableToAssess) return;
        setSelections(prev => ({ ...prev, [dep]: !prev[dep] }));
    };

    const handleSubmit = async () => {
        const selectedCount = Object.values(selections).filter(Boolean).length;
        if (selectedCount === 0 && !unableToAssess) {
            toast.warning('Incomplete Submission', {
                description: 'You must select at least one department, or check "Unable to assess".'
            });
            return;
        }

        setSubmitting(true);
        try {
            try {
                await api.post('/doctor/verifications', {
                    record_id: id,
                    verified_departments: selections,
                    clinical_note: note,
                    is_unable_to_assess: unableToAssess
                });
            } catch (postError: any) {
                if (postError.response?.status === 409) {
                    await api.put(`/doctor/verifications/${id}`, {
                        verified_departments: selections,
                        clinical_note: note,
                        is_unable_to_assess: unableToAssess
                    });
                } else {
                    throw postError;
                }
            }

            toast.success('Verification Submitted', {
                description: 'Data has been synchronized.'
            });

            // Automatically fetch next from queue
            const queueRes = await api.get('/doctor/queue');
            const queueData = queueRes.data as any;
            if (queueData.record) {
                router.replace(`/doctor/verify/${queueData.record.id}`);
            } else {
                router.push('/doctor/dashboard');
            }

        } catch (error) {
            toast.error('Submission Failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="w-full space-y-4 md:space-y-8 pb-32 md:pb-0">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="hidden sm:inline">Back to Queue</span><span className="sm:hidden">Back</span>
                </button>
                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-2 md:gap-4 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-200 shadow-sm">
                    {savingDraft && <span className="text-emerald-500 animate-pulse flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Synchronizing...</span></span>}
                    <span className="uppercase tracking-widest text-indigo-600"><span className="hidden sm:inline">Progress:</span> <span className="text-slate-900">{progress.completed} / {progress.total}</span></span>
                    <span className="uppercase tracking-widest border-l border-slate-200 pl-2 md:pl-4">ID: <span className="text-slate-900">#{record?.id}</span></span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-8 items-start">
                {/* Column 1: Patient Symptom Details */}
                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-[100px]">
                    <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-3 md:mb-6">
                            <div className="w-2 h-4 md:w-2.5 md:h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-base md:text-xl font-bold text-slate-900 tracking-tight font-poppins">Clinical Input</h2>
                        </div>

                        <div className="bg-slate-50 p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 max-h-[120px] md:max-h-[400px] overflow-y-auto shadow-inner">
                            <p className="text-sm md:text-lg leading-relaxed text-slate-900 font-medium" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                                {record?.symptom_text}
                            </p>
                        </div>

                        <div className="mt-4 md:mt-8 p-4 md:p-6 rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50/50 relative overflow-hidden group">
                            <h3 className="text-[9px] font-bold text-amber-600 flex items-center gap-2 mb-1 uppercase tracking-widest font-poppins">
                                AI Classification
                            </h3>
                            <p className="font-bold text-slate-900 text-sm md:text-lg uppercase tracking-tight truncate">{record?.departments}</p>
                        </div>
                    </div>
                </div>

                {/* Column 2: Department Selection */}
                <div className="xl:col-span-5 space-y-4">
                    <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h3 className="font-bold text-base md:text-xl text-slate-900 tracking-tight font-poppins">Matrix</h3>
                            <div className="text-[9px] font-bold text-indigo-600 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 uppercase tracking-widest shadow-sm">
                                {Object.values(selections).filter(Boolean).length} Mapped
                            </div>
                        </div>

                        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 transition-all duration-500 ${unableToAssess ? 'opacity-20 grayscale pointer-events-none scale-95' : ''}`}>
                            {DEPARTMENTS.map((dep) => {
                                const isSelected = selections[dep];
                                const isAiSuggested = aiSuggestions[dep];

                                return (
                                    <button
                                        key={dep}
                                        onClick={() => handleCheckbox(dep)}
                                        className={cn(
                                            "group relative flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl border transition-all text-left",
                                            isSelected
                                                ? "bg-indigo-600 border-transparent text-white shadow-md md:shadow-lg"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-slate-50/50",
                                            isAiSuggested && !isSelected && "border-dashed border-amber-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 md:w-5 md:h-5 rounded flex items-center justify-center border transition-all shrink-0",
                                            isSelected ? "bg-white border-white" : "bg-slate-50 border-slate-200"
                                        )}>
                                            {isSelected && <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-600" />}
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "text-[10px] md:text-[12px] font-bold capitalize truncate tracking-tight leading-none",
                                                isSelected ? "text-white" : "text-slate-900"
                                            )}>{dep}</span>
                                            {isAiSuggested && (
                                                <span className={cn(
                                                    "text-[7px] md:text-[8px] font-black uppercase tracking-tighter mt-0.5",
                                                    isSelected ? "text-white/60" : "text-amber-600"
                                                )}>
                                                    AI Pred
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 3: Action Panel */}
                <div className="xl:col-span-3 space-y-4 xl:sticky xl:top-[100px]">
                    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-4 md:gap-6">
                        <h3 className="font-black text-lg md:text-xl text-slate-900 tracking-tight hidden md:block">Certification</h3>

                        <div className="grid grid-cols-1 gap-4">
                            <label className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border cursor-pointer transition-all group ${unableToAssess ? 'bg-rose-600 border-transparent text-white shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-rose-200'}`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={unableToAssess}
                                    onChange={(e) => {
                                        setUnableToAssess(e.target.checked);
                                        if (e.target.checked) {
                                            const cleared: Record<string, boolean> = {};
                                            DEPARTMENTS.forEach(d => cleared[d] = false);
                                            setSelections(cleared);
                                        }
                                    }}
                                />
                                <div className={cn(
                                    "w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                    unableToAssess ? "bg-white border-white scale-110" : "bg-white border-slate-300 group-hover:border-rose-400"
                                )}>
                                    {unableToAssess && <X className="w-3 md:w-4 h-3 md:h-4 text-rose-600" />}
                                </div>
                                <div className="flex-1">
                                    <span className={cn("font-bold text-[10px] md:text-xs uppercase tracking-widest block", unableToAssess ? "text-white" : "text-slate-900")}>Unable to Assess</span>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 hidden md:block">Case Notes</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full h-20 md:h-40 px-3 md:px-5 py-2 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-xs md:text-sm placeholder:text-slate-300"
                                    placeholder="Add clinical observations..."
                                />
                            </div>
                        </div>

                        {/* Sticky Bottom Bar for Mobile */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:p-0 md:bg-transparent md:border-t-0 z-40">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || countdown > 0}
                                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white p-4 md:p-6 rounded-xl md:rounded-2xl font-black flex flex-col items-center justify-center gap-1 shadow-24 transition-all active:scale-95"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" /> : (
                                    <>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="text-base md:text-lg uppercase tracking-tighter font-poppins font-bold">
                                                {countdown > 0 ? `Review... (${countdown}s)` : 'Commit Verify'}
                                            </span>
                                            {countdown <= 0 && <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
