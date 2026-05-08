'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Loader2 } from 'lucide-react';
import api, { setAuthToken } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMatch, setErrorMatch] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMatch('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, role } = response.data as { accessToken: string; role: string };

      setAuthToken(accessToken);

      // Store minimal user info
      localStorage.setItem('role', role);

      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/doctor/dashboard');
      }
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        setErrorMatch(error.response.data.message);
      } else {
        setErrorMatch('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[150px] rounded-full" />

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl z-10 mx-4 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
            <HeartPulse className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bangla Medical Triage</h1>
          <p className="text-sm text-muted-foreground mt-2">Physician Verification System v1.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {errorMatch && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium text-center">{errorMatch}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-secondary/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="doctor@research.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-secondary/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>CONFIDENTIAL — INTERNAL USE ONLY</p>
        </div>
      </div>
    </div>
  );
}
