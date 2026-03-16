import Tiposkripto from "../../src/Tiposkripto";
import { testAdapter } from "./adapter";
import { MockGiven } from "./MockGiven";
import { MockWhen } from "./MockWhen";
import { MockThen } from "./MockThen";
import { I, O } from "./types";
import DecoratorBaseTests from "./decorators";
import { fluentTests, fluentBuilder } from "./fluent";

// Convert decorator tests to baseline format
const decoratorSpecification = DecoratorBaseTests.toSpecification();
const decoratorImplementation = DecoratorBaseTests.toImplementation();

// Create a fluent test and convert to baseline
const fluentTest = fluentBuilder
  .createTest("Fluent Conversion Test")
  .given("test store", () => ({
    testStore: { value: "test" },
    testSelection: { selected: true }
  }))
  .when("modifyStore: changed", (store: any) => ({
    ...store,
    testStore: { value: "changed" }
  }))
  .then("verifyStore: changed", (store: any) => {
    if (store.testStore.value !== "changed") {
      throw new Error(`Expected changed, got ${store.testStore.value}`);
    }
  });

const fluentSpecification = fluentTest.toSpecification();
const fluentImplementation = fluentTest.toImplementation();

// Combined specification that includes both decorator and fluent tests
export const flavoredSpecification = (Suite: any, Given: any, When: any, Then: any) => {
  const decoratorSuites = decoratorSpecification(Suite, Given, When, Then);
  const fluentSuites = fluentSpecification(Suite, Given, When, Then);
  return [...decoratorSuites, ...fluentSuites];
};

// Combined implementation
export const flavoredImplementation = {
  suites: {
    ...decoratorImplementation.suites,
    ...fluentImplementation.suites,
  },
  givens: {
    ...decoratorImplementation.givens,
    ...fluentImplementation.givens,
  },
  whens: {
    ...decoratorImplementation.whens,
    ...fluentImplementation.whens,
  },
  thens: {
    ...decoratorImplementation.thens,
    ...fluentImplementation.thens,
  },
};

// Export the flavored Tiposkripto instance
export default Tiposkripto<I, O, {}>(
  {
    MockGiven,
    MockWhen,
    MockThen,
  },
  flavoredSpecification,
  flavoredImplementation,
  testAdapter
);

// Export direct test runners for decorator and fluent APIs
export const runDecoratorTests = async () => {
  const suite = new DecoratorBaseTests();
  
  try {
    // Test 1: Default store
    suite.setupDefault();
    suite.modifyStore("modified");
    suite.verifyStore("modified");
    
    // Test 2: Error handling  
    suite.setupWithError();
    suite.verifyError("Test error");
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const runFluentTests = async () => {
  const results = [];
  
  // Run all fluent tests
  for (const [name, testFn] of Object.entries(fluentTests)) {
    try {
      const result = await testFn();
      results.push({ name, ...result });
    } catch (error) {
      results.push({ name, success: false, error });
    }
  }
  
  return results;
};

// Run both styles if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log("Running flavored tests...");
    
    console.log("\n1. Running decorator tests:");
    const decoratorResult = await runDecoratorTests();
    console.log("Decorator tests:", decoratorResult.success ? "PASSED" : "FAILED");
    if (decoratorResult.error) {
      console.error("Decorator error:", decoratorResult.error);
    }
    
    console.log("\n2. Running fluent tests:");
    const fluentResults = await runFluentTests();
    fluentResults.forEach(result => {
      console.log(`  ${result.name}: ${result.success ? "PASSED" : "FAILED"}`);
      if (result.error) {
        console.error(`    Error: ${result.error}`);
      }
    });
    
    console.log("\n3. Running baseline conversion:");
    const allPassed = fluentResults.every(r => r.success) && decoratorResult.success;
    console.log("All tests:", allPassed ? "PASSED" : "FAILED");
    
    process.exit(allPassed ? 0 : 1);
  })();
}
