import NodeTiposkripto from "../../src/Node.js";
import {
  type O,
  RectangleTesterantoBaseTestSpecification,
} from "./Rectangle.test.specification";
import type { I } from "./Rectangle.test.adapter";
import type { ITestImplementation, ITestAdapter } from "../../src/CoreTypes";
import type { ITTestResourceRequest } from "../../src/types";
import Rectangle from "./Rectangle";
import { assert } from "chai";

class RectangleTest extends NodeTiposkripto<I, O, {}> {
  input() {
    return null;
  }
  
  implementation(): ITestImplementation<I, O, {}> {
    return {
      suites: {
        Default: "a default suite",
      },

      givens: {
        Default: () => new Rectangle(2, 2),
        WidthOfOneAndHeightOfOne: () => new Rectangle(1, 1),
        WidthAndHeightOf: (width, height) => new Rectangle(width, height),
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
        setWidth: (width: number) => (rectangle) => {
          rectangle.setWidth(width);
          return rectangle;
        },
        setHeight: (height: number) => (rectangle) => {
          rectangle.setHeight(height);
          return rectangle;
        },
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
          assert.equal(Object.getPrototypeOf(rectangle), Rectangle.prototype);
          return rectangle;
        },
        circumference: (circumference: number) => (rectangle: Rectangle) => {
          assert.equal(rectangle.circumference(), circumference);
          return rectangle;
        },
      },
    };
  }
  
  adapter(): Partial<ITestAdapter<I>> {
    return {
      prepareEach: async (subject, i) => {
        return i(subject);
      },
      execute: async function (s, whenCB, tr, artifactory) {
        // whenCB should be a function that takes the rectangle
        if (typeof whenCB !== 'function') {
          console.error('whenCB is not a function:', whenCB);
          throw new Error('whenCB is not a function');
        }
        return whenCB(s);
      },
      verify: async (s, t, tr, artifactory) => {
        // t should be a function that takes the rectangle
        if (typeof t !== 'function') {
          console.error('t is not a function:', t);
          throw new Error('t is not a function');
        }
        return t(s);
      },
    };
  }
  
  testResourceRequirement(): ITTestResourceRequest {
    return { ports: 0 };
  }

  constructor() {
    super(RectangleTesterantoBaseTestSpecification);
  }
}

export default new RectangleTest();
