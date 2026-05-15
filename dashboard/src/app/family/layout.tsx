import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'بوابة أهالي دار شمس التعافي',
  description: 'بوابة متابعة المقيمين لأهاليهم — دار شمس التعافي',
};

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="family-portal" style={{ minHeight: '100vh', direction: 'rtl' }}>
      {children}
    </div>
  );
}
