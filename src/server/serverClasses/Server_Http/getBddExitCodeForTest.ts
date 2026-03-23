import fs from "fs";
import path from "path";

export const getBddExitCodeForTest = async (
  runtimeKey: string,
  testName: string,
): Promise<{ status: string; color: string }> => {
  // Look for BDD log exit code file
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");
  const testDir = path.join(reportsDir, runtimeKey);

  if (!fs.existsSync(testDir)) {
    return { status: "unknown", color: "gray" };
  }

  // Look for exit code files
  let exitCodeFiles: string[] = [];
  try {
    exitCodeFiles = fs
      .readdirSync(testDir)
      .filter((f) => f.includes("bdd") && f.endsWith(".exitcode"));
  } catch (error) {
    return { status: "unknown", color: "gray" };
  }

  if (exitCodeFiles.length === 0) {
    return { status: "unknown", color: "gray" };
  }

  // Read the first BDD exit code file
  const exitCodeFile = path.join(testDir, exitCodeFiles[0]);
  try {
    const content = fs.readFileSync(exitCodeFile, "utf-8").trim();
    const code = content || "unknown";

    // Determine color based on exit code
    let color = "gray";
    let status = code;
    if (code !== "unknown") {
      const num = parseInt(code, 10);
      if (!isNaN(num)) {
        if (num === 0) {
          color = "green";
          status = "passed";
        } else if (num > 0) {
          color = "yellow";
          status = "failed";
        } else {
          color = "red";
          status = "error";
        }
      }
    }
    return { status, color };
  } catch (error) {
    return { status: "unknown", color: "gray" };
  }
};
