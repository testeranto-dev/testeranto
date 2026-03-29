// Package golingvu - test suite runner
package golingvu

import (
	"testing"
)

// TestAll is a placeholder test that ensures the test suite runs
func TestAll(t *testing.T) {
	t.Log("Golingvu test suite is running")
}

// TestExamples ensures example tests can be discovered
func TestExamples(t *testing.T) {
	// This test ensures the example tests are included in test runs
	t.Log("Example tests should be run from their own directory")
}
