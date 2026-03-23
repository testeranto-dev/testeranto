import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestResourceConfiguration } from "./types.js";
import { BaseCheck } from "./BaseCheck.js";

/**
 * BaseThen extends BaseCheck for BDD pattern.
 */
export abstract class BaseThen<
  I extends TestTypeParams_any,
> extends BaseCheck<I> {
  thenCB: (
    storeState: I["iselection"],
  ) => Promise<I["then"]>;

  constructor(
    name: string,
    thenCB: (val: I["iselection"]) => Promise<I["then"]>,
  ) {
    super(name, thenCB);
    this.thenCB = thenCB;
  }

  /**
   * Abstract method to be implemented by concrete Then classes.
   * Performs the verification for the BDD Then phase.
   * 
   * @param store The test store
   * @param thenCB Then callback function
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @returns Promise resolving to the selection for verification
   */
  abstract butThen(
    store: I["istore"],
    thenCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: any,
  ): Promise<I["iselection"]>;

  // Implement the abstract verifyCheck method from BaseCheck
  async verifyCheck(
    store: I["istore"],
    checkCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: any,
  ): Promise<I["iselection"]> {
    return this.butThen(store, checkCB, testResourceConfiguration, artifactory);
  }

  async test(
    store: I["istore"],
    testResourceConfiguration: ITestResourceConfiguration,
    filepath: string,
    artifactory?: any,
  ): Promise<I["then"] | undefined> {
    try {
      const x = await this.butThen(
        store,
        async (s: I["iselection"]) => {
          try {
            if (typeof this.thenCB === "function") {
              const result = await this.thenCB(s);
              return result;
            } else {
              return this.thenCB;
            }
          } catch (e) {
            this.error = true;
            throw e;
          }
        },
        testResourceConfiguration,
        artifactory as any,
      );
      this.status = true;
      return x;
    } catch (e) {
      this.status = false;
      this.error = true;
      throw e;
    }
  }
}
/**
 * Represents a collection of Then assertions keyed by their names.
 * Thens are typically part of Given definitions rather than standalone collections,
 * but this type exists for consistency and potential future use cases where:
 * - Assertions might need to be reused or composed dynamically
 * - Custom assertion libraries could benefit from named assertion collections
 * - Advanced validation patterns require named Then conditions
 */
export type IThens<I extends TestTypeParams_any> = Record<string, BaseThen<I>>;
