/**
 * Common utilities shared across all testing patterns
 */
export declare class CommonUtils {
    /**
     * Normalize a path string for consistent artifact storage
     */
    static normalizePath(path: string): string;
    /**
     * Add an artifact with path normalization
     */
    static addArtifact(artifacts: string[], path: string): void;
    /**
     * Create a fallback artifactory for logging
     */
    static createFallbackArtifactory(context: {
        suiteIndex?: number;
        givenKey?: string;
        whenIndex?: number;
        thenIndex?: number;
        valueKey?: string;
        rowIndex?: number;
    }, basePath?: string): any;
    /**
     * Standard error handling for test operations
     */
    static handleTestError(error: any, target: {
        failed: boolean;
        fails: number;
        error: Error | null;
    }): void;
    /**
     * Standard method to create an object representation
     */
    static toObj(target: {
        key?: string;
        name?: string;
        failed: boolean;
        fails?: number;
        error: Error | null;
        features?: string[];
        artifacts: string[];
        status?: boolean | undefined;
    }, additionalProps?: Record<string, any>): any;
}
