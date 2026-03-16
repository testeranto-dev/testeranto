import { given } from '../../src/flavored';

// Fluent chainable test builder
export const fluentBuilder = {
  // Create a test with fluent syntax
  createTest(name: string) {
    return {
      given(description: string, setup: () => any) {
        return new FluentTestBuilder(name, description, setup);
      }
    };
  }
};

class FluentTestBuilder {
  private name: string;
  private givenDesc: string;
  private setup: () => any;
  private whenSteps: Array<{
    desc: string; 
    action: (store: any, ...args: any[]) => any;
    args: any[];
  }> = [];
  private thenSteps: Array<{
    desc: string;
    assertion: (store: any, ...args: any[]) => void;
    args: any[];
  }> = [];

  constructor(name: string, givenDesc: string, setup: () => any) {
    this.name = name;
    this.givenDesc = givenDesc;
    this.setup = setup;
  }

  when(description: string, action: (store: any, ...args: any[]) => any, ...args: any[]) {
    this.whenSteps.push({ desc: description, action, args });
    return this;
  }

  then(description: string, assertion: (store: any, ...args: any[]) => void, ...args: any[]) {
    this.thenSteps.push({ desc: description, assertion, args });
    return this;
  }

  // Convert to baseline specification
  toSpecification() {
    return (Suite: any, Given: any, When: any, Then: any) => {
      const whenCalls = this.whenSteps.map(step => {
        const whenKey = step.desc.split(':')[0] || step.desc;
        return When[whenKey](...step.args);
      });

      const thenCalls = this.thenSteps.map(step => {
        const thenKey = step.desc.split(':')[0] || step.desc;
        return Then[thenKey](...step.args);
      });

      return [
        Suite.Default(this.name, {
          [this.givenDesc]: Given.Default(
            [this.givenDesc],
            whenCalls,
            thenCalls
          ),
        }),
      ];
    };
  }

  // Convert to baseline implementation
  toImplementation() {
    const implementation: any = {
      suites: {
        Default: this.name,
      },
      givens: {
        Default: () => this.setup,
      },
      whens: {},
      thens: {},
    };

    // Add when implementations
    this.whenSteps.forEach((step, index) => {
      const whenKey = step.desc.split(':')[0] || `when${index}`;
      implementation.whens[whenKey] = (...args: any[]) => (store: any) => {
        return step.action(store, ...args);
      };
    });

    // Add then implementations
    this.thenSteps.forEach((step, index) => {
      const thenKey = step.desc.split(':')[0] || `then${index}`;
      implementation.thens[thenKey] = (...args: any[]) => (store: any) => {
        step.assertion(store, ...args);
        return store;
      };
    });

    return implementation;
  }

  // Run the test directly
  async run() {
    try {
      const store = this.setup();
      let currentStore = store;
      
      // Execute when steps
      for (const step of this.whenSteps) {
        currentStore = await step.action(currentStore, ...step.args);
      }
      
      // Execute then steps
      for (const step of this.thenSteps) {
        await step.assertion(currentStore, ...step.args);
      }
      
      return { success: true, store: currentStore };
    } catch (error) {
      return { success: false, error };
    }
  }
}

// Example fluent tests using the actual flavored API
export const fluentTests = {
  testStoreModification: () =>
    given("default store", () => ({
      testStore: { value: "initial" },
      testSelection: { selected: true }
    }))
      .when("modifyStore: modified", (store: any) => ({
        ...store,
        testStore: { value: "modified" }
      }))
      .then("verifyStore: modified", (store: any) => {
        if (store.testStore.value !== "modified") {
          throw new Error(`Expected modified, got ${store.testStore.value}`);
        }
      })
      .run(),

  testErrorHandling: () =>
    given("store with error", () => ({
      testStore: { value: "error" },
      testSelection: { selected: false }
    }))
      .when("throwError", () => {
        throw new Error("Test error");
      })
      .then("verifyError: Test error", (store: any) => {
        if (!store.error || !store.error.message.includes("Test error")) {
          throw new Error('Expected error "Test error" not found');
        }
      })
      .run(),
};

export { FluentTestBuilder };
