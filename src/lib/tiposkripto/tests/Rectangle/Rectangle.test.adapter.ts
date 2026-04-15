import type { IArtifactory, Ibdd_in, ITestAdapter } from "../../src/CoreTypes";
import Rectangle from "./Rectangle";

export type I = Ibdd_in<
  null,
  null,
  Rectangle,
  Rectangle,
  Rectangle,
  (...x: any[]) => (rectangle: Rectangle) => Rectangle,
  (rectangle: Rectangle) => Rectangle
>;

export const RectangleTesterantoBaseAdapter: ITestAdapter<I> = {
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
