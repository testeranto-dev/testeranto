// src/server/runtimes/web/hoist.ts
import puppeteer from "puppeteer-core";
import http from "http";
import fs from "fs";
import path from "path";
var esbuildUrlDomain = `http://webtests:8000/`;
var testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
var reportBaseDir = testResourceConfig.fs || "testeranto/reports/webtests";
async function launchPuppeteer(browserWSEndpoint) {
  const browser = await puppeteer.connect({
    browserWSEndpoint
  });
  const page = await browser.newPage();
  try {
    page.on("console", (log) => {
      const msg = `${log.text()}
`;
      switch (log.type()) {
        case "info":
          break;
        case "warn":
          break;
        case "error":
          break;
        case "debug":
          break;
        default:
          break;
      }
    });
    page.on("close", () => {
    });
    await page.exposeFunction("__writeFile", (filePath, content) => {
      const fullPath = path.join(process.cwd(), reportBaseDir, filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content);
      console.log(`[hoist] Wrote file: ${fullPath}`);
    });
    const close = () => {
    };
    page.on("pageerror", (err) => {
      console.error("Page error in web test:", err);
      close();
      throw err;
    });
    page.on("console", (msg) => {
      const text = msg.text();
      console.log(`Browser console [${msg.type()}]: ${text} ${JSON.stringify(msg.stackTrace())}`);
    });
    const testBundlePath = process.argv[2];
    if (!testBundlePath) {
      throw new Error("Test bundle path not provided");
    }
    const bundleUrl = `${esbuildUrlDomain}${testBundlePath}`;
    console.log("bundleUrl", bundleUrl);
    await page.goto("about:blank", { waitUntil: "networkidle0" });
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
      console.log("Test evaluation result:", result);
      if (!result || !result.success) {
        throw new Error(`Test failed: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error running web test:", error);
      throw error;
    }
    await page.close();
    close();
  } catch (error) {
    console.error(`Error in web test:`, error);
    throw error;
  }
}
async function connectWithRetry(retries = 30, delay = 2e3) {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `http://chrome-service:3000/json/version`;
      console.log(`[CLIENT] Attempt ${i + 1}/${retries}: Attempting to reach Chrome service at ${url}...`);
      const data = await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          let data2 = "";
          console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);
          res.on("data", (chunk) => data2 += chunk);
          res.on("end", () => resolve(data2));
        });
        req.on("error", reject);
        req.setTimeout(1e4, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
      const json = JSON.parse(data);
      console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);
      await launchPuppeteer(json.webSocketDebuggerUrl);
      return;
    } catch (e) {
      console.error(`[CLIENT] Attempt ${i + 1} failed:`, e.message);
      if (i < retries - 1) {
        console.log(`[CLIENT] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("[CLIENT] All connection attempts failed");
        throw e;
      }
    }
  }
}
connectWithRetry();
