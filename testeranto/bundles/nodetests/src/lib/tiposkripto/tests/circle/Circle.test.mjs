import {
  NodeTiposkripto
} from "../../../../../chunk-SJGOGFCL.mjs";

// src/lib/tiposkripto/tests/circle/Circle.ts
var Circle = class {
  constructor(radius = 0) {
    this.radius = 0;
    this.radius = radius;
  }
  setRadius(radius) {
    this.radius = radius;
    return this;
  }
  getRadius() {
    return this.radius;
  }
  getCircumference() {
    return 2 * Math.PI * this.radius;
  }
  getArea() {
    return Math.PI * this.radius * this.radius;
  }
  // For testing purposes
  toString() {
    return `Circle(radius=${this.radius})`;
  }
};

// src/lib/tiposkripto/tests/circle/Circle.test.adapter.ts
var adapter = {
  prepareAll: async (input, testResource, artifactory) => {
    console.log("[Circle adapter] beforeAll called with input:", input);
    return input;
  },
  prepareEach: async (subject, initializer, testResource, initialValues, artifactory) => {
    console.log("[Circle adapter] beforeEach called with subject:", subject);
    const circle = initializer();
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
    if (typeof verificationFn === "function") {
      try {
        const actualVerificationFn = verificationFn();
        if (typeof actualVerificationFn === "function") {
          return actualVerificationFn(store);
        } else {
          return verificationFn;
        }
      } catch (e) {
        console.log("[Circle adapter] Error in verify:", e);
        throw e;
      }
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
  assert: (actual) => {
    console.log("[Circle adapter] assert called with actual:", actual);
    return actual;
  }
};

// src/lib/tiposkripto/tests/circle/Circle.test.implementation.ts
import { assert } from "chai";
var implementation = {
  // TDT style /////////////////////////
  confirms: {
    circumferenceCalculation: () => {
      return () => {
        return (radius) => {
          const circle = new Circle(radius);
          return circle.getCircumference();
        };
      };
    },
    areaCalculation: () => {
      return () => {
        return (radius) => {
          const circle = new Circle(radius);
          return circle.getArea();
        };
      };
    }
  },
  values: {
    radius: (radius) => {
      return [radius];
    },
    radii: (radii) => {
      return radii;
    }
  },
  shoulds: {
    beEqualTo: (expected) => {
      return (actualResult) => {
        return assert.equal(actualResult, expected);
      };
    },
    beCloseTo: (expected, tolerance = 1e-4) => {
      return (actualResult) => {
        return assert.closeTo(actualResult, expected, tolerance);
      };
    },
    beGreaterThan: (expected) => {
      return (actualResult) => {
        return assert.isAbove(actualResult, expected, `${actualResult} should be greater than ${expected}`);
      };
    },
    beLessThan: (expected) => {
      return (actualResult) => {
        return assert.isBelow(actualResult, expected, `${actualResult} should be less than ${expected}`);
      };
    }
  },
  // AAA style /////////////////////////
  describes: {
    "a circle with radius": (radius) => new Circle(radius)
  },
  its: {
    "has correct circumference": () => {
      return (circle) => {
        const expected = 2 * Math.PI * circle.getRadius();
        const actual = circle.getCircumference();
        assert.closeTo(actual, expected, 1e-4);
      };
    },
    "has correct area": () => {
      return (circle) => {
        const expected = Math.PI * circle.getRadius() * circle.getRadius();
        const actual = circle.getArea();
        assert.closeTo(actual, expected, 1e-4);
      };
    }
  },
  // BDD style /////////////////////////
  givens: {
    Default: () => new Circle(1),
    WithRadius: (radius) => new Circle(radius)
  },
  whens: {
    setRadius: (radius) => {
      return (circle) => {
        return circle.setRadius(radius);
      };
    },
    doubleRadius: () => {
      return (circle) => {
        return circle.setRadius(circle.getRadius() * 2);
      };
    },
    halveRadius: () => {
      return (circle) => {
        return circle.setRadius(circle.getRadius() / 2);
      };
    }
  },
  thens: {
    radiusIs: (expected) => {
      return (circle) => {
        const actual = circle.getRadius();
        assert.closeTo(actual, expected, 1e-4);
      };
    },
    circumferenceIs: (expected) => {
      return (circle) => {
        const actual = circle.getCircumference();
        assert.closeTo(actual, expected, 1e-4);
      };
    },
    areaIs: (expected) => {
      return (circle) => {
        const actual = circle.getArea();
        assert.closeTo(actual, expected, 1e-4);
      };
    }
  }
};

// src/lib/tiposkripto/tests/circle/Circle.test.specification.ts
var specification = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    // TDT pattern: Test circumference calculation
    Confirm["circumferenceCalculation"]()(
      [
        [Value.radius(0), Should.beEqualTo(0)],
        [Value.radius(1), Should.beCloseTo(2 * Math.PI)],
        [Value.radius(2), Should.beCloseTo(4 * Math.PI)],
        [Value.radius(5), Should.beCloseTo(10 * Math.PI)]
      ],
      ["Circle circumference formula: C = 2\u03C0r"]
    ),
    // TDT pattern: Test area calculation
    Confirm["areaCalculation"]()(
      [
        [Value.radius(0), Should.beEqualTo(0)],
        [Value.radius(1), Should.beCloseTo(Math.PI)],
        [Value.radius(2), Should.beCloseTo(4 * Math.PI)],
        [Value.radius(5), Should.beCloseTo(25 * Math.PI)]
      ],
      ["Circle area formula: A = \u03C0r\xB2"]
    ),
    // AAA pattern: Test circle properties
    Describe["a circle with radius"](5)(
      [
        It["has correct circumference"](),
        It["has correct area"]()
      ],
      ["Testing circle with radius 5"]
    ),
    // BDD pattern: Test radius operations
    Given.WithRadius(10)(
      [
        When.doubleRadius(),
        When.halveRadius()
      ],
      [
        Then.radiusIs(10),
        // 10 * 2 / 2 = 10
        Then.circumferenceIs(2 * Math.PI * 10)
      ],
      ["Testing radius operations"]
    ),
    // BDD pattern: Test setRadius
    Given.Default(
      ["Default circle with radius 1"],
      [
        When.setRadius(7)
      ],
      [
        Then.radiusIs(7),
        Then.circumferenceIs(2 * Math.PI * 7),
        Then.areaIs(Math.PI * 49)
      ],
      ["Testing setRadius method"]
    )
  ];
};

// src/lib/tiposkripto/tests/circle/Circle.test.ts
var Circle_test_default = new NodeTiposkripto(
  Circle,
  specification,
  implementation,
  adapter,
  { ports: 1e3 }
);
export {
  Circle_test_default as default
};
