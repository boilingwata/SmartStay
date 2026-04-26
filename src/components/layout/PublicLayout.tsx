import { Outlet } from 'react-router-dom';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicTopbar } from '@/components/public/PublicTopbar';

interface PublicLayoutProps {
  showHeader?: boolean;
}

export const PublicLayout = ({ showHeader = true }: PublicLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
    {showHeader ? <PublicTopbar /> : null}
    <main className="flex-1 animate-in fade-in duration-700">
      <Outlet />
    </main>
    {showHeader ? <PublicFooter /> : null}
  </div>
);

export default PublicLayout;
