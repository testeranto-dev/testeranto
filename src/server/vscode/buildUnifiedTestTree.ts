import fs from 'fs';
import path from 'path';

export function buildUnifiedTestTree(
  configs: any,
  projectRoot: string
): Record<string, any> {
  if (!configs || !configs.runtimes) {
    return {};
  }

  const tree: Record<string, any> = {};
  
  for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const runtime = runtimeConfig as any;
    tree[runtimeKey] = {
      name: runtimeKey,
      runtime: runtime.runtime,
      tests: {},
    };
    
    const tests = runtime.tests || [];
    for (const testName of tests) {
      const testEntry: Record<string, any> = {
        name: testName,
        sourceFiles: [],
        logs: [],
        results: null,
        outputFiles: [],
      };
      
      // Add source file
      const testPath = path.isAbsolute(testName) ? testName : path.join(projectRoot, testName);
      if (fs.existsSync(testPath)) {
        testEntry.sourceFiles.push({
          path: testName,
          absolutePath: testPath,
          type: 'test'
        });
        
        // Also add other files in the same directory (source files)
        const testDir = path.dirname(testPath);
        try {
          const dirFiles = fs.readdirSync(testDir);
          for (const file of dirFiles) {
            if (file === path.basename(testPath)) {
              continue; // Skip the test file itself
            }
            const filePath = path.join(testDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              // Check if it's a source file by extension
              const ext = path.extname(file).toLowerCase();
              if (['.ts', '.js', '.tsx', '.jsx', '.go', '.py', '.rb', '.java', '.rs', '.c', '.cpp', '.h', '.hpp'].includes(ext)) {
                const relativePath = path.relative(projectRoot, filePath);
                testEntry.sourceFiles.push({
                  path: relativePath,
                  absolutePath: filePath,
                  type: 'source'
                });
              }
            }
          }
        } catch (error) {
          // Ignore errors reading directory
        }
      }
      
      // Look for logs and results in testeranto/reports/{runtimeKey}/{testName}/
      const testDir = path.dirname(testName);
      const testBaseName = path.basename(testName);
      
      // Try multiple possible locations for logs:
      const possibleLogDirs = [];
      
      // 1. Directory containing the test file (where logs actually are)
      const testFileDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testDir);
      possibleLogDirs.push(testFileDir);
      
      // 2. Directory named after the test file (without extension)
      const testNameWithoutExt = testBaseName.replace(/\.[^/.]+$/, '');
      const testNamedDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testDir, testNameWithoutExt);
      possibleLogDirs.push(testNamedDir);
      
      // 3. The exact testName path as a directory
      const exactTestDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey, testName);
      possibleLogDirs.push(exactTestDir);
      
      // 4. Also check the reports directory itself for any files matching the test name pattern
      const reportsRootDir = path.join(projectRoot, 'testeranto', 'reports', runtimeKey);
      possibleLogDirs.push(reportsRootDir);
      
      // Track which files we've already added to avoid duplicates
      const addedFiles = new Set<string>();
      
      for (const reportsDir of possibleLogDirs) {
        if (fs.existsSync(reportsDir)) {
          // Recursively collect all files
          const collectFiles = (dir: string, basePath: string) => {
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(basePath, fullPath);
                if (entry.isDirectory()) {
                  collectFiles(fullPath, basePath);
                } else if (entry.isFile()) {
                  // Calculate the path relative to the reports directory
                  const filePath = `testeranto/reports/${runtimeKey}/${path.relative(
                    path.join(projectRoot, 'testeranto', 'reports', runtimeKey),
                    fullPath
                  )}`;
                  
                  // Skip if we've already added this file
                  if (addedFiles.has(filePath)) {
                    continue;
                  }
                  addedFiles.add(filePath);
                  
                  // Check if this file belongs to our test
                  const fileName = entry.name;
                  const cleanTestName = testNameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
                  
                  // Check if this file is related to our test
                  const isTestFile = cleanFileName.includes(cleanTestName) || 
                                     fileName.includes(testNameWithoutExt) ||
                                     // Also include all .log, .exitcode, .status files in the test directory
                                     (dir === testFileDir && (
                                       fileName.endsWith('.log') || 
                                       fileName.endsWith('.exitcode') || 
                                       fileName.endsWith('.status') ||
                                       fileName.endsWith('.txt')
                                     ));
                  
                  if (fileName === 'test.json' || fileName === 'tests.json') {
                    testEntry.results = filePath;
                  } else if (isTestFile && (
                    fileName.endsWith('.log') || 
                    fileName.endsWith('.txt') || 
                    fileName.includes('log') ||
                    fileName.endsWith('.exitcode') ||
                    fileName.endsWith('.status')
                  )) {
                    // Include all .log, .txt, .exitcode, and .status files as logs
                    testEntry.logs.push(filePath);
                  } else if (isTestFile) {
                    testEntry.outputFiles.push(filePath);
                  }
                }
              }
            } catch (error) {
              // Ignore errors
            }
          };
          collectFiles(reportsDir, reportsDir);
        }
      }
      
      // Also look for files in the test directory that match patterns
      if (fs.existsSync(testFileDir)) {
        try {
          const files = fs.readdirSync(testFileDir);
          for (const file of files) {
            const filePath = path.join(testFileDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const relativePath = `testeranto/reports/${runtimeKey}/${testDir}/${file}`;
              if (addedFiles.has(relativePath)) {
                continue;
              }
              
              // Check if file matches our test pattern
              const cleanTestName = testNameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanFileName = file.toLowerCase().replace(/[^a-z0-9]/g, '');
              
              if (cleanFileName.includes(cleanTestName) || 
                  file.includes(testNameWithoutExt) ||
                  file.endsWith('.log') || 
                  file.endsWith('.exitcode') || 
                  file.endsWith('.status') ||
                  file.endsWith('.txt')) {
                if (file === 'test.json' || file === 'tests.json') {
                  testEntry.results = relativePath;
                } else if (
                  file.endsWith('.log') || 
                  file.endsWith('.txt') || 
                  file.includes('log') ||
                  file.endsWith('.exitcode') ||
                  file.endsWith('.status')
                ) {
                  testEntry.logs.push(relativePath);
                } else {
                  testEntry.outputFiles.push(relativePath);
                }
              }
            }
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      tree[runtimeKey].tests[testName] = testEntry;
    }
  }
  
  return tree;
}
