
const urls = [
    'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d',
    'https://query2.finance.yahoo.com/v7/finance/options/SPY'
];

async function test() {
    for (const url of urls) {
        try {
            console.log(`Fetching ${url}...`);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Success (keys):', Object.keys(data));
            } else {
                console.log('Text:', await res.text());
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
}

test();
