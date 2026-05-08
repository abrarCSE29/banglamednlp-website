'use client';

import { DownloadCloud } from 'lucide-react';

export default function ExportPage() {
    const handleExport = () => {
        // Relying on native browser download via window.location because it's a file stream
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/dataset/export`;
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Export Dataset</h1>
                <p className="text-muted-foreground mt-1">Download the fully verified gold-standard corpus.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-sm border border-slate-200">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                    <DownloadCloud className="w-10 h-10 text-indigo-600" />
                </div>

                <div className="text-center max-w-md space-y-2">
                    <h2 className="text-xl font-semibold">Download Verified Annotations</h2>
                    <p className="text-sm text-muted-foreground">
                        This will generate a CSV containing the original symptom text, AI-assigned labels, and the final physician-verified binary classifications.
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                >
                    Generate & Download CSV
                </button>
            </div>
        </div>
    );
}
