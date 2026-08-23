'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CrowdWorkerEnterPage() {
  const [email, setEmail] = useState('');
  const [bmdcRegNumber, setBmdcRegNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/crowd/enter', {
        email,
        bmdc_reg_number: bmdcRegNumber || undefined,
      });
      const { accessToken, worker } = response.data as {
        accessToken: string;
        worker: { id: string; email: string; role: string };
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('worker', JSON.stringify(worker));

      toast.success('Login successful', { duration: 2000 });
      router.push('/doctor/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
      toast.error('Verification Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-900 dark:bg-slate-800 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />

            <div className="inline-flex w-20 h-20 bg-indigo-500/10 rounded-3xl items-center justify-center mb-6 border border-white/10 shadow-inner">
              <HeartPulse className="w-10 h-10 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-poppins">
              Bangla Medical <span className="text-indigo-400">Triage</span> Verification
            </h1>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1" htmlFor="bmdc">
                  BMDC Registration Number
                </label>
                <input
                  id="bmdc"
                  type="text"
                  value={bmdcRegNumber}
                  onChange={(e) => setBmdcRegNumber(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="eg. 235532"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs mt-4"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Start Verifying</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
