package flavored_test

import (
	"testing"

	"github.com/testeranto-dev/testeranto/src/lib/golingvu/flavored"
)

// Calculator example for testing
type Calculator struct {
	result int
}

func NewCalculator() *Calculator {
	return &Calculator{result: 0}
}

func (c *Calculator) Add(x, y int) {
	c.result = x + y
}

func (c *Calculator) Subtract(x, y int) {
	c.result = x - y
}

func (c *Calculator) Result() int {
	return c.result
}

func TestCalculatorAddition(t *testing.T) {
	flavored.Given(t, "a new calculator", func() interface{} {
		return NewCalculator()
	}).
		When("adding %d and %d", func(calc interface{}, x, y int) interface{} {
			calc.(*Calculator).Add(x, y)
			return calc
		}, 2, 3).
		Then("result should be %d", func(calc interface{}, expected int) {
			c := calc.(*Calculator)
			if c.Result() != expected {
				t.Errorf("Expected %d, got %d", expected, c.Result())
			}
		}, 5).
		Run()
}

func TestCalculatorSubtraction(t *testing.T) {
	flavored.Given(t, "a calculator with initial value 20", func() interface{} {
		c := NewCalculator()
		c.result = 20
		return c
	}).
		When("subtracting %d from %d", func(calc interface{}, x, y int) interface{} {
			calc.(*Calculator).Subtract(x, y)
			return calc
		}, 5, 3).
		Then("result should be %d", func(calc interface{}, expected int) {
			c := calc.(*Calculator)
			if c.Result() != expected {
				t.Errorf("Expected %d, got %d", expected, c.Result())
			}
		}, 2).
		Run()
}

func TestMultipleOperations(t *testing.T) {
	flavored.Given(t, "a calculator with initial value 10", func() interface{} {
		c := NewCalculator()
		c.result = 10
		return c
	}).
		When("adding %d", func(calc interface{}, x int) interface{} {
			c := calc.(*Calculator)
			c.Add(c.result, x)
			return c
		}, 5).
		Then("result should be %d", func(calc interface{}, expected int) {
			c := calc.(*Calculator)
			if c.Result() != expected {
				t.Errorf("Expected %d, got %d", expected, c.Result())
			}
		}, 15).
		Run()
}

// Test integration with golingvu directly
func TestGolingvuIntegration(t *testing.T) {
	// This shows how flavored tests can be converted to golingvu tests
	chain := flavored.Given(t, "integration test", func() interface{} {
		return map[string]interface{}{"value": 0}
	}).
		When("incrementing value", func(data interface{}) interface{} {
		m := data.(map[string]interface{})
		m["value"] = m["value"].(int) + 1
		return m
	}).
		Then("value should be 1", func(data interface{}) {
		m := data.(map[string]interface{})
		if m["value"].(int) != 1 {
			t.Errorf("Expected value to be 1, got %d", m["value"].(int))
		}
	})
	
	chain.Run()
	
	// Also demonstrate conversion to golingvu
	gv := chain.ToGolingvu()
	if gv == nil {
		t.Error("Failed to convert flavored test to golingvu")
	} else {
		t.Log("Successfully converted flavored test to golingvu")
		// Verify the golingvu instance has test jobs
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
	}
}

// TestParallelExecution demonstrates that flavored tests can run in parallel
func TestParallelExecution(t *testing.T) {
	t.Parallel()
	
	flavored.Given(t, "parallel test", func() interface{} {
		return 0
	}).
	When("incrementing", func(n interface{}) interface{} {
		return n.(int) + 1
	}).
	Then("should be 1", func(n interface{}) {
		if n.(int) != 1 {
			t.Errorf("Expected 1, got %d", n.(int))
		}
	}).
	Run()
}
