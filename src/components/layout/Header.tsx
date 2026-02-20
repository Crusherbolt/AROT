import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, BarChart3, Newspaper, Activity, LayoutDashboard, Droplet, Shield } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cot-reports', label: 'COT Reports', icon: BarChart3 },
  { path: '/news', label: 'News Feed', icon: Newspaper },
  { path: '/gamma', label: 'Gamma/GEX', icon: Activity },
  { path: '/crude-oil', label: 'CRUDE OIL', icon: Droplet },
  { path: '/vpn', label: 'VPN Service', icon: Shield },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isCinematic = ['/crude-oil', '/cru'].includes(location.pathname);

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      isCinematic 
        ? 'bg-black/20 border-transparent text-white backdrop-blur-sm fixed' 
        : 'bg-background/95 border-border backdrop-blur supports-[backdrop-filter]:bg-background/60'
    }`}>
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 mr-8">
        <div className="flex items-center gap-2 mr-8">
          <span className="font-bold text-lg tracking-tight hover:text-primary transition-colors cursor-default">AROT</span>
        </div>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <Button
                  variant={isActive ? 'navActive' : 'ghost'}
                  size="sm"
                  className={`gap-2 ${isCinematic && !isActive ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse-glow" />
            <span className="text-muted-foreground">LIVE</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
