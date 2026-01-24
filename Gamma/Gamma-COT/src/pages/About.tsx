import { Activity, BarChart3, Newspaper, TrendingUp, Zap, Shield, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const features = [
    {
      icon: Activity,
      title: 'Gamma Trading Insights',
      description: 'Track real-time gamma exposure (GEX) and understand how options positioning impacts market volatility. Our advanced analytics decode dealer hedging flows and predict potential price movements.',
    },
    {
      icon: BarChart3,
      title: 'COT Reports Analysis',
      description: 'Access the latest Commitments of Traders data with clear visualizations, helping you decode institutional vs. retail positioning across commodities, currencies, and indices.',
    },
    {
      icon: Newspaper,
      title: 'Live Market News Feed',
      description: 'Stay updated with curated financial news, macroeconomic updates, and option market developments. Our sentiment analysis helps you gauge market mood in real-time.',
    },
    {
      icon: TrendingUp,
      title: 'ETF Flow Analytics',
      description: 'Monitor institutional fund flows across major ETFs including SPY, QQQ, and sector-specific funds. Identify risk-on/risk-off sentiment shifts before they impact prices.',
    },
  ];

  const stats = [
    { value: '50+', label: 'Instruments Tracked' },
    { value: 'Real-Time', label: 'Data Updates' },
    { value: '15+', label: 'ETFs Monitored' },
    { value: '24/7', label: 'Market Coverage' },
  ];

  return (
    <div className="space-y-12 animate-fade-up">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary">
            <span className="font-mono font-bold text-primary-foreground text-2xl">A</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Advanced Research on Options & Traders
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AROT.tech is a cutting-edge financial analytics platform designed for professional traders, 
          analysts, and market enthusiasts seeking actionable intelligence.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.label}
            className="p-6 rounded-lg border border-border bg-card text-center"
          >
            <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="p-8 rounded-lg border border-border bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're analyzing SPX Gamma Exposure, monitoring hedging flows, or studying COT 
            positioning in commodities and FX, AROT.tech provides the tools to make informed trading 
            decisions. We believe in democratizing access to institutional-grade analytics, giving 
            every trader the edge they need to succeed in today's complex markets.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Why Choose AROT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Live data feeds ensure you're always working with the most current market information.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Institutional Quality</h3>
            <p className="text-sm text-muted-foreground">
              Professional-grade tools previously available only to hedge funds and institutions.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Trader Focused</h3>
            <p className="text-sm text-muted-foreground">
              Designed by traders, for traders. Every feature serves a practical trading purpose.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6">
          Explore our tools and discover how AROT can enhance your trading decisions.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            to="/gamma"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Explore Gamma/GEX
          </Link>
          <Link 
            to="/cot-reports"
            className="px-6 py-3 rounded-lg border border-border bg-card font-medium hover:border-primary/50 transition-colors"
          >
            View COT Reports
          </Link>
        </div>
      </section>
    </div>
  );
}
