// Package golingvu - test discovery tests
package golingvu

import (
	"os"
	"path/filepath"
	"testing"
)

// TestDiscovery verifies test files can be discovered
func TestDiscovery(t *testing.T) {
	// Count test files in current directory
	testFiles := []string{}
	
	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && filepath.Ext(path) == ".go" {
			if filepath.Base(path) == "golingvu_test.go" ||
				filepath.Base(path) == "examples_test.go" ||
				filepath.Base(path) == "package_test.go" ||
				filepath.Base(path) == "test_discovery_test.go" {
				testFiles = append(testFiles, path)
			}
		}
		return nil
	})
	
	if err != nil {
		t.Errorf("Error walking directory: %v", err)
	}
	
	if len(testFiles) == 0 {
		t.Error("No test files found")
	} else {
		t.Logf("Found %d test files: %v", len(testFiles), testFiles)
	}
}
