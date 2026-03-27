import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../types.js";
import { CommonUtils } from "../internal/CommonUtils.js";

/**
 * BaseValue for TDT pattern - independent implementation
 * Sets up table data for table-driven testing.
 */
export class BaseValue<I extends TestTypeParams_any> {
  features: string[];
  tableRows: any[][];
  confirmCB: I["setup"];
  initialValues: any;
  key: string = "";
  failed: boolean = false;
  artifacts: string[] = [];
  fails: number = 0;
  status: boolean | undefined;
  error: Error | null = null;
  store: I["istore"] = null as any;
  testResourceConfiguration: ITestResourceConfiguration | null = null;

  constructor(
    features: string[],
    tableRows: any[][],
    confirmCB: I["setup"],
    initialValues: any,
  ) {
    this.features = features;
    this.tableRows = tableRows;
    this.confirmCB = confirmCB;
    this.initialValues = initialValues;
  }

  setParent(parent: any) {
    (this as any)._parent = parent;
  }

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  async value(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["check"]> | undefined) => boolean,
    artifactory?: any,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;

    const actualArtifactory =
      artifactory || ((fPath: string, value: unknown) => { });
    const valueArtifactory = (fPath: string, value: unknown) =>
      actualArtifactory(`value-${key}/${fPath}`, value);

    try {
      // Setup phase
      const result = (this.confirmCB as any)();
      if (typeof result === "function") {
        this.store = await result();
      } else {
        this.store = await result;
      }
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
          const rowResult = await this.processRow(
            row,
            rowIndex,
            rowArtifactory,
            testResourceConfiguration,
          );
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

  private async processRow(
    row: any[],
    rowIndex: number,
    artifactory: any,
    testResourceConfiguration: any,
  ) {
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

  async afterEach(store: I["istore"], key: string, artifactory: any): Promise<I["istore"]> {
    return store;
  }

  toObj() {
    // Process table rows to include actual values
    const processedRows = (this.tableRows || []).map(row => {
      if (Array.isArray(row)) {
        return row.map(item => {
          if (item && typeof item === 'object') {
            // If it has a toObj method, call it
            if (item.toObj) {
              return item.toObj();
            }
            // Otherwise, return key properties
            const result: any = {};
            for (const [key, value] of Object.entries(item)) {
              if (key !== '_parent' && key !== 'testResourceConfiguration') {
                result[key] = value;
              }
            }
            return result;
          }
          return item;
        });
      }
      return row;
    });

    return {
      key: this.key,
      values: processedRows,
      tableRows: this.tableRows || [],
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features || [],
      artifacts: this.artifacts,
      status: this.status,
    };
  }
}

export type IValues<I extends TestTypeParams_any> = Record<
  string,
  BaseValue<I>
>;
