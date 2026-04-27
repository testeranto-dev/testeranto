// i will be copied to users testeranto folder @ testeranto/golang_runtime.go
package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// Types
type TestInfo struct {
	Hash  string   `json:"hash"`
	Files []string `json:"files"`
}

type DetectionResult struct {
	IsNativeTest   bool                   `json:"isNativeTest"`
	FrameworkType  string                 `json:"frameworkType"`
	TestStructure  map[string]interface{} `json:"testStructure"`
}

// Utility functions
func computeFilesHash(files []string) (string, error) {
	hash := md5.New()
	for _, file := range files {
		absPath := filepath.Join("/workspace", file)
		hash.Write([]byte(file))
		info, err := os.Stat(absPath)
		if err == nil {
			hash.Write([]byte(info.ModTime().String()))
			hash.Write([]byte(fmt.Sprintf("%d", info.Size())))
		} else {
			hash.Write([]byte("missing"))
		}
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func findModuleRoot(dir string) string {
	current := dir
	for {
		goModPath := filepath.Join(current, "go.mod")
		if _, err := os.Stat(goModPath); err == nil {
			return current
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}
	return ""
}

func parseConfigJson(configJson string) ([]string, []string) {
	var entryPoints []string
	var outputs []string
	var config map[string]interface{}
	if err := json.Unmarshal([]byte(configJson), &config); err == nil {
		if testsInterface, ok := config["tests"].([]interface{}); ok {
			for _, test := range testsInterface {
				if testStr, ok := test.(string); ok {
					entryPoints = append(entryPoints, testStr)
				}
			}
		}
		if outputsInterface, ok := config["outputs"].([]interface{}); ok {
			for _, output := range outputsInterface {
				if outputStr, ok := output.(string); ok {
					outputs = append(outputs, outputStr)
				}
			}
		}
	}
	return entryPoints, outputs
}

func translateNativeTest(filePath string) (*DetectionResult, error) {
	filename := filepath.Base(filePath)
	isNativeTest := strings.HasSuffix(filename, "_test.go")
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

// Builder
type Builder struct{}

func NewBuilder() *Builder {
	return &Builder{}
}

func (b *Builder) Run(testName string, entryPoints []string, outputs []string, isDevMode bool, projectConfigPath string) {
	fmt.Printf("[Go Builder] Test name: %s\n", testName)
	fmt.Printf("[Go Builder] Entry points: %v\n", entryPoints)
	fmt.Printf("[Go Builder] Mode: %s\n", func() string {
		if isDevMode {
			return "dev"
		}
		return "once"
	}())

	if len(entryPoints) == 0 {
		fmt.Fprintln(os.Stderr, "❌ No entry points provided")
		os.Exit(1)
	}

	workspace := "/workspace"
	if err := os.Chdir(workspace); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to change to workspace directory: %v\n", err)
		os.Exit(1)
	}

	bundlesDir := filepath.Join(workspace, "testeranto/bundles", testName)
	if err := os.MkdirAll(bundlesDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to create bundles directory: %v\n", err)
		os.Exit(1)
	}

	allTestsInfo := make(map[string]TestInfo)

	for _, entryPoint := range entryPoints {
		b.processEntryPoint(entryPoint, workspace, bundlesDir, allTestsInfo)
	}

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
	entryPointPath := filepath.Join(workspace, entryPoint)
	if _, err := os.Stat(entryPointPath); err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Entry point does not exist: %s\n", entryPointPath)
		os.Exit(1)
	}

	fileName := filepath.Base(entryPoint)
	if !strings.HasSuffix(fileName, ".go") {
		fmt.Fprintf(os.Stderr, "  ❌ Entry point is not a Go file: %s\n", entryPoint)
		os.Exit(1)
	}
	baseName := strings.TrimSuffix(fileName, ".go")
	binaryName := strings.ReplaceAll(baseName, ".", "_")

	moduleRoot := findModuleRoot(entryPointPath)
	if moduleRoot == "" {
		fmt.Fprintf(os.Stderr, "  ❌ Cannot find go.mod in or above %s\n", entryPointPath)
		os.Exit(1)
	}

	if err := os.Chdir(moduleRoot); err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Cannot change to module root %s: %v\n", moduleRoot, err)
		os.Exit(1)
	}

	relEntryPath, err1 := filepath.Rel(moduleRoot, entryPointPath)
	if err1 != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Failed to get relative path: %v\n", err1)
		os.Exit(1)
	}

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
		fmt.Fprintf(os.Stderr, "  ❌ go mod tidy failed: %v\n", errTidy)
		fmt.Fprintf(os.Stderr, "  💡 This indicates dependency issues that must be fixed\n")
		os.Exit(1)
	}

	var inputs []string
	relEntryToWorkspace, errRel := filepath.Rel(workspace, entryPointPath)
	if errRel == nil && !strings.HasPrefix(relEntryToWorkspace, "..") {
		inputs = append(inputs, relEntryToWorkspace)
	} else {
		inputs = append(inputs, entryPoint)
	}
	
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
		fmt.Fprintf(os.Stderr, "  ❌ Error walking directory: %v\n", errWalk)
		os.Exit(1)
	}
	
	fmt.Printf("  Found %d input files\n", len(inputs))
	
	detectionResult, err := translateNativeTest(entryPointPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "  ❌ Native detection failed: %v\n", err)
		os.Exit(1)
	}
	
	if detectionResult.IsNativeTest {
		fmt.Printf("  Detected native test with framework: %s\n", detectionResult.FrameworkType)
	}

	hash, err2 := computeFilesHash(inputs)
	if err2 != nil {
		fmt.Printf("  ⚠️  Failed to compute hash: %v\n", err2)
		hash = "error"
	}

	allTestsInfo[entryPoint] = TestInfo{
		Hash:  hash,
		Files: inputs,
	}

	destDir := filepath.Join(bundlesDir, filepath.Dir(relEntryPath))
	if err := os.MkdirAll(destDir, 0755); err != nil {
	    fmt.Fprintf(os.Stderr, "  ❌ Failed to create output directory: %v\n", err)
	    os.Exit(1)
	}
	outputExePath := filepath.Join(destDir, binaryName)
	fmt.Printf("  🔨 Compiling %s to %s...\n", relEntryPath, outputExePath)

	entryDir := filepath.Dir(relEntryPath)
	if entryDir == "." {
		entryDir = "./"
	}
	
	fmt.Printf("  📁 Building package in directory: %s\n", entryDir)
	goFiles, _ := filepath.Glob(filepath.Join(entryDir, "*.go"))
	fmt.Printf("  📄 Found %d .go files in package:\n", len(goFiles))
	for _, f := range goFiles {
		fmt.Printf("    - %s\n", filepath.Base(f))
	}
	
	buildDepsCmd := exec.Command("go", "build", "./...")
	buildDepsCmd.Stdout = os.Stdout
	buildDepsCmd.Stderr = os.Stderr
	buildDepsCmd.Dir = moduleRoot
	if err := buildDepsCmd.Run(); err != nil {
		fmt.Printf("  ⚠️  Failed to build dependencies: %v\n", err)
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

	if err4 := os.Chmod(outputExePath, 0755); err4 != nil {
		fmt.Printf("  ⚠️  Failed to make binary executable: %v\n", err4)
	}

	fmt.Printf("  ✅ Compiled binary ready at %s\n", outputExePath)

	if err5 := os.Chdir(workspace); err5 != nil {
		fmt.Fprintf(os.Stderr, "  ⚠️  Failed to change back to workspace: %v\n", err5)
	}
}

func produceOutputArtifacts(projectConfigPath, configKey string) {
	fmt.Printf("[Go Builder] Producing output artifacts for config %s\n", configKey)
	configFile, err := os.ReadFile(projectConfigPath)
	if err != nil {
		fmt.Printf("[Go Builder] Error loading project config: %v\n", err)
		return
	}
	
	var projectConfig map[string]interface{}
	if err := json.Unmarshal(configFile, &projectConfig); err != nil {
		fmt.Printf("[Go Builder] Error parsing project config: %v\n", err)
		return
	}
	
	runtimes, ok := projectConfig["runtimes"].(map[string]interface{})
	if !ok {
		fmt.Printf("[Go Builder] No runtimes found in config\n")
		return
	}
	
	runtimeConfig, ok := runtimes[configKey].(map[string]interface{})
	if !ok {
		fmt.Printf("[Go Builder] No runtime config found for %s\n", configKey)
		return
	}
	
	outputsInterface, ok := runtimeConfig["outputs"].([]interface{})
	if !ok || outputsInterface == nil {
		fmt.Printf("[Go Builder] No outputs defined for %s\n", configKey)
		return
	}
	
	fmt.Printf("[Go Builder] Processing %d output artifacts\n", len(outputsInterface))
	
	outputDir := filepath.Join("testeranto", "outputs", configKey)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		fmt.Printf("[Go Builder] Error creating output directory: %v\n", err)
		return
	}
	
	for _, outputInterface := range outputsInterface {
		entrypoint, ok := outputInterface.(string)
		if !ok {
			continue
		}
		
		sourcePath := entrypoint
		fileName := filepath.Base(entrypoint)
		destPath := filepath.Join(outputDir, fileName)
		
		fmt.Printf("[Go Builder] Copying %s to %s\n", sourcePath, destPath)
		
		input, err := os.ReadFile(sourcePath)
		if err != nil {
			fmt.Printf("[Go Builder] Failed to read source file %s: %v\n", sourcePath, err)
			continue
		}
		
		if err := os.WriteFile(destPath, input, 0644); err != nil {
			fmt.Printf("[Go Builder] Failed to write destination file %s: %v\n", destPath, err)
			continue
		}
		
		fmt.Printf("[Go Builder] ✅ Copied %s\n", fileName)
	}
	
	fmt.Printf("[Go Builder] Finished producing output artifacts\n")
}

func main() {
	// Force output to be visible
	os.Stdout.Sync()
	os.Stderr.Sync()

	args := os.Args
	if len(args) < 3 {
		os.Stderr.WriteString("❌ Insufficient arguments\n")
		os.Stderr.WriteString("Usage: main.go <project_config> <golang_config> [test_name] [config_json]\n")
		os.Exit(1)
	}

	projectConfigPath := args[1]
	golangConfigPath := args[2]
	
	var testName string
	var entryPoints []string
	var outputs []string
	
	// Determine which argument is which
	// If we have at least 4 arguments, args[3] could be test_name or JSON
	if len(args) >= 4 {
		arg3 := args[3]
		// Check if arg3 looks like JSON (starts with {)
		if len(arg3) > 0 && arg3[0] == '{' {
			// arg3 is JSON config, parse it
			entryPoints, outputs = parseConfigJson(arg3)
			// testName should be derived from something else
			// For now, use a default
			testName = "default_test"
		} else {
			// arg3 is test_name
			testName = arg3
			// If we have a 5th argument, it's JSON config
			if len(args) >= 5 {
				configJson := args[4]
				entryPoints, outputs = parseConfigJson(configJson)
			}
		}
	} else {
		// Only 3 arguments: project, golang config
		testName = "default_test"
	}
	
	// If entryPoints are still empty, try to parse golangConfigPath as JSON
	if len(entryPoints) == 0 && len(golangConfigPath) > 0 && golangConfigPath[0] == '{' {
		entryPoints, outputs = parseConfigJson(golangConfigPath)
	}
	
	// If still no entry points, error
	if len(entryPoints) == 0 {
		fmt.Fprintln(os.Stderr, "❌ No tests provided in config")
		os.Exit(1)
	}
	
	// If testName is still empty or default, create a meaningful name from the first test
	if testName == "" || testName == "default_test" {
		if len(entryPoints) > 0 {
			// Use the base name of the first test file without extension
			firstTest := entryPoints[0]
			base := filepath.Base(firstTest)
			testName = strings.TrimSuffix(base, filepath.Ext(base))
		} else {
			testName = "default_test"
		}
	}

	mode := os.Getenv("MODE")
	isDevMode := mode == "dev"

	builder := NewBuilder()
	builder.Run(testName, entryPoints, outputs, isDevMode, projectConfigPath)
	
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)
	
	if isDevMode {
		select {
		case <-sigChan:
			produceOutputArtifacts(projectConfigPath, testName)
			os.Exit(0)
		}
	} else {
		go func() {
			<-sigChan
			produceOutputArtifacts(projectConfigPath, testName)
			os.Exit(0)
		}()
		time.Sleep(100 * time.Millisecond)
	}
}
