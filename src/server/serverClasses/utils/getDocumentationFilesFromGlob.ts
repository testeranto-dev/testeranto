import { glob } from "fs";
import path from "path";

/**
 * Get documentation files from glob pattern
 */
export function getDocumentationFilesFromGlob(
  globPattern: string | undefined,
): string[] {
  if (!globPattern) {
    return [];
  }

  try {
    const cwd = process.cwd();

    // Normalize glob pattern: remove leading ./ if present
    const normalizedGlob = globPattern.replace(/^\.\//, "");

    // Find files matching the glob pattern
    const files = glob.sync(normalizedGlob, {
      cwd,
      ignore: ["**/node_modules/**", "**/.git/**"],
      nodir: true,
    });

    // Convert to relative paths
    const relativeFiles = files.map((file) => {
      // Ensure forward slashes for consistency
      return file.split(path.sep).join("/");
    });

    return relativeFiles;
  } catch (error) {
    console.error(
      `[utils] Failed to get documentation files from glob:`,
      error,
    );
    return [];
  }
}
