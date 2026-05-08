'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, FileWarning, PlayCircle } from 'lucide-react';
import api from '@/lib/api';

export default function DatasetUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [result, setResult] = useState<{ message?: string; rowsImported?: number; error?: string } | null>(null);

    const [uploads, setUploads] = useState<any[]>([]);
    const [previewRecords, setPreviewRecords] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/admin/dataset/uploads');
            setUploads(Array.isArray(data) ? data : []);
            const { data: preview } = await api.get('/admin/dataset/preview');
            setPreviewRecords(Array.isArray(preview) ? preview : []);
        } catch (e) { }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        setIsUploading(true);
        setResult(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Simulate progress for UI realism (axios upload progress doesn't track server-side processing)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
            }, 500);

            const response = await api.post('/admin/dataset/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            clearInterval(progressInterval);
            setUploadProgress(100);
            const data = response.data as any;
            setResult({ message: data.message, rowsImported: data.rowsImported });
            fetchHistory(); // Refresh the dataset history tables
        } catch (error: any) {
            setUploadProgress(0);
            setResult({ error: error.response?.data?.message || 'Failed to upload dataset.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dataset Upload</h1>
                <p className="text-muted-foreground mt-1">Import a CSV containing AI-labeled triage records.</p>
            </div>

            <div
                className={`glass-panel border-2 border-dashed p-12 rounded-2xl flex flex-col items-center justify-center transition-all ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-white/[0.02]'
                    }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <UploadCloud className={`w-16 h-16 mb-4 ${file ? 'text-primary' : 'text-muted-foreground'}`} />

                {file ? (
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                            onClick={() => setFile(null)}
                            className="text-xs text-destructive hover:underline mt-2"
                        >
                            Remove file
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">Drag & Drop your CSV here</h3>
                        <p className="text-sm text-muted-foreground">or click below to browse your files</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-lg font-medium text-sm transition-colors border border-white/5"
                        >
                            Select File
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
            </div>

            {file && !result && (
                <div className="flex justify-end">
                    <button
                        onClick={uploadFile}
                        disabled={isUploading}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing... {uploadProgress}%
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-5 h-5" /> Start Import
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Result Card */}
            {result && (
                <div className={`p-6 rounded-xl border ${result.error ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                    <div className="flex items-start gap-4">
                        {result.error ? <FileWarning className="w-6 h-6 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 mt-0.5" />}
                        <div>
                            <h4 className="font-semibold text-lg">{result.error ? 'Upload Failed' : 'Upload Successful'}</h4>
                            <p className="mt-1 opacity-90">{result.error || result.message}</p>
                            {result.rowsImported !== undefined && (
                                <p className="mt-2 font-medium">✨ Imported {result.rowsImported} records</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Dataset History Panel */}
            {uploads.length > 0 && (
                <div className="pt-8 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Upload History</h2>
                    <div className="glass-panel overflow-hidden rounded-xl border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/[0.02] uppercase text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium border-b border-light">Filename</th>
                                    <th className="px-6 py-4 font-medium border-b border-light">Rows</th>
                                    <th className="px-6 py-4 font-medium border-b border-light">Uploaded By</th>
                                    <th className="px-6 py-4 font-medium border-b border-light">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map(u => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-foreground">{u.filename}</td>
                                        <td className="px-6 py-4 text-primary font-medium">{u.record_count}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{u.admin.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(u.upload_timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Database Preview */}
            {previewRecords.length > 0 && (
                <div className="pt-8 space-y-4 pb-12">
                    <h2 className="text-xl font-bold tracking-tight">Database Preview</h2>
                    <p className="text-sm text-muted-foreground">Showing the first 10 imported triage records in the system.</p>
                    <div className="glass-panel overflow-hidden rounded-xl border border-white/5">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-white/[0.02] uppercase text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-light">ID</th>
                                        <th className="px-6 py-4 border-b border-light max-w-[200px]">Symptom Text</th>
                                        <th className="px-6 py-4 border-b border-light">Departments Strings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRecords.map((r: any) => (
                                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 text-primary font-medium">{r.id}</td>
                                            <td className="px-6 py-4 text-foreground truncate max-w-[400px] hover:whitespace-normal" title={r.symptom_text}>
                                                {r.symptom_text}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{r.departments}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-8 border-t border-white/5 space-y-4">
                <h4 className="font-medium text-muted-foreground flex items-center gap-2">
                    Required CSV Schema
                </h4>
                <div className="bg-black/40 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-white/5 text-muted-foreground">
                    id, symptom_text, departments, num_labels, medicine, neurology, surgery, gastroenterology, pediatrics, cardiology, ent, orthopedics, endocrinology, nephrology, psychiatry, dermatology, pulmonology, ophthalmology, hematology, urology, gynecology, rheumatology
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Column headers must match exactly. Department columns must contain binary flags (0 or 1).
                </p>
            </div>
        </div>
    );
}
