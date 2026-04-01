import type { Ibdd_in, IArtifactory, Ibdd_out } from "../../src/CoreTypes";

export type ICircleNode = Ibdd_in<
  typeof Circle, // iinput
  typeof Circle, // isubject
  Circle, // istore
  number, // iselection (getRadius returns number)
  () => Circle, // given
  (circle: Circle) => Circle, // when
  (circle: Circle) => void // then
>;

export type O = Ibdd_out<
  // Given
  {
    Default: [];
    WithRadius: [number];
  },

  // When
  {
    setRadius: [number];
    doubleRadius: [];
    halveRadius: [];
  },

  // Then
  {
    radiusIs: [number];
    circumferenceIs: [number];
    areaIs: [number];
  },

  // Describe
  {
    "a circle with radius": [number];
  },
  // It
  {
    "has correct circumference": [];
    "has correct area": [];
  },

  // Confirm
  {
    circumferenceCalculation: [];
    areaCalculation: [];
  },

  // Value
  {
    radius: [number];
    radii: [number[]];
  },

  // Should
  {
    beEqualTo: [number];
    beCloseTo: [number, number]; // value, tolerance
    beGreaterThan: [number];
    beLessThan: [number];
  }
>;

export type M = {
  givens: {
    [K in keyof O["givens"]]: (...args: O["givens"][K]) => Circle;
  };
  whens: {
    [K in keyof O["whens"]]: (
      ...args: O["whens"][K]
    ) => (circle: Circle) => Circle;
  };
  thens: {
    [K in keyof O["thens"]]: (
      ...args: O["thens"][K]
    ) => (circle: Circle) => void;
  };
};
