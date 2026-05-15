import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontAdmin = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const fontAdminDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-admin-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        fontAdmin.variable,
        fontAdminDisplay.variable,
        'min-h-screen font-admin text-[15px] leading-relaxed antialiased [font-feature-settings:"liga_1","kern_1"]',
      )}
    >
      {children}
    </div>
  );
}
