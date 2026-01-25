-- Create News Table
create table public.news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source text not null,
  summary text,
  url text,
  image text,
  category text check (category in ('forex', 'stocks', 'crypto', 'commodities', 'economy')),
  sentiment text check (sentiment in ('bullish', 'bearish', 'neutral')),
  impact text check (impact in ('high', 'medium', 'low')),
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.news enable row level security;

-- Create Policy for reading (allow all)
create policy "Allow public read access" on public.news
  for select using (true);
  
-- Create Policy for inserting (service role only, or authenticated if needed)
-- defaulting to service role only usually for backend scripts
create policy "Allow service role insert" on public.news
  for insert with check (true);
