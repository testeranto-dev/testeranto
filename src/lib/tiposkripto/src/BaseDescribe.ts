import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseDescribe extends BaseSetup for Describe-It pattern (AAA).
 * Describe can be nested, and Its can mix mutations and assertions.
 */
export class BaseDescribe<I extends TestTypeParams_any> extends BaseSetup<I> {
  /**
   * Abstract method to be implemented by concrete Describe classes.
   * Sets up the initial state for the Describe-It pattern (AAA Arrange phase).
   * 
   * @param subject The test subject
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @param setupCB Setup callback function
   * @param initialValues Initial values for setup
   * @returns Promise resolving to the test store
   */
  abstract setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]>;
  
  // Its can be nested Describes or actual Its
  its: any[];
  
  constructor(
    features: string[],
    its: any[],
    describeCB: I["given"],
    initialValues: any,
  ) {
    // Map its to actions and checks
    // Since Its can mix mutations and assertions, we need to handle them differently
    super(features, its, [], describeCB, initialValues);
    this.its = its;
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
              suiteNdx
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
              if (typeof result === 'boolean' || result === null || result === undefined) {
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
}

export type IDescribes<I extends TestTypeParams_any> = Record<string, BaseDescribe<I>>;
