---
status: planning
---

src/server/tickets/testToolChainIntegration.md

Go (golingvu) - Flavored Version:

```
// Baseline
import "github.com/testeranto-dev/testeranto/src/lib/golingvu"

// Flavored
import "github.com/testeranto-dev/testeranto/src/lib/golingvu/flavored"

func TestCalculator(t *testing.T) {
    flavored.Given(t, "a new calculator", func() *Calculator {
        return NewCalculator()
    }).
    When("adding %d and %d", func(calc *Calculator, x, y int) *Calculator {
        calc.Add(x, y)
        return calc
    }, 2, 3).
    Then("result should be %d", func(calc *Calculator, expected int) {
        if calc.Result() != expected {
            t.Errorf("Expected %d, got %d", expected, calc.Result())
        }
    }, 5)
}
```

**unittest integration**

We need to interopt with the standad toolchain.

1. Testeranto can run go tests
2. go tests can run golingvu tests
