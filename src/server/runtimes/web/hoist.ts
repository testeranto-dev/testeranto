import puppeteer, { ConsoleMessage } from 'puppeteer-core';
import http from 'http';

const esbuildUrlDomain = `http://webtests:8000/`;

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

    // Note: Functions are no longer exposed via page.exposeFunction()
    // The web tests should use PM_Web which communicates via WebSocket
    // PM_Web is instantiated in the browser context and connects to the WebSocket server

    const close = () => {
      // logs.info?.write("close2");
      // if (!files[src]) {
      //   files[src] = new Set();
      // }
      // delete files[src];
      // Promise.all(screenshots[src] || []).then(() => {
      //   delete screenshots[src];
      // });
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
    const htmlUrl = `${esbuildUrlDomain}testeranto/bundles/webtests/src/ts/Calculator.test.ts.html`;
    console.log("htmlUrl", htmlUrl);

    // Navigate to the HTML page with the config in the query parameter
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });

    // The HTML page loads the JS bundle, but we need to actually run the test
    // Use webEvaluator to import and run the test module
    // First, get the JS file path from the dest
    // const jsPath = `${esbuildUrlDomain}testeranto/bundles/webtests/src/ts/Calculator.test.mjs`;
    // // Convert to relative URL for the browser
    // let jsRelativePath: string;
    // const jsMatch = jsPath.match(/testeranto\/bundles\/web\/(.*)/);
    // if (jsMatch) {
    //   jsRelativePath = jsMatch[1];
    // } else {
    //   const jsAbsMatch = jsPath.match(/\/bundles\/web\/(.*)/);
    //   if (jsAbsMatch) {
    //     jsRelativePath = jsAbsMatch[1];
    //   } else {
    //     jsRelativePath = path.basename(jsPath);
    //   }
    // }
    // const jsUrl = `${esbuildUrlDomain}${jsRelativePath}?cacheBust=${Date.now()}`;

    // // Evaluate the test using webEvaluator
    // const evaluation = webEvaluator(jsUrl, testResourceConfig);
    // console.log("jsUrl", jsUrl);

    // try {
    //   const results = (await page.evaluate(evaluation)) as IFinalResults;
    //   const { fails, failed, features } = results;
    //   // logs.info?.write("\n idk1");
    //   // statusMessagePretty(fails, src, "web");
    //   // this.bddTestIsNowDone(src, fails);
    // } catch (error) {
    //   console.error("Error evaluating web test:", error);
    //   // logs.info?.write("\n Error evaluating web test");
    //   // statusMessagePretty(-1, src, "web");
    //   // this.bddTestIsNowDone(src, -1);
    // }

    // Generate prompt files for Web tests
    // generatePromptFiles(reportDest, src);

    await page.close();
    close();
  } catch (error) {
    console.error(`Error in web test:`, error);
    // this.bddTestIsNowDone(src, -1);
    throw error;
  }

}

async function connect() {
  // Connect to Chrome standalone service
  const url = `http://chrome-service:9222/json/version`;
  console.log(`[CLIENT] Attempting to reach Chrome service at ${url}...`);

  const req = http.get(url, (res) => {
    let data = '';
    console.log(`[CLIENT] HTTP Status: ${res.statusCode}`);

    res.on('data', (chunk) => data += chunk);
    res.on('end', async () => {
      try {
        const json = JSON.parse(data);
        console.log(`[CLIENT] Successfully fetched WS URL: ${json.webSocketDebuggerUrl}`);
        await launchPuppeteer(json.webSocketDebuggerUrl);
      } catch (e: any) {
        console.error('[CLIENT] Failed to parse JSON or connect:', e.message);
        console.log('[CLIENT] Raw Data received:', data);
        throw e;
      }
    });
  });

  req.on('error', (err) => {
    console.error('[CLIENT] HTTP Request Failed:', err.message);
    throw err;
  });

  req.setTimeout(5000, () => {
    console.log('[CLIENT] Request timeout');
    req.destroy();
    throw new Error('Timeout');
  });
}

// Start connection
connect();
