import type { ITestResourceConfiguration } from "./types";
import type {
  IArtifactory,
  Ibdd_in_any,
  Ibdd_out_any,
  IUniversalTestAdapter,
  ITestAdapter,
  TestTypeParams_any,
} from "./CoreTypes";

export const BaseAdapter = <
  T extends TestTypeParams_any,
>(): IUniversalTestAdapter<T> => ({
  prepareAll: async (
    input: T["iinput"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return input as unknown as T["isubject"];
  },
  prepareEach: async function (
    subject: T["isubject"],
    initializer: (c?: any) => T["given"],
    testResource: ITestResourceConfiguration,
    initialValues: any,
    artifactory?: IArtifactory,
  ): Promise<T["istore"]> {
    return subject as unknown as T["istore"];
  },
  cleanupEach: async (
    store: T["istore"],
    key: string,
    artifactory?: IArtifactory,
  ) => Promise.resolve(store),
  cleanupAll: (store: T["istore"], artifactory: IArtifactory) => undefined,
  verify: async (
    store: T["istore"],
    checkCb: T["then"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return (checkCb as any)(store);
  },
  execute: async (
    store: T["istore"],
    actionCB: T["when"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return (actionCB as any)(store);
  },
  assert: (x: T["then"]) => x,
});

export const DefaultAdapter = <T extends TestTypeParams_any>(
  p: Partial<ITestAdapter<T>>,
): IUniversalTestAdapter<T> => {
  const base = BaseAdapter<T>();
  
  // Create adapter with new method names
  // ITestAdapter is now IUniversalTestAdapter, so we can use the methods directly
  const adapter: IUniversalTestAdapter<T> = {
    prepareAll: p.prepareAll || base.prepareAll,
    prepareEach: p.prepareEach || base.prepareEach,
    execute: p.execute || base.execute,
    verify: p.verify || base.verify,
    cleanupEach: p.cleanupEach || base.cleanupEach,
    cleanupAll: p.cleanupAll || base.cleanupAll,
    assert: p.assert || base.assert,
  };
  
  return adapter;
};

// Export BDD pattern classes (user-facing)
export { BaseGiven } from "./BaseGiven.js";
export { BaseWhen } from "./BaseWhen.js";
export { BaseThen } from "./BaseThen.js";

// Export TDT pattern classes (user-facing)
export { BaseValue } from "./BaseValue.js";
export { BaseShould } from "./BaseShould.js";
export { BaseExpected } from "./BaseExpected.js";

// Export Describe-It pattern classes (user-facing)
export { BaseDescribe } from "./BaseDescribe.js";
export { BaseIt } from "./BaseIt.js";

// Export internal base classes (not exposed to users)
export { BaseSetup } from "./BaseSetup.js";
export { BaseAction } from "./BaseAction.js";
export { BaseCheck } from "./BaseCheck.js";

// Helper function to create Describe-It specifications
export function createDescribeItSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
>() {
  return {
    // Create a suite with Describe-It pattern
    Suite: {
      Default: (Suite: any, Describe: any, It: any) => 
        (name: string, descriptions: Record<string, any>) => {
          // Convert descriptions to setups
          const setups: Record<string, any> = {};
          for (const [key, description] of Object.entries(descriptions)) {
            const { features, its, describeCB, initialValues } = description;
            setups[key] = Describe.Default(
              features,
              its,
              describeCB,
              initialValues,
            );
          }
          return Suite.Default(name, setups);
        },
    },
    // Describe maps to Setup
    Describe: {
      Default: (
        features: string[],
        its: any[],
        describeCB: I["given"],
        initialValues: any,
      ) => {
        return (Describe: any) => Describe.Default(
          features,
          its,
          describeCB,
          initialValues,
        );
      },
    },
    // It can mix mutations and assertions
    It: {
      Default: (name: string, itCB: (x: I["iselection"]) => I["then"]) => {
        return (It: any) => It.Default(name, itCB);
      },
    },
  };
}

// Helper function to create TDT specifications with Value, Should, Expected
export function createTDTSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
>() {
  return {
    // Create a suite with TDT pattern
    Suite: {
      Default: (Suite: any, Value: any, Should: any, Expected: any) => 
        (name: string, confirms: Record<string, any>) => {
          // Convert confirms to setups
          const setups: Record<string, any> = {};
          for (const [key, confirm] of Object.entries(confirms)) {
            const { features, tableRows, confirmCB, initialValues } = confirm;
            setups[key] = Value.Default(
              features,
              tableRows,
              confirmCB,
              initialValues,
            );
          }
          return Suite.Default(name, setups);
        },
    },
    // Value maps to Setup (sets up table data)
    Value: {
      Default: (
        features: string[],
        tableRows: any[][],
        confirmCB: I["given"],
        initialValues: any,
      ) => {
        return (Value: any) => Value.Default(
          features,
          tableRows,
          confirmCB,
          initialValues,
        );
      },
    },
    // Should processes each row (like Action)
    Should: {
      Default: (name: string, shouldCB: (x: I["iselection"]) => I["then"]) => {
        return (Should: any) => Should.Default(name, shouldCB);
      },
    },
    // Expected validates each row (like Check)
    Expected: {
      Default: (
        name: string,
        expectedCB: (val: I["iselection"]) => Promise<I["then"]>,
      ) => {
        return (Expected: any) => Expected.Default(name, expectedCB);
      },
    },
  };
}

// Alias for Describe-It pattern
export function DescribeIt<I extends Ibdd_in_any, O extends Ibdd_out_any>() {
  // Return an object that matches what the examples expect
  return {
    Suite: {
      Default: (name: string, descriptions: Record<string, any>) => {
        console.warn('DescribeIt.Suite.Default: This helper function requires proper context from a test specification. Use createDescribeItSpecification() for full functionality.');
        return { name, descriptions };
      },
    },
    Describe: {
      Default: (
        features: string[],
        its: any[],
        describeCB: I["given"],
        initialValues: any,
      ) => {
        console.warn('DescribeIt.Describe.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.');
        return { features, its, describeCB, initialValues };
      },
    },
    It: {
      Default: (name: string, itCB: (x: I["iselection"]) => I["then"]) => {
        console.warn('DescribeIt.It.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.');
        return { name, itCB };
      },
    },
  };
}

// Alias for TDT pattern with Value, Should, Expected
export function Confirm<I extends Ibdd_in_any, O extends Ibdd_out_any>() {
  // Return an object that matches what the examples expect
  return {
    Suite: {
      Default: (name: string, confirms: Record<string, any>) => {
        console.warn('Confirm.Suite.Default: This helper function requires proper context from a test specification. Use createTDTSpecification() for full functionality.');
        return { name, confirms };
      },
    },
    Value: {
      Default: (
        features: string[],
        tableRows: any[][],
        confirmCB: I["given"],
        initialValues: any,
      ) => {
        console.warn('Confirm.Value.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.');
        return { features, tableRows, confirmCB, initialValues };
      },
    },
    Should: {
      Default: (name: string, shouldCB: (x: I["iselection"]) => I["then"]) => {
        console.warn('Confirm.Should.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.');
        return { name, shouldCB };
      },
    },
    Expected: {
      Default: (
        name: string,
        expectedCB: (val: I["iselection"]) => Promise<I["then"]>,
      ) => {
        console.warn('Confirm.Expected.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.');
        return { name, expectedCB };
      },
    },
  };
}
