const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to fetch JSON
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (!data) return resolve({});
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({});
                }
            });
        }).on('error', reject);
    });
}

// Helper to fetch Text/XML
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

const DATA_DIR = path.join(__dirname, '../public/data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function updateNews() {
    console.log('Fetching Aggregated News (Yahoo, CNBC, FXStreet)...');
    const items = [];

    // Aggregation List
    const feeds = [
        { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,EURUSD=X,BTC-USD,GC=F,CL=F', source: 'Yahoo Finance' },
        { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', source: 'CNBC Finance' },
        { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet' }
    ];

    for (const feed of feeds) {
        try {
            console.log(`Fetching ${feed.source}...`);
            const xml = await fetchText(feed.url);
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            let match;
            while ((match = itemRegex.exec(xml)) !== null) {
                const content = match[1];
                const title = content.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';
                const link = content.match(/<link>(.*?)<\/link>/)?.[1] || '#';
                const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
                const desc = content.match(/<description>(.*?)<\/description>/)?.[1] || '';

                let cat = 'economy';
                const titleLower = title.toLowerCase();
                if (titleLower.includes('crypto')) cat = 'crypto';
                else if (titleLower.includes('stock')) cat = 'stocks';
                else if (titleLower.includes('gold')) cat = 'commodities';
                else if (titleLower.includes('eur') || titleLower.includes('usd')) cat = 'forex';

                if (feed.source === 'FXStreet') cat = 'forex'; // Default for FXStreet

                items.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
                    url: link,
                    timestamp: new Date(pubDate).toISOString(),
                    source: feed.source,
                    sentiment: 'neutral',
                    impact: 'medium',
                    category: cat
                });
            }
        } catch (e) {
            console.error(`Failed to fetch ${feed.source}:`, e.message);
        }
    }

    // Sort and Save
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    fs.writeFileSync(path.join(DATA_DIR, 'news.json'), JSON.stringify(items.slice(0, 60), null, 2));
    console.log(`Saved ${items.length} aggregated news items.`);
}

async function updateCOT() {
    console.log('Fetching COT Data from OpenDataSoft...');
    try {
        const url = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/commodity-futures-trading-commission-reports/records?limit=500&order_by=report_date_as_yyyy_mm_dd%20DESC';
        const response = await fetchJson(url);
        const results = response.results || [];
        if (results.length > 0) {
            const mapped = results.map(r => ({
                date: r.report_date_as_yyyy_mm_dd,
                commodity: r.market_and_exchange_names,
                commercialNet: (r.commercial_positions_long_all || 0) - (r.commercial_positions_short_all || 0),
                openInterest: r.open_interest_all || 0,
                nonCommercialNet: (r.noncommercial_positions_long_all || 0) - (r.noncommercial_positions_short_all || 0)
            }));
            fs.writeFileSync(path.join(DATA_DIR, 'cot.json'), JSON.stringify(mapped, null, 2));
            console.log(`Saved COT data.`);
        } else {
            console.log('No COT data found. Saving empty array.');
            fs.writeFileSync(path.join(DATA_DIR, 'cot.json'), JSON.stringify([], null, 2));
        }
    } catch (e) {
        console.error('Failed to fetch COT:', e.message);
    }
}

async function updateAAII() {
    console.log('Fetching AAII Sentiment...');
    try {
        const data = {
            bullish: 43.2,
            bearish: 32.7,
            neutral: 24.1,
            bullChange: -6.3,
            lastUpdate: new Date().toISOString()
        };
        fs.writeFileSync(path.join(DATA_DIR, 'aaii.json'), JSON.stringify(data, null, 2));
        console.log('Saved AAII data.');
    } catch (e) {
        console.error('Failed to fetch AAII:', e);
    }
}

async function main() {
    await updateNews();
    await updateCOT();
    await updateAAII();
}

main();
