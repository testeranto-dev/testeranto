import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseDescribe extends BaseSetup for Describe-It pattern (AAA).
 * Describe can be nested, and Its can mix mutations and assertions.
 */
export abstract class BaseDescribe<
  I extends TestTypeParams_any,
> extends BaseSetup<I> {
  /**
   * Sets up the initial state for the Describe-It pattern (AAA Arrange phase).
   *
   * @param subject The test subject
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @param setupCB Setup callback function
   * @param initialValues Initial values for setup
   * @returns Promise resolving to the test store
   */
  async setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]> {
    // Default implementation: call setupCB and return the result
    const result = (setupCB as any)();
    if (typeof result === "function") {
      return result();
    }
    return result;
  }

  // Its can be nested Describes or actual Its
  its: any[];

  constructor(
    features: string[],
    its: any[] | any,
    describeCB: I["given"],
    initialValues: any,
  ) {
    // Ensure its is always an array
    const itsArray = Array.isArray(its) ? its : (its !== undefined ? [its] : []);
    // Map its to actions and checks
    // Since Its can mix mutations and assertions, we need to handle them differently
    super(features, itsArray, [], describeCB, initialValues);
    this.its = itsArray;
  }

  // Override setup to handle Its differently
  async setup(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;

    const actualArtifactory =
      artifactory || ((fPath: string, value: unknown) => { });
    const describeArtifactory = (fPath: string, value: unknown) =>
      actualArtifactory(`describe-${key}/${fPath}`, value);

    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        describeArtifactory,
        this.setupCB,
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
      // Process Its
      for (const [itNdx, itStep] of (this.its || []).entries()) {
        try {
          // Create artifactory for it context
          const itArtifactory = this.createArtifactoryForIt(
            key,
            itNdx,
            suiteNdx,
          );

          // Check if it's a nested Describe
          if (itStep && itStep instanceof BaseDescribe) {
            // Process nested Describe
            const nestedResult = await itStep.setup(
              this.store,
              `${key}.nested${itNdx}`,
              testResourceConfiguration,
              tester,
              itArtifactory,
              suiteNdx,
            );
            this.store = nestedResult;
          } else {
            // Process regular It (which can mix mutations and assertions)
            const result = await itStep.test(
              this.store,
              testResourceConfiguration,
              itArtifactory,
            );
            // It may return a new store or an assertion result
            if (result !== undefined) {
              // If it returns something, it might be a new store state
              // or an assertion result to test
              if (
                typeof result === "boolean" ||
                result === null ||
                result === undefined
              ) {
                // Likely an assertion result
                tester(result);
              } else {
                // Likely a new store state
                this.store = result;
              }
            }
          }
        } catch (e: any) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
    } catch (e: any) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, describeArtifactory);
      } catch (e: any) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }

    return this.store;
  }

  private createArtifactoryForIt(
    key: string,
    itIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        describeKey: key,
        itIndex: itIndex,
        suiteIndex: suiteNdx,
      });
    }
    // Fallback to logging
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `describe-${key}/`;
        path += `it-${itIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename: string, payload?: string) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      },
    };
  }

  // Add describe method that delegates to setup
  async describe(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: any,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: any,
    suiteNdx?: number,
  ) {
    return this.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
  }

  toObj() {
    // Handle its which might not be an array
    const its = this.its;
    const describes: any[] = [];
    const itsArray: any[] = [];
    
    if (Array.isArray(its)) {
      for (const item of its) {
        if (item && item.toObj) {
          const obj = item.toObj();
          // Check if it's a Describe or It based on the object structure
          if (obj.describes !== undefined || obj.its !== undefined) {
            // This is likely a Describe
            describes.push(obj);
          } else {
            // This is likely an It
            itsArray.push(obj);
          }
        } else {
          console.error("Item is not as expected!", JSON.stringify(item));
        }
      }
    } else if (its) {
      console.warn("its is not an array:", its);
      if (its.toObj) {
        const obj = its.toObj();
        if (obj.describes !== undefined || obj.its !== undefined) {
          describes.push(obj);
        } else {
          itsArray.push(obj);
        }
      } else {
        itsArray.push(its);
      }
    }
    
    return {
      key: this.key,
      describes: describes,
      its: itsArray,
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }
}

export type IDescribes<I extends TestTypeParams_any> = Record<
  string,
  BaseDescribe<I>
>;
