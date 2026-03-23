import type {
  GivenSpecification,
  WhenSpecification,
  ThenSpecification,
  DescribeSpecification,
  ItSpecification,
  ValueSpecification,
  ShouldSpecification,
  ExpectSpecification,
  ConfirmSpecification,
  TestWhenImplementation,
  Modify,
  TestSuiteImplementation,
  TestGivenImplementation,
  TestThenImplementation,
  TestDescribeImplementation,
  TestItImplementation,
  TestValueImplementation,
  TestShouldImplementation,
  TestExpectedImplementation,
  TestConfirmImplementation,
  TestSuiteShape,
  TestGivenShape,
  TestWhenShape,
  TestThenShape,
} from "../../../Types";
import type { IGivens } from "./BaseGiven";
import type { BaseSuite } from "./BaseSuite";
import type { ITestResourceConfiguration } from "./types";

export type IArtifactory = {};

export type SuiteSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = {
    [K in keyof O["suites"]]: (
      name: string,
      givens: IGivens<I>,
    ) => BaseSuite<I, O>;
  };

// Universal test adapter with methodology-agnostic terminology
export type IUniversalTestAdapter<I extends TestTypeParams_any> = {
  // Lifecycle hooks
  prepareAll: (
    input: I["iinput"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => Promise<I["isubject"]>;
  prepareEach: (
    subject: I["isubject"],
    initializer: (c?: any) => I["given"],
    testResource: ITestResourceConfiguration,
    initialValues: any,
    artifactory?: IArtifactory,
  ) => Promise<I["istore"]>;

  // Execution
  execute: (
    store: I["istore"],
    actionCB: I["when"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => Promise<I["istore"]>;

  // Verification
  verify: (
    store: I["istore"],
    checkCB: I["then"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => Promise<I["iselection"]>;

  // Cleanup
  cleanupEach: (
    store: I["istore"],
    key: string,
    artifactory?: IArtifactory,
  ) => Promise<unknown>;
  cleanupAll: (store: I["istore"], artifactory: IArtifactory) => any;

  // Assertion
  assert: (x: I["then"]) => any;
};

// Legacy BDD adapter for backward compatibility
export type ITestAdapter<I extends TestTypeParams_any> =
  IUniversalTestAdapter<I> & {
    // Legacy method names for backward compatibility
    beforeAll?: (
      input: I["iinput"],
      testResource: ITestResourceConfiguration,
      artifactory?: IArtifactory,
    ) => Promise<I["isubject"]>;
    beforeEach?: (
      subject: I["isubject"],
      initializer: (c?: any) => I["given"],
      testResource: ITestResourceConfiguration,
      initialValues: any,
      artifactory?: IArtifactory,
    ) => Promise<I["istore"]>;
    afterEach?: (
      store: I["istore"],
      key: string,
      artifactory?: IArtifactory,
    ) => Promise<unknown>;
    afterAll?: (store: I["istore"], artifactory: IArtifactory) => any;
    andWhen?: (
      store: I["istore"],
      actionCB: I["when"],
      testResource: ITestResourceConfiguration,
      artifactory?: IArtifactory,
    ) => Promise<I["istore"]>;
    butThen?: (
      store: I["istore"],
      checkCB: I["then"],
      testResource: ITestResourceConfiguration,
      artifactory?: IArtifactory,
    ) => Promise<I["iselection"]>;
    assertThis?: (x: I["then"]) => any;
  };

export type ITestSpecification<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
> = (
  Suite: SuiteSpecification<I, O>,
  Given: GivenSpecification<I, O>,
  When: WhenSpecification<I, O>,
  Then: ThenSpecification<I, O>,
  Describe: DescribeSpecification<I, O>,
  It: ItSpecification<I, O>,
  Confirm: ConfirmSpecification<I, O>,
  Value: ValueSpecification<I, O>,
  Should: ShouldSpecification<I, O>,
  Expected: ExpectSpecification<I, O>,
) => BaseSuite<I, O>[];

export type ITestImplementation<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
  modifier = {
    whens: TestWhenImplementation<I, O>;
  },
> = Modify<
  {
    suites: TestSuiteImplementation<O>;
    givens: TestGivenImplementation<I, O>;
    whens: TestWhenImplementation<I, O>;
    thens: TestThenImplementation<I, O>;
    // TDT pattern
    values: TestValueImplementation<I, O>;
    shoulds: TestShouldImplementation<I, O>;
    expecteds: TestExpectedImplementation<I, O>;
    // Describe-It pattern
    describes: TestDescribeImplementation<I, O>;
    its: TestItImplementation<I, O>;
    // Confirm pattern
    confirms?: TestConfirmImplementation<I, O>;
  },
  modifier
>;

export type TestSpecShape<
  ISuites extends TestSuiteShape = TestSuiteShape,
  ISetups extends TestGivenShape = TestGivenShape,
  IActions extends TestWhenShape = TestWhenShape,
  IChecks extends TestThenShape = TestThenShape,
  IDescribes extends TestGivenShape = TestGivenShape,
  IIts extends TestWhenShape = TestWhenShape,
  IValues extends TestGivenShape = TestGivenShape,
  IShoulds extends TestWhenShape = TestWhenShape,
  IExpecteds extends TestThenShape = TestThenShape,
  IConfirms extends TestGivenShape = TestGivenShape,
> = {
  suites: ISuites;
  givens: ISetups;
  whens: IActions;
  thens: IChecks;
  describes?: IDescribes;
  its?: IIts;
  values?: IValues;
  shoulds?: IShoulds;
  expecteds?: IExpecteds;
  confirms?: IConfirms;
};

export type TestSpecShape_any = TestSpecShape<
  TestSuiteShape,
  TestGivenShape,
  TestWhenShape,
  TestThenShape
>;

// Legacy type aliases for backward compatibility
export type Ibdd_out<
  ISuites extends TestSuiteShape,
  IGivens extends TestGivenShape,
  IWhens extends TestWhenShape,
  IThens extends TestThenShape,
> = TestSpecShape<ISuites, IGivens, IWhens, IThens>;
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
  given: ISetup;

  /** Function type for Action steps (When/Act/Feed) */
  when: IAction;

  /** Function type for Check steps (Then/Assert/Validate) */
  then: ICheck;
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

// Legacy type aliases for backward compatibility
export type Ibdd_in<
  IInput,
  ISubject,
  IStore,
  ISelection,
  IGiven,
  IWhen,
  IThen,
> = TestTypeParams<IInput, ISubject, IStore, ISelection, IGiven, IWhen, IThen>;
export type Ibdd_in_any = TestTypeParams_any;
