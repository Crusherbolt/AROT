
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- VERIFIED MARKET CODES (LEGACY FUTURES ONLY) ---
const COMMODITIES = [
    { name: 'GOLD', code: '088691' },
    { name: 'SILVER', code: '084691' },
    { name: 'CRUDE OIL', code: '067651' },
    { name: 'S&P 500', code: '13874+' },
    { name: 'NASDAQ 100', code: '209742' },
    { name: '10Y TREASURY', code: '043602' },
    { name: 'EUR/USD', code: '099741' }
];

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
let envVars: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    }
});

async function fetchCommodityData(code: string) {
    const baseUrl = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';
    // Use CORRECT field name for numeric codes: cftc_contract_market_code
    const params = new URLSearchParams();
    params.append('cftc_contract_market_code', code);
    params.append('$limit', '100');
    params.append('$order', 'report_date_as_yyyy_mm_dd DESC');

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`[FETCH] ${code} from: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`[ERROR] HTTP ${response.status} for ${code}: ${text}`);
        return [];
    }

    return await response.json();
}

async function bulkImport() {
    console.log('--- Starting 1-Year REAL Data Import ---');
    let totalImported = 0;

    for (const item of COMMODITIES) {
        try {
            console.log(`\n[PROCESS] Processing ${item.name} (${item.code})...`);
            const results = await fetchCommodityData(item.code);

            if (!results || !Array.isArray(results) || results.length === 0) {
                console.warn(`[SKIP] No data found for ${item.name} (${item.code})`);
                continue;
            }

            console.log(`[INFO] Found ${results.length} historical records for ${item.name}`);

            const mappedData = results.map((r: any) => ({
                date: r.report_date_as_yyyy_mm_dd.split('T')[0],
                commodity_name: item.name,
                cftc_code: item.code,
                category: 'commodities',
                // Positions
                commercial_long: parseInt(r.comm_positions_long_all || '0'),
                commercial_short: parseInt(r.comm_positions_short_all || '0'),
                non_commercial_long: parseInt(r.noncomm_positions_long_all || '0'),
                non_commercial_short: parseInt(r.noncomm_positions_short_all || '0'),
                non_reportable_long: parseInt(r.nonrept_positions_long_all || '0'),
                non_reportable_short: parseInt(r.nonrept_positions_short_all || '0'),
                // Changes (Δ)
                comm_change_long: parseInt(r.change_in_comm_long_all || '0'),
                comm_change_short: parseInt(r.change_in_comm_short_all || '0'),
                noncomm_change_long: parseInt(r.change_in_noncomm_long_all || '0'),
                noncomm_change_short: parseInt(r.change_in_noncomm_short_all || '0'),
                nonrept_change_long: parseInt(r.change_in_nonrept_long_all || '0'),
                nonrept_change_short: parseInt(r.change_in_nonrept_short_all || '0'),
                // Global
                open_interest: parseInt(r.open_interest_all || '0'),
                change_oi: parseInt(r.change_in_open_interest_all || '0'),
                spread_positions: parseInt(r.noncomm_positions_spread_all || '0')
            }));

            // Filter to exactly last 1 year from now
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const filtered = mappedData.filter(d => new Date(d.date) >= oneYearAgo);

            console.log(`[INFO] Finalizing ${filtered.length} records for ${item.name}`);

            const { data, error } = await supabase
                .from('cot_reports' as any)
                .upsert(filtered, { onConflict: 'date, cftc_code' })
                .select();

            if (error) {
                console.error(`[FAIL] Upsert failed for ${item.name}:`, error.message);
            } else {
                const count = data?.length || 0;
                console.log(`[SUCCESS] Imported ${count} weeks for ${item.name}`);
                totalImported += count;
            }

        } catch (e: any) {
            console.error(`[CRITICAL] Error processing ${item.name}:`, e.message);
        }
    }

    console.log(`\n--- Final Import Complete! Total Rows in Supabase: ${totalImported} ---`);
}

bulkImport();
