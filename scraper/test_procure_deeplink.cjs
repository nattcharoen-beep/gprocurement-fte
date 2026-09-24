const CryptoJS = require('crypto-js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

function encryptProjectId(projectId) {
  const payload = JSON.stringify({ projectId: projectId });
  const encrypted = CryptoJS.AES.encrypt(payload, 'RDCrypto').toString();
  return encodeURIComponent(encrypted);
}

(async () => {
  const pid = '69099483146'; // Project #2: Mahidol fire pump from user screenshot
  const param = encryptProjectId(pid);
  const directUrl = `https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/${param}`;
  console.log(`Direct Procurement URL: ${directUrl}`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,850']
  });
  const page = await browser.newPage();
  
  console.log('Navigating directly to announcement/procurement/:param...');
  const res = await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
  console.log('HTTP Status:', res.status());
  
  await new Promise(r => setTimeout(r, 6000));

  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      h1s: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, .title, strong')).map(e => e.innerText.trim()).filter(Boolean).slice(0, 15),
      bodyTextSnippet: document.body.innerText.slice(0, 500)
    };
  });

  console.log('Page Info:', JSON.stringify(pageInfo, null, 2));
  await page.screenshot({ path: 'procurement_deep_link.png' });
  await browser.close();
})();
