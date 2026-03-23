import puppeteer, { ConsoleMessage } from "puppeteer-core";
import http from "http";
import fs from "fs";
import path from "path";

// Note: esbuildUrlDomain will be determined inside launchPuppeteer
// after resolving the hostname to an IP address

const testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const reportBaseDir = testResourceConfig.fs || "testeranto/reports/webtests";

async function launchPuppeteer(browserWSEndpoint: string) {
  // Connect via Puppeteer
  const browser = await puppeteer.connect({
    browserWSEndpoint,
  });

  const page = await browser.newPage();

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

  page.on("close", async () => {
    console.log(`[hoist] Page closing, current screencast path:`, currentScreencastPath);
    // Close active screencast session if exists
    // if (currentScreencastPath) {
    //   console.log(`[hoist] Stopping screencast on page close`);
    //   try {
    //     await page.stopScreencast();
    //   } catch (e) {
    //     console.error(`[hoist] Error stopping screencast:`, e);
    //   }
    //   currentScreencastPath = null;
    // }
    // console.log(`[hoist] Screencast cleaned up`);
  });

  // Expose writeFile function to the browser
  await page.exposeFunction(
    "__writeFile",
    (filePath: string, content: string) => {
      // The filePath from the artifactory is already the full path relative to workspace
      // e.g., "testeranto/suite-0/screenshot2.png"
      // We need to make it absolute by joining with process.cwd()
      const fullPath = path.join(process.cwd(), filePath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(fullPath, content);
      console.log(`[hoist] Wrote file: ${fullPath}`);
    },
  );

  await page.exposeFunction(
    "__screenshot",
    async (filePath: string) => {
      console.log("__screenshot", filePath);
      // The filePath from the artifactory is already the full path relative to workspace
      // e.g., "testeranto/suite-0/screenshot2.png"
      // We need to make it absolute by joining with process.cwd()
      const absolutePath = path.join(process.cwd(), filePath);

      // Ensure the directory exists
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await page.screenshot({
        path: absolutePath,
      });
      console.log(`[hoist] Saved screenshot to: ${absolutePath}`);
    },
  );

  // Store screencast recorders
  let currentScreencastPath: string | null = null;
  const screencastRecorders = new Map<string, any>();

  await page.exposeFunction(
    "__openScreencast",
    async (filePath: string) => {
      console.log("__openScreencast called with:", filePath);
      console.log(`[hoist] Current screencast path:`, currentScreencastPath);

      const absolutePath = path.join(process.cwd(), filePath);

      // Ensure the directory exists
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (currentScreencastPath === filePath) {
        throw "you can't screen multiple times to the same file"
      }

      // If there's already a screencast running, stop it first
      if (currentScreencastPath) {
        console.log(`[hoist] Stopping current screencast at ${currentScreencastPath} before starting new one`);
        const existingRecorder = screencastRecorders.get(currentScreencastPath);
        if (existingRecorder) {
          if (typeof existingRecorder.stop === 'function') {
            await existingRecorder.stop();
          } else if (typeof page.stopScreencast === 'function') {
            await page.stopScreencast();
          }
          screencastRecorders.delete(currentScreencastPath);
        }
      }

      // Start screencast using Puppeteer's API
      // Check which method is available
      let recorder;
      if (typeof page.screencast === 'function') {
        recorder = await page.screencast({ path: absolutePath });
      } else if (typeof page.startScreencast === 'function') {
        await page.startScreencast({
          format: 'png',
          quality: 80,
          maxWidth: 1920,
          maxHeight: 1080
        });
        // For startScreencast, we need to handle frames manually
        // Store the recorder info
        recorder = {
          stop: async () => {
            await page.stopScreencast();
          }
        };
      } else {
        throw new Error('Neither page.screencast() nor page.startScreencast() methods are available');
      }

      currentScreencastPath = filePath;
      // Store the recorder if we have one
      if (recorder) {
        screencastRecorders.set(filePath, recorder);
      }
    },
  );

  await page.exposeFunction(
    "__closeScreencast",
    async (filePath: string) => {
      console.log("__closeScreencast called with:", filePath);
      console.log(`[hoist] Current screencast path:`, currentScreencastPath);

      if (currentScreencastPath !== filePath) {
        console.log(`[hoist] No screencast session found for ${filePath} (current is ${currentScreencastPath})`);
        return;
      }

      const absolutePath = path.join(process.cwd(), filePath);
      console.log(`[hoist] Stopping screencast to: ${absolutePath}`);

      // Stop screencast using Puppeteer's API
      const recorder = screencastRecorders.get(filePath);
      if (recorder) {
        if (typeof recorder.stop === 'function') {
          await recorder.stop();
        } else if (typeof page.stopScreencast === 'function') {
          await page.stopScreencast();
        }
        screencastRecorders.delete(filePath);
      }
      currentScreencastPath = null;
    }
  );

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
    console.log(
      `Browser console [${msg.type()}]: ${text} ${JSON.stringify(msg.stackTrace())}`,
    );
  });

  // Get the test bundle path from command line arguments
  const testBundlePath = process.argv[2];
  if (!testBundlePath) {
    throw new Error("Test bundle path not provided");
  }

  // Get the test resource configuration from command line
  const testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  console.log(`[hoist] Test resource config:`, testResourceConfig);

  // Read the bundle file from the filesystem
  const bundleAbsolutePath = path.join(process.cwd(), testBundlePath);
  console.log(`[hoist] Reading bundle from: ${bundleAbsolutePath}`);

  if (!fs.existsSync(bundleAbsolutePath)) {
    throw new Error(`Bundle file not found at ${bundleAbsolutePath}`);
  }

  const bundleContent = fs.readFileSync(bundleAbsolutePath, 'utf-8');
  console.log(`[hoist] Bundle size: ${bundleContent.length} characters`);

  // Create a simple HTML page that will load the bundle via page.evaluate
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Runner</title>

</head>
<body>
    <div id="root"></div>
    <script>
      // Inject the test resource configuration as a global variable
      window.testResourceConfig = ${JSON.stringify(testResourceConfig)};
      console.log('Test resource config injected:', window.testResourceConfig);
      
      // This will be populated by page.evaluate
      window.bundleContent = null;
    </script>
</body>
</html>`;

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  console.log(`[hoist] Navigating to data URL`);

  try {
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 60000 });
    console.log(`[hoist] Successfully navigated to data URL`);

    // Now inject the bundle content and execute it
    console.log(`[hoist] Injecting and executing bundle...`);
    await page.evaluate(async (content) => {
      try {
        // Create a blob with the bundle content
        const blob = new Blob([content], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        console.log('Starting to load bundle from blob URL');
        const module = await import(blobUrl);
        console.log('Test bundle loaded successfully from blob');

        // Check if the module has a default export
        if (module && module.default) {
          // If it's a function, call it with the test resource config
          if (typeof module.default === 'function') {
            // Pass the config to the test function
            await module.default(window.testResourceConfig);
          } else {
            // Otherwise, just use it as is
            console.log('Module loaded:', module);
          }
        } else {
          console.log('Module loaded, but no default export:', module);
        }

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Failed to load test bundle:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        throw error;
      }
    }, bundleContent);

    // Wait for tests to run - give more time
    console.log(`[hoist] Waiting for tests to execute...`);
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check page title for debugging
    const pageTitle = await page.title();
    console.log(`[hoist] Page title: ${pageTitle}`);

  } catch (e: any) {
    console.error(`[hoist] Failed to navigate to data URL: ${e.message}`);
    throw e;
  }

  // Wait for any pending operations
  console.log(`[hoist] Waiting for pending operations...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if there are any active screencast sessions
  console.log(`[hoist] Active screencast sessions before closing: ${screencastRecorders.size}`);

  // Close the page and browser
  await page.close();
  await browser.disconnect();
}
//     // Try to navigate to the HTML file
//     try {

//     } catch (error) {
//       console.error("Failed to navigate to HTML file:", error);
//       // Fall back to data URL approach
//       console.log("Falling back to data URL approach...");

//       // Create an HTML page that imports the bundle directly
//       // Use a data URL to avoid file serving issues
//       const htmlContent = `<!DOCTYPE html>
// <html>
// <head>
//     <meta charset="UTF-8">
//     <title>Test Runner</title>
// </head>
// <body>
//     <div id="root"></div>
//     <script type="module">
//         // Import the test bundle
//         import('${bundleUrl}').then(async (module) => {
//             try {
//                 const testRunner = module.default;
//                 if (typeof testRunner === 'function') {
//                     await testRunner();
//                 } else {
//                     console.error('Test bundle does not export a default function');
//                 }
//             } catch (error) {
//                 console.error('Error running tests:', error);
//             }
//         });
//     </script>
// </body>
// </html>`;

//       // Convert to data URL
//       const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

//       // Navigate to the data URL
//       await page.goto(dataUrl, { waitUntil: 'networkidle0' });
//     }

//     // Wait a bit for tests to run
//     await new Promise(resolve => setTimeout(resolve, 3000));
//     await page.close();
//     close();
//   } catch (error) {
//     console.error(`Error in web test:`, error);
//     // this.bddTestIsNowDone(src, -1);
//     throw error;
//   }

async function connectWithRetry(retries = 30, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Connect to browserless/chrome service
      const url = `http://chrome-service:3000/json/version`;
      console.log(
        `[CLIENT] Attempt ${i + 1}/${retries}: Attempting to reach Chrome service at ${url}...`,
      );

      const data = await new Promise<string>((resolve, reject) => {
        const req = http.get(url, (res) => {
          let data = "";
          console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);

          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        });

        req.on("error", reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });

      const json = JSON.parse(data);
      console.log(
        `[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`,
      );
      await launchPuppeteer(json.webSocketDebuggerUrl);
      return; // Success
    } catch (e: any) {
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

// Start connection with retry
connectWithRetry();
