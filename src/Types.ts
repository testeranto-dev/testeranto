import { BaseGiven } from "./lib/tiposkripto/src/BaseGiven";
import { BaseThen } from "./lib/tiposkripto/src/BaseThen";
import { BaseWhen } from "./lib/tiposkripto/src/BaseWhen";
import type {
  Ibdd_in_any,
  Ibdd_out_any,
} from "./lib/tiposkripto/src/CoreTypes";
import type { ITestResourceConfiguration } from "./lib/tiposkripto/src/types";

export type ITestconfigV2 = {
  featureIngestor: (s: string) => Promise<string>;
  runtimes: Record<string, IBaseTestConfig>;
  documentationGlob?: string; // New field: glob pattern to find documentation files
  stakeholderReactModule?: string; // Path to custom React component module
};

export type IOtherTest = (x: any) => string;
export type IOtherTests = IOtherTest[];

export type IBaseTestConfig = {
  runtime: string;
  tests: string[];
  dockerfile: string;
  buildOptions: string;
  checks: IOtherTests;
  outputs: string[];
  buildKitOptions?: {
    cacheMounts?: string[];
    multiStage?: boolean;
    targetStage?: string;
    buildArgs?: Record<string, string>;
  };
};

export type TestSummary = {
  testName: string;
  errors?: {
    runtime?: number;
    type?: number;
    static?: number;
  };
  prompt?: string;
  failedFeatures: string[];
};

export type TestLifecycle<Subject, State, Selection> = {
  prepareAll?: (input: any) => Promise<Subject>;
  prepareEach?: (subject: Subject) => Promise<State>;
  executeStep?: (state: State) => Promise<State>;
  verifyStep?: (state: State) => Promise<Selection>;
  cleanupEach?: (state: State) => Promise<void>;
  cleanupAll?: (state: State) => Promise<void>;
  assert?: (result: Selection) => void;
};

// BDD Test Structure
// export type TestDefinition<Subject, State, Selection> = {
//   // Test subject
//   subject: Subject;

//   // Test steps
//   given?: (input: any) => State;
//   when?: (state: State) => State | Promise<State>;
//   then?: (state: State) => Selection | Promise<Selection>;

//   // Configuration
//   resources?: ITestResourceConfiguration;
//   pm?: typeof PM;
// };

// Test Suite Organization
// export type TestSuite = {
//   name: string;
//   tests: TestDefinition<any, any, any>[];
//   features?: string[];
// };

// Runtime Configuration
// export type RuntimeConfig = {
//   type: "node" | "web" | "pure" | "spawn";
//   ports?: number[];
//   plugins?: Plugin[];
// };

// // Project Configuration
// export type ProjectConfig = {
//   name: string;
//   sourceDir: string;
//   testSuites: TestSuite[];
//   runtime: RuntimeConfig;
//   minify?: boolean;
//   debug?: boolean;
// };

export type GivenSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["givens"]]: (
      features: string[],
      whens: BaseWhen<I>[],
      thens: BaseThen<I>[],
      ...xtrasB: O["givens"][K]
    ) => BaseGiven<I>;
  };

export type WhenSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = {
  [K in keyof O["whens"]]: (...xtrasC: O["whens"][K]) => BaseWhen<I>;
};

export type ThenSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = {
  [K in keyof O["thens"]]: (...xtrasD: O["thens"][K]) => BaseThen<I>;
};

// Describe-It pattern specifications
export type DescribeSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["describes"]]: (
      features: string[],
      its: import("./lib/tiposkripto/src/BaseIt").BaseIt<I>[],
      ...xtras: O["describes"][K]
    ) => import("./lib/tiposkripto/src/BaseDescribe").BaseDescribe<I>;
  };

export type ItSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = {
  [K in keyof O["its"]]: (
    ...xtras: O["its"][K]
  ) => import("./lib/tiposkripto/src/BaseIt").BaseIt<I>;
};

// TDT pattern specifications

export type ConfirmSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["confirms"]]: (
      features: string[],
      tableRows: any[][],
      ...xtras: O["confirms"][K]
    ) => import("./lib/tiposkripto/src/BaseValue").BaseValue<I>;
    
export type ValueSpecification<
      I extends Ibdd_in_any,
      O extends Ibdd_out_any,
    > = {
    [K in keyof O["values"]]: (
      features: string[],
      tableRows: any[][],
      ...xtras: O["values"][K]
    ) => import("./lib/tiposkripto/src/BaseValue").BaseValue<I>;
  };

export type ShouldSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["shoulds"]]: (
      ...xtras: O["shoulds"][K]
    ) => import("./lib/tiposkripto/src/BaseShould").BaseShould<I>;
  };

export type ExpectSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["expecteds"]]: (
      ...xtras: O["expecteds"][K]
    ) => import("./lib/tiposkripto/src/BaseExpected").BaseExpected<I>;
  };


  };

//////////////////////////////////////////////////////////////////////////////////////////////

export type TestSuiteImplementation<O extends Ibdd_out_any> = {
  [K in keyof O["suites"]]: string;
};

export type TestGivenImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["givens"]]: (...Ig: O["givens"][K]) => I["given"];
  };

export type TestWhenImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["whens"]]: (
      ...Iw: O["whens"][K]
    ) => (
      zel: I["iselection"],
      tr: ITestResourceConfiguration,
    ) => Promise<I["when"]>;
  };

export type TestThenImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["thens"]]: (
      ...It: O["thens"][K]
    ) => (ssel: I["iselection"]) => I["then"];
  };

// Describe-It pattern implementations
export type TestDescribeImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["describes"]]: (...Id: O["describes"][K]) => I["given"];
  };

export type TestItImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["its"]]: (
      ...Ii: O["its"][K]
    ) => (sel: I["iselection"]) => I["then"];
  };

// TDT pattern implementations
export type TestValueImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["values"]]: (...Iv: O["values"][K]) => I["given"];
  };

export type TestShouldImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["shoulds"]]: (
      ...Is: O["shoulds"][K]
    ) => (sel: I["iselection"]) => I["then"];
  };

export type TestExpectedImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["expecteds"]]: (
      ...Ie: O["expecteds"][K]
    ) => (sel: I["iselection"]) => Promise<I["then"]>;
  };

// Confirm pattern implementation
export type TestConfirmImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["confirms"]]: (...Ic: O["confirms"][K]) => I["given"];
  };

export type Modify<T, R> = Omit<T, keyof R> & R;

export type TestSuiteShape = Record<string, any>;

export type TestGivenShape = Record<string, any>;
export type TestWhenShape = Record<string, any>;
export type TestThenShape = Record<string, any>;

export type TestDescribeShape = Record<string, any>;
export type TestItShape = Record<string, any>;

export type TestBaseConfirm = Record<string, any>;
export type TestBaseValue = Record<string, any>;
export type TestExpectShape = Record<string, any>;
export type TestExpectVerify = Record<string, any>;

export type IPluginFactory = (
  register?: (entrypoint: string, sources: string[]) => any,
  entrypoints?: string[],
) => Plugin;

export type IRunTime =
  | `node`
  | `web`
  | `golang`
  | `python`
  | `ruby`
  | `java`
  | `rust`;

export type ITestTypes = [string, IRunTime, { ports: number }, ITestTypes[]];
