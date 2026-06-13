// Node.js has global fetch, so no external fetch package is needed.

async function run(strategy) {
  console.log(`Fetching PageSpeed Insights for ${strategy}...`);
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://mra-t-g-blog.cn/&strategy=${strategy}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const data = await res.json();
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse.categories;
    const score = categories.performance.score * 100;
    
    console.log(`\n=== Strategy: ${strategy.toUpperCase()} ===`);
    console.log(`Performance Score: ${score}`);
    
    console.log('\n--- Core Web Vitals / Key Metrics ---');
    const audits = lighthouse.audits;
    const metrics = [
      'first-contentful-paint',
      'speed-index',
      'largest-contentful-paint',
      'interactive',
      'total-blocking-time',
      'cumulative-layout-shift'
    ];
    for (const m of metrics) {
      if (audits[m]) {
        console.log(`${audits[m].title}: ${audits[m].displayValue} (Score: ${audits[m].score})`);
      }
    }
    
    console.log('\n--- Opportunities & Diagnostics ---');
    for (const [key, audit] of Object.entries(audits)) {
      if (audit.score !== null && audit.score < 0.9 && audit.details) {
        console.log(`- [${key}] ${audit.title} (Score: ${audit.score})`);
        if (audit.description) {
          console.log(`  Description: ${audit.description}`);
        }
        if (audit.displayValue) {
          console.log(`  Savings/Value: ${audit.displayValue}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error for ${strategy}:`, err);
  }
}

async function main() {
  await run('mobile');
  await run('desktop');
}

main();
