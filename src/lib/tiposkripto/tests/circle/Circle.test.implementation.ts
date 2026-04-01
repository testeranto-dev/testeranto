import { assert } from "chai";
import { Circle } from "./Circle.js";
import type { ICircleNode, O, M } from "./Circle.test.types.js";
import type { ITestImplementation } from "../../src/CoreTypes.js";

export const implementation: ITestImplementation<ICircleNode, O, M> = {
  // TDT style /////////////////////////
  confirms: {
    circumferenceCalculation: () => {
      return () => {
        return (radius: number) => {
          const circle = new Circle(radius);
          return circle.getCircumference();
        };
      };
    },
    areaCalculation: () => {
      return () => {
        return (radius: number) => {
          const circle = new Circle(radius);
          return circle.getArea();
        };
      };
    },
  },

  values: {
    radius: (radius: number) => {
      return [radius];
    },
    radii: (radii: number[]) => {
      return radii;
    },
  },

  shoulds: {
    beEqualTo: (expected: number) => {
      return (actualResult: number) => {
        return assert.equal(actualResult, expected);
      };
    },
    beCloseTo: (expected: number, tolerance: number = 0.0001) => {
      return (actualResult: number) => {
        return assert.closeTo(actualResult, expected, tolerance);
      };
    },
    beGreaterThan: (expected: number) => {
      return (actualResult: number) => {
        return assert.isAbove(actualResult, expected, `${actualResult} should be greater than ${expected}`);
      };
    },
    beLessThan: (expected: number) => {
      return (actualResult: number) => {
        return assert.isBelow(actualResult, expected, `${actualResult} should be less than ${expected}`);
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
        assert.closeTo(actual, expected, 0.0001);
      };
    },
    "has correct area": () => {
      return (circle: Circle) => {
        const expected = Math.PI * circle.getRadius() * circle.getRadius();
        const actual = circle.getArea();
        assert.closeTo(actual, expected, 0.0001);
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
        assert.closeTo(actual, expected, 0.0001);
      };
    },
    circumferenceIs: (expected: number) => {
      return (circle: Circle) => {
        const actual = circle.getCircumference();
        assert.closeTo(actual, expected, 0.0001);
      };
    },
    areaIs: (expected: number) => {
      return (circle: Circle) => {
        const actual = circle.getArea();
        assert.closeTo(actual, expected, 0.0001);
      };
    },
  },
};
