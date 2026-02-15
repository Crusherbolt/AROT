import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isCinematic = ['/crude-oil', '/cru', '/cot-reports'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className={isCinematic ? "flex-1 w-full" : "container py-6 flex-1"}>
        {children}
      </main>
      {!isCinematic && <Footer />}
    </div>
  );
}
