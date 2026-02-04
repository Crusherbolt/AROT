
// Native fetch is available in Node 18+

const host = 'arot.tech';
const key = '72370783da4c47fc94f4539074836645';
const urlList = [
    'https://arot.tech/',
    'https://arot.tech/news',
    'https://arot.tech/cot-reports',
    'https://arot.tech/gamma',
    'https://arot.tech/aaii',
    'https://arot.tech/about'
];

async function submitToIndexNow(endpoint) {
    console.log(`Submitting to ${endpoint}...`);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host,
                key,
                keyLocation: `https://${host}/${key}.txt`,
                urlList
            })
        });
        if (response.ok) {
            console.log(`✅ Success for ${endpoint}`);
        } else {
            console.error(`❌ Failed for ${endpoint}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Error for ${endpoint}:`, error.message);
    }
}

async function main() {
    await submitToIndexNow('https://www.bing.com/indexnow');
    await submitToIndexNow('https://yandex.com/indexnow');
}

main();
