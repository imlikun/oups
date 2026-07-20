import asyncio
from playwright.async_api import async_playwright

async def screenshot_phones():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1500, "height": 900})
        
        file_path = "/Users/likun/WorkBuddy/2026-05-29-21-25-04/宠急达_phones.html"
        await page.goto(f"file://{file_path}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        
        screens = {
            "screen-welcome": "#screen1",
            "screen-asker-home": "#screen2",
            "screen-publish": "#screen3",
            "screen-helper-pool": "#screen4",
        }
        
        for name, selector in screens.items():
            el = await page.query_selector(selector)
            if el:
                await el.screenshot(path=f"/Users/likun/WorkBuddy/2026-05-29-21-25-04/宠急达_{name}.png")
                print(f"  ✓ {name}")
            else:
                print(f"  ✗ {name} not found")
        
        await browser.close()

asyncio.run(screenshot_phones())
