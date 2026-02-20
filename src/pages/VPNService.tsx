import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Shield, Zap, Clock, HardDrive, RefreshCw, Copy, CheckCircle2, Download, Smartphone, Monitor, Activity, Globe, Lock, Server } from 'lucide-react';
import { toast } from 'sonner';

interface VPNToken {
  token: string;
  expires_at: string;
  bandwidth_used: number;
  bandwidth_limit: number;
  is_active: boolean;
}

const BANDWIDTH_LIMIT_MB = 1536; // 1.5 GB in MB

export default function VPNService() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tokenData, setTokenData] = useState<VPNToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [adSeconds, setAdSeconds] = useState(0);

  useEffect(() => {
    fetchTokenStatus();
  }, []);

  const startAdVerification = async () => {
    setAdSeconds(5);
    const timer = setInterval(() => {
      setAdSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          generateToken();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchTokenStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('vpn-manager', {
        method: 'POST',
        body: JSON.stringify({ action: 'status' })
      });
      if (data && data.token) setTokenData(data);
    } catch (err) {
      console.error('Error fetching VPN status:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      setGenerating(true);
      toast.info("Verifying session...");
      
      const { data, error } = await supabase.functions.invoke('vpn-manager', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate' })
      });

      if (error) throw error;
      setTokenData(data);
      toast.success("New VPN Token Generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate token");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info("Token copied to clipboard");
    }
  };

  const usedMB = tokenData ? Math.round(tokenData.bandwidth_used / (1024 * 1024)) : 0;
  const bandwidthPercent = tokenData
    ? Math.min((tokenData.bandwidth_used / tokenData.bandwidth_limit) * 100, 100)
    : 0;

  const isExhausted = bandwidthPercent >= 100;
  const timeRemaining = tokenData
    ? Math.max(0, new Date(tokenData.expires_at).getTime() - Date.now())
    : 0;
  const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-up">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <CustomBadge variant="bullish">MUMBAI SERVER • LIVE</CustomBadge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            AROT <span className="text-emerald-400">VPN</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Ultra low-latency WireGuard tunnel optimized for competitive gaming in India. Free, fast, encrypted.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${tokenData?.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
          </div>
          <p className="text-xl font-bold">{tokenData?.is_active ? 'Protected' : 'Offline'}</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Time Left</span>
          </div>
          <p className="text-xl font-bold">
            {tokenData?.is_active ? `${hoursLeft}h ${minsLeft}m` : '--:--'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bandwidth</span>
          </div>
          <p className="text-xl font-bold">{usedMB} / {BANDWIDTH_LIMIT_MB} MB</p>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${bandwidthPercent > 80 ? 'bg-red-400' : bandwidthPercent > 50 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
              style={{ width: `${bandwidthPercent}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Region</span>
          </div>
          <p className="text-xl font-bold">Mumbai</p>
          <p className="text-xs text-emerald-400 font-medium">~15ms ping</p>
        </div>
      </div>

      {/* Exhausted Banner */}
      {isExhausted && (
        <div className="p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-200">Your 1.5 GB daily limit has been reached. Watch an ad to reset.</p>
          </div>
          <Button size="sm" onClick={startAdVerification} disabled={adSeconds > 0} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
            {adSeconds > 0 ? `${adSeconds}s` : 'Reset Now'}
          </Button>
        </div>
      )}

      {/* Token Section */}
      <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Access Token</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Generate your unique token below and paste it in the AROT VPN app to connect instantly.
          </p>
        </div>

        {tokenData?.token ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-lg flex items-center gap-2 p-4 bg-background border border-border rounded-xl font-mono text-lg shadow-inner">
              <span className="flex-1 truncate text-emerald-400">{tokenData.token}</span>
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copy Token"
              >
                {copied ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={startAdVerification} 
                disabled={generating || adSeconds > 0}
                className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {adSeconds > 0 ? `Verifying... ${adSeconds}s` : 'Regenerate Token'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <Button 
              size="lg" 
              onClick={startAdVerification} 
              disabled={generating || adSeconds > 0}
              className="px-12 py-6 text-lg font-bold rounded-2xl gap-2 shadow-xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95 bg-emerald-500 hover:bg-emerald-600"
            >
              {generating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
              {adSeconds > 0 ? `Watching Ad... ${adSeconds}s` : (generating ? 'Generating...' : 'Start Free Session')}
            </Button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Watching a short ad verifies your session and activates your 1.5 GB daily limit.
            </p>
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Download className="h-6 w-6 text-emerald-400" /> Download App
          </h2>
          <p className="text-muted-foreground">Get the AROT VPN client for your device</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="/downloads/AROT.exe" 
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#1E293B] hover:bg-[#334155] border border-slate-600/30 transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
          >
            <Monitor className="h-6 w-6 text-blue-400" />
            <div className="text-left">
              <p className="text-xs text-slate-400">Download for</p>
              <p className="font-bold text-white">Windows</p>
            </div>
          </a>
          <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#1E293B] border border-slate-600/30 opacity-60 cursor-not-allowed w-full sm:w-auto">
            <Smartphone className="h-6 w-6 text-green-400" />
            <div className="text-left">
              <p className="text-xs text-slate-400">Coming Soon</p>
              <p className="font-bold text-white">Android</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        <div className="p-6 rounded-2xl border border-border bg-card/50 hover:border-emerald-500/30 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit mb-4">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="font-bold mb-2">Gaming Optimized</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            WireGuard protocol on Mumbai servers with TCP BBR congestion control. Minimal overhead for competitive Valorant with jitter under 5ms.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card/50 hover:border-blue-500/30 transition-colors">
          <div className="p-2.5 rounded-xl bg-blue-500/10 w-fit mb-4">
            <Lock className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="font-bold mb-2">256-bit Encryption</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChaCha20-Poly1305 encryption secures all traffic. Works through college Wi-Fi restrictions using port 53 UDP tunneling.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card/50 hover:border-purple-500/30 transition-colors">
          <div className="p-2.5 rounded-xl bg-purple-500/10 w-fit mb-4">
            <Globe className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="font-bold mb-2">Free Forever</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No subscriptions. 1.5 GB daily bandwidth refreshed through verified ad sessions. Premium Azure infrastructure maintained for the community.
          </p>
        </div>
      </div>
    </div>
  );
}
