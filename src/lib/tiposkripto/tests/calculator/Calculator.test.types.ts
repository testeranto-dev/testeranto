import React, { ReactNode } from "react";
import type { Calculator } from "./Calculator";
import type { Ibdd_in, IArtifactory, Ibdd_out } from "../../src/CoreTypes";

export type ICalculatorNode = Ibdd_in<
  typeof Calculator, // iinput
  typeof Calculator, // isubject
  Calculator, // istore
  string, // iselection (getDisplay returns string)
  () => Calculator, // given
  (calculator: Calculator) => Calculator, // when
  (calculator: Calculator) => void // then
>;

type IInput = typeof React.Component;
// export type ISelection = ReactNode;
// export type IStore = ReactNode;
// export type ISubject = ReactNode;

export type ICalculatorWebReact = Ibdd_in<
  IInput,
  HTMLElement,
  ReactNode,
  ReactNode,
  unknown,
  (s: HTMLElement, art: IArtifactory) => any,
  (s: HTMLElement, art: IArtifactory) => any
>;

export type O = Ibdd_out<
  {
    Default: [string];
  },
  {
    Default: [];
  },
  {
    press: [string];
    enter: [];
    memoryStore: [];
    memoryRecall: [];
    memoryClear: [];
    memoryAdd: [];
  },
  {
    result: [string];
  }
>;

// type M allows you customize you implementation
// The default implementation is a function which accepts an expected value and returns another function which accepts the actual value.
// But you can create one that just returns 1 function, or even a constant.
// If you do not use the default case, you will need to update type M, which describes the shape of the implementations
// You can even type specific verbs if you want!
export type M = {
  givens: {
    [K in keyof O["givens"]]: (...args: O["givens"][K]) => Calculator;
  };
  whens: {
    [K in keyof O["whens"]]: (
      ...args: O["whens"][K]
    ) => (calculator: Calculator) => Calculator;
  };
  thens: {
    [K in keyof O["thens"]]: (
      ...args: O["thens"][K]
    ) => (calculator: Calculator) => void;
  };
};
