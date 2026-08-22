'use client';

import { Bell, Search, User, ChevronDown, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const [user, setUser] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                const data = res.data as { user: any };
                setUser(data.user);
            } catch (e) { }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('accessToken');
            window.location.href = '/';
        } catch (e) {
            window.location.href = '/';
        }
    };

    return (
        <header className="h-14 md:h-[75px] bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center px-4 md:px-8 justify-between shadow-sm">
            {/* Left section: Hamburger on mobile + Search on desktop */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative group hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search system..."
                        className="bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white px-10 py-2 rounded-xl text-sm outline-none transition-all w-[300px]"
                    />
                </div>
            </div>

            {/* Right section: Notifications & Profile */}
            <div className="flex items-center gap-2">
                <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>

                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-2xl transition-all group"
                    >
                        <div className="text-right hidden sm:block">
                            <div className="text-[13px] font-bold text-slate-900 leading-tight font-poppins">{user?.name || user?.email?.split('@')[0] || 'Physician'}</div>
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{user?.role || 'User'}</div>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 group-hover:scale-105 transition-transform">
                            {(user?.name?.[0] || user?.email?.[0] || 'P').toUpperCase()}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", showDropdown && "rotate-180")} />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.08)] border border-slate-100 py-3 animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="px-5 py-3 border-b border-slate-50 mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</p>
                                <p className="text-xs font-bold text-slate-700 truncate font-poppins">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-bold transition-colors flex items-center gap-3"
                            >
                                <User className="w-4 h-4" />
                                Logout Session
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
