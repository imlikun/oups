import asyncio
from playwright.async_api import async_playwright

async def screenshot():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        await page.goto("https://www.appin.site/宠急帮/index.html", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Scroll to make reveal animations fire
        await page.evaluate("() => window.scrollBy(0, 400)")
        await page.wait_for_timeout(500)
        await page.evaluate("() => window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)
        
        await page.screenshot(path="/Users/likun/WorkBuddy/2026-05-29-21-25-04/宠急帮_preview.png", full_page=False)
        print("Screenshot saved: 宠急帮_preview.png")
        
        await browser.close()

asyncio.run(screenshot())
