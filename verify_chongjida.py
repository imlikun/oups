import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        tests = {
            "homepage": "https://www.appin.site/index.html",
            "chongjida": "https://www.appin.site/宠急达/index.html",
        }
        
        all_ok = True
        for name, url in tests.items():
            try:
                resp = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                status = resp.status
                title = await page.title()
                ok = "✅" if status == 200 else "❌"
                if status != 200: all_ok = False
                print(f"  {ok} {name}: {status} — {title[:60]}")
                
                # For homepage, check for 宠急达 in the page
                if name == "homepage":
                    has_card = await page.evaluate("() => document.body.textContent.includes('宠急达')")
                    print(f"     {'✅' if has_card else '❌'} 6th card present: {has_card}")
                    if not has_card: all_ok = False
                    
            except Exception as e:
                print(f"  ❌ {name}: ERROR - {e}")
                all_ok = False
        
        await browser.close()
        
        print(f"\n{'✅ All passed!' if all_ok else '❌ Some failed!'}")
        return all_ok

asyncio.run(verify())
