import { readFileSync } from "fs";
import { parse } from "yaml";

/**
 * Parse a markdown file with YAML frontmatter.
 *
 * The frontmatter is delimited by `---` lines at the start of the file.
 * Expected frontmatter keys:
 *   - `add`: list of file paths to be added as read‑write (`--file`)
 *   - `read`: list of file paths to be added as read‑only (`--read`)
 *
 * The body of the markdown (everything after the second `---`) is the persona message.
 *
 * @param filePath Absolute path to the markdown file.
 * @returns Parsed frontmatter and body.
 */
export function parseAgentMarkdown(filePath: string): {
  personaBody: string;
  readFiles: string[];
  addFiles: string[];
} {
  const content = readFileSync(filePath, "utf-8");

  // Expect frontmatter delimited by `---`
  if (!content.startsWith("---")) {
    // No frontmatter – treat the whole file as the persona body
    return {
      personaBody: content,
      readFiles: [],
      addFiles: [],
    };
  }

  // Find the closing `---`
  const endOfFrontmatter = content.indexOf("---", 3);
  if (endOfFrontmatter === -1) {
    // Malformed – treat whole file as body
    return {
      personaBody: content,
      readFiles: [],
      addFiles: [],
    };
  }

  const frontmatterRaw = content.slice(3, endOfFrontmatter).trim();
  const body = content.slice(endOfFrontmatter + 3).trim();

  const frontmatter: { add?: string[]; read?: string[] } = parse(frontmatterRaw) || {};

  return {
    personaBody: body,
    readFiles: frontmatter.read || [],
    addFiles: frontmatter.add || [],
  };
}
