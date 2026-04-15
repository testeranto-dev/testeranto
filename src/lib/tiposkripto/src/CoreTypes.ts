import { ITestResourceConfiguration } from "./types";

export type IArtifactory = {
  writeFileSync: (a: string, b: string) => any;
};

export type IWebArtifactory = {
  writeFileSync: (a: string, b: string) => any;
  screenshot: (a: string) => any;
};

// export type SuiteSpecification<
//   I extends Ibdd_in_any,
//   O extends Ibdd_out_any,
// > = {
//     [K in keyof O["suites"]]: (
//       givens: BaseGiven<I>,
//     ) => BaseSuite<I, O>;
//   };

// Universal test adapter with methodology-agnostic terminology
export type IUniversalTestAdapter<I extends TestTypeParams_any, J = "web" | "node"> = {
  // Lifecycle hooks
  prepareAll: (
    input: I["iinput"],
    testResource: ITestResourceConfiguration,
    artifactory: IArtifactory,
  ) => Promise<I["isubject"]>;
  prepareEach: (
    subject: I["isubject"],
    initializer: (c?: any) => I["check"],
    testResource: ITestResourceConfiguration,
    initialValues: any,
    artifactory: IArtifactory,
  ) => Promise<I["istore"]>;

  // Execution
  execute: (
    store: I["istore"],
    actionCB: I["check"],
    testResource: ITestResourceConfiguration,
    artifactory: IArtifactory,
  ) => Promise<I["istore"]>;

  // Verification
  verify: (
    store: I["istore"],
    checkCB: I["check"],
    testResource: ITestResourceConfiguration,
    artifactory: IArtifactory,
  ) => Promise<I["iselection"]>;

  // Cleanup
  cleanupEach: (
    store: I["istore"],
    key: string,
    artifactory: IArtifactory,
  ) => Promise<unknown>;
  cleanupAll: (store: I["istore"], artifactory: IArtifactory) => any;

  // Assertion
  assert: (x: I["check"]) => any;
};

// Test adapter type - uses universal method names
export type ITestAdapter<I extends TestTypeParams_any, J = "web" | "node"> =
  IUniversalTestAdapter<I, J>;

export type ITestSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = (
  Given: GivenSpecification<I, O>,
  When: WhenSpecification<I, O>,
  Then: ThenSpecification<I, O>,
  Describe: DescribeSpecification<I, O>,
  It: ItSpecification<I, O>,
  Confirm: ConfirmSpecification<I, O>,
  Value: ValueSpecification<I, O>,
  Should: ShouldSpecification<I, O>,
) => any[];

export type ITestImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
  modifier = {
    whens: TestWhenImplementation<I, O>;
  },
> = Modify<
  {
    suites: TestSuiteImplementation<O>;

    // BDD pattern
    givens: TestGivenImplementation<I, O>;
    whens: TestWhenImplementation<I, O>;
    thens: TestThenImplementation<I, O>;

    // TDT pattern
    confirms: TestConfirmImplementation<I, O>;
    values: TestValueImplementation<I, O>;
    shoulds: TestShouldImplementation<I, O>;
    expecteds: TestExpectedImplementation<I, O>;

    // AAA pattern
    describes: TestDescribeImplementation<I, O>;
    its: TestItImplementation<I, O>;
  },
  modifier
>;

export type TestSpecShape<
  // ISuites extends TestSuiteShape = TestSuiteShape,
  ISetups extends TestGivenShape = TestGivenShape,
  IActions extends TestWhenShape = TestWhenShape,
  IChecks extends TestThenShape = TestThenShape,
  IDescribes extends TestGivenShape = TestGivenShape,
  IIts extends TestWhenShape = TestWhenShape,
  IConfirms extends TestGivenShape = TestGivenShape,
  IValues extends TestGivenShape = TestGivenShape,
  IShoulds extends TestWhenShape = TestWhenShape,
> = {
  // suites: ISuites;
  givens: ISetups;
  whens: IActions;
  thens: IChecks;
  describes: IDescribes;
  its: IIts;
  confirms: IConfirms;
  values: IValues;
  should?: IShoulds;
};

export type TestSpecShape_any = TestSpecShape<
  TestSuiteShape,
  TestGivenShape,
  TestWhenShape,
  TestThenShape
>;

export type Ibdd_out<
  // ISuites extends TestSuiteShape,  
  IGivens extends TestGivenShape,
  IWhens extends TestWhenShape,
  IThens extends TestThenShape,
  IDescribes extends TestDescribeShape,
  IIts extends TestItShape,
  IConfirms extends TestConfirmShape,
  IValues extends TestValueShape,
  IShoulds extends TestShouldShape,

> = TestSpecShape<
  IGivens,
  IWhens,
  IThens,
  IDescribes,
  IIts,
  IConfirms,
  IValues,
  IShoulds
>;
export type Ibdd_out_any = TestSpecShape_any;

export type TestTypeParams<
  IInput, // Type of initial test input
  ISubject, // Type of object being tested
  IStore, // Type for storing test state between steps
  ISelection, // Type for selecting state for assertions
  ISetup, // Type for Setup step functions (formerly Given)
  IAction, // Type for Action step functions (formerly When)
  ICheck, // Type for Check step functions (formerly Then)
> = {
  /** Initial input required to start tests */
  iinput: IInput;

  /** The subject being tested (class, function, etc) */
  isubject: ISubject;

  /** Complete test state storage */
  istore: IStore;

  /** Selected portion of state for assertions */
  iselection: ISelection;

  /** Function type for Setup steps (Given/Arrange/Map) */
  setup: ISetup;

  /** Function type for Action steps (When/Act/Feed) */
  action: IAction;

  /** Function type for Check steps (Then/Assert/Validate) */
  check: ICheck;
};

export type TestTypeParams_any = TestTypeParams<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>;


export type Ibdd_in<
  IInput,
  ISubject,
  IStore,
  ISelection,
  ISetup,
  IAction,
  ICheck,
> = TestTypeParams<
  IInput,
  ISubject,
  IStore,
  ISelection,
  ISetup,
  IAction,
  ICheck
>;
export type Ibdd_in_any = TestTypeParams_any;
