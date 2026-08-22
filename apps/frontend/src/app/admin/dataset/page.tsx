'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle2, FileWarning, PlayCircle, Trash2, X, Eye, Database, Info } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DatasetUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [result, setResult] = useState<{ message?: string; rowsImported?: number; error?: string } | null>(null);

    const [uploads, setUploads] = useState<any[]>([]);
    const [previewRecords, setPreviewRecords] = useState<any[]>([]);
    const [selectedUpload, setSelectedUpload] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/admin/dataset/uploads');
            setUploads(Array.isArray(data) ? data : []);
        } catch (e) { }
    };

    const fetchPreview = async (upload: any) => {
        try {
            const { data } = await api.get(`/admin/dataset/uploads/${upload.id}/preview`);
            setPreviewRecords(data as any[]);
            setSelectedUpload(upload);
        } catch (e) {
            toast.error('Failed to fetch preview');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/admin/login');
        }
    }, [router]);

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
            toast.success(data.message || 'Dataset uploaded successfully', {
                description: `Imported ${data.rowsImported || 0} records.`,
            });
            fetchHistory(); // Refresh the dataset history tables
            setFile(null);
        } catch (error: any) {
            setUploadProgress(0);
            toast.error(error.response?.data?.message || 'Failed to upload dataset.');
        } finally {
            setIsUploading(false);
        }
    };

    const deleteDataset = async (id: number) => {
        if (!window.confirm('Are you sure? This will PERMANENTLY delete this data source and ALL associated patient records and validations.')) return;

        try {
            await api.delete(`/admin/dataset/uploads/${id}`);
            toast.success('Data source deleted successfully');
            fetchHistory();
        } catch (error) {
            toast.error('Failed to delete dataset.');
        }
    };

    const resetDatabase = async () => {
        if (!window.confirm('🚨 DANGER: This will permanently DELETE ALL triage records, all crowd validations, and ALL history. This cannot be undone. Are you absolutely sure?')) return;

        try {
            await api.post('/admin/dataset/reset');
            fetchHistory();
            toast.success('System reset successfully', {
                description: 'All records and validations cleared.',
            });
        } catch (error) {
            toast.error('Failed to reset database.');
        }
    };


    return (
        <div className="space-y-8 w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Dataset Management</h1>
                    <p className="text-slate-500 mt-1">Control your training data sources and system state.</p>
                </div>
                <button
                    onClick={resetDatabase}
                    className="px-5 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-sm"
                >
                    Nuke All Records
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left & Middle Column (2/3): Dataset Information & History */}
                <div className="lg:col-span-2 space-y-8 text-left">
                    {/* Info Section */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-500" />
                            Data Source Statistics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Total Sources</div>
                                <div className="text-2xl font-black text-indigo-900 mt-1">{uploads.length}</div>
                            </div>
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Total Records</div>
                                <div className="text-2xl font-black text-emerald-900 mt-1">
                                    {uploads.reduce((acc, curr) => acc + curr.record_count, 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Ready Status</div>
                                <div className="text-2xl font-black text-indigo-900 mt-1">Production</div>
                            </div>
                        </div>
                    </div>

                    {/* Upload History Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Registered Datasets</h2>
                            <Database className="w-5 h-5 text-slate-400" />
                        </div>

                        {uploads.length > 0 ? (
                            <>
                                {/* Mobile card layout */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {uploads.map(u => (
                                        <div key={u.id} className="p-4 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{u.filename}</div>
                                                    <div className="text-[10px] text-slate-400">By {u.admin.name}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => fetchPreview(u)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="View Records"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDataset(u.id)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Source"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span><span className="font-bold text-slate-700">{u.record_count.toLocaleString()}</span> records</span>
                                                <span>{new Date(u.upload_timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop table layout */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-widest text-slate-500">
                                            <tr>
                                                <th className="px-6 py-4">Filename</th>
                                                <th className="px-6 py-4">Total Rows</th>
                                                <th className="px-6 py-4">Import Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {uploads.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-900">{u.filename}</div>
                                                        <div className="text-[10px] text-slate-400">By {u.admin.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-slate-700">{u.record_count.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 text-xs text-left">
                                                        {new Date(u.upload_timestamp).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => fetchPreview(u)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View Records"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteDataset(u.id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete Source"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="p-12 text-center text-slate-400 italic">No data sources detected in the system.</div>
                        )}
                    </div>
                </div>

                {/* Right Column (1/3): Upload Section */}
                <div className="space-y-6">
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-900">Import New Data</h2>
                        <p className="text-sm text-slate-500 mt-1">Add fresh symptoms to the triage pool.</p>
                    </div>

                    <div
                        className={`bg-white border-2 border-dashed p-8 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm
                                ${file ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
                            `}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => !file && fileInputRef.current?.click()}
                    >
                        <UploadCloud className={`w-12 h-12 mb-4 transition-transform duration-300 ${file ? 'text-indigo-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />

                        {file ? (
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-slate-900 truncate max-w-[200px]">{file.name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{(file.size / (1024 * 1024)).toFixed(2)} MB • READY</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="text-[10px] font-bold text-rose-500 hover:underline"
                                >
                                    Change File
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-1">
                                <h3 className="font-bold text-slate-700">Drop CSV here</h3>
                                <p className="text-xs text-slate-400">or click to browse local storage</p>
                            </div>
                        )}
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    </div>

                    {file && (
                        <button
                            onClick={uploadFile}
                            disabled={isUploading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Importing... {uploadProgress}%</span>
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-5 h-5" />
                                    <span>Start Ingestion</span>
                                </>
                            )}
                        </button>
                    )}



                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-6 shadow-sm">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-indigo-900">
                            <Database className="w-4 h-4 text-indigo-500" />
                            Schema Requirements
                        </h4>
                        <div className="bg-white rounded-lg p-3 font-mono text-[10px] break-all text-indigo-600 leading-relaxed mb-4 border border-indigo-200">
                            id, symptom_text, departments, num_labels, [18 binary flags]
                        </div>
                        <p className="text-[10px] text-indigo-500 leading-relaxed">
                            Ensure headers match exactly and patient symptom text is in Bangla for optimal crowd worker verification.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Preview Pop-up */}
            {selectedUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedUpload(null)} />
                    <div className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedUpload.filename}</h3>
                                <p className="text-sm text-slate-500">Showing up to 50 records from this data source</p>
                            </div>
                            <button
                                onClick={() => setSelectedUpload(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 md:p-8">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 sticky top-0 uppercase text-[10px] font-bold tracking-widest text-slate-500 z-10">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-200">ID</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Bangla Symptom Text</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Ground Truth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previewRecords.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4 text-indigo-600 font-bold">#{r.id}</td>
                                            <td className="px-6 py-4 text-slate-700 leading-relaxed font-bangla" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                                                {r.symptom_text}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {r.departments.split(',').map((d: string) => (
                                                        <span key={d} className="bg-indigo-50 text-[10px] font-bold text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                                            {d.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 md:px-8 md:py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedUpload(null)}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
