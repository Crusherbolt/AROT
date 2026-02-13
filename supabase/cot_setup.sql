-- Create the COT Reports table
CREATE TABLE IF NOT EXISTS public.cot_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    commodity_name TEXT NOT NULL,
    cftc_code TEXT NOT NULL,
    category TEXT DEFAULT 'commodities',
    
    -- Commercial Positions (Hedgers)
    commercial_long INTEGER DEFAULT 0,
    commercial_short INTEGER DEFAULT 0,
    commercial_net INTEGER GENERATED ALWAYS AS (commercial_long - commercial_short) STORED,
    
    -- Non-Commercial Positions (Large Speculators / Managed Money)
    non_commercial_long INTEGER DEFAULT 0,
    non_commercial_short INTEGER DEFAULT 0,
    non_commercial_net INTEGER GENERATED ALWAYS AS (non_commercial_long - non_commercial_short) STORED,
    
    -- Non-Reportable (Small Traders)
    non_reportable_long INTEGER DEFAULT 0,
    non_reportable_short INTEGER DEFAULT 0,
    non_reportable_net INTEGER GENERATED ALWAYS AS (non_reportable_long - non_reportable_short) STORED,
    
    -- Open Interest & Changes
    open_interest INTEGER DEFAULT 0,
    change_oi INTEGER DEFAULT 0,
    
    -- Change Tracking (Δ Positions)
    comm_change_long INTEGER DEFAULT 0,
    comm_change_short INTEGER DEFAULT 0,
    noncomm_change_long INTEGER DEFAULT 0,
    noncomm_change_short INTEGER DEFAULT 0,
    nonrept_change_long INTEGER DEFAULT 0,
    nonrept_change_short INTEGER DEFAULT 0,
    
    -- Analysis
    percent_oi_long NUMERIC,
    percent_oi_short NUMERIC,
    spread_positions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unique constraint to prevent duplicates
    UNIQUE(date, cftc_code)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cot_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for the dashboard)
CREATE POLICY "Allow public read access" ON public.cot_reports
    FOR SELECT USING (true);

-- Policy: Allow service role (scripts) to insert/update
CREATE POLICY "Allow service role insert" ON public.cot_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update" ON public.cot_reports
    FOR UPDATE USING (true);
