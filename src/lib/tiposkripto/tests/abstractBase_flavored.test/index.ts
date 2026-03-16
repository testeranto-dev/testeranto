import Tiposkripto from "../../src/Tiposkripto";
import { testAdapter } from "./adapter";
import { implementation } from "./implementation";
import { MockGiven } from "./MockGiven";
import { MockThen } from "./MockThen";
import { MockWhen } from "./MockWhen";
import { specification } from "./specification";
import { I, O } from "./types";

// Import flavored versions
import flavoredTiposkripto, { runDecoratorTests, runFluentTests } from "./flavored.test";

// Import the flavored API directly for convenience
import { given, suite, when, then, runSuite } from "../../src/flavored";

// Export baseline version
const baseline = Tiposkripto<I, O, {}>(
  {
    MockGiven,
    MockWhen,
    MockThen,
  },
  specification,
  implementation,
  testAdapter
);

// Export flavored version
export const flavored = flavoredTiposkripto;

// Export the flavored API directly
export { given, suite, when, then, runSuite };

// Export runners for different styles
export const runners = {
  // Baseline runner
  baseline: () => baseline,
  
  // Flavored runners
  decorator: runDecoratorTests,
  fluent: runFluentTests,
  
  // Combined runner
  all: async () => {
    console.log("Running all test styles...");
    
    // Run decorator tests
    console.log("\n=== Decorator Tests ===");
    const decoratorResult = await runDecoratorTests();
    console.log("Result:", decoratorResult.success ? "PASSED" : "FAILED");
    
    // Run fluent tests
    console.log("\n=== Fluent Tests ===");
    const fluentResults = await runFluentTests();
    fluentResults.forEach(result => {
      console.log(`${result.name}: ${result.success ? "PASSED" : "FAILED"}`);
    });
    
    // Run baseline tests through Tiposkripto
    console.log("\n=== Baseline Tests ===");
    // Note: This would require test resource configuration
    console.log("Baseline tests require resource configuration");
    
    return {
      decorator: decoratorResult,
      fluent: fluentResults,
      baseline: { note: "Requires resource configuration" }
    };
  }
};

// Default export remains the flavored version for easy import
export default flavored;

// Also export the baseline for compatibility
export { baseline };
