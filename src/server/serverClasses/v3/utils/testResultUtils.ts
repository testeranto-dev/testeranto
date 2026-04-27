export function processTestResults(testResults: any): { success: boolean; message: string } {
  // Implement the logic to process test results
  // This is a placeholder implementation
  const success = testResults.every((result: any) => result.passed);
  const message = success ? "All tests passed" : "Some tests failed";
  return { success, message };
}
