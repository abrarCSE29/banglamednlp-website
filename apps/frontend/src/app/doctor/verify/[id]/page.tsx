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
        <div className="w-full space-y-8">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Queue
                </button>
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    {savingDraft && <span className="text-emerald-500 animate-pulse flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Synchronizing Draft...</span>}
                    <span className="uppercase tracking-widest text-indigo-600">Verification Progress: <span className="text-slate-900">{progress.completed} / {progress.total}</span></span>
                    <span className="uppercase tracking-widest border-l border-slate-200 pl-4">Protocol ID: <span className="text-slate-900">#TR-{record?.id}</span></span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Column 1: Patient Symptom Details */}
                <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-[100px]">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-poppins">Clinical Input</h2>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-h-[400px] overflow-y-auto shadow-inner">
                            <p className="text-lg leading-relaxed text-slate-900 font-medium" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                                {record?.symptom_text}
                            </p>
                        </div>

                        <div className="mt-8 p-6 rounded-2xl border border-amber-200 bg-amber-50/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertTriangle className="w-12 h-12 text-amber-500" />
                            </div>
                            <h3 className="text-[10px] font-bold text-amber-600 flex items-center gap-2 mb-3 uppercase tracking-[0.2em] font-poppins">
                                AI Classification
                            </h3>
                            <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">{record?.departments}</p>
                        </div>
                    </div>
                </div>

                {/* Column 2: Department Selection */}
                <div className="xl:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-slate-900 tracking-tight font-poppins">Departmental Matrix</h3>
                            <div className="text-[10px] font-bold text-indigo-600 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 uppercase tracking-widest shadow-sm">
                                {Object.values(selections).filter(Boolean).length} Mapped
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-500 ${unableToAssess ? 'opacity-20 grayscale pointer-events-none scale-95' : ''}`}>
                            {DEPARTMENTS.map((dep) => {
                                const isSelected = selections[dep];
                                const isAiSuggested = aiSuggestions[dep];

                                return (
                                    <button
                                        key={dep}
                                        onClick={() => handleCheckbox(dep)}
                                        className={cn(
                                            "group relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                            isSelected
                                                ? "bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-100"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-slate-50/50",
                                            isAiSuggested && !isSelected && "border-dashed border-amber-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0",
                                            isSelected ? "bg-white border-white" : "bg-slate-50 border-slate-200"
                                        )}>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "text-[12px] font-bold capitalize truncate tracking-tight leading-none",
                                                isSelected ? "text-white" : "text-slate-900"
                                            )}>{dep}</span>
                                            {isAiSuggested && (
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-tighter mt-0.5",
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
                <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-[100px]">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                        <h3 className="font-black text-xl text-slate-900 tracking-tight">Certification</h3>

                        <div className="space-y-6">
                            <label className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all group ${unableToAssess ? 'bg-rose-600 border-transparent text-white shadow-xl shadow-rose-200' : 'bg-slate-50 border-slate-200 hover:border-rose-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 accent-rose-500 rounded-lg outline-none hidden"
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
                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                    unableToAssess ? "bg-white border-white scale-110" : "bg-white border-slate-300 group-hover:border-rose-400"
                                )}>
                                    {unableToAssess && <X className="w-4 h-4 text-rose-600" />}
                                </div>
                                <div>
                                    <span className={cn("font-bold text-xs uppercase tracking-widest block", unableToAssess ? "text-white" : "text-slate-900")}>Unable to Assess</span>
                                    {!unableToAssess && <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Incomplete or incomprehensible input.</p>}
                                </div>
                            </label>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Case Notes</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full h-40 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none text-sm placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter clinical observations or reasoning..."
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || countdown > 0}
                                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white p-6 rounded-2xl font-black flex flex-col items-center justify-center gap-1 shadow-24 transition-all hover:translate-y-[-4px] active:translate-y-[0px] active:scale-95"
                            >
                                {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg uppercase tracking-tighter font-poppins font-bold">
                                                {countdown > 0 ? `Reviewing... (${countdown}s)` : 'Commit Record'}
                                            </span>
                                            {countdown <= 0 && <ArrowRight className="w-5 h-5" />}
                                        </div>
                                        <span className="text-[9px] opacity-50 font-medium uppercase tracking-[0.2em] mt-1 text-center">Submit & Load Next</span>
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
