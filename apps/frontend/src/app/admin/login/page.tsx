'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, role, name } = response.data as {
        accessToken: string;
        role: string;
        name: string;
      };

      if (role !== 'ADMIN') {
        toast.error('Access Denied', { description: 'Only administrators can access this page.' });
        return;
      }

      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      toast.success('Login successful', { duration: 2000 });
      router.push('/admin/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials.';
      toast.error('Login Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-900 dark:bg-slate-800 p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />

            <div className="inline-flex w-16 h-16 bg-rose-500/10 rounded-3xl items-center justify-center mb-5 border border-white/10 shadow-inner">
              <Shield className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-poppins">
              Admin Access
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
              Bangla Medical Triage
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-rose-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-rose-50 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-rose-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-rose-50 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white dark:text-slate-900 font-bold rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Admin access only. Contact your administrator if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
