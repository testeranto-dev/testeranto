import { ITestResourceConfiguration } from "./types";
import { Ibdd_in_any, ITestAdapter, Ibdd_out, ITestImplementation, ITestSpecification } from "./CoreTypes";
import type BaseTiposkripto from "./BaseTiposkripto.js";
import { ITTestResourceRequest, defaultTestResourceRequirement } from "./types";

export const BaseAdapter = <T extends TestTypeParams_any>(): IUniversalTestAdapter<T> => ({
  prepareAll: async (
    input: T["iinput"],
    testResource: ITestResourceConfiguration
  ) => {
    return input as unknown as T["isubject"];
  },
  prepareEach: async function (
    subject: T["isubject"],
    initializer: (c?: any) => T["given"],
    testResource: ITestResourceConfiguration,
    initialValues: any
  ): Promise<T["istore"]> {
    return subject as unknown as T["istore"];
  },
  cleanupEach: async (store: T["istore"], key: string) => Promise.resolve(store),
  cleanupAll: (store: T["istore"]) => undefined,
  verify: async (
    store: T["istore"],
    checkCb: T["then"],
    testResource: ITestResourceConfiguration
  ) => {
    return checkCb(store);
  },
  execute: async (
    store: T["istore"],
    actionCB: T["when"],
    testResource: ITestResourceConfiguration
  ) => {
    return actionCB(store);
  },
  assert: (x: T["then"]) => x,
});

export const DefaultAdapter = <T extends TestTypeParams_any>(
  p: Partial<IUniversalTestAdapter<T>>
): IUniversalTestAdapter<T> => {
  const base = BaseAdapter<T>();
  return {
    ...base,
    ...p,
  } as IUniversalTestAdapter<T>;
};

// Export Unified base classes
export { BaseSetup } from "./BaseSetup.js";
export { BaseAction } from "./BaseAction.js";
export { BaseCheck } from "./BaseCheck.js";

// Export AAA base classes (deprecated)
export { BaseArrange } from "./BaseArrange.js";
export { BaseAct } from "./BaseAct.js";
export { BaseAssert } from "./BaseAssert.js";

// Export TDT base classes (deprecated)
export { BaseMap } from "./BaseMap.js";
export { BaseFeed } from "./BaseFeed.js";
export { BaseValidate } from "./BaseValidate.js";

// Export BDD base classes (deprecated)
export { BaseGiven } from "./BaseGiven.js";
export { BaseWhen } from "./BaseWhen.js";
export { BaseThen } from "./BaseThen.js";

// Helper function to create AAA specifications
export function createAAASpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(
  Suite: any,
  Arrange: any,
  Act: any,
  Assert: any
) {
  return {
    // Create a suite with AAA pattern
    Suite: {
      Default: (name: string, arrangements: Record<string, any>) => {
        // Convert arrangements to givens
        const givens: Record<string, any> = {};
        for (const [key, arrangement] of Object.entries(arrangements)) {
          const { features, acts, asserts, arrangeCB, initialValues } = arrangement;
          givens[key] = Arrange.Default(features, acts, asserts, arrangeCB, initialValues);
        }
        return Suite.Default(name, givens);
      }
    },
    // Arrange maps to Given
    Arrange: {
      Default: (
        features: string[],
        acts: any[],
        asserts: any[],
        arrangeCB: I["given"],
        initialValues: any
      ) => {
        return Arrange.Default(features, acts, asserts, arrangeCB, initialValues);
      }
    },
    // Act maps to When
    Act: {
      Default: (name: string, actCB: (x: I["iselection"]) => I["then"]) => {
        return Act.Default(name, actCB);
      }
    },
    // Assert maps to Then
    Assert: {
      Default: (
        name: string,
        assertCB: (val: I["iselection"]) => Promise<I["then"]>
      ) => {
        return Assert.Default(name, assertCB);
      }
    }
  };
}

// Helper function to create TDT specifications
export function createTDTSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(
  Suite: any,
  Map: any,
  Feed: any,
  Validate: any
) {
  return {
    // Create a suite with TDT pattern
    Suite: {
      Default: (name: string, maps: Record<string, any>) => {
        // Convert maps to givens
        const givens: Record<string, any> = {};
        for (const [key, map] of Object.entries(maps)) {
          const { features, feeds, validates, mapCB, initialValues, tableData } = map;
          givens[key] = Map.Default(features, feeds, validates, mapCB, initialValues, tableData);
        }
        return Suite.Default(name, givens);
      }
    },
    // Map maps to Given
    Map: {
      Default: (
        features: string[],
        feeds: any[],
        validates: any[],
        mapCB: I["given"],
        initialValues: any,
        tableData: any[] = []
      ) => {
        return Map.Default(features, feeds, validates, mapCB, initialValues, tableData);
      }
    },
    // Feed maps to When
    Feed: {
      Default: (name: string, feedCB: (x: I["iselection"]) => I["then"]) => {
        return Feed.Default(name, feedCB);
      }
    },
    // Validate maps to Then
    Validate: {
      Default: (
        name: string,
        validateCB: (val: I["iselection"]) => Promise<I["then"]>
      ) => {
        return Validate.Default(name, validateCB);
      }
    }
  };
}

// Alias for backward compatibility
export const AAA = createAAASpecification;
export const TDT = createTDTSpecification;

