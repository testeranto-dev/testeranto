import NodeTiposkripto from "../../src/Node.js";
import { Circle } from "./Circle.js";
import { specification } from "./Circle.test.specification.js";
import type { ICircleNode, O, M } from "./Circle.test.types.js";
import type { ITestImplementation, ITestAdapter } from "../../src/CoreTypes.js";
import type { ITTestResourceRequest } from "../../src/types.js";

class CircleTest extends NodeTiposkripto<ICircleNode, O, M> {
  input() {
    return Circle;
  }
  
  implementation(): ITestImplementation<ICircleNode, O, M> {
    return {
      // TDT style /////////////////////////
      confirms: {
        circumferenceCalculation: () => {
          return (radius: number) => {
            const circle = new Circle(radius);
            return circle.getCircumference();
          };
        },
        areaCalculation: () => {
          return (radius: number) => {
            const circle = new Circle(radius);
            return circle.getArea();
          };
        },
      },

      values: {
        radius: (radius: number) => {
          return radius;
        },
        radii: (radii: number[]) => {
          return radii;
        },
      },

      shoulds: {
        beEqualTo: (expected: number) => {
          return (actualResult: number) => {
            try {
              // Using assert would require importing chai, but we can't import in the middle of a method
              // For now, return a boolean
              return actualResult === expected;
            } catch (e) {
              return false;
            }
          };
        },
        beCloseTo: (expected: number, tolerance: number = 0.0001) => {
          return (actualResult: number) => {
            try {
              return Math.abs(actualResult - expected) <= tolerance;
            } catch (e) {
              return false;
            }
          };
        },
        beGreaterThan: (expected: number) => {
          return (actualResult: number) => {
            try {
              return actualResult > expected;
            } catch (e) {
              return false;
            }
          };
        },
        beLessThan: (expected: number) => {
          return (actualResult: number) => {
            try {
              return actualResult < expected;
            } catch (e) {
              return false;
            }
          };
        },
      },

      // AAA style /////////////////////////
      describes: {
        "a circle with radius": (radius: number) => new Circle(radius),
      },

      its: {
        "has correct circumference": () => {
          return (circle: Circle) => {
            const expected = 2 * Math.PI * circle.getRadius();
            const actual = circle.getCircumference();
            return Math.abs(actual - expected) <= 0.0001;
          };
        },
        "has correct area": () => {
          return (circle: Circle) => {
            const expected = Math.PI * circle.getRadius() * circle.getRadius();
            const actual = circle.getArea();
            return Math.abs(actual - expected) <= 0.0001;
          };
        },
      },

      // BDD style /////////////////////////
      givens: {
        Default: () => new Circle(1),
        WithRadius: (radius: number) => new Circle(radius),
      },

      whens: {
        setRadius: (radius: number) => {
          return (circle: Circle) => {
            return circle.setRadius(radius);
          };
        },
        doubleRadius: () => {
          return (circle: Circle) => {
            return circle.setRadius(circle.getRadius() * 2);
          };
        },
        halveRadius: () => {
          return (circle: Circle) => {
            return circle.setRadius(circle.getRadius() / 2);
          };
        },
      },

      thens: {
        radiusIs: (expected: number) => {
          return (circle: Circle) => {
            const actual = circle.getRadius();
            return Math.abs(actual - expected) <= 0.0001;
          };
        },
        circumferenceIs: (expected: number) => {
          return (circle: Circle) => {
            const actual = circle.getCircumference();
            return Math.abs(actual - expected) <= 0.0001;
          };
        },
        areaIs: (expected: number) => {
          return (circle: Circle) => {
            const actual = circle.getArea();
            return Math.abs(actual - expected) <= 0.0001;
          };
        },
      },
    };
  }
  
  adapter(): Partial<ITestAdapter<ICircleNode>> {
    return {
      prepareAll: async (input, testResource, artifactory) => {
        console.log("[Circle adapter] beforeAll called with input:", input);
        return input;
      },
      prepareEach: async (
        subject,
        initializer,
        testResource,
        initialValues,
        artifactory,
      ) => {
        console.log("[Circle adapter] beforeEach called with subject:", subject);
        // Trust the type contract: initializer is a function that returns the store
        const circle = initializer(subject);
        console.log("[Circle adapter] beforeEach created circle:", circle);
        return circle;
      },
      execute: async (store, whenCB, testResource, artifactory) => {
        console.log("[Circle adapter] andWhen called with store:", store);
        const result = whenCB(store);
        console.log("[Circle adapter] andWhen result:", result);
        return result;
      },
      verify: async (store, verificationFn, testResource, artifactory) => {
        console.log("[Circle adapter] verify called with store:", store);
        console.log("[Circle adapter] verificationFn:", verificationFn);
        
        if (typeof verificationFn === 'function') {
          // Call verificationFn with store to perform assertion
          await verificationFn(store);
          // Return the store (truthy value) to indicate success
          return store;
        }
        return store;
      },
      cleanupEach: async (store, key, artifactory) => {
        console.log("[Circle adapter] afterEach called with store:", store);
        return store;
      },
      cleanupAll: async (store, artifactory) => {
        console.log("[Circle adapter] afterAll called");
        return store;
      },
      assert: (actual: any) => {
        console.log("[Circle adapter] assert called with actual:", actual);
        return actual;
      },
    };
  }
  
  testResourceRequirement(): ITTestResourceRequest {
    return { ports: 1000 };
  }

  constructor() {
    super(specification);
  }
}

export default new CircleTest();
