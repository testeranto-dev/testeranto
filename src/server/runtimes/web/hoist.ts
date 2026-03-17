import puppeteer, { ConsoleMessage } from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const esbuildUrlDomain = `http://webtests:8000/`;

// Get the config from command line arguments
const testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const reportBaseDir = testResourceConfig.fs || 'testeranto/reports/webtests';

// const relativePath = process.argv[2];
// const projectConfigPath = process.argv[3];
// const nodeConfigPath = process.argv[4];
// const testName = process.argv[5];
// const testResourceConfig = process.argv[5];

// const webEvaluator = (d, webArgz) => {
//   return `
// import('${d}').then(async (x) => {
//   try {
//     return await (await x.default).receiveTestResourceConfig(${webArgz})
//   } catch (e) {
//     console.log("web run failure", e.toString())
//   }
// })
// `;
// };

async function launchPuppeteer(browserWSEndpoint: string) {

  // Connect via Puppeteer
  const browser = await puppeteer.connect({
    browserWSEndpoint
  });

  const page = await browser.newPage();

  try {
    page.on("console", (log: ConsoleMessage) => {
      const msg = `${log.text()}\n`;
      switch (log.type()) {
        case "info":
          // logs.info?.write(msg);
          break;
        case "warn":
          // logs.warn?.write(msg);
          break;
        case "error":
          // logs.error?.write(msg);
          break;
        case "debug":
          // logs.debug?.write(msg);
          break;
        default:
          break;
      }
    });

    page.on("close", () => {
      // logs.writeExitCode(0);
      // logs.closeAll();
    });

    // Expose writeFile function to the browser
    await page.exposeFunction('__writeFile', (filePath: string, content: string) => {
      // Write to the filesystem directly
      // The path should be relative to the report directory from config
      const fullPath = path.join(process.cwd(), reportBaseDir, filePath);
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(fullPath, content);
      console.log(`[hoist] Wrote file: ${fullPath}`);
    });

    const close = () => {
      // Cleanup if needed
    };

    page.on("pageerror", (err: Error) => {
      // logs.info?.write("pageerror: " + err.message);
      console.error("Page error in web test:", err);
      // logs.writeExitCode(-1, err);
      // console.log(
      //   ansiColors.red(
      //     `web ! ${src} failed to execute. No "tests.json" file was generated. Check ${reportDest}/error.log for more info`
      //   )
      // );
      // this.bddTestIsNowDone(src, -1);
      close();
      throw err;
    });

    // Log console messages for debugging
    page.on("console", (msg) => {
      const text = msg.text();
      console.log(`Browser console [${msg.type()}]: ${text} ${JSON.stringify(msg.stackTrace())}`);
    });

    // const url = `${urlDomain}/testeranto/bundles/web/${relativePath}?config=${testResourceConfig}`;
    // Get the test bundle path from command line arguments
    const testBundlePath = process.argv[2];
    if (!testBundlePath) {
      throw new Error('Test bundle path not provided');
    }

    // Construct the URL for the test bundle
    // The bundle is served by esbuild at webtests:8000
    const bundleUrl = `${esbuildUrlDomain}${testBundlePath}`;
    console.log("bundleUrl", bundleUrl);

    // Navigate to a blank page
    await page.goto('about:blank', { waitUntil: 'networkidle0' });

    // Evaluate the test bundle directly
    // The bundle should export a default function that runs tests
    const testCode = `
      import('${bundleUrl}').then(async (module) => {
        try {
          const testRunner = module.default;
          await testRunner();
          return { success: true };
        } catch (error) {
          console.error('Test failed:', error);
          return { success: false, error: error.message };
        }
      });
    `;

    try {
      const result = await page.evaluate(testCode);
      console.log('Test evaluation result:', result);
      
      if (!result || !result.success) {
        throw new Error(`Test failed: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error running web test:', error);
      throw error;
    }

    await page.close();
    close();
  } catch (error) {
    console.error(`Error in web test:`, error);
    // this.bddTestIsNowDone(src, -1);
    throw error;
  }

}

async function connectWithRetry(retries = 30, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Connect to browserless/chrome service
      const url = `http://chrome-service:3000/json/version`;
      console.log(`[CLIENT] Attempt ${i + 1}/${retries}: Attempting to reach Chrome service at ${url}...`);

      const data = await new Promise<string>((resolve, reject) => {
        const req = http.get(url, (res) => {
          let data = '';
          console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);

          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });

      const json = JSON.parse(data);
      console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);
      await launchPuppeteer(json.webSocketDebuggerUrl);
      return; // Success
    } catch (e: any) {
      console.error(`[CLIENT] Attempt ${i + 1} failed:`, e.message);
      if (i < retries - 1) {
        console.log(`[CLIENT] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('[CLIENT] All connection attempts failed');
        throw e;
      }
    }
  }
}

// Start connection with retry
connectWithRetry();
