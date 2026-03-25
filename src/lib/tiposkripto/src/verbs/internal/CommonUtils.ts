/**
 * Common utilities shared across all testing patterns
 */
export class CommonUtils {
  /**
   * Normalize a path string for consistent artifact storage
   */
  static normalizePath(path: string): string {
    if (typeof path !== "string") {
      throw new Error(
        `[ARTIFACT ERROR] Expected string, got ${typeof path}: ${JSON.stringify(
          path,
        )}`,
      );
    }
    return path.replace(/\\/g, "/");
  }

  /**
   * Add an artifact with path normalization
   */
  static addArtifact(artifacts: string[], path: string): void {
    artifacts.push(this.normalizePath(path));
  }

  /**
   * Create a fallback artifactory for logging
   */
  static createFallbackArtifactory(
    context: {
      suiteIndex?: number;
      givenKey?: string;
      whenIndex?: number;
      thenIndex?: number;
      valueKey?: string;
      rowIndex?: number;
    },
    basePath?: string,
  ): any {
    const { suiteIndex, givenKey, whenIndex, thenIndex, valueKey, rowIndex } = context;
    const actualBasePath = basePath || "testeranto";
    
    return {
      writeFileSync: (filename: string, payload: string) => {
        let path = "";
        if (suiteIndex !== undefined) {
          path += `suite-${suiteIndex}/`;
        }
        if (givenKey !== undefined) {
          path += `given-${givenKey}/`;
        }
        if (whenIndex !== undefined) {
          path += `when-${whenIndex}/`;
        }
        if (thenIndex !== undefined) {
          path += `then-${thenIndex}/`;
        }
        if (valueKey !== undefined) {
          path += `value-${valueKey}/`;
        }
        if (rowIndex !== undefined) {
          path += `row-${rowIndex}/`;
        }
        path += filename;
        const fullPath = `${actualBasePath}/${path}`;
        console.log(`[Artifactory] Would write to ${fullPath}: ${payload.substring(0, 100)}...`);
      },
      screenshot: (filename: string, payload?: string) => {
        console.log(`[Artifactory] Would take screenshot: ${filename}`);
      },
    };
  }

  /**
   * Standard error handling for test operations
   */
  static handleTestError(
    error: any,
    target: { failed: boolean; fails: number; error: Error | null },
  ): void {
    target.failed = true;
    target.fails++;
    target.error = error;
  }

  /**
   * Standard method to create an object representation
   */
  static toObj(
    target: {
      key?: string;
      name?: string;
      failed: boolean;
      fails?: number;
      error: Error | null;
      features?: string[];
      artifacts: string[];
      status?: boolean | undefined;
    },
    additionalProps: Record<string, any> = {},
  ): any {
    const baseObj: any = {
      key: target.key,
      name: target.name,
      error: target.error ? [target.error, target.error.stack] : null,
      failed: target.failed,
      features: target.features || [],
      artifacts: target.artifacts,
      status: target.status,
    };

    if (target.fails !== undefined) {
      baseObj.fails = target.fails;
    }

    return { ...baseObj, ...additionalProps };
  }
}
