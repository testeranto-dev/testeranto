// import puppeteer from "puppeteer-core";

// async function main() {

//   try {
//     const browser = await puppeteer.connect({
//       // browserURL: 'http://web-builder:9222',
//       browserWSEndpoint: 'ws://web-builder:9222',
//     });
//     const page = await browser.newPage();
//     await page.goto('about:blank');
//     await browser.disconnect();
//   } catch (e) {
//     console.error(e)
//   }

//   return;
// }

// main()

import puppeteer from 'puppeteer-core';
import http from 'http';
import dns from 'dns';

async function debugConnection() {
  // const host = 'web-builder';

  // const host = 'webtests';
  // const port = 9223;
  // const url = `http://${host}:${port}/json/version`;

  // Manually resolve the IP to bypass the Host Header check
  const { address } = await dns.promises.lookup('webtests');
  const url = `http://${address}:9223/json/version`;
  const host = address;

  console.log(`[CLIENT] Attempting to reach ${url}...`);

  // 1. Log Network Info

  dns.lookup(host, (err, address) => {
    console.log(`[CLIENT] DNS Lookup for "${host}": ${address || 'FAILED'} (${err ? err.message : 'OK'})`);
  });

  // 2. Try raw HTTP request to see exact error
  http.get(url, (res) => {
    let data = '';
    console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);

    res.on('data', (chunk) => data += chunk);
    res.on('end', async () => {
      try {
        const json = JSON.parse(data);
        console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);

        // Connect via Puppeteer
        const browser = await puppeteer.connect({
          browserWSEndpoint: json.webSocketDebuggerUrl
        });
        console.log('[CLIENT] Puppeteer Connected!');
        await browser.disconnect();
      } catch (e) {
        console.error('[CLIENT] Failed to parse JSON or connect:', e.message);
        console.log('[CLIENT] Raw Data received:', data);
      }
    });
  }).on('error', (err) => {
    console.error('[CLIENT] HTTP Request Failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('[CLIENT] HINT: The port is closed or Chromium isn\'t binding to 0.0.0.0');
    } else if (err.code === 'ENOTFOUND') {
      console.error('[CLIENT] HINT: Docker cannot find the service name "web-builder"');
    }
  });
}

debugConnection();