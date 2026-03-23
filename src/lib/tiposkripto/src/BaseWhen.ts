import type { TestTypeParams_any } from "./CoreTypes.js";
import { BaseAction } from "./BaseAction.js";

/**
 * BaseWhen extends BaseAction for BDD pattern.
 */
export abstract class BaseWhen<
  I extends TestTypeParams_any,
> extends BaseAction<I> {
  whenCB: (x: I["iselection"]) => I["then"];

  constructor(name: string, whenCB: (xyz: I["iselection"]) => I["then"]) {
    super(name, whenCB);
    this.whenCB = whenCB;
  }

  /**
   * Abstract method to be implemented by concrete When classes.
   * Performs the action for the BDD When phase.
   * 
   * @param store The test store
   * @param whenCB When callback function
   * @param testResource Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @returns Promise resolving to the result of the action
   */
  abstract andWhen(
    store: I["istore"],
    whenCB: (x: I["iselection"]) => I["then"],
    testResource: any,
    artifactory?: any,
  ): Promise<any>;

  // Implement BaseAction's abstract method
  async performAction(
    store: I["istore"],
    actionCB: (x: I["iselection"]) => I["then"],
    testResource: any,
  ): Promise<any> {
    return this.andWhen(store, actionCB, testResource);
  }

  async test(store: I["istore"], testResourceConfiguration: any, artifactory?: any) {
    try {
      const result = await this.andWhen(
        store,
        this.whenCB,
        testResourceConfiguration,
        artifactory as any,
      );
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }
}
/**
 * Represents a collection of When actions keyed by their names.
 * Whens are typically part of Given definitions rather than standalone collections,
 * but this type exists for consistency and potential future use cases where:
 * - When actions might need to be reused across multiple Given conditions
 * - Dynamic composition of test steps is required
 * - Advanced test patterns need to reference When actions by name
 */
export type IWhens<I extends TestTypeParams_any> = Record<string, BaseWhen<I>>;
