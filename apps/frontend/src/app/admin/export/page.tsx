'use client';

import { useState } from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ExportPage() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/admin/dataset/export', {
                responseType: 'blob'
            });

            // Create a local URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'verified_triage_dataset.csv');
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export Complete', {
                description: 'Your dataset is now downloading.'
            });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export Failed', {
                description: 'Could not generate the CSV. Please ensure you have data available.'
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 w-full max-w-4xl">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Export Corpus</h1>
                <p className="text-slate-500 mt-1">Download the fully verified gold-standard medical dataset.</p>
            </div>

            <div className="bg-white p-6 md:p-12 rounded-3xl flex flex-col items-center justify-center space-y-8 shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-50 rounded-3xl flex items-center justify-center border border-indigo-100 shadow-inner">
                    <DownloadCloud className="w-8 h-8 md:w-12 md:h-12 text-indigo-600" />
                </div>

                <div className="max-w-md space-y-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verified Annotations</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Generate a comprehensive CSV containing original Bangla symptoms, AI labels, and physician validations. This dataset is optimized for further NLP training.
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs w-full sm:w-auto"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
                    {isExporting ? 'Preparing File...' : 'Download CSV Archive'}
                </button>
            </div>
        </div>
    );
}
