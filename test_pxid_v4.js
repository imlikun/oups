const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Test 1: Homepage Chinese toggle
  console.log('=== Test 1: Homepage ZH Toggle ===');
  await page.goto('http://localhost:9012/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  await page.click('[aria-label="Toggle language"]');
  await page.waitForTimeout(3000);
  
  const results = await page.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('nav a, header a')).slice(0,8).map(a => a.textContent.trim());
    const h1 = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '';
    const h2s = Array.from(document.querySelectorAll('h2')).slice(0,8).map(h => h.textContent.trim());
    return { nav, h1, h2s };
  });
  console.log('Nav:', JSON.stringify(results.nav));
  console.log('H1:', results.h1);
  console.log('H2s:', JSON.stringify(results.h2s.slice(0,5)));
  
  let pass = true;
  if (!results.nav.some(t => t === '\u9996\u9875')) { console.log('FAIL: Nav Home not Chinese'); pass = false; }
  if (!results.h1.includes('\u5236\u9020\u5546')) { console.log('FAIL: H1 not Chinese'); pass = false; }
  if (!results.h2s.some(t => t === '\u5236\u9020\u5353\u8d8a')) { console.log('FAIL: Manufacturing h2 missing'); pass = false; }
  console.log(pass ? 'Test 1: PASS' : 'Test 1: FAIL');
  
  // Test 2: Product detail page
  console.log('\n=== Test 2: Product Detail ZH ===');
  await page.evaluate(() => { localStorage.setItem('pxid-lang', 'zh'); });
  await page.goto('http://localhost:9012/products/antelope-p5/?lang=zh', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const detail = await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
    const h3s = Array.from(document.querySelectorAll('h3')).slice(0,10).map(h => h.textContent.trim());
    return { h2s, h3s };
  });
  console.log('Detail H2s:', JSON.stringify(detail.h2s));
  console.log('Detail H3s:', JSON.stringify(detail.h3s.slice(0,6)));
  
  pass = true;
  if (!detail.h2s.some(t => t.includes('\u5173\u4e8e\u672c\u4ea7\u54c1'))) { console.log('FAIL: About This Product not translated'); pass = false; }
  if (!detail.h2s.some(t => t === '\u6838\u5fc3\u7279\u70b9')) { console.log('FAIL: Key Features not translated'); pass = false; }
  if (!detail.h2s.some(t => t === '\u6280\u672f\u89c4\u683c')) { console.log('FAIL: Technical Specs not translated'); pass = false; }
  if (!detail.h2s.some(t => t === 'ODM \u5b9a\u5236\u670d\u52a1')) { console.log('FAIL: ODM Customization not translated'); pass = false; }
  if (!detail.h3s.some(t => t === '\u8ba4\u8bc1')) { console.log('FAIL: Certifications not translated'); pass = false; }
  console.log(pass ? 'Test 2: PASS' : 'Test 2: FAIL');
  
  // Test 3: Toggle back to English
  console.log('\n=== Test 3: Toggle back EN ===');
  await page.click('[aria-label="Toggle language"]');
  await page.waitForTimeout(3000);
  
  const enDet = await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
    const h3s = Array.from(document.querySelectorAll('h3')).slice(0,10).map(h => h.textContent.trim());
    return { h2s, h3s };
  });
  console.log('EN H2s:', JSON.stringify(enDet.h2s));
  
  pass = true;
  if (!enDet.h2s.some(t => t === 'About This Product')) { console.log('FAIL: About This Product not restored'); pass = false; }
  if (!enDet.h2s.some(t => t === 'Key Features')) { console.log('FAIL: Key Features not restored'); pass = false; }
  if (!enDet.h3s.some(t => t === 'Certifications')) { console.log('FAIL: Certifications not restored'); pass = false; }
  console.log(pass ? 'Test 3: PASS' : 'Test 3: FAIL');
  
  // Test 4: ODM Services page
  console.log('\n=== Test 4: ODM Services ZH ===');
  await page.goto('http://localhost:9012/odm-services/?lang=zh', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const odm = await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
    const h3s = Array.from(document.querySelectorAll('h3')).slice(0,5).map(h => h.textContent.trim());
    return { h2s, h3s };
  });
  console.log('ODM H2s:', JSON.stringify(odm.h2s));
  console.log('ODM H3s:', JSON.stringify(odm.h3s));
  
  pass = true;
  if (!odm.h3s.some(t => t === '\u4ea7\u54c1\u8bbe\u8ba1')) { console.log('FAIL: Product Design not translated'); pass = false; }
  console.log(pass ? 'Test 4: PASS' : 'Test 4: FAIL');
  
  await browser.close();
  console.log('\n=== All tests complete ===');
})();
