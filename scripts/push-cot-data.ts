
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }
});

async function diagnostic() {
    console.log('--- Supabase Diagnostic ---');
    console.log('Project URL:', supabaseUrl);

    // 1. Try to list any table to see what's visible
    console.log('\nChecking table visibility...');
    const { data: tables, error: tableError } = await supabase
        .from('cot_reports' as any)
        .select('id')
        .limit(1);

    if (tableError) {
        console.error('❌ Table "cot_reports" NOT found:', tableError.message);

        // Suggest fix based on error
        if (tableError.message.includes('schema cache')) {
            console.log('\n💡 REASON: The database table does not exist OR the API cache is stale.');
            console.log('1. Please ensure you clicked "RUN" on the SQL code in the Supabase Dashboard.');
            console.log('2. Confirm you are in project: ' + supabaseUrl);
        }
    } else {
        console.log('✅ Table "cot_reports" IS visible!');

        // 2. Perform the push
        console.log('\n2. Seeding Data...');
        const cotData = [{
            date: '2026-02-03',
            commodity_name: 'CRUDE OIL',
            cftc_code: '067651',
            category: 'commodities',
            commercial_long: 165000,
            commercial_short: 350000,
            non_commercial_long: 189550,
            non_commercial_short: 176380,
            open_interest: 2091314,
            change_oi: 55665,
            non_reportable_long: 50000,
            non_reportable_short: 50000
        }];

        const { data, error: pushError } = await supabase
            .from('cot_reports' as any)
            .upsert(cotData, { onConflict: 'date, cftc_code' })
            .select();

        if (pushError) {
            console.error('❌ Push Failed:', pushError);
        } else {
            console.log('🚀 Success! Data pushed:', data);
        }
    }
}

diagnostic();
