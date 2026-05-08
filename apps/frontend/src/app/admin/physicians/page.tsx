'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PhysiciansPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', specialty: '', institution: '' });

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
            setIsModalOpen(false);
            setFormData({ name: '', email: '', specialty: '', institution: '' });
            fetchDoctors();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Error creating doctor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate this account?')) return;
        try {
            await api.put(`/admin/doctors/${id}/deactivate`);
            fetchDoctors();
        } catch (e) {
            alert('Error deactivating');
        }
    };

    const handleResend = async (id: number) => {
        if (!confirm('This will generate a new password and email it to the doctor. Continue?')) return;
        try {
            await api.post(`/admin/doctors/${id}/resend-email`);
            alert('Email resent successfully.');
        } catch (e) {
            alert('Error resending email');
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Physician Panel</h1>
                    <p className="text-muted-foreground mt-1">Manage annotators and access credentials.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" /> Add Doctor
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 uppercase text-xs text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Name / Email</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Specialty</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Status</th>
                            <th className="px-6 py-4 font-medium border-b border-slate-100">Records</th>
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
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${doctor.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                                        }`}>
                                        {doctor.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-primary">{doctor._count.verifications}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleResend(doctor.id)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Resend Credentials"
                                    >
                                        <Mail className="w-4 h-4" />
                                    </button>
                                    {doctor.is_active && (
                                        <button
                                            onClick={() => handleDeactivate(doctor.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Deactivate Account"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Physician</h2>
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
        </div>
    );
}
