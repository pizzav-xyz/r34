import { chromium } from 'playwright';

async function main() {
  console.log('→ Launching Camoufox (real Firefox)...');
  
  // Use camoufox as a playwright-compatible browser
  const { getFirefox } = await import('camoufox');
  const firefox = await getFirefox({ headless: true });
  
  const browser = await firefox.connect();
  const page = await browser.newPage();

  console.log('→ Navigating to app...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('✓ App loaded');

  // Test: probe a single video's duration from the app's origin
  console.log('\n=== TEST: Video duration probing via <video> ===');
  const probeResult = await page.evaluate(async () => {
    const url = 'https://api-cdn-mp4.rule34.xxx/images/1788/97672268aaaf18099b0b9009b8074d23.mp4';
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = url;
      const timeout = setTimeout(() => {
        video.removeAttribute('src');
        try { video.load(); } catch {}
        resolve({ status: 'timeout' });
      }, 15000);
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const dur = video.duration;
        video.removeAttribute('src');
        try { video.load(); } catch {}
        resolve({ status: 'ok', duration: dur });
      };
      video.onerror = () => {
        clearTimeout(timeout);
        resolve({ status: 'error', code: video.error?.code });
      };
    });
  });
  console.log(`Probe result: ${JSON.stringify(probeResult)}`);

  if (probeResult.status === 'ok') {
    console.log(`✓ Duration probing works! Video is ${probeResult.duration}s long`);
  } else {
    console.log(`✗ Probe failed: ${probeResult.status} (code=${probeResult.code})`);
  }

  // Test: search with duration filter and check if filtering works
  if (probeResult.status === 'ok') {
    console.log('\n=== TEST: Full duration filter flow ===');
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('webm');
    await searchInput.press('Enter');
    await page.waitForTimeout(5000);
    const unfiltered = await page.locator('.image-card').count();
    console.log(`webm (no filter): ${unfiltered} cards`);

    await searchInput.fill('webm duration:>30');
    await searchInput.press('Enter');
    await page.waitForTimeout(5000);
    const preProbe = await page.locator('.image-card').count();
    console.log(`webm duration:>30 (before probe): ${preProbe} cards`);

    // Wait for probing to complete
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(5000);
      const count = await page.locator('.image-card').count();
      const probing = await page.locator('.duration-probing').isVisible().catch(() => false);
      console.log(`  [${(i+1)*5}s] Cards: ${count}, Probing: ${probing}`);
      if (!probing) break;
    }
    const filtered = await page.locator('.image-card').count();
    console.log(`\nResult: ${unfiltered} → ${filtered} cards`);
    if (filtered < unfiltered) {
      console.log(`✓ Duration filter WORKS! ${unfiltered - filtered} videos filtered out`);
    } else {
      console.log(`⚠ No filtering happened (all videos may be >30s, or probing failed)`);
    }
  }

  await browser.close();
  console.log('\n✓ Done');
}

main().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
