import { TestTypeParams_any, Ibdd_in_any, Ibdd_out_any } from "./CoreTypes";
import { BaseDescribe } from "./verbs/aaa/BaseDescribe";
import { BaseSuite } from "./verbs/BaseSuite";
import { BaseGiven } from "./verbs/bdd/BaseGiven";
import { BaseThen } from "./verbs/bdd/BaseThen";
import { BaseWhen } from "./verbs/bdd/BaseWhen";
import { BaseConfirm } from "./verbs/tdt/BaseConfirm";


// export type ISuiteKlasser<I extends Ibdd_in_any, O extends Ibdd_out_any> = (
//   name: string,
//   index: number,
//   givens: IGivens<I>,
// ) => BaseSuite<I, O>;

export type IGivenKlasser<I extends Ibdd_in_any> = (
  name: string,
  features: string[],
  whens: BaseWhen<I>[],
  thens: BaseThen<I>[],
  givenCB: I["setup"],
) => BaseGiven<I>;

export type IWhenKlasser<I extends Ibdd_in_any> = (
  s: I["istore"],
  o: any,
) => BaseWhen<I>;

export type IThenKlasser<I extends Ibdd_in_any> = (
  s: I["iselection"],
  o: any,
) => BaseThen<I>;

export type ITestResourceConfiguration = {
  name: string;
  fs: string;
  ports: number[];
  files: string[];
  timeout?: number;
  retries?: number;
  environment?: Record<string, any>;
};

export type ITTestResourceRequirement = {
  name: string;
  ports: number;
  fs: string;
};

export type ITTestResourceRequest = {
  ports: number;
};

type ITest = {
  toObj(): object;
  name: string;
  steps:
  (BaseGiven<Ibdd_in_any> |
    BaseDescribe<Ibdd_in_any> |
    BaseConfirm<Ibdd_in_any>)[];

  testResourceConfiguration: ITestResourceConfiguration;
};

export type ITestJob = {
  toObj(): object;
  test: ITest;
  runner: (
    x: ITestResourceConfiguration,
  ) => Promise<BaseSuite<Ibdd_in_any, Ibdd_out_any>>;
  testResourceRequirement: ITTestResourceRequirement;
  receiveTestResourceConfig: (x: ITestResourceConfiguration) => IFinalResults;
};

export type ITestResults = Promise<{ test: ITest }>[];

export const defaultTestResourceRequirement: ITTestResourceRequest = {
  ports: 0,
};

export type ITestArtifactory = (key: string, value: unknown) => unknown;

// export type IRunnables = {
//   golangEntryPoints: Record<string, string>;
//   nodeEntryPoints: Record<string, string>;
//   pythonEntryPoints: Record<string, string>;
//   webEntryPoints: Record<string, string>;
// };

export type IFinalResults = {
  features: string[];
  failed: boolean;
  fails: number;
  artifacts: any[];
  tests: number;
  runTimeTests: number;
  testJob: object;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  stepName?: string;
  stepType?: string;
  [key: string]: any;
};
