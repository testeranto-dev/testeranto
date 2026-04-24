// /**
//  * Convert a test path to a source path by removing test/spec patterns
//  */
// export function testPathToSourcePath(testPath: string): string | null {
//   if (!testPath) return null;

//   const patterns = [
//     /\.test\./,
//     /\.spec\./,
//     /-test\./,
//     /-spec\./,
//     /\.test\.[^/.]+\./,
//     /\.spec\.[^/.]+\./,
//   ];

//   for (const pattern of patterns) {
//     if (pattern.test(testPath)) {
//       return testPath.replace(pattern, '.');
//     }
//   }

//   const lastDotIndex = testPath.lastIndexOf('.');
//   if (lastDotIndex !== -1) {
//     const beforeDot = testPath.substring(0, lastDotIndex);
//     const afterDot = testPath.substring(lastDotIndex);

//     const cleaned = beforeDot
//       .replace(/\.test$/, '')
//       .replace(/\.spec$/, '')
//       .replace(/-test$/, '')
//       .replace(/-spec$/, '');

//     if (cleaned !== beforeDot) {
//       return cleaned + afterDot;
//     }
//   }

//   return null;
// }
