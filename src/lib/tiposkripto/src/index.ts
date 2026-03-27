import { Ibdd_in_any, Ibdd_out_any } from "./CoreTypes.js";

// Export TDT pattern classes (user-facing)
export { BaseValue } from "./verbs/tdt/BaseValue.js";
export { BaseShould } from "./verbs/tdt/BaseShould";
export { BaseExpected } from "./verbs/tdt/BaseExpected.js";

// Export Describe-It pattern classes (user-facing)
export { BaseDescribe } from "./verbs/aaa/BaseDescribe.js";
export { BaseIt } from "./verbs/aaa/BaseIt.js";

// Helper function to create Describe-It specifications
export function createDescribeItSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
>() {
  return {
    // Create a suite with Describe-It pattern
    Suite: {
      Default:
        (Suite: any, Describe: any, It: any) =>
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
        describeCB: I["setup"],
        initialValues: any,
      ) => {
        return (Describe: any) =>
          Describe.Default(features, its, describeCB, initialValues);
      },
    },
    // It can mix mutations and assertions
    It: {
      Default: (name: string, itCB: (x: I["iselection"]) => I["check"]) => {
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
      Default:
        (Suite: any, Value: any, Should: any, Expected: any) =>
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
        confirmCB: I["setup"],
        initialValues: any,
      ) => {
        return (Value: any) =>
          Value.Default(features, tableRows, confirmCB, initialValues);
      },
    },
    // Should processes each row (like Action)
    Should: {
      Default: (name: string, shouldCB: (x: I["iselection"]) => I["check"]) => {
        return (Should: any) => Should.Default(name, shouldCB);
      },
    },
    // Expected validates each row (like Check)
    Expected: {
      Default: (
        name: string,
        expectedCB: (val: I["iselection"]) => Promise<I["check"]>,
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
        console.warn(
          "DescribeIt.Suite.Default: This helper function requires proper context from a test specification. Use createDescribeItSpecification() for full functionality.",
        );
        return { name, descriptions };
      },
    },
    Describe: {
      Default: (
        features: string[],
        its: any[],
        describeCB: I["setup"],
        initialValues: any,
      ) => {
        console.warn(
          "DescribeIt.Describe.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.",
        );
        return { features, its, describeCB, initialValues };
      },
    },
    It: {
      Default: (name: string, itCB: (x: I["iselection"]) => I["check"]) => {
        console.warn(
          "DescribeIt.It.Default: This helper function requires proper context. Use createDescribeItSpecification() for full functionality.",
        );
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
        console.warn(
          "Confirm.Suite.Default: This helper function requires proper context from a test specification. Use createTDTSpecification() for full functionality.",
        );
        return { name, confirms };
      },
    },
    Value: {
      Default: (
        features: string[],
        tableRows: any[][],
        confirmCB: I["setup"],
        initialValues: any,
      ) => {
        console.warn(
          "Confirm.Value.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.",
        );
        return { features, tableRows, confirmCB, initialValues };
      },
    },
    Should: {
      Default: (name: string, shouldCB: (x: I["iselection"]) => I["check"]) => {
        console.warn(
          "Confirm.Should.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.",
        );
        return { name, shouldCB };
      },
    },
    Expected: {
      Default: (
        name: string,
        expectedCB: (val: I["iselection"]) => Promise<I["check"]>,
      ) => {
        console.warn(
          "Confirm.Expected.Default: This helper function requires proper context. Use createTDTSpecification() for full functionality.",
        );
        return { name, expectedCB };
      },
    },
  };
}
