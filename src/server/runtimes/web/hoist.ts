import puppeteer, { ConsoleMessage } from "puppeteer-core";
import http from "http";
import fs from "fs";
import path from "path";

// Note: esbuildUrlDomain will be determined inside launchPuppeteer
// after resolving the hostname to an IP address

// Get the config from command line arguments
const testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const reportBaseDir = testResourceConfig.fs || "testeranto/reports/webtests";

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

  page.on("close", () => {
    // logs.writeExitCode(0);
    // logs.closeAll();
  });

  // Expose writeFile function to the browser
  await page.exposeFunction(
    "__writeFile",
    (filePath: string, content: string) => {
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
    },
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

  // Read the .mjs bundle file from the filesystem
  console.log(`[hoist] Reading bundle from: ${testBundlePath}`);
  const bundleAbsolutePath = path.join(process.cwd(), testBundlePath);
  
  if (!fs.existsSync(bundleAbsolutePath)) {
    throw new Error(`Bundle file not found at ${bundleAbsolutePath}`);
  }
  
  const bundleContent = fs.readFileSync(bundleAbsolutePath, 'utf-8');
  console.log(`[hoist] Bundle size: ${bundleContent.length} characters`);
  
  // Get the test resource configuration from command line
  const testResourceConfig = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  console.log(`[hoist] Test resource config:`, testResourceConfig);
  
  // Create a blob URL for the bundle content
  // We'll inject it into the page using evaluate
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
    </script>
    <script type="module">
      // Create a blob with the bundle content
      const bundleContent = ${JSON.stringify(bundleContent)};
      const blob = new Blob([bundleContent], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Import the bundle
      import(blobUrl).then(module => {
        console.log('Test bundle loaded successfully from blob');
        // Check if the module has a default export
        if (module && module.default) {
          // If it's a function, call it with the test resource config
          if (typeof module.default === 'function') {
            // Pass the config to the test function
            return module.default(window.testResourceConfig);
          }
          // Otherwise, just use it as is
          console.log('Module loaded:', module);
        } else {
          console.log('Module loaded, but no default export:', module);
        }
      }).catch(error => {
        console.error('Failed to load test bundle:', error);
        console.error('Error stack:', error.stack);
      });
    </script>
</body>
</html>`;
  
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  console.log(`[hoist] Navigating to data URL with embedded bundle`);
  
  try {
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 10000 });
    console.log(`[hoist] Successfully navigated to data URL`);
    
    // Wait for tests to run
    console.log(`[hoist] Waiting for tests to execute...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page title for debugging
    const pageTitle = await page.title();
    console.log(`[hoist] Page title: ${pageTitle}`);
    
  } catch (e: any) {
    console.error(`[hoist] Failed to navigate to data URL: ${e.message}`);
    throw e;
  }

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
