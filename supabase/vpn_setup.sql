-- VPN Service Schema Setup

-- Table for VPN tokens and bandwidth tracking
create table if not exists public.vpn_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  token text unique not null,
  public_key text, -- WireGuard Public Key
  allowed_ip inet, -- Internal VPN IP (e.g. 10.0.0.2)
  bandwidth_used bigint default 0, -- bytes
  bandwidth_limit bigint default 1073741824, -- 1GB default (1024^3)
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_active boolean default true,
  
  -- Ensure one active token per user usually
  constraint unique_active_token_per_user unique (user_id, is_active)
);

-- RLS
alter table public.vpn_tokens enable row level security;

-- Drop existing policies if they exist (to allow re-running)
drop policy if exists "Users can view own tokens" on public.vpn_tokens;
drop policy if exists "Service role can all" on public.vpn_tokens;

-- Policy: Users can see their own tokens
create policy "Users can view own tokens" on public.vpn_tokens
  for select using (auth.uid() = user_id);

-- Policy: Service role can update
create policy "Service role can all" on public.vpn_tokens
  using (true)
  with check (true);

-- Function to clean up expired tokens (run via cron or edge function)
create or replace function public.cleanup_expired_tokens()
returns void language plpgsql as $$
begin
  update public.vpn_tokens
  set is_active = false
  where expires_at < now() and is_active = true;
end;
$$;
