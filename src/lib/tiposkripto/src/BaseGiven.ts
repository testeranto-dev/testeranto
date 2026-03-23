import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
import { BaseSetup } from "./BaseSetup.js";

/**
 * Represents a collection of Given conditions keyed by their names.
 * Givens are typically organized as named collections because:
 * - They set up different initial states for tests
 * - Tests often need to reference specific Given conditions by name
 * - This allows for better organization and reuse of setup logic
 * - The BDD pattern often involves multiple named Given scenarios
 */
export type IGivens<I extends TestTypeParams_any> = Record<
  string,
  BaseGiven<I>
>;

/**
 * BaseGiven extends BaseSetup for BDD pattern.
 */
export abstract class BaseGiven<
  I extends TestTypeParams_any,
> extends BaseSetup<I> {
  declare features: string[];
  declare whens: any[];
  declare thens: any[];
  declare error: Error;
  declare fail: any;
  declare store: I["istore"];
  declare recommendedFsPath: string;
  declare givenCB: I["given"];
  declare initialValues: any;
  declare key: string;
  declare failed: boolean;
  artifacts: string[] = [];
  fails: number = 0;

  declare status: boolean | undefined;

  addArtifact(path: string) {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path,
        )}`,
      );
    }
    const normalizedPath = path.replace(/\\/g, "/"); // Normalize path separators
    this.artifacts.push(normalizedPath);
  }

  constructor(
    features: string[],
    whens: any[],
    thens: any[],
    givenCB: I["given"],
    initialValues: any,
  ) {
    // Map whens to actions, thens to checks
    super(features, whens, thens, givenCB, initialValues);
    // Store a reference to the parent BaseTiposkripto instance
    // This will be set by BaseTiposkripto when creating the instance
    (this as any)._parent = null;
    // Ensure whens and thens are arrays
    this.whens = whens || [];
    this.thens = thens || [];
    // Store the givenCB
    this.givenCB = givenCB;
    console.log(`[BaseGiven.constructor] _parent initialized to null`);
    console.log(`[BaseGiven.constructor] whens:`, this.whens.length);
    console.log(`[BaseGiven.constructor] thens:`, this.thens.length);
  }

  // Set the parent explicitly
  setParent(parent: any) {
    (this as any)._parent = parent;
    console.log(`[BaseGiven.setParent] _parent set to:`, parent);
  }

  beforeAll(store: I["istore"]) {
    return store;
  }

  toObj() {
    const whens = this.whens || [];
    const thens = this.thens || [];
    return {
      key: this.key,
      actions: whens.map((w) => {
        if (w && w.toObj) return w.toObj();
        console.error("When step is not as expected!", JSON.stringify(w));
        return {};
      }),
      checks: thens.map((t) => (t && t.toObj ? t.toObj() : {})),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }

  /**
   * Abstract method to be implemented by concrete Given classes.
   * Sets up the initial state for the BDD Given phase.
   * 
   * @param subject The test subject
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @param givenCB Given callback function
   * @param initialValues Initial values for setup
   * @returns Promise resolving to the test store
   */
  abstract givenThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    givenCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]>;

  // Implement BaseSetup's abstract method
  async setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]> {
    return this.givenThat(
      subject,
      testResourceConfiguration,
      artifactory,
      setupCB,
      initialValues,
    );
  }

  async afterEach(
    store: I["istore"],
    key: string,
    artifactory: ITestArtifactory,
  ): Promise<I["istore"]> {
    return store;
  }

  async give(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: any,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;

    // Store suite index for use in artifactory creation
    (this as any)._suiteIndex = suiteNdx;

    // Create a proper artifactory if one isn't provided
    const actualArtifactory =
      artifactory || this.createDefaultArtifactory(key, suiteNdx);

    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        actualArtifactory,
        this.givenCB,
        this.initialValues,
      );
      this.status = true;
    } catch (e: any) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }

    try {
      // Process whens
      const whens = this.whens || [];
      if (whens && Array.isArray(whens)) {
        for (const [whenNdx, whenStep] of whens.entries()) {
          try {
            // Create artifactory for when context
            const whenArtifactory = this.createArtifactoryForWhen(
              key,
              whenNdx,
              suiteNdx,
            );
            this.store = await whenStep.test(
              this.store,
              testResourceConfiguration,
              whenArtifactory,
            );
          } catch (e: any) {
            this.failed = true;
            this.fails++;
            this.error = e;
          }
        }
      } else {
        console.warn(`[BaseGiven.give] whens is not an array:`, whens);
      }

      // Process thens
      const thens = this.thens || [];
      if (thens && Array.isArray(thens)) {
        for (const [thenNdx, thenStep] of thens.entries()) {
          try {
            const filepath =
              suiteNdx !== undefined
                ? `suite-${suiteNdx}/given-${key}/then-${thenNdx}`
                : `given-${key}/then-${thenNdx}`;
            // Create artifactory for then context
            const thenArtifactory = this.createArtifactoryForThen(
              key,
              thenNdx,
              suiteNdx,
            );
            const t = await thenStep.test(
              this.store,
              testResourceConfiguration,
              filepath,
              thenArtifactory,
            );
            tester(t);
          } catch (e: any) {
            this.failed = true;
            this.fails++;
            this.error = e;
          }
        }
      } else {
        console.warn(`[BaseGiven.give] thens is not an array:`, thens);
      }
    } catch (e: any) {
      this.error = e;
      this.failed = true;
      this.fails++; // Increment fail count
    } finally {
      try {
        await this.afterEach(this.store, this.key, actualArtifactory);
      } catch (e: any) {
        this.failed = true;
        this.fails++; // Increment fail count
        this.error = e;
      }
    }

    return this.store;
  }

  private createDefaultArtifactory(givenKey: string, suiteNdx?: number) {
    // Try to get the parent BaseTiposkripto instance
    const self = this as any;
    console.log(`[BaseGiven.createDefaultArtifactory] self._parent:`, self._parent);
    console.log(`[BaseGiven.createDefaultArtifactory] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    
    // First, try to get artifactory from parent
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        suiteIndex: suiteNdx,
      });
      console.log(`[BaseGiven.createDefaultArtifactory] Created artifactory from parent:`, artifactory);
      return artifactory;
    }
    
    // If parent is not available, try to create a basic artifactory
    // Get the base path from testResourceConfiguration if available
    let basePath = "testeranto";
    if (self._parent && self._parent.testResourceConfiguration?.fs) {
      basePath = self._parent.testResourceConfiguration.fs;
      console.log(`[BaseGiven.createDefaultArtifactory] Using base path from parent: ${basePath}`);
    } else {
      console.log(`[BaseGiven.createDefaultArtifactory] Using default base path: ${basePath}`);
    }
    
    // Create a simple artifactory that writes to the filesystem
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += filename;
        
        // Ensure .txt extension
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".txt";
        }
        
        const fullPath = `${basePath}/${path}`;
        console.log(`[Artifactory] Writing to: ${fullPath}`);
        
        // Try to write using parent's writeFileSync if available
        if (self._parent && typeof self._parent.writeFileSync === 'function') {
          self._parent.writeFileSync(fullPath, payload);
        } else {
          console.log(`[Artifactory] Would write to: ${fullPath}`);
          console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
        }
      },
      screenshot: (filename: string, payload?: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += filename;
        
        // Ensure .png extension
        if (!path.match(/\.[a-zA-Z0-9]+$/)) {
          path += ".png";
        }
        
        const fullPath = `${basePath}/${path}`;
        console.log(`[Artifactory] Would take screenshot: ${fullPath}`);
        
        // Try to use parent's screenshot if available
        if (self._parent && typeof self._parent.screenshot === 'function') {
          self._parent.screenshot(fullPath, payload || "");
        }
      },
    };
  }

  private createArtifactoryForWhen(
    givenKey: string,
    whenIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    console.log(`[BaseGiven.createArtifactoryForWhen] self._parent:`, self._parent);
    console.log(`[BaseGiven.createArtifactoryForWhen] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        whenIndex,
        suiteIndex: suiteNdx,
      });
      console.log(`[BaseGiven.createArtifactoryForWhen] Created artifactory:`, artifactory);
      return artifactory;
    }
    console.log(`[BaseGiven.createArtifactoryForWhen] Using fallback artifactory`);
    // Fallback to logging
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += `when-${whenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename: string, payload?: string) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      },
    };
  }

  private createArtifactoryForThen(
    givenKey: string,
    thenIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    console.log(`[BaseGiven.createArtifactoryForThen] self._parent:`, self._parent);
    console.log(`[BaseGiven.createArtifactoryForThen] self._parent.createArtifactory:`, self._parent?.createArtifactory);
    if (self._parent && self._parent.createArtifactory) {
      const artifactory = self._parent.createArtifactory({
        givenKey,
        thenIndex,
        suiteIndex: suiteNdx,
      });
      console.log(`[BaseGiven.createArtifactoryForThen] Created artifactory:`, artifactory);
      return artifactory;
    }
    console.log(`[BaseGiven.createArtifactoryForThen] Using fallback artifactory`);
    // Fallback to logging
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `given-${givenKey}/`;
        path += `then-${thenIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename: string, payload?: string) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      },
    };
  }
}
