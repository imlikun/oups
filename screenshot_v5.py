import asyncio
from playwright.async_api import async_playwright

async def screenshot():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Screenshot: antelope-p5 product page in Chinese
        await page.goto("https://www.appin.site/pxid/products/antelope-p5/index.html", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(3000)
        
        # Toggle to Chinese
        await page.evaluate("() => window.__pxid_setLang('zh')")
        await page.wait_for_timeout(1500)
        
        await page.screenshot(path="/Users/likun/WorkBuddy/2026-05-29-21-25-04/pxid_zh_screenshot.png", full_page=False)
        print("Screenshot saved: pxid_zh_screenshot.png")
        
        # Screenshot: homepage in Chinese
        await page.goto("https://www.appin.site/pxid/index.html", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(3000)
        await page.evaluate("() => window.__pxid_setLang('zh')")
        await page.wait_for_timeout(1500)
        
        await page.screenshot(path="/Users/likun/WorkBuddy/2026-05-29-21-25-04/pxid_home_zh_screenshot.png", full_page=False)
        print("Screenshot saved: pxid_home_zh_screenshot.png")
        
        await browser.close()

asyncio.run(screenshot())
