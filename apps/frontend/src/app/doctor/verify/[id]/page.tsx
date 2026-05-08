'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowRight, AlertTriangle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

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
                console.error(error);
                alert('Failed to load record.');
                router.push('/doctor/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchRecord();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, router]);

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
            alert('You must select at least one department, or check "Unable to assess".');
            return;
        }

        setSubmitting(true);
        try {
            // Upsert logic handled by backend if we wanted to simplify. Let's just blindly push 
            // POST handles both thanks to how we set up the route (actually POST creates, PUT updates).
            // Let's assume the router automatically handles upsert logic, wait, POST returns 409 if exists.
            // So let's check if it exists or simply use POST first.
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

            // Automatically fetch next from queue
            const queueRes = await api.get('/doctor/queue');
            const queueData = queueRes.data as any;
            if (queueData.record) {
                router.replace(`/doctor/verify/${queueData.record.id}`);
            } else {
                router.push('/doctor/dashboard');
            }

        } catch (error) {
            alert('Failed to submit verification');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="w-full mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                    {savingDraft && <span className="text-emerald-500 animate-pulse flex items-center gap-1"><Save className="w-3 h-3" /> Auto-saving...</span>}
                    <span>Record ID: {record?.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Column 1: Patient Symptom Details (xl:col-span-3) */}
                <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-6 bg-primary rounded-full" />
                            <h2 className="text-xl font-semibold">Symptom</h2>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
                            <p className="text-lg leading-relaxed text-foreground" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                                {record?.symptom_text}
                            </p>
                        </div>

                        <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <h3 className="text-xs font-bold text-amber-600 flex items-center gap-2 mb-2 uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5" /> AI Suggestion
                            </h3>
                            <p className="font-bold text-slate-900 text-sm">{record?.departments}</p>
                        </div>
                    </div>
                </div>

                {/* Column 2: Department Selection (xl:col-span-6) */}
                <div className="xl:col-span-6 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl tracking-tight">Select Departments</h3>
                            <div className="text-[10px] font-bold text-slate-500 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 uppercase tracking-wider">
                                {Object.values(selections).filter(Boolean).length} Selected
                            </div>
                        </div>

                        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 transition-opacity duration-300 ${unableToAssess ? 'opacity-30 pointer-events-none' : ''}`}>
                            {DEPARTMENTS.map((dep) => {
                                const isSelected = selections[dep];
                                const isAiSuggested = aiSuggestions[dep];

                                return (
                                    <button
                                        key={dep}
                                        onClick={() => handleCheckbox(dep)}
                                        className={`group relative flex flex-col items-start p-4 rounded-xl border transition-all text-left h-24
                                            ${isSelected
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-[0_4px_12px_rgba(79,70,229,0.08)] scale-[1.02]'
                                                : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                            }
                                            ${isAiSuggested && !isSelected ? 'border-dashed border-amber-500/50' : ''}
                                        `}
                                    >
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-slate-400'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                            </div>
                                            {isAiSuggested && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">AI</span>}
                                        </div>
                                        <span className="text-sm font-bold capitalize mt-auto truncate w-full tracking-tight">{dep}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 3: Action Panel (xl:col-span-3) */}
                <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-6">
                        <h3 className="font-bold text-xl tracking-tight">Finalize</h3>

                        <div className="space-y-4">
                            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${unableToAssess ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'}`}>
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-destructive rounded outline-none"
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
                                <div>
                                    <span className={`font-bold block ${unableToAssess ? 'text-destructive' : 'text-foreground'}`}>Unable to Assess</span>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Symptom is incomplete or incomprehensible.</p>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Clinical Note</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none text-sm placeholder:text-slate-400"
                                    placeholder="Add clinical context..."
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white p-5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Submit Record</span>
                                        </div>
                                        <span className="text-[10px] opacity-70 font-normal">Saves and loads next available</span>
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-center mt-4 text-muted-foreground">
                                Your work is auto-saved every 30 seconds.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
