import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'بوابة أهالي دار شمس التعافي',
  description: 'بوابة متابعة المقيمين لأهاليهم — دار شمس التعافي',
};

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', direction: 'rtl' }}>
      {children}
    </div>
  );
}
