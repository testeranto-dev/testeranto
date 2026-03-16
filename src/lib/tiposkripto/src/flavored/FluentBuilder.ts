// Fluent builder for chainable test syntax

export class FluentTestBuilder<T = any> {
  private givenDesc: string;
  private setup: () => T | Promise<T>;
  private whenSteps: Array<{
    desc: string;
    action: (store: T, ...args: any[]) => T | Promise<T>;
    args: any[];
  }> = [];
  private thenSteps: Array<{
    desc: string;
    assertion: (store: T, ...args: any[]) => void | Promise<void>;
    args: any[];
  }> = [];

  constructor(givenDesc: string, setup: () => T | Promise<T>) {
    this.givenDesc = givenDesc;
    this.setup = setup;
  }

  when<A extends any[]>(
    description: string,
    action: (store: T, ...args: A) => T | Promise<T>,
    ...args: A
  ): this {
    this.whenSteps.push({ desc: description, action, args });
    return this;
  }

  then<A extends any[]>(
    description: string,
    assertion: (store: T, ...args: A) => void | Promise<void>,
    ...args: A
  ): this {
    this.thenSteps.push({ desc: description, assertion, args });
    return this;
  }

  async run(): Promise<{ success: boolean; store?: T; error?: any }> {
    try {
      // Execute Given
      let store = await this.setup();
      
      // Execute When steps
      for (const step of this.whenSteps) {
        store = await step.action(store, ...step.args);
      }
      
      // Execute Then steps
      for (const step of this.thenSteps) {
        await step.assertion(store, ...step.args);
      }
      
      return { success: true, store };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Convert to baseline Testeranto format
  toBaseline() {
    return {
      specification: (Suite: any, Given: any, When: any, Then: any) => {
        const whenCalls = this.whenSteps.map(step => {
          const whenKey = step.desc.split(':')[0]?.trim() || 'when';
          return When[whenKey](...step.args);
        });

        const thenCalls = this.thenSteps.map(step => {
          const thenKey = step.desc.split(':')[0]?.trim() || 'then';
          return Then[thenKey](...step.args);
        });

        return [
          Suite.Default("Fluent Test", {
            [this.givenDesc]: Given.Default(
              [this.givenDesc],
              whenCalls,
              thenCalls
            ),
          }),
        ];
      },
      
      implementation: {
        suites: { Default: "Fluent Test Suite" },
        givens: {
          Default: () => this.setup,
        },
        whens: this.whenSteps.reduce((acc, step, index) => {
          const key = step.desc.split(':')[0]?.trim() || `when${index}`;
          acc[key] = (...args: any[]) => (store: any) => step.action(store, ...args);
          return acc;
        }, {} as Record<string, Function>),
        thens: this.thenSteps.reduce((acc, step, index) => {
          const key = step.desc.split(':')[0]?.trim() || `then${index}`;
          acc[key] = (...args: any[]) => (store: any) => {
            step.assertion(store, ...args);
            return store;
          };
          return acc;
        }, {} as Record<string, Function>),
      },
    };
  }
}

// Main export for fluent API
export function given<T>(description: string, setup: () => T | Promise<T>): FluentTestBuilder<T> {
  return new FluentTestBuilder(description, setup);
}

// Alias for compatibility
export const flavored = { given };
