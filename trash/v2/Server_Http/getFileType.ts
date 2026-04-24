export const getFileType = (filename: string): string => {
  if (
    filename === "tests.json" ||
    (filename.endsWith(".json") && filename.includes("test"))
  ) {
    return "test-results";
  } else if (filename.endsWith(".log")) {
    return "log";
  } else if (filename.endsWith(".html")) {
    return "html";
  } else if (filename.endsWith(".json")) {
    return "json";
  } else if (filename.endsWith(".md")) {
    return "documentation";
  } else if (
    filename.endsWith(".ts") ||
    filename.endsWith(".js") ||
    filename.endsWith(".tsx") ||
    filename.endsWith(".jsx")
  ) {
    return "javascript";
  } else if (filename.endsWith(".rb")) {
    return "ruby";
  } else if (filename.endsWith(".py")) {
    return "python";
  } else if (filename.endsWith(".go")) {
    return "golang";
  } else if (filename.endsWith(".rs")) {
    return "rust";
  } else if (filename.endsWith(".java")) {
    return "java";
  } else {
    return "file";
  }
};
