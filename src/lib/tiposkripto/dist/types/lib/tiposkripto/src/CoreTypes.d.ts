import type { ConfirmSpecification, DescribeSpecification, GivenSpecification, ItSpecification, Modify, ShouldSpecification, TestConfirmImplementation, TestConfirmShape, TestDescribeImplementation, TestDescribeShape, TestExpectedImplementation, TestGivenImplementation, TestGivenShape, TestItImplementation, TestItShape, TestShouldImplementation, TestShouldShape, TestSuiteImplementation, TestSuiteShape, TestThenImplementation, TestThenShape, TestValueImplementation, TestValueShape, TestWhenImplementation, TestWhenShape, ThenSpecification, ValueSpecification, WhenSpecification } from "./../../../Types";
import { ITestResourceConfiguration } from "./types";
export type IArtifactory = {
    writeFileSync: (a: string, b: string) => any;
};
export type IUniversalTestAdapter<I extends TestTypeParams_any> = {
    prepareAll: (input: I["iinput"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["isubject"]>;
    prepareEach: (subject: I["isubject"], initializer: (c?: any) => I["check"], testResource: ITestResourceConfiguration, initialValues: any, artifactory?: IArtifactory) => Promise<I["istore"]>;
    execute: (store: I["istore"], actionCB: I["check"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["istore"]>;
    verify: (store: I["istore"], checkCB: I["check"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["iselection"]>;
    cleanupEach: (store: I["istore"], key: string, artifactory?: IArtifactory) => Promise<unknown>;
    cleanupAll: (store: I["istore"], artifactory: IArtifactory) => any;
    assert: (x: I["check"]) => any;
};
export type ITestAdapter<I extends TestTypeParams_any> = IUniversalTestAdapter<I>;
export type ITestSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = (Given: GivenSpecification<I, O>, When: WhenSpecification<I, O>, Then: ThenSpecification<I, O>, Describe: DescribeSpecification<I, O>, It: ItSpecification<I, O>, Confirm: ConfirmSpecification<I, O>, Value: ValueSpecification<I, O>, Should: ShouldSpecification<I, O>) => any[];
export type ITestImplementation<I extends Ibdd_in_any, O extends Ibdd_out_any, modifier = {
    whens: TestWhenImplementation<I, O>;
}> = Modify<{
    suites: TestSuiteImplementation<O>;
    givens: TestGivenImplementation<I, O>;
    whens: TestWhenImplementation<I, O>;
    thens: TestThenImplementation<I, O>;
    confirms: TestConfirmImplementation<I, O>;
    values: TestValueImplementation<I, O>;
    shoulds: TestShouldImplementation<I, O>;
    expecteds: TestExpectedImplementation<I, O>;
    describes: TestDescribeImplementation<I, O>;
    its: TestItImplementation<I, O>;
}, modifier>;
export type TestSpecShape<ISetups extends TestGivenShape = TestGivenShape, IActions extends TestWhenShape = TestWhenShape, IChecks extends TestThenShape = TestThenShape, IDescribes extends TestGivenShape = TestGivenShape, IIts extends TestWhenShape = TestWhenShape, IConfirms extends TestGivenShape = TestGivenShape, IValues extends TestGivenShape = TestGivenShape, IShoulds extends TestWhenShape = TestWhenShape> = {
    givens: ISetups;
    whens: IActions;
    thens: IChecks;
    describes: IDescribes;
    its: IIts;
    confirms: IConfirms;
    values: IValues;
    should?: IShoulds;
};
export type TestSpecShape_any = TestSpecShape<TestSuiteShape, TestGivenShape, TestWhenShape, TestThenShape>;
export type Ibdd_out<IGivens extends TestGivenShape, IWhens extends TestWhenShape, IThens extends TestThenShape, IDescribes extends TestDescribeShape, IIts extends TestItShape, IConfirms extends TestConfirmShape, IValues extends TestValueShape, IShoulds extends TestShouldShape> = TestSpecShape<IGivens, IWhens, IThens, IDescribes, IIts, IConfirms, IValues, IShoulds>;
export type Ibdd_out_any = TestSpecShape_any;
export type TestTypeParams<IInput, // Type of initial test input
ISubject, // Type of object being tested
IStore, // Type for storing test state between steps
ISelection, // Type for selecting state for assertions
ISetup, // Type for Setup step functions (formerly Given)
IAction, // Type for Action step functions (formerly When)
ICheck> = {
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
export type TestTypeParams_any = TestTypeParams<unknown, unknown, unknown, unknown, unknown, unknown, unknown>;
export type Ibdd_in<IInput, ISubject, IStore, ISelection, ISetup, IAction, ICheck> = TestTypeParams<IInput, ISubject, IStore, ISelection, ISetup, IAction, ICheck>;
export type Ibdd_in_any = TestTypeParams_any;
