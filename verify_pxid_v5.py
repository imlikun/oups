#!/usr/bin/env python3
"""Playwright verification: PXID v5 language switching on live site"""
import asyncio
import sys

async def test_pxid():
    from playwright.async_api import async_playwright

    BASE = "https://www.appin.site/pxid"
    tests = {
        "homepage_zh": f"{BASE}/index.html",
        "antelope_p5_zh": f"{BASE}/products/antelope-p5/index.html",
        "e_motorcycle_p8_zh": f"{BASE}/products/e-motorcycle-p8/index.html",
        "bestride_pro_zh": f"{BASE}/products/bestride-pro/index.html",
        "odm_zh": f"{BASE}/odm-services/index.html",
    }

    results = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        
        for name, url in tests.items():
            print(f"\n{'='*60}")
            print(f"Testing: {name}")
            print(f"  URL: {url}")
            page = await context.new_page()
            
            try:
                await page.goto(url, wait_until="networkidle", timeout=15000)
                await page.wait_for_timeout(2000)
                
                # Check if v5 script is injected
                has_v5 = await page.evaluate("() => typeof window.__pxid_toggleLang === 'function'")
                
                # Get current lang
                html_lang = await page.evaluate("() => document.documentElement.lang")
                
                # Toggle to Chinese
                await page.evaluate("() => window.__pxid_setLang('zh')")
                await page.wait_for_timeout(1000)
                
                body_text = await page.evaluate("() => document.body.textContent || ''")
                has_chinese = any(w in body_text for w in ["首页", "产品", "关于", "联系我们"])
                
                chinese_chars = sum(1 for c in body_text if '\u4e00' <= c <= '\u9fff')
                
                # Toggle back to English
                await page.evaluate("() => window.__pxid_setLang('en')")
                await page.wait_for_timeout(500)
                
                status = "✅" if has_v5 and has_chinese else "❌"
                results[name] = {
                    "v5_loaded": has_v5,
                    "has_chinese": has_chinese,
                    "chinese_char_count": chinese_chars,
                    "status": status
                }
                
                print(f"  V5 loaded: {has_v5}")
                print(f"  Has Chinese after toggle: {has_chinese}")
                print(f"  Chinese chars found: {chinese_chars}")
                print(f"  Status: {status}")
                
            except Exception as e:
                results[name] = {"error": str(e)[:80], "status": "❌"}
                print(f"  ERROR: {e}")
            finally:
                await page.close()
        
        await browser.close()
    
    print(f"\n{'='*60}")
    print("SUMMARY:")
    total = len(results)
    passed = sum(1 for r in results.values() if r.get("status") == "✅")
    for name, r in results.items():
        print(f"  {r['status']} {name}: {r.get('chinese_char_count', 'N/A')} Chinese chars")
    print(f"\n  {passed}/{total} tests passed")
    
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(test_pxid())
    sys.exit(0 if success else 1)
