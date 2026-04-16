
import BaseTiposkripto from "./BaseTiposkripto";
import {
  TestTypeParams_any,
  TestSpecShape_any,
  ITestSpecification,
  ITestImplementation,
  ITestAdapter,
} from "./CoreTypes";
import { ITTestResourceRequest, defaultTestResourceRequirement } from "./types";

// Check if we're in a browser environment
const isBrowser =
  typeof globalThis !== "undefined" && (globalThis as any).window !== undefined;

declare global {
  interface Window {
    testResourceConfig?: any;
    __writeFile?: (filename: string, payload: string) => void;
    __screenshot?: (filename: string, payload?: string) => void;
  }
}

export abstract class WebTiposkripto<
  I extends TestTypeParams_any,
  O extends TestSpecShape_any,
  M,
> extends BaseTiposkripto<I, O, M> {
  constructor(testSpecification: ITestSpecification<I, O>) {
    let testResourceConfig = {};
    if (isBrowser) {
      const win = (globalThis as any).window;
      if (win) {
        // First try to get config from window.testResourceConfig (set by hoist.ts)
        if (win.testResourceConfig) {
          testResourceConfig = win.testResourceConfig;
        } else {
          // Fallback to URL params for backward compatibility
          const urlParams = new URLSearchParams(win.location.search);
          const encodedConfig = urlParams.get("config");
          if (encodedConfig) {
            try {
              testResourceConfig = JSON.parse(
                decodeURIComponent(encodedConfig),
              );
            } catch (e) {
              console.error("Failed to parse config from URL:", e);
              testResourceConfig = {};
            }
          } else {
            testResourceConfig = {};
          }
        }
      }
    }

    // Ensure we have an object with fs property
    if (typeof testResourceConfig === "string") {
      try {
        testResourceConfig = JSON.parse(testResourceConfig);
      } catch (e) {
        console.error("Failed to parse testResourceConfig as JSON:", e);
        testResourceConfig = {};
      }
    }

    if (!testResourceConfig || typeof testResourceConfig !== "object") {
      testResourceConfig = {};
    }

    // Ensure fs path is set for web tests
    if (!testResourceConfig.fs) {
      // Try to construct a default path based on the test name or URL
      // For web tests, we need a reports directory
      // Try to get the current URL or test name
      let testPath = "unknown-test";
      if (isBrowser) {
        const win = (globalThis as any).window;
        if (win && win.location) {
          const url = win.location.href;
          // Extract test name from URL
          const match = url.match(/([^/]+)\.(test|spec)\.[^/]+$/);
          if (match) {
            testPath = match[0];
          }
        }
      }
      testResourceConfig.fs = `testeranto/reports/webtests/${testPath}`;
      console.log(
        `[WebTiposkripto] Constructed default fs path: ${testResourceConfig.fs}`,
      );
    }

    console.log(
      "[WebTiposkripto] testResourceConfig:",
      JSON.stringify(testResourceConfig),
    );

    super(testSpecification, testResourceConfig);
    this.initialize();

    console.log(
      "[WebTiposkripto] testResourceConfiguration.fs:",
      this.testResourceConfiguration?.fs,
    );
  }

  writeFileSync(filename: string, payload: string): void {
    // Call the exposed function from the hoist
    // This will throw if __writeFile is not exposed, which is what we want
    if (isBrowser) {
      const win = (globalThis as any).window;
      if (win && win.__writeFile) {
        win.__writeFile(filename, payload);
      } else {
        console.error("__writeFile not available");
      }
    } else {
      console.error("Not in browser environment");
    }
  }

  // screenshot, openScreencast, and closeScreencast are only applicable to web runtime
  // These methods capture visual artifacts in browser environments
  screenshot(filename: string, payload?: string): void {
    console.log("screenshot", filename, payload);

    if (isBrowser) {
      const win = (globalThis as any).window;
      if (win && win.__screenshot) {
        win.__screenshot(filename, payload);
      } else {
        console.error("__screenshot not available");
      }
    } else {
      console.error("Not in browser environment");
    }
  }

  async openScreencast(filename: string): Promise<void> {
    console.log("openScreencast", filename);
    if (isBrowser) {
      const win = (globalThis as any).window;
      if (win && win.__openScreencast) {
        await win.__openScreencast(filename);
      } else {
        console.error("__openScreencast not available");
      }
    } else {
      console.error("Not in browser environment");
    }
  }

  async closeScreencast(filename: string): Promise<void> {
    console.log("closeScreencast", filename);
    if (isBrowser) {
      const win = (globalThis as any).window;
      if (win && win.__closeScreencast) {
        await win.__closeScreencast(filename);
      } else {
        console.error("__closeScreencast not available");
      }
    } else {
      console.error("Not in browser environment");
    }
  }

  // Override createArtifactory to add web-specific methods
  createArtifactory(
    context: {
      suiteIndex?: number;

      givenKey?: string;
      whenIndex?: number;
      thenIndex?: number;

      describeIndex?: number;
      itIndex?: number;

      confirmKey?: string;
      valueKey?: string;
      shouldIndex?: number;
      expectKey?: number;

    } = {},
  ) {
    const baseArtifactory = super.createArtifactory(context);

    // Add web-specific methods to the artifactory
    return {
      ...baseArtifactory,
      // screenshot, openScreencast, and closeScreencast are only applicable to web runtime
      // They capture visual artifacts in browser environments
      screenshot: (filename: string, payload?: string) => {
        // Construct the path based on context
        let path = "";

        // Start with the test resource configuration fs path
        const basePath = this.testResourceConfiguration?.fs || "testeranto";

        console.log("[Artifactory Screenshot] Base path:", basePath);
        console.log("[Artifactory Screenshot] Context:", context);

        // Add suite context if available
        if (context.suiteIndex !== undefined) {
          path += `suite-${context.suiteIndex}/`;
        }

        // Add given context if available
        if (context.givenKey) {
          path += `given-${context.givenKey}/`;
        }

        // Add when or then context
        if (context.whenIndex !== undefined) {
          path += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== undefined) {
          path += `then-${context.thenIndex} `;
        }

        // Add the filename
        path += filename;

        // Ensure it has a .png extension if not present
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".png";
        }

        // Prepend the base path, avoiding double slashes
        const basePathClean = basePath.replace(/\/$/, "");
        const pathClean = path.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;

        console.log("[Artifactory Screenshot] Full path:", fullPath);

        // Call the web implementation
        this.screenshot(fullPath, payload || "");
      },
      openScreencast: async (filename: string) => {
        // Construct the path based on context
        let path = "";

        // Start with the test resource configuration fs path
        const basePath = this.testResourceConfiguration?.fs || "testeranto";

        console.log("[Artifactory openScreencast] Base path:", basePath);
        console.log("[Artifactory openScreencast] Context:", context);

        // Add suite context if available
        if (context.suiteIndex !== undefined) {
          path += `suite-${context.suiteIndex}/`;
        }

        // Add given context if available
        if (context.givenKey) {
          path += `given-${context.givenKey}/`;
        }

        // Add when or then context
        if (context.whenIndex !== undefined) {
          path += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== undefined) {
          path += `then-${context.thenIndex} `;
        }

        // Add the filename
        path += filename;

        // Ensure it has a .webm extension if not present
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".webm";
        }

        // Prepend the base path, avoiding double slashes
        const basePathClean = basePath.replace(/\/$/, "");
        const pathClean = path.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;

        console.log("[Artifactory openScreencast] Full path:", fullPath);

        // Call the web implementation
        await this.openScreencast(fullPath);
      },
      closeScreencast: async (filename: string) => {
        // Construct the path based on context
        let path = "";

        // Start with the test resource configuration fs path
        const basePath = this.testResourceConfiguration?.fs || "testeranto";

        console.log("[Artifactory closeScreencast] Base path:", basePath);
        console.log("[Artifactory closeScreencast] Context:", context);

        // Add suite context if available
        if (context.suiteIndex !== undefined) {
          path += `suite-${context.suiteIndex}/`;
        }

        // Add given context if available
        if (context.givenKey) {
          path += `given-${context.givenKey}/`;
        }

        // Add when or then context
        if (context.whenIndex !== undefined) {
          path += `when-${context.whenIndex} `;
        } else if (context.thenIndex !== undefined) {
          path += `then-${context.thenIndex} `;
        }

        // Add the filename
        path += filename;

        // Ensure it has a .webm extension if not present
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".webm";
        }

        // Prepend the base path, avoiding double slashes
        const basePathClean = basePath.replace(/\/$/, "");
        const pathClean = path.replace(/^\//, "");
        const fullPath = `${basePathClean}/${pathClean}`;

        console.log("[Artifactory closeScreencast] Full path:", fullPath);

        // Call the web implementation
        await this.closeScreencast(fullPath);
      },
    };
  }
}

export default WebTiposkripto;
