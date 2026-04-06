import {
  Node_default
} from "../../../../../chunk-7TUUD5WL.mjs";

// src/lib/tiposkripto/tests/Rectangle/Rectangle.test.implementation.ts
import { assert } from "chai";

// src/lib/tiposkripto/tests/Rectangle/Rectangle.ts
console.log("HELLO RECTANGLE");
var Rectangle = class {
  constructor(height = 2, width = 2) {
    this.height = height;
    this.width = width;
  }
  getHeight() {
    return this.height;
  }
  getWidth() {
    return this.width;
  }
  setHeight(height) {
    this.height = height;
  }
  setWidth(width) {
    this.width = width;
  }
  area() {
    return this.width * this.height;
  }
  circumference() {
    return 2 * (this.width + this.height);
  }
};
var Rectangle_default = Rectangle;

// src/lib/tiposkripto/tests/Rectangle/Rectangle.test.implementation.ts
var RectangleTesterantoBaseTestImplementation = {
  suites: {
    Default: "a default suite"
  },
  givens: {
    Default: () => new Rectangle_default(2, 2),
    WidthOfOneAndHeightOfOne: () => new Rectangle_default(1, 1),
    WidthAndHeightOf: (width, height) => new Rectangle_default(width, height)
  },
  whens: {
    HeightIsPubliclySetTo: (height) => (rectangle) => {
      rectangle.setHeight(height);
      return rectangle;
    },
    WidthIsPubliclySetTo: (width) => (rectangle) => {
      rectangle.setWidth(width);
      return rectangle;
    },
    setWidth: (width) => (rectangle) => {
      rectangle.setWidth(width);
      return rectangle;
    },
    setHeight: (height) => (rectangle) => {
      rectangle.setHeight(height);
      return rectangle;
    }
  },
  thens: {
    AreaPlusCircumference: (combined) => (rectangle) => {
      const actual = rectangle.area() + rectangle.circumference();
      assert.equal(actual, combined);
      return rectangle;
    },
    getWidth: (expectedWidth) => (rectangle) => {
      assert.equal(rectangle.getWidth(), expectedWidth);
      return rectangle;
    },
    getHeight: (expectedHeight) => (rectangle) => {
      assert.equal(rectangle.getHeight(), expectedHeight);
      return rectangle;
    },
    area: (area) => (rectangle) => {
      assert.equal(rectangle.area(), area);
      return rectangle;
    },
    prototype: () => (rectangle) => {
      assert.equal(Object.getPrototypeOf(rectangle), Rectangle_default.prototype);
      return rectangle;
    },
    circumference: (circumference) => (rectangle) => {
      assert.equal(rectangle.circumference(), circumference);
      return rectangle;
    }
  }
};

// src/lib/tiposkripto/tests/Rectangle/Rectangle.test.specification.ts
var RectangleTesterantoBaseTestSpecification = (Given, When, Then, Describe, It, Confirm, Value, Should) => {
  return [
    Given.Default(void 0)(
      [When.setWidth(4), When.setHeight(19)],
      [Then.getWidth(4), Then.getHeight(19)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/888"]
    ),
    Given.Default(void 0)(
      [When.setWidth(4), When.setHeight(5)],
      [
        Then.getWidth(4),
        Then.getHeight(5),
        Then.area(20),
        Then.AreaPlusCircumference(38)
      ],
      [
        "src/lib/tiposkripto/tests/Rectangle/README.md"
      ]
    ),
    Given.Default(void 0)(
      [When.setHeight(4), When.setWidth(33)],
      [Then.area(132)],
      [
        "https://api.github.com/repos/adamwong246/testeranto/issues/8",
        "src/lib/tiposkripto/README.md"
      ]
    ),
    Given.Default(void 0)(
      [],
      [Then.getWidth(2), Then.getHeight(2)],
      [
        "https://api.github.com/repos/adamwong246/testeranto/issues/8",
        "src/lib/tiposkripto/README.md"
      ]
    ),
    Given.Default(void 0)(
      [When.setHeight(5), When.setWidth(5)],
      [Then.area(25)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"]
    ),
    Given.Default(void 0)(
      [When.setHeight(6), When.setWidth(6)],
      [Then.area(36)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"]
    ),
    Given.Default(void 0)(
      [],
      [Then.getWidth(2), Then.getHeight(2)],
      ["https://api.github.com/repos/adamwong246/testeranto/issues/8"]
    )
  ];
};

// src/lib/tiposkripto/tests/Rectangle/Rectangle.test.adapter.ts
var RectangleTesterantoBaseAdapter = {
  prepareEach: async (subject, i) => {
    return i();
  },
  execute: async function(s, whenCB, tr, artifactory) {
    if (typeof whenCB !== "function") {
      console.error("whenCB is not a function:", whenCB);
      throw new Error("whenCB is not a function");
    }
    return whenCB(s);
  },
  verify: async (s, t, tr, artifactory) => {
    if (typeof t !== "function") {
      console.error("t is not a function:", t);
      throw new Error("t is not a function");
    }
    return t(s);
  }
};

// src/lib/tiposkripto/tests/Rectangle/Rectangle.test.ts
var Rectangle_test_default = Node_default(
  null,
  RectangleTesterantoBaseTestSpecification,
  RectangleTesterantoBaseTestImplementation,
  RectangleTesterantoBaseAdapter
);
export {
  Rectangle_test_default as default
};
