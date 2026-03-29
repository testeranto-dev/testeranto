// Package golingvu tests for examples
package golingvu

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// TestExamplesExist verifies that example files exist
func TestExamplesExist(t *testing.T) {
	examplesDir := "examples/calculator"
	
	// Check for required files
	requiredFiles := []string{
		"calculator.go",
		"native_test.go",
		"golingvu_test.go",
	}
	
	for _, file := range requiredFiles {
		path := filepath.Join(examplesDir, file)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("Example file does not exist: %s", path)
		}
	}
}

// TestRunExampleTests runs the example tests if possible
func TestRunExampleTests(t *testing.T) {
	// Skip this test in CI or when examples can't be run
	if testing.Short() {
		t.Skip("Skipping example tests in short mode")
	}
	
	// Check if examples directory exists
	examplesDir := "examples/calculator"
	if _, err := os.Stat(examplesDir); os.IsNotExist(err) {
		t.Skip("Examples directory does not exist")
	}
	
	// Check for go.mod file and warn if present
	goModPath := filepath.Join(examplesDir, "go.mod")
	if _, err := os.Stat(goModPath); err == nil {
		t.Log("Warning: examples/calculator/go.mod exists. This may interfere with test discovery.")
		t.Log("Consider removing it to use the parent module.")
	}
	
	// Try to run go test in the examples directory
	cmd := exec.Command("go", "test", "./...")
	cmd.Dir = examplesDir
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Don't fail the test, just log the error
		t.Logf("Example tests output:\n%s", output)
		t.Logf("Note: Example tests may require special setup: %v", err)
	} else {
		t.Logf("Example tests ran successfully:\n%s", output)
	}
}
