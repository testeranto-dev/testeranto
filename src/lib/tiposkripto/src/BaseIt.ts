import { BaseAction } from "./BaseAction.js";
import type { TestTypeParams_any } from "./CoreTypes.js";

/**
 * BaseIt extends BaseAction for Describe-It pattern.
 * Its can mix mutations and assertions, unlike BDD's When which only does mutations.
 */
export class BaseIt<I extends TestTypeParams_any> extends BaseAction<I> {
  /**
   * Abstract method to be implemented by concrete It classes.
   * Performs the action for the Describe-It pattern (AAA Act/Assert combined phase).
   * 
   * @param store The test store
   * @param actionCB Action callback function
   * @param testResource Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @returns Promise resolving to the result of the action
   */
  abstract performAction(
    store: I["istore"],
    actionCB: (x: I["iselection"]) => I["then"],
    testResource: any,
    artifactory?: any,
  ): Promise<any>;
  
  // It can perform both actions and assertions
  constructor(name: string, itCB: (xyz: I["iselection"]) => I["then"]) {
    super(name, itCB);
  }

  // Override test to handle both mutations and assertions
  async test(store: I["istore"], testResourceConfiguration: any, artifactory?: any) {
    try {
      const result = await this.performAction(
        store,
        this.actionCB,
        testResourceConfiguration,
        artifactory,
      );
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }

  // Alias performAction to performIt
  async performIt(
    store: I["istore"],
    itCB: (x: I["iselection"]) => I["then"],
    testResource: any,
    artifactory?: any,
  ) {
    return this.performAction(store, itCB, testResource, artifactory);
  }
}

export type IIts<I extends TestTypeParams_any> = Record<string, BaseIt<I>>;
