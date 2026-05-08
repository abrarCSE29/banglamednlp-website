import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Bangla Medical Triage Verification',
  description: 'Physician verification system for AI-generated medical triage.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${poppins.variable} antialiased min-h-screen bg-slate-50/50 uppercase-headings`}>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
