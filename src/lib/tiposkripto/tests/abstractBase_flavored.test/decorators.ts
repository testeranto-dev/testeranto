import { suite, given, when, then } from '../../src/flavored';

// Define test store interface
interface TestStore {
  testStore: { value: string };
  error?: Error;
  testSelection?: { selected: boolean };
}

// Decorator-based test suite
@suite("Decorator Base Tests")
class DecoratorBaseTests {
  private store: TestStore;

  @given("Default store")
  setupDefault() {
    this.store = {
      testStore: { value: "initial" },
      testSelection: { selected: true }
    };
    return this.store;
  }

  @given("Store with error")
  setupWithError() {
    this.store = {
      testStore: { value: "error" },
      testSelection: { selected: false },
      error: new Error("Test error")
    };
    return this.store;
  }

  @when("modifyStore: {newValue}")
  modifyStore(newValue: string) {
    this.store.testStore.value = newValue;
    return this.store;
  }

  @when("throwError")
  throwError() {
    throw new Error("Test error");
  }

  @then("verifyStore: {expected}")
  verifyStore(expected: string) {
    if (this.store.testStore.value !== expected) {
      throw new Error(`Expected ${expected}, got ${this.store.testStore.value}`);
    }
    return this.store;
  }

  @then("verifyError: {expected}")
  verifyError(expected: string) {
    if (!this.store.error || !this.store.error.message.includes(expected)) {
      throw new Error(`Expected error "${expected}" not found`);
    }
    return this.store;
  }

  // Convert to baseline specification
  static toSpecification() {
    return (Suite: any, Given: any, When: any, Then: any) => [
      Suite.Default("Decorator Base Tests", {
        initialization: Given.Default(
          ["Should initialize with default values"],
          [],
          [Then.verifyStore("initial")]
        ),
        errorHandling: Given.WithError(
          ["Should handle errors properly"],
          [When.throwError()],
          [Then.verifyError("Test error")]
        ),
        stateModification: Given.Default(
          ["Should modify state correctly"],
          [When.modifyStore("modified")],
          [Then.verifyStore("modified")]
        ),
      }),
    ];
  }

  // Convert to baseline implementation
  static toImplementation() {
    return {
      suites: {
        Default: "Decorator Base Test Suite",
      },
      givens: {
        Default: () => () => ({
          testStore: { value: "initial" },
          testSelection: { selected: true },
        }),
        WithError: () => () => ({
          testStore: { value: "error" },
          testSelection: { selected: false },
        }),
      },
      whens: {
        modifyStore: (newValue: string) => (store: any) => ({
          ...store,
          testStore: { value: newValue },
        }),
        throwError: () => (store: any) => {
          throw new Error("Test error");
        },
      },
      thens: {
        verifyStore: (expected: string) => (store: any) => {
          if (store.testStore.value !== expected) {
            throw new Error(`Expected ${expected}, got ${store.testStore.value}`);
          }
          return store;
        },
        verifyError: (expected: string) => (store: any) => {
          if (!store.error || !store.error.message.includes(expected)) {
            throw new Error(`Expected error "${expected}" not found`);
          }
          return store;
        },
      },
    };
  }
}

export default DecoratorBaseTests;
