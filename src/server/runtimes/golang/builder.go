package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Builder struct{}

func NewBuilder() *Builder {
	return &Builder{}
}

// TODO entrypoints should be "tests"
func (b *Builder) Run(testName string, entryPoints []string, outputs []string, isDevMode bool, projectConfigPath string) {
	fmt.Printf("[Go Builder] Test name: %s\n", testName)
	fmt.Printf("[Go Builder] Entry points: %v\n", entryPoints)
	fmt.Printf("[Go Builder] Mode: %s\n", func() string {
		if isDevMode {
			return "dev"
		}
		return "once"
	}())

	// FIXME: I always catch because enytrpoints is the wrong key, use "tests" as key instead
	if len(entryPoints) == 0 {
		fmt.Fprintln(os.Stderr, "❌ No entry points provided")
		os.Exit(1)
	}

	// Change to workspace directory
	workspace := "/workspace"
	if err := os.Chdir(workspace); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to change to workspace directory: %v\n", err)
		os.Exit(1)
	}

	// Create bundles directory
	bundlesDir := filepath.Join(workspace, "testeranto/bundles", testName)
	if err := os.MkdirAll(bundlesDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to create bundles directory: %v\n", err)
		os.Exit(1)
	}

	// Create a map to store all tests' information
	allTestsInfo := make(map[string]TestInfo)

	// Process each entry point
	for _, entryPoint := range entryPoints {
		b.processEntryPoint(entryPoint, workspace, bundlesDir, allTestsInfo)
	}

	// Write single inputFiles.json for all tests
	inputFilesPath := filepath.Join(bundlesDir, "inputFiles.json")
	inputFilesJSON, err := json.MarshalIndent(allTestsInfo, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Failed to marshal inputFiles.json: %v\n", err)
		os.Exit(1)
	}
	if err := os.WriteFile(inputFilesPath, inputFilesJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Failed to write inputFiles.json: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("\n✅ Created inputFiles.json at %s with %d tests\n", inputFilesPath, len(allTestsInfo))

	fmt.Println("\n🎉 Go builder completed successfully")
}

func (b *Builder) processEntryPoint(entryPoint, workspace, bundlesDir string, allTestsInfo map[string]TestInfo) {
	fmt.Printf("\n📦 Processing Go test: %s\n", entryPoint)

	// Get entry point path
	entryPointPath := filepath.Join(workspace, entryPoint)
	if _, err := os.Stat(entryPointPath); err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Entry point does not exist: %s\n", entryPointPath)
		os.Exit(1)
	}

	// Get base name (without .go extension)
	fileName := filepath.Base(entryPoint)
	if !strings.HasSuffix(fileName, ".go") {
		fmt.Fprintf(os.Stderr, "  ❌ Entry point is not a Go file: %s\n", entryPoint)
		os.Exit(1)
	}
	baseName := strings.TrimSuffix(fileName, ".go")
	// Replace dots with underscores to make a valid binary name
	binaryName := strings.ReplaceAll(baseName, ".", "_")

	// Find module root
	moduleRoot := findModuleRoot(entryPointPath)
	if moduleRoot == "" {
		fmt.Fprintf(os.Stderr, "  ❌ Cannot find go.mod in or above %s\n", entryPointPath)
		os.Exit(1)
	}

	// Change to module root directory
	if err := os.Chdir(moduleRoot); err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Cannot change to module root %s: %v\n", moduleRoot, err)
		os.Exit(1)
	}

	// Get relative path from module root to entry point
	relEntryPath, err1 := filepath.Rel(moduleRoot, entryPointPath)
	if err1 != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Failed to get relative path: %v\n", err1)
		os.Exit(1)
	}

	// Go modules handle dependencies automatically
	// The build will succeed or fail based on go.mod correctness
	fmt.Printf("  Building with Go modules...\n")
	
	// Check if go.mod exists and has a module declaration
	goModCheckPath := filepath.Join(moduleRoot, "go.mod")
	hasValidGoMod := false
	if goModContent, err := os.ReadFile(goModCheckPath); err == nil {
		if strings.Contains(string(goModContent), "module ") {
			hasValidGoMod = true
		}
	}
	
	// According to SOUL.md, we should fail immediately if there's no valid go.mod
	// No guessing or fallbacks
	if !hasValidGoMod {
		fmt.Fprintf(os.Stderr, "  ❌ No valid go.mod found in %s\n", moduleRoot)
		fmt.Fprintf(os.Stderr, "  💡 Go modules are required for building tests\n")
		os.Exit(1)
	}
	
	// We have a valid go.mod, proceed with dependency management
	goSumPath := filepath.Join(moduleRoot, "go.sum")
	if _, errStat := os.Stat(goSumPath); errStat == nil {
		fmt.Printf("  Removing go.sum to force fresh dependency resolution...\n")
		os.Remove(goSumPath)
	}
	
	fmt.Printf("  Running go mod tidy...\n")
	tidyCmd := exec.Command("go", "mod", "tidy")
	tidyCmd.Stdout = os.Stdout
	tidyCmd.Stderr = os.Stderr
	tidyCmd.Dir = moduleRoot
	if errTidy := tidyCmd.Run(); errTidy != nil {
		// According to SOUL.md, propagate the error immediately
		fmt.Fprintf(os.Stderr, "  ❌ go mod tidy failed: %v\n", errTidy)
		fmt.Fprintf(os.Stderr, "  💡 This indicates dependency issues that must be fixed\n")
		os.Exit(1)
	}

	// Collect input files
	var inputs []string
	
	// Add the entry point file itself
	relEntryToWorkspace, errRel := filepath.Rel(workspace, entryPointPath)
	if errRel == nil && !strings.HasPrefix(relEntryToWorkspace, "..") {
		inputs = append(inputs, relEntryToWorkspace)
	} else {
		// If we can't get a relative path, use the original entry point
		inputs = append(inputs, entryPoint)
	}
	
	// Add go.mod and go.sum if they exist
	goModPath := filepath.Join(moduleRoot, "go.mod")
	goSumPath2 := filepath.Join(moduleRoot, "go.sum")
	for _, filePath := range []string{goModPath, goSumPath2} {
		if _, errStat := os.Stat(filePath); errStat == nil {
			relToWorkspace, errRel := filepath.Rel(workspace, filePath)
			if errRel == nil && !strings.HasPrefix(relToWorkspace, "..") {
				inputs = append(inputs, relToWorkspace)
			}
		}
	}
	
	// Add all .go files in the module root and subdirectories
	errWalk := filepath.Walk(moduleRoot, func(path string, info os.FileInfo, errWalkInner error) error {
		if errWalkInner != nil {
			return errWalkInner
		}
		if !info.IsDir() && strings.HasSuffix(path, ".go") {
			relToWorkspace, errRel := filepath.Rel(workspace, path)
			if errRel == nil && !strings.HasPrefix(relToWorkspace, "..") {
				inputs = append(inputs, relToWorkspace)
			}
		}
		return nil
	})
	if errWalk != nil {
		// According to SOUL.md, we should propagate errors, not just log them
		fmt.Fprintf(os.Stderr, "  ❌ Error walking directory: %v\n", errWalk)
		os.Exit(1)
	}
	
	fmt.Printf("  Found %d input files\n", len(inputs))
	
	// Run native detection for test analysis
	detectionResult, err := translateNativeTest(entryPointPath)
	if err != nil {
		// According to SOUL.md, we should propagate errors
		fmt.Fprintf(os.Stderr, "  ❌ Native detection failed: %v\n", err)
		os.Exit(1)
	}
	
	// Log detection result
	if detectionResult.IsNativeTest {
		fmt.Printf("  Detected native test with framework: %s\n", detectionResult.FrameworkType)
	}

	// Compute hash
	hash, err2 := computeFilesHash(inputs)
	if err2 != nil {
		fmt.Printf("  ⚠️  Failed to compute hash: %v\n", err2)
		hash = "error"
	}

	// Store test information
	allTestsInfo[entryPoint] = TestInfo{
		Hash:  hash,
		Files: inputs,
	}

	// Compile the binary
	destDir := filepath.Join(bundlesDir, filepath.Dir(relEntryPath))
	if err := os.MkdirAll(destDir, 0755); err != nil {
	    fmt.Fprintf(os.Stderr, "  ❌ Failed to create output directory: %v\n", err)
	    os.Exit(1)
	}
	outputExePath := filepath.Join(destDir, binaryName)
	fmt.Printf("  🔨 Compiling %s to %s...\n", relEntryPath, outputExePath)

	// Build the entire package directory, not just the single file
	// Get the directory containing the entry point
	entryDir := filepath.Dir(relEntryPath)
	if entryDir == "." {
		entryDir = "./"
	}
	
	// List all .go files in the entry directory for debugging
	fmt.Printf("  📁 Building package in directory: %s\n", entryDir)
	goFiles, _ := filepath.Glob(filepath.Join(entryDir, "*.go"))
	fmt.Printf("  📄 Found %d .go files in package:\n", len(goFiles))
	for _, f := range goFiles {
		fmt.Printf("    - %s\n", filepath.Base(f))
	}
	
	// Build the package in that directory
	// Use ./... pattern to build all packages in the directory
	// First, ensure all dependencies are built
	buildDepsCmd := exec.Command("go", "build", "./...")
	buildDepsCmd.Stdout = os.Stdout
	buildDepsCmd.Stderr = os.Stderr
	buildDepsCmd.Dir = moduleRoot
	if err := buildDepsCmd.Run(); err != nil {
		fmt.Printf("  ⚠️  Failed to build dependencies: %v\n", err)
		// Continue anyway, as the main build might still work
	}
	
	buildCmd := exec.Command("go", "build", "-o", outputExePath, "./"+entryDir)
	buildCmd.Stdout = os.Stdout
	buildCmd.Stderr = os.Stderr
	buildCmd.Dir = moduleRoot

	if err3 := buildCmd.Run(); err3 != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Failed to compile: %v\n", err3)
		fmt.Fprintf(os.Stderr, "  💡 Go module dependency error.\n")
		fmt.Fprintf(os.Stderr, "  💡 This could be due to:\n")
		fmt.Fprintf(os.Stderr, "  💡 1. Missing or incorrect module structure\n")
		fmt.Fprintf(os.Stderr, "  💡 2. Network issues downloading modules\n")
		fmt.Fprintf(os.Stderr, "  💡 3. Version conflicts in go.mod\n")
		fmt.Fprintf(os.Stderr, "  💡 4. Missing files in the package (trying to build single file instead of package)\n")
		fmt.Fprintf(os.Stderr, "  💡 5. Inconsistent imports between files\n")
		fmt.Fprintf(os.Stderr, "  💡 6. Local module replace directives not working\n")
		fmt.Fprintf(os.Stderr, "  💡 7. Try running 'go mod tidy' manually\n")
		fmt.Fprintf(os.Stderr, "  💡 8. Dependencies not built\n")
		fmt.Fprintf(os.Stderr, "  💡 Check that all imported packages exist and are correctly published.\n")
		os.Exit(1)
	}
	
	fmt.Printf("  ✅ Successfully compiled to %s\n", outputExePath)

	// Make executable
	if err4 := os.Chmod(outputExePath, 0755); err4 != nil {
		fmt.Printf("  ⚠️  Failed to make binary executable: %v\n", err4)
	}

	// No dummy bundle file needed for compiled Go binaries
	// We'll use the actual binary directly
	fmt.Printf("  ✅ Compiled binary ready at %s\n", outputExePath)

	// Change back to workspace root for next iteration
	if err5 := os.Chdir(workspace); err5 != nil {
		fmt.Fprintf(os.Stderr, "  ⚠️  Failed to change back to workspace: %v\n", err5)
	}
}

func translateNativeTest(filePath string) (*DetectionResult, error) {
	// Basic detection based on file name
	filename := filepath.Base(filePath)
	isNativeTest := strings.HasSuffix(filename, "_test.go")
	
	// Default result
	result := &DetectionResult{
		IsNativeTest:  isNativeTest,
		FrameworkType: "testing",
		TestStructure: map[string]interface{}{
			"testFunctions": []map[string]interface{}{},
			"imports":       []string{},
		},
	}
	
	return result, nil
}

func loadConfig(path string) (*Config, error) {
	fmt.Printf("[INFO] Loading config from: %s\n", path)

	// Run the Go file to get JSON output
	cmd := exec.Command("go", "run", path)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to run config program: %w", err)
	}

	var config Config
	if err = json.Unmarshal(output, &config); err != nil {
		return nil, fmt.Errorf("failed to decode config JSON: %w", err)
	}

	fmt.Printf("[INFO] Loaded config with %d Go test(s)\n", len(config.Golang.Tests))
	for testName, testConfig := range config.Golang.Tests {
		fmt.Printf("[INFO]   - %s (path: %s)\n", testName, testConfig.Path)
	}

	return &config, nil
}
