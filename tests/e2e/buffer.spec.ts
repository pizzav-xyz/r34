import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  console.log('1. Navigating...')
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

  console.log('2. Waiting for initial search results...')
  try {
    await page.waitForSelector('.image-grid', { timeout: 30000 })
  } catch {
    const allClasses = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[class]'))
        .map(el => el.className.toString())
        .filter(c => c.includes('grid') || c.includes('card') || c.includes('skeleton') || c.includes('empty') || c.includes('status'))
        .slice(0, 20)
    )
    console.log('   Grid NOT found. Relevant classes:', JSON.stringify(allClasses))
    await browser.close()
    return
  }

  const cardCount = await page.locator('.image-card').count()
  console.log(`   Found ${cardCount} cards`)

  console.log('3. Setting buffer count to 3...')
  const bufferInput = page.locator('.video-buffer-control input[type="number"]')
  await bufferInput.fill('3')

  console.log('4. Clicking Buffer...')
  await page.getByRole('button', { name: /buffer/i }).click()

  console.log('5. Waiting for buffering to start...')
  await page.waitForTimeout(1000)
  const statusText = await page.locator('.status-text').textContent()
  console.log(`   Status: ${statusText?.trim()}`)

  try {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.status-text')
        if (!el) return false
        const text = el.textContent || ''
        return text.includes('buffered') && !text.includes('Buffering')
      },
      { timeout: 120000 },
    )
  } catch {
    console.log('   Buffering did not complete in 120s')
  }

  const finalStatus = await page.locator('.status-text').textContent()
  console.log(`   Final status: ${finalStatus?.trim()}`)

  console.log('6. Clicking first video card...')
  const firstCard = page.locator('.image-card').filter({ has: page.locator('.image-card-play') }).first()
  if (await firstCard.count() > 0) {
    await firstCard.click()
  } else {
    await page.locator('.image-card').first().click()
  }
  await page.waitForTimeout(3000)

  console.log('7. Checking lightbox...')
  const video = page.locator('video.lightbox-media')
  if (await video.isVisible()) {
    const src = await video.getAttribute('src')
    console.log(`   Is blob: ${src?.startsWith('blob:')}`)
    console.log(`   Src: ${src?.slice(0, 120)}`)
  } else {
    console.log('   No video element (card is an image, not a video)')
  }

  const corsErrors = consoleErrors.filter(e => e.includes('CORS') || e.includes('cors'))
  console.log(`8. CORS errors: ${corsErrors.length}`)
  if (corsErrors.length > 0) {
    for (const e of corsErrors) console.log(`   ${e.slice(0, 150)}`)
  }

  await browser.close()
  console.log('\nDone.')
}

run().catch(e => { console.error(e); process.exit(1) })
