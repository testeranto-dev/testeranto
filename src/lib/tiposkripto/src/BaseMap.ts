import { BaseSetup } from "./BaseSetup.js";
import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseMap extends BaseSetup to support TDT (Table Driven Testing) pattern.
 * It sets up the test table data.
 */
export class BaseMap<I extends TestTypeParams_any> extends BaseSetup<I> {
  // Additional property to store table data
  tableData: any[];

  constructor(
    features: string[],
    feeds: any[],  // These will be processed as actions
    validates: any[],  // These will be processed as checks
    mapCB: I["given"],
    initialValues: any,
    tableData: any[] = []
  ) {
    // Map feeds to actions, validates to checks
    super(features, feeds, validates, mapCB, initialValues);
    this.tableData = tableData;
  }

  // Alias setup to map for TDT pattern
  async map(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number
  ) {
    // Store table data in the subject or store for later use
    // For now, just call the parent setup method
    return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
  }

  // Method to get table data
  getTableData(): any[] {
    return this.tableData || [];
  }
}

export type IMaps<I extends TestTypeParams_any> = Record<string, BaseMap<I>>;
