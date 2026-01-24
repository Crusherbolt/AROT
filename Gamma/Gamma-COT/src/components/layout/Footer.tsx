import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    platform: [
      { label: 'Dashboard', path: '/' },
      { label: 'Gamma/GEX', path: '/gamma' },
      { label: 'COT Reports', path: '/cot-reports' },
      { label: 'News Feed', path: '/news' },
    ],
    company: [
      { label: 'About AROT', path: '/about' },
      { label: 'Contact Us', path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Disclaimer', path: '/disclaimer' },
    ],
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <span className="font-mono font-bold text-primary-foreground text-sm">A</span>
              </div>
              <span className="font-bold text-lg tracking-tight">AROT</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced Research on Options & Traders. Real-time gamma trading analytics, 
              COT insights, and market intelligence for informed trading decisions.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} AROT.tech. All rights reserved.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            <strong>Disclaimer:</strong> AROT.tech provides financial data and analytics for 
            informational purposes only. This is not financial advice. Trading involves substantial 
            risk and may not be suitable for all investors. Past performance is not indicative of 
            future results. Always consult a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
