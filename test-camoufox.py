from camoufox.sync_api import Camoufox

def main():
    print("→ Launching Camoufox (real Firefox with anti-fingerprinting)...")
    with Camoufox(headless=True) as browser:
        page = browser.new_page()
        
        print("→ Navigating to app...")
        page.goto("http://127.0.0.1:5173", wait_until="domcontentloaded", timeout=30000)
        print("✓ App loaded")

        # Test 1: probe a single video's duration
        print("\n=== TEST 1: Video duration probing via <video> ===")
        result = page.evaluate("""async () => {
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
        }""")
        print(f"Probe result: {result}")
        
        if result.get("status") == "ok":
            print(f"✓ Duration probing works! Video is {result['duration']}s")
        else:
            print(f"✗ Probe failed: {result}")

        # Test 2: full duration filter flow
        if result.get("status") == "ok":
            print("\n=== TEST 2: Full duration filter flow ===")
            search_input = page.locator("input.search-input")
            
            # Unfiltered
            search_input.fill("webm")
            search_input.press("Enter")
            page.wait_for_timeout(5000)
            unfiltered = page.locator(".image-card").count()
            print(f"webm (no filter): {unfiltered} cards")

            # With duration filter
            search_input.fill("webm duration:>30")
            search_input.press("Enter")
            page.wait_for_timeout(5000)
            pre_probe = page.locator(".image-card").count()
            print(f"webm duration:>30 (before probe): {pre_probe} cards")

            # Wait for probing
            for i in range(10):
                page.wait_for_timeout(5000)
                count = page.locator(".image-card").count()
                try:
                    probing = page.locator(".duration-probing").is_visible()
                except:
                    probing = False
                print(f"  [{(i+1)*5}s] Cards: {count}, Probing: {probing}")
                if not probing:
                    break

            filtered = page.locator(".image-card").count()
            print(f"\nResult: {unfiltered} → {filtered} cards")
            if filtered < unfiltered:
                print(f"✓ Duration filter WORKS! {unfiltered - filtered} videos filtered out")
            else:
                print(f"⚠ No filtering happened")

        browser.close()
        print("\n✓ Done")

if __name__ == "__main__":
    main()
