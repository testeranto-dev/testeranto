---
statu: in progress
---

We need to get the web runtime working again.

The web runtime is unique in that it runs in the browser and thus needs a node "hoist" to stand between the test-in-the-browser and the filesytem. In the past we have use cucumber's exposed functions to all the page to write to the file systems. We should consider if this architecture is really congruent with the other builders.

It's a long standing problem of bridging the chrome runtime and i am open to other solutions. An ideal solution would be to write the tests.json (and other files) to an in-browser and then download them after the test is done, to a particualr place. we can't let the browsers default download behvior takeover.

Included in this problem is the need to connect to a runnning the chrome-service, not the native host chrome.

````sh
yarn run v1.22.22

$ /workspace/node_modules/.bin/tsx /workspace/testeranto/web_hoist.ts testeranto/bundles/webtests/src/ts/Calculator.test.web.mjs '{"ports":[1111],"fs":"testeranto/reports/webtests/src/ts/Calculator.test.web.ts/"}'

[CLIENT] Attempt 1/30: Attempting to reach Chrome service at http://chrome-service:3000/json/version...⁠

[CLIENT] HTTP Status: 200

[CLIENT] Successfully fetched WS URL: ws://chrome-service:3000

bundleUrl http://webtests:8000/testeranto/bundles/webtests/src/ts/Calculator.test.web.mjs⁠

[CLIENT] Retrying in 2000ms...

[CLIENT] Attempt 2/30: Attempting to reach Chrome service at http://chrome-service:3000/json/version...⁠

Error in web test: Error: net::ERR_ABORTED at webtests:8000/testeranto/bundles/webtests/Calculator.test.web.html

    at navigate (/workspace/node_modules/puppeteer-core/src/cdp/Frame.ts:211:13)

    at async Function.race (/workspace/node_modules/puppeteer-core/src/util/Deferred.ts:49:14)

    at async CdpFrame.goto (/workspace/node_modules/puppeteer-core/src/cdp/Frame.ts:164:17)

    at async CdpPage.goto (/workspace/node_modules/puppeteer-core/src/api/Page.ts:1773:12)

    at async launchPuppeteer (/workspace/testeranto/web_hoist.ts:59:5)

    at async connectWithRetry (/workspace/testeranto/web_hoist.ts:109:7)
    ```
````
