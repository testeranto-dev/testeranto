package flavored_test

import (
	"testing"

	"github.com/testeranto-dev/testeranto/src/lib/golingvu/flavored"
)

// TestNativeGoTest demonstrates that flavored tests work with native go test
func TestNativeGoTest(t *testing.T) {
	// This test uses the standard testing.T and will be picked up by `go test`
	t.Run("addition", func(t *testing.T) {
		flavored.Given(t, "calculator", func() interface{} {
			return &struct{ value int }{value: 0}
		}).
			When("adding 5", func(data interface{}, args ...interface{}) interface{} {
				d := data.(*struct{ value int })
				d.value += 5
				return d
			}).
			Then("value should be 5", func(data interface{}, args ...interface{}) {
				d := data.(*struct{ value int })
				if d.value != 5 {
					t.Errorf("Expected 5, got %d", d.value)
				}
			}).
			Run()
	})

	t.Run("subtraction", func(t *testing.T) {
		flavored.Given(t, "calculator with 10", func() interface{} {
			return &struct{ value int }{value: 10}
		}).
			When("subtracting 3", func(data interface{}, args ...interface{}) interface{} {
				d := data.(*struct{ value int })
				d.value -= 3
				return d
			}).
			Then("value should be 7", func(data interface{}, args ...interface{}) {
				d := data.(*struct{ value int })
				if d.value != 7 {
					t.Errorf("Expected 7, got %d", d.value)
				}
			}).
			Run()
	})
}

// TestGolingvuCompatibility shows how flavored tests can work with golingvu
func TestGolingvuCompatibility(t *testing.T) {
	// Create a flavored test chain
	chain := flavored.Given(t, "compatibility test", func() interface{} {
		return "initial"
	}).
		When("transforming", func(data interface{}, args ...interface{}) interface{} {
			return data.(string) + "-transformed"
		}).
		Then("should be transformed", func(data interface{}, args ...interface{}) {
			if data.(string) != "initial-transformed" {
				t.Errorf("Expected 'initial-transformed', got %s", data.(string))
			}
		})

	// Convert to golingvu specification (for demonstration)
	spec := flavored.ConvertTestChain(chain)

	// This shows the structure that would be passed to golingvu
	_ = spec(nil, nil, nil, nil)

	// Convert to Golingvu instance
	gv := chain.ToGolingvu()
	if gv == nil {
		t.Error("Failed to create Golingvu instance")
	}

	// Run the flavored test
	chain.Run()
}

// TestFlavoredToGolingvu demonstrates the full conversion pipeline
func TestFlavoredToGolingvu(t *testing.T) {
	chain := flavored.Given(t, "conversion test", func() interface{} {
		return 100
	}).
		When("adding 50", func(n interface{}, args ...interface{}) interface{} {
			return n.(int) + 50
		}).
		Then("should be 150", func(n interface{}, args ...interface{}) {
			if n.(int) != 150 {
				t.Errorf("Expected 150, got %d", n.(int))
			}
		})

	// Convert to Golingvu
	gv := chain.ToGolingvu()
	if gv == nil {
		t.Fatal("Failed to create Golingvu instance")
	}

	// Verify the golingvu instance has the right structure
	if jobs := gv.GetTestJobs(); jobs == nil || len(jobs) == 0 {
		t.Error("Golingvu instance has no test jobs")
	} else {
		t.Logf("Golingvu instance has %d test job(s)", len(jobs))
	}

	// Verify specs are generated
	if specs := gv.GetSpecs(); specs == nil {
		t.Error("Golingvu instance has no specs")
	} else {
		t.Log("Golingvu instance has generated specs")
	}

	// Verify total tests
	if totalTests := gv.GetTotalTests(); totalTests == 0 {
		t.Error("Golingvu instance reports 0 total tests")
	} else {
		t.Logf("Golingvu instance reports %d total tests", totalTests)
	}

	// We can also run the flavored test normally
	chain.Run()

	t.Log("Successfully converted flavored test to golingvu and ran both versions")
}

// TestNativeGoToolchainIntegration tests that flavored tests work with standard go test
func TestNativeGoToolchainIntegration(t *testing.T) {
	// This test demonstrates that flavored tests are fully compatible with go test
	// They can be run with: go test -v -run TestNativeGoToolchainIntegration

	t.Run("test with subtests", func(t *testing.T) {
		flavored.Given(t, "native integration", func() interface{} {
			return "test"
		}).
			When("transforming", func(s interface{}, args ...interface{}) interface{} {
				return s.(string) + "-transformed"
			}).
			Then("should be transformed", func(s interface{}, args ...interface{}) {
				if s.(string) != "test-transformed" {
					t.Errorf("Expected 'test-transformed', got %s", s.(string))
				}
			}).
			Run()
	})

	// Test that we can use all standard testing.T features
	t.Run("parallel execution", func(t *testing.T) {
		t.Parallel()

		flavored.Given(t, "parallel test", func() interface{} {
			return 0
		}).
			When("incrementing", func(n interface{}, args ...interface{}) interface{} {
				return n.(int) + 1
			}).
			Then("should be 1", func(n interface{}, args ...interface{}) {
				if n.(int) != 1 {
					t.Errorf("Expected 1, got %d", n.(int))
				}
			}).
			Run()
	})
}

// BenchmarkFlavoredTests shows that flavored tests can be benchmarked
func BenchmarkFlavoredTests(b *testing.B) {
	for i := 0; i < b.N; i++ {
		// Create a test without running it through testing.T
		// This is just to show the structure works
		_ = flavored.Given(nil, "benchmark", func() interface{} {
			return i
		}).
			When("incrementing", func(data interface{}) interface{} {
				return data.(int) + 1
			}).
			Then("should be incremented", func(data interface{}) {
				// In a real benchmark, we wouldn't have assertions
				_ = data
			})
	}
}
