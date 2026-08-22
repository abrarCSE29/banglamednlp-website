'use client';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-slate-50">
            {children}
        </div>
    );
}
