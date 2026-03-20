import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";
import { BaseCheck } from "./BaseCheck.js";

/**
 * BaseThen extends BaseCheck for BDD pattern.
 * @deprecated Use BaseCheck for unified terminology
 */
export abstract class BaseThen<I extends TestTypeParams_any> extends BaseCheck<I> {
  thenCB: (
    storeState: I["iselection"]
    // pm: IPM
  ) => Promise<I["then"]>;

  constructor(
    name: string,
    thenCB: (val: I["iselection"]) => Promise<I["then"]>
  ) {
    super(name, thenCB);
    this.thenCB = thenCB;
  }

  abstract butThen(
    store: I["istore"],
    thenCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration
  ): // pm: IPM
    Promise<I["iselection"]>;

  async test(
    store: I["istore"],
    testResourceConfiguration,
    // tLog: ITLog,
    // pm: IPM,
    filepath: string
  ): Promise<I["then"] | undefined> {
    // Ensure addArtifact is properly bound to 'this'
    const addArtifact = this.addArtifact.bind(this);
    // const proxiedPm = butThenProxy(pm, filepath, addArtifact);

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
            // Mark this then step as failed
            this.error = true;
            // Re-throw to be caught by the outer catch block
            throw e;
          }
        },
        testResourceConfiguration
        // proxiedPm
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
 * @deprecated Use IChecks for unified terminology
 */
export type IThens<I extends TestTypeParams_any> = Record<string, BaseThen<I>>;
