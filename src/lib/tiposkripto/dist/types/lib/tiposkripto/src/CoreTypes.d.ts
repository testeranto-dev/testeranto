import type { GivenSpecification, WhenSpecification, ThenSpecification, TestWhenImplementation, Modify, TestSuiteImplementation, TestGivenImplementation, TestThenImplementation, TestSuiteShape, TestGivenShape, TestWhenShape, TestThenShape } from "../../../Types";
import type { IGivens } from "./BaseGiven";
import type { BaseSuite } from "./BaseSuite";
import type { ITestResourceConfiguration } from "./types";
export type IArtifactory = {};
export type SuiteSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = {
    [K in keyof O["suites"]]: (name: string, givens: IGivens<I>) => BaseSuite<I, O>;
};
export type IUniversalTestAdapter<I extends TestTypeParams_any> = {
    prepareAll: (input: I["iinput"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["isubject"]>;
    prepareEach: (subject: I["isubject"], initializer: (c?: any) => I["given"], testResource: ITestResourceConfiguration, initialValues: any, artifactory?: IArtifactory) => Promise<I["istore"]>;
    execute: (store: I["istore"], actionCB: I["when"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["istore"]>;
    verify: (store: I["istore"], checkCB: I["then"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["iselection"]>;
    cleanupEach: (store: I["istore"], key: string, artifactory?: IArtifactory) => Promise<unknown>;
    cleanupAll: (store: I["istore"], artifactory: IArtifactory) => any;
    assert: (x: I["then"]) => any;
};
export type ITestAdapter<I extends TestTypeParams_any> = IUniversalTestAdapter<I> & {
    beforeAll?: (input: I["iinput"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["isubject"]>;
    beforeEach?: (subject: I["isubject"], initializer: (c?: any) => I["given"], testResource: ITestResourceConfiguration, initialValues: any, artifactory?: IArtifactory) => Promise<I["istore"]>;
    afterEach?: (store: I["istore"], key: string, artifactory?: IArtifactory) => Promise<unknown>;
    afterAll?: (store: I["istore"], artifactory: IArtifactory) => any;
    andWhen?: (store: I["istore"], actionCB: I["when"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["istore"]>;
    butThen?: (store: I["istore"], checkCB: I["then"], testResource: ITestResourceConfiguration, artifactory?: IArtifactory) => Promise<I["iselection"]>;
    assertThis?: (x: I["then"]) => any;
};
export type ITestSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any> = (Suite: SuiteSpecification<I, O>, Given: GivenSpecification<I, O>, When: WhenSpecification<I, O>, Then: ThenSpecification<I, O>, Describe: DescribewSpecification<I, O>, It: ItSpecification<I, O>, Confirm: ValueSpecification<I, O>, Value: ValueSpecification<I, O>, Should: ShouldSpecification<I, O>, Expected: ExpectSpecification<I, O>) => BaseSuite<I, O>[];
export type ITestImplementation<I extends Ibdd_in_any, O extends Ibdd_out_any, modifier = {
    whens: TestWhenImplementation<I, O>;
}> = Modify<{
    suites: TestSuiteImplementation<O>;
    givens: TestGivenImplementation<I, O>;
    whens: TestWhenImplementation<I, O>;
    thens: TestThenImplementation<I, O>;
}, modifier>;
export type TestSpecShape<ISuites extends TestSuiteShape = TestSuiteShape, ISetups extends TestGivenShape = TestGivenShape, IActions extends TestWhenShape = TestWhenShape, IChecks extends TestThenShape = TestThenShape> = {
    suites: ISuites;
    givens: ISetups;
    whens: IActions;
    thens: IChecks;
};
export type TestSpecShape_any = TestSpecShape<TestSuiteShape, TestGivenShape, TestWhenShape, TestThenShape>;
export type Ibdd_out<ISuites extends TestSuiteShape, IGivens extends TestGivenShape, IWhens extends TestWhenShape, IThens extends TestThenShape> = TestSpecShape<ISuites, IGivens, IWhens, IThens>;
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
    given: ISetup;
    /** Function type for Action steps (When/Act/Feed) */
    when: IAction;
    /** Function type for Check steps (Then/Assert/Validate) */
    then: ICheck;
};
export type TestTypeParams_any = TestTypeParams<unknown, unknown, unknown, unknown, unknown, unknown, unknown>;
export type Ibdd_in<IInput, ISubject, IStore, ISelection, IGiven, IWhen, IThen> = TestTypeParams<IInput, ISubject, IStore, ISelection, IGiven, IWhen, IThen>;
export type Ibdd_in_any = TestTypeParams_any;
