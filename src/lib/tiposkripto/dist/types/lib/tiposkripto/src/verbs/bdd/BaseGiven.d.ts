import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../../types.js";
/**
 * Represents a collection of Given conditions keyed by their names.
 * Givens are typically organized as named collections because:
 * - They set up different initial states for tests
 * - Tests often need to reference specific Given conditions by name
 * - This allows for better organization and reuse of setup logic
 * - The BDD pattern often involves multiple named Given scenarios
 */
/**
 * BaseGiven for BDD pattern - independent implementation
 */
export declare abstract class BaseGiven<I extends TestTypeParams_any> {
    features: string[];
    whens: any[];
    thens: any[];
    error: Error | null;
    store: I["istore"];
    givenCB: I["given"];
    initialValues: any;
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    testResourceConfiguration: ITestResourceConfiguration | null;
    constructor(features: string[], whens: any[], thens: any[], givenCB: I["given"], initialValues: any);
    addArtifact(path: string): void;
    setParent(parent: any): void;
    toObj(): any;
    /**
     * Abstract method to be implemented by concrete Given classes.
     * Sets up the initial state for the BDD Given phase.
     *
     * @param subject The test subject
     * @param testResourceConfiguration Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @param givenCB Given callback function
     * @param initialValues Initial values for setup
     * @returns Promise resolving to the test store
     */
    abstract givenThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, givenCB: I["given"], initialValues: any): Promise<I["istore"]>;
    afterEach(store: I["istore"], key: string, artifactory: ITestArtifactory): Promise<I["istore"]>;
    give(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: any, suiteNdx?: number): Promise<I["istore"]>;
    private createArtifactoryForWhen;
    private createArtifactoryForThen;
}
