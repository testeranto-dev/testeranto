package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Package struct maps the fields we need from 'go list'
type Package struct {
	ImportPath   string   `json:"ImportPath"`
	Dir          string   `json:"Dir"`
	GoFiles      []string `json:"GoFiles"`
	CgoFiles     []string `json:"CgoFiles"`
	CFiles       []string `json:"CFiles"`
	CXXFiles     []string `json:"CXXFiles"`
	HFiles       []string `json:"HFiles"`
	SFiles       []string `json:"SFiles"`
	SwigFiles    []string `json:"SwigFiles"`
	SwigCXXFiles []string `json:"SwigCXXFiles"`
	SysoFiles    []string `json:"SysoFiles"`
	EmbedFiles   []string `json:"EmbedFiles"`
	TestGoFiles  []string `json:"TestGoFiles"`
	Module       *struct {
		Main bool `json:"Main"`
	} `json:"Module"`
}

// TestEntry represents a test entry in the metafile
type TestEntry struct {
	Name   string   `json:"name"`
	Path   string   `json:"path"`
	Inputs []string `json:"inputs"`
	Output string   `json:"output"`
}

// Metafile structure matching esbuild format
type Metafile struct {
	Inputs  map[string]InputEntry  `json:"inputs"`
	Outputs map[string]OutputEntry `json:"outputs"`
}

// InputEntry represents an input file
type InputEntry struct {
	Bytes   int      `json:"bytes"`
	Imports []string `json:"imports"`
}

// OutputEntry represents an output entry
type OutputEntry struct {
	Imports    []string               `json:"imports"`
	Exports    []string               `json:"exports"`
	EntryPoint string                 `json:"entryPoint"`
	Inputs     map[string]InputDetail `json:"inputs"`
	Bytes      int                    `json:"bytes"`
}

// InputDetail represents input file details in output
type InputDetail struct {
	BytesInOutput int `json:"bytesInOutput"`
}

func computeFilesHash(files []string) (string, error) {
	hash := md5.New()
	for _, file := range files {
		absPath := filepath.Join("/workspace", file)
		// Add file path to hash
		hash.Write([]byte(file))

		// Add file stats to hash
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

func main() {
	// Force output to be visible
	fmt.Fprintln(os.Stdout, "🚀 Go builder starting...")
	fmt.Fprintln(os.Stderr, "🚀 Go builder starting (stderr)...")
	os.Stdout.Sync()
	os.Stderr.Sync()

	// Parse command line arguments similar to Rust builder
	// Expected: main.go <project_config> <golang_config> <test_name> <entry_points...>
	args := os.Args
	if len(args) < 4 {
		fmt.Fprintln(os.Stderr, "❌ Insufficient arguments")
		fmt.Fprintln(os.Stderr, "Usage: main.go <project_config> <golang_config> <test_name> <entry_points...>")
		os.Exit(1)
	}

	projectConfigPath := args[1]
	golangConfigPath := args[2]
	testName := args[3]
	entryPoints := args[4:]

	fmt.Printf("Test name: %s\n", testName)
	fmt.Printf("Entry points: %v\n", entryPoints)

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

	// Process each entry point
	for _, entryPoint := range entryPoints {
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
		relEntryPath, err := filepath.Rel(moduleRoot, entryPointPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to get relative path: %v\n", err)
			os.Exit(1)
		}

		// Run go mod tidy
		fmt.Printf("  Running go mod tidy...\n")
		tidyCmd := exec.Command("go", "mod", "tidy")
		tidyCmd.Stdout = os.Stdout
		tidyCmd.Stderr = os.Stderr
		if err := tidyCmd.Run(); err != nil {
			fmt.Printf("  ⚠️  go mod tidy failed: %v\n", err)
			// Continue anyway
		}

		// Get all dependencies using go list
		fmt.Printf("  Collecting dependencies...\n")
		listArgs := []string{"list", "-tags", "testeranto", "-json", "-deps", relEntryPath}
		listCmd := exec.Command("go", listArgs...)
		output, err := listCmd.Output()
		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				fmt.Printf("  ⚠️  go list stderr: %s\n", string(exitErr.Stderr))
			}
			fmt.Fprintf(os.Stderr, "  ❌ Failed to list dependencies: %v\n", err)
			os.Exit(1)
		}

		// Parse dependencies and collect input files
		var inputs []string
		dec := json.NewDecoder(strings.NewReader(string(output)))
		for dec.More() {
			var pkg Package
			if err := dec.Decode(&pkg); err != nil {
				fmt.Printf("  ⚠️  Error decoding package: %v\n", err)
				break
			}

			// Check if package is under workspace
			isUnderWorkspace := false
			if rel, err := filepath.Rel(workspace, pkg.Dir); err == nil && !strings.HasPrefix(rel, "..") {
				isUnderWorkspace = true
			}

			if !isUnderWorkspace {
				continue
			}

			// Add all relevant files
			addFiles := func(files []string) {
				for _, file := range files {
					absPath := filepath.Join(pkg.Dir, file)
					relToWorkspace, err := filepath.Rel(workspace, absPath)
					if err != nil {
						relToWorkspace = absPath
					}
					if !strings.HasPrefix(relToWorkspace, "..") {
						inputs = append(inputs, relToWorkspace)
					}
				}
			}

			addFiles(pkg.GoFiles)
			addFiles(pkg.CgoFiles)
			addFiles(pkg.CFiles)
			addFiles(pkg.CXXFiles)
			addFiles(pkg.HFiles)
			addFiles(pkg.SFiles)
			addFiles(pkg.SwigFiles)
			addFiles(pkg.SwigCXXFiles)
			addFiles(pkg.SysoFiles)
			addFiles(pkg.EmbedFiles)
			addFiles(pkg.TestGoFiles)
		}

		// Add go.mod and go.sum
		goModPath := filepath.Join(moduleRoot, "go.mod")
		goSumPath := filepath.Join(moduleRoot, "go.sum")
		for _, filePath := range []string{goModPath, goSumPath} {
			if _, err := os.Stat(filePath); err == nil {
				relToWorkspace, err := filepath.Rel(workspace, filePath)
				if err == nil && !strings.HasPrefix(relToWorkspace, "..") {
					// Check if not already in inputs
					alreadyAdded := false
					for _, existing := range inputs {
						if existing == relToWorkspace {
							alreadyAdded = true
							break
						}
					}
					if !alreadyAdded {
						inputs = append(inputs, relToWorkspace)
					}
				}
			}
		}

		fmt.Printf("  Found %d input files\n", len(inputs))

		// Compute hash
		testHash, err := computeFilesHash(inputs)
		if err != nil {
			fmt.Printf("  ⚠️  Failed to compute hash: %v\n", err)
			testHash = "error"
		}

		// Create inputFiles.json
		inputFilesBasename := strings.ReplaceAll(entryPoint, "/", "_") + "-inputFiles.json"
		inputFilesPath := filepath.Join(bundlesDir, inputFilesBasename)
		inputFilesJSON, err := json.MarshalIndent(inputs, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to marshal inputFiles.json: %v\n", err)
			os.Exit(1)
		}
		if err := os.WriteFile(inputFilesPath, inputFilesJSON, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to write inputFiles.json: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("  ✅ Created inputFiles.json at %s\n", inputFilesPath)

		// Compile the binary
		outputExePath := filepath.Join(bundlesDir, binaryName)
		fmt.Printf("  🔨 Compiling %s to %s...\n", relEntryPath, outputExePath)
		
		buildCmd := exec.Command("go", "build", "-tags", "testeranto", "-o", outputExePath, relEntryPath)
		buildCmd.Stdout = os.Stdout
		buildCmd.Stderr = os.Stderr
		
		if err := buildCmd.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to compile: %v\n", err)
			os.Exit(1)
		}

		// Make executable
		if err := os.Chmod(outputExePath, 0755); err != nil {
			fmt.Printf("  ⚠️  Failed to make binary executable: %v\n", err)
		}

		fmt.Printf("  ✅ Successfully compiled to %s\n", outputExePath)

		// Create dummy bundle file (for consistency with other runtimes)
		dummyPath := filepath.Join(bundlesDir, entryPoint)
		if err := os.MkdirAll(filepath.Dir(dummyPath), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to create dummy bundle directory: %v\n", err)
			os.Exit(1)
		}

		dummyContent := fmt.Sprintf(`#!/usr/bin/env bash
# Dummy bundle file generated by testeranto
# Hash: %s
# This file execs the compiled Go binary

exec "%s" "$@"
`, testHash, outputExePath)

		if err := os.WriteFile(dummyPath, []byte(dummyContent), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "  ❌ Failed to write dummy bundle file: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("  ✅ Created dummy bundle file at %s\n", dummyPath)

		// Change back to workspace root for next iteration
		if err := os.Chdir(workspace); err != nil {
			fmt.Fprintf(os.Stderr, "  ⚠️  Failed to change back to workspace: %v\n", err)
		}
	}

	fmt.Println("\n🎉 Go builder completed successfully")
}

func getCurrentDir() string {
	dir, err := os.Getwd()
	if err != nil {
		return fmt.Sprintf("Error: %v", err)
	}
	return dir
}

func findConfig() string {
	return "/workspace/testeranto/runtimes/golang/golang.go"
}

// loadConfig is defined in config.go
// findModuleRoot walks up from dir to find a directory containing go.mod
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

// TestConfig represents configuration for a single test
type TestConfig struct {
	Path string `json:"path"`
}

// GolangConfig represents the Go-specific configuration
type GolangConfig struct {
	Tests map[string]TestConfig `json:"tests"`
}

// Config represents the overall configuration
type Config struct {
	Golang GolangConfig `json:"golang"`
}

func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	// Ensure the destination directory exists
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	return os.WriteFile(dst, input, 0644)
}

func copyDir(src, dst string) error {
	// Get properties of source dir
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	
	// Create the destination directory
	if err := os.MkdirAll(dst, info.Mode()); err != nil {
		return err
	}
	
	// Read the source directory
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())
		
		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
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
	if err := json.Unmarshal(output, &config); err != nil {
		return nil, fmt.Errorf("failed to decode config JSON: %w", err)
	}

	fmt.Printf("[INFO] Loaded config with %d Go test(s)\n", len(config.Golang.Tests))
	for testName, testConfig := range config.Golang.Tests {
		fmt.Printf("[INFO]   - %s (path: %s)\n", testName, testConfig.Path)
	}

	return &config, nil
}
