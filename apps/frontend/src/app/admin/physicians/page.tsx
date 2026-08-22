"use client";

import { useState, useEffect } from 'react';
import { UserPlus, Mail, ShieldAlert, ShieldCheck, Loader2, X, ListPlus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PhysiciansPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', email: '', specialty: '', institution: '' });
    const [assignCount, setAssignCount] = useState(50);

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get('/admin/doctors');
            if (Array.isArray(data)) {
                setDoctors(data as any[]);
            } else {
                setDoctors([]);
            }
        } catch (e) {
            console.error('Failed to fetch doctors');
            setDoctors([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchDoctors(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/admin/doctors', formData);
            toast.success('Physician created successfully', {
                description: `${formData.name} can now access the portal.`
            });
            setIsModalOpen(false);
            setFormData({ name: '', email: '', specialty: '', institution: '' });
            fetchDoctors();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Error creating doctor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate this account?')) return;
        try {
            await api.put(`/admin/doctors/${id}/deactivate`);
            toast.success('Account deactivated');
            fetchDoctors();
        } catch (e) {
            toast.error('Error deactivating');
        }
    };

    const handleReactivate = async (id: number) => {
        if (!confirm('Are you sure you want to reactivate this account?')) return;
        try {
            await api.put(`/admin/doctors/${id}/reactivate`);
            toast.success('Account reactivated');
            fetchDoctors();
        } catch (e) {
            toast.error('Error reactivating');
        }
    };

    const handleResend = async (id: number) => {
        if (!confirm('This will generate a new password and email it to the doctor. Continue?')) return;
        try {
            await api.post(`/admin/doctors/${id}/resend-email`);
            toast.success('Email resent successfully', {
                description: 'A new password has been generated.'
            });
        } catch (e) {
            toast.error('Error resending email');
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) return;
        setIsSubmitting(true);
        try {
            const { data } = await api.post(`/admin/doctors/${selectedDoctor.id}/assign`, { count: assignCount }) as { data: any };
            toast.success('Records assigned', {
                description: data.message
            });
            setIsAssignModalOpen(false);
            fetchDoctors();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Error assigning records');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Physician Panel</h1>
                    <p className="text-muted-foreground mt-1">Manage annotators and access credentials.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                    <UserPlus className="w-4 h-4" /> Add Doctor
                </button>
            </div>

            {/* Desktop Table - md+ */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 uppercase text-xs text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Name / Email</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Specialty</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 text-center">Assigned</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 text-center">Verified</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map(doctor => (
                            <tr key={doctor.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-foreground">{doctor.name}</div>
                                    <div className="text-xs text-muted-foreground">{doctor.email}</div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {doctor.specialty}<br />
                                    <span className="text-xs opacity-70">{doctor.institution}</span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-700">{doctor._count.assigned_records}</td>
                                <td className="px-6 py-4 text-center font-bold text-indigo-600">{doctor._count.verifications}</td>
                                <td className="px-6 py-4 text-right space-x-1">
                                    <button
                                        onClick={() => { setSelectedDoctor(doctor); setIsAssignModalOpen(true); }}
                                        className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Assign Records"
                                    >
                                        <ListPlus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleResend(doctor.id)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Resend Credentials"
                                    >
                                        <Mail className="w-4 h-4" />
                                    </button>
                                    {doctor.is_active ? (
                                        <button
                                            onClick={() => handleDeactivate(doctor.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Deactivate Account"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(doctor.id)}
                                            className="p-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Reactivate Account"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {doctors.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No doctors found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards - below md */}
            <div className="md:hidden space-y-3">
                {doctors.map(doctor => (
                    <div key={doctor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="font-medium text-foreground truncate">{doctor.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{doctor.email}</div>
                            </div>
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${doctor.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {doctor.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <span>{doctor.specialty}</span>
                            {doctor.institution && <span className="text-xs opacity-70"> · {doctor.institution}</span>}
                        </div>
                        <div className="flex gap-4 text-xs">
                            <span className="text-slate-600">Assigned: <strong>{doctor._count.assigned_records}</strong></span>
                            <span className="text-indigo-600">Verified: <strong>{doctor._count.verifications}</strong></span>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => { setSelectedDoctor(doctor); setIsAssignModalOpen(true); }}
                                className="flex-1 py-2 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                                Assign
                            </button>
                            <button
                                onClick={() => handleResend(doctor.id)}
                                className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                                Resend
                            </button>
                            {doctor.is_active ? (
                                <button
                                    onClick={() => handleDeactivate(doctor.id)}
                                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                >
                                    Disable
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleReactivate(doctor.id)}
                                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                    Enable
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {doctors.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-muted-foreground">No doctors found.</div>
                )}
            </div>

            {/* Create Physician Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Add New Physician</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Full Name</label>
                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Email Address</label>
                                <input required type="email" className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-primary outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Specialty</label>
                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-primary outline-none" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Institution</label>
                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-primary outline-none" value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} />
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Records Modal */}
            {isAssignModalOpen && selectedDoctor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAssignModalOpen(false)}>
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-slate-900">Assign Records</h2>
                                <p className="text-sm text-slate-500">Distributing random unassigned records to Dr. {selectedDoctor.name.split(' ')[0]}</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Number of Records</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[25, 50, 100, 200].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAssignCount(val)}
                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${assignCount === val ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="500"
                                    className="w-full mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                    value={isNaN(assignCount) ? '' : assignCount}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        setAssignCount(isNaN(val) ? 0 : val);
                                    }}
                                />
                            </div>

                            <p className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-lg leading-relaxed">
                                ⚠️ System will fetch records that have 0 current assignments and distribute them randomly. Already verified records are excluded.
                            </p>

                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
