import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SessionExpiryBanner } from '@/components/common/SessionExpiryBanner';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SessionExpiryBanner />
      <Navbar />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
