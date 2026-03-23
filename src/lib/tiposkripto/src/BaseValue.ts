import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseValue extends BaseSetup for TDT pattern.
 * Sets up table data for table-driven testing.
 */
export class BaseValue<I extends TestTypeParams_any> extends BaseSetup<I> {
  /**
   * Abstract method to be implemented by concrete Value classes.
   * Sets up table data for the TDT (Table-Driven Testing) pattern.
   * 
   * @param subject The test subject
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @param setupCB Setup callback function
   * @param initialValues Initial values for setup
   * @returns Promise resolving to the test store
   */
  abstract setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]>;
  
  // Table rows for TDT
  tableRows: any[][];
  
  constructor(
    features: string[],
    tableRows: any[][],
    confirmCB: I["given"],
    initialValues: any,
  ) {
    // For TDT, actions will be Should and checks will be Expected
    // We'll process them differently in setup
    super(features, [], [], confirmCB, initialValues);
    this.tableRows = tableRows;
  }

  // Override setup to process table rows
  async setup(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;

    const actualArtifactory =
      artifactory || ((fPath: string, value: unknown) => { });
    const valueArtifactory = (fPath: string, value: unknown) =>
      actualArtifactory(`value-${key}/${fPath}`, value);

    try {
      this.store = await this.setupThat(
        subject,
        testResourceConfiguration,
        valueArtifactory,
        this.setupCB,
        this.initialValues,
      );
      this.status = true;
    } catch (e: any) {
      this.status = false;
      this.failed = true;
      this.fails++;
      this.error = e;
      return this.store;
    }

    try {
      // Process each table row
      for (const [rowIndex, row] of (this.tableRows || []).entries()) {
        try {
          // Create artifactory for row context
          const rowArtifactory = this.createArtifactoryForRow(
            key,
            rowIndex,
            suiteNdx,
          );
          
          // Process the row
          // The actions and checks should be set up to handle row data
          // For now, we'll just pass the row to the tester
          // In practice, this would be more complex
          const rowResult = await this.processRow(row, rowIndex, rowArtifactory, testResourceConfiguration);
          if (rowResult !== undefined) {
            tester(rowResult);
          }
        } catch (e: any) {
          this.failed = true;
          this.fails++;
          this.error = e;
        }
      }
    } catch (e: any) {
      this.error = e;
      this.failed = true;
      this.fails++;
    } finally {
      try {
        await this.afterEach(this.store, this.key, valueArtifactory);
      } catch (e: any) {
        this.failed = true;
        this.fails++;
        this.error = e;
      }
    }

    return this.store;
  }

  private async processRow(row: any[], rowIndex: number, artifactory: any, testResourceConfiguration: any) {
    // This would be implemented to process each row using Should and Expected
    // For now, return the row for testing
    return row;
  }

  private createArtifactoryForRow(
    key: string,
    rowIndex: number,
    suiteNdx?: number,
  ) {
    const self = this as any;
    if (self._parent && self._parent.createArtifactory) {
      return self._parent.createArtifactory({
        valueKey: key,
        rowIndex: rowIndex,
        suiteIndex: suiteNdx,
      });
    }
    // Fallback to logging
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteNdx !== undefined) {
          path += `suite-${suiteNdx}/`;
        }
        path += `value-${key}/`;
        path += `row-${rowIndex} ${filename}`;
        console.log(`[Artifactory] Would write to: ${path}`);
        console.log(`[Artifactory] Content: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename: string, payload?: string) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      },
    };
  }

  toObj() {
    return {
      key: this.key,
      tableRows: this.tableRows || [],
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }
}

export type IValues<I extends TestTypeParams_any> = Record<string, BaseValue<I>>;
